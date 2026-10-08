package tz.co.oto.torrent

import android.util.Base64
import java.io.BufferedReader
import java.io.BufferedWriter
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.io.RandomAccessFile
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.security.SecureRandom
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

data class NativeRangeRoute(
  val routeId: String,
  val port: Int,
)

// Keep this model outside RouteServer because Kotlin forbids nested
// declarations inside an inner class.
private data class ByteRange(
  val start: Long,
  val end: Long,
  val partial: Boolean,
)

class LoopbackRangeServer(
  private val engine: JlibtorrentEngine,
) {
  private val routes =
    ConcurrentHashMap<String, RouteServer>()
  private val random = SecureRandom()

  private fun routeId(): String {
    val bytes = ByteArray(24)
    random.nextBytes(bytes)
    return Base64.encodeToString(
      bytes,
      Base64.URL_SAFE or
        Base64.NO_WRAP or
        Base64.NO_PADDING,
    )
  }

  fun start(
    sessionId: String,
    fileIndex: Int,
  ): NativeRangeRoute {
    engine.selectFile(sessionId, fileIndex, null)
    val routeId = routeId()
    val server =
      RouteServer(
        routeId = routeId,
        sessionId = sessionId,
        fileIndex = fileIndex,
      )
    routes[routeId] = server
    server.start()
    return NativeRangeRoute(
      routeId = routeId,
      port = server.port,
    )
  }

  fun stop(routeId: String) {
    routes.remove(routeId)?.close()
  }

  fun shutdown() {
    routes.keys.toList().forEach(::stop)
  }

  private inner class RouteServer(
    private val routeId: String,
    private val sessionId: String,
    private val fileIndex: Int,
  ) {
    private val server =
      ServerSocket(
        0,
        16,
        InetAddress.getLoopbackAddress(),
      )
    private val clients = Executors.newCachedThreadPool()
    private val acceptor =
      Executors.newSingleThreadExecutor()

    val port: Int
      get() = server.localPort

    fun start() {
      acceptor.execute {
        while (!server.isClosed) {
          try {
            val socket = server.accept()
            clients.execute {
              socket.use(::serve)
            }
          } catch (_: Throwable) {
            if (!server.isClosed) {
              close()
            }
          }
        }
      }
    }

    private fun readHeaders(
      reader: BufferedReader,
    ): Map<String, String> {
      val headers = linkedMapOf<String, String>()
      repeat(100) {
        val line = reader.readLine() ?: return headers
        if (line.isEmpty()) return headers
        require(line.length <= 8192) {
          "HTTP header line is too large"
        }
        val split = line.indexOf(':')
        if (split > 0) {
          headers[
            line.substring(0, split)
              .trim()
              .lowercase(Locale.US)
          ] = line.substring(split + 1).trim()
        }
      }
      throw IllegalArgumentException(
        "Too many HTTP headers",
      )
    }

    private fun parseRange(
      header: String?,
      size: Long,
    ): ByteRange {
      if (header.isNullOrBlank()) {
        return ByteRange(
          start = 0,
          end = size - 1,
          partial = false,
        )
      }
      require(header.startsWith("bytes=")) {
        "Unsupported Range unit"
      }
      require(!header.contains(',')) {
        "Multipart ranges are not supported"
      }

      val value = header.removePrefix("bytes=").trim()
      val separator = value.indexOf('-')
      require(separator >= 0) {
        "Malformed Range header"
      }
      val left = value.substring(0, separator).trim()
      val right = value.substring(separator + 1).trim()

      if (left.isEmpty()) {
        val suffix = right.toLong()
        require(suffix > 0) {
          "Invalid suffix Range"
        }
        val start = (size - suffix).coerceAtLeast(0)
        return ByteRange(
          start = start,
          end = size - 1,
          partial = true,
        )
      }

      val start = left.toLong()
      require(start in 0 until size) {
        "Range start is outside the file"
      }
      val end =
        if (right.isEmpty()) {
          size - 1
        } else {
          minOf(right.toLong(), size - 1)
        }
      require(end >= start) {
        "Range end precedes start"
      }
      return ByteRange(
        start = start,
        end = end,
        partial = true,
      )
    }

    private fun writeHeaders(
      writer: BufferedWriter,
      status: String,
      contentLength: Long,
      size: Long,
      range: ByteRange?,
    ) {
      writer.write("HTTP/1.1 $status\r\n")
      writer.write(
        "Content-Type: application/octet-stream\r\n",
      )
      writer.write("Accept-Ranges: bytes\r\n")
      writer.write("Cache-Control: no-store\r\n")
      writer.write("Connection: close\r\n")
      writer.write("Content-Length: $contentLength\r\n")
      if (range?.partial == true) {
        writer.write(
          "Content-Range: bytes " +
            "${range.start}-${range.end}/$size\r\n",
        )
      }
      writer.write("\r\n")
      writer.flush()
    }

    private fun error(
      socket: Socket,
      status: String,
      contentRange: String? = null,
    ) {
      val writer =
        BufferedWriter(
          OutputStreamWriter(socket.getOutputStream()),
        )
      writer.write("HTTP/1.1 $status\r\n")
      writer.write("Connection: close\r\n")
      writer.write("Content-Length: 0\r\n")
      contentRange?.let {
        writer.write("Content-Range: $it\r\n")
      }
      writer.write("\r\n")
      writer.flush()
    }

    private fun serve(socket: Socket) {
      socket.soTimeout = 30_000
      val reader =
        BufferedReader(
          InputStreamReader(socket.getInputStream()),
        )
      val request = reader.readLine()
        ?: return
      if (request.length > 8192) {
        error(socket, "414 URI Too Long")
        return
      }

      val parts = request.split(' ')
      if (parts.size != 3) {
        error(socket, "400 Bad Request")
        return
      }
      val method = parts[0]
      val path = parts[1]
      if (method != "GET" && method != "HEAD") {
        error(socket, "405 Method Not Allowed")
        return
      }
      if (
        path !=
          "/media/${java.net.URLEncoder.encode(routeId, "UTF-8")}" &&
        path != "/media/$routeId"
      ) {
        error(socket, "404 Not Found")
        return
      }

      val headers =
        try {
          readHeaders(reader)
        } catch (_: Throwable) {
          error(socket, "400 Bad Request")
          return
        }

      val (_, target) =
        try {
          engine.fileFor(sessionId, fileIndex)
        } catch (_: Throwable) {
          error(socket, "404 Not Found")
          return
        }
      val file =
        engine.selectFile(
          sessionId,
          fileIndex,
          null,
        )
      if (file.sizeBytes <= 0) {
        error(socket, "416 Range Not Satisfiable")
        return
      }

      val range =
        try {
          parseRange(headers["range"], file.sizeBytes)
        } catch (_: Throwable) {
          error(
            socket,
            "416 Range Not Satisfiable",
            "bytes */${file.sizeBytes}",
          )
          return
        }

      val length = range.end - range.start + 1
      writeHeaders(
        BufferedWriter(
          OutputStreamWriter(socket.getOutputStream()),
        ),
        if (range.partial) {
          "206 Partial Content"
        } else {
          "200 OK"
        },
        length,
        file.sizeBytes,
        range,
      )
      if (method == "HEAD") return

      val output = socket.getOutputStream()
      val buffer = ByteArray(128 * 1024)
      var input: RandomAccessFile? = null
      try {
        var offset = range.start
        var remaining = length

        while (remaining > 0) {
          val chunk =
            minOf(
              remaining,
              buffer.size.toLong(),
            ).toInt()
          val end = offset + chunk - 1
          engine.awaitRange(
            sessionId,
            fileIndex,
            offset,
            end,
          )

          val ready =
            input ?: RandomAccessFile(target, "r")
              .also { input = it }
          ready.seek(offset)

          var chunkRemaining = chunk
          while (chunkRemaining > 0) {
            val count =
              ready.read(
                buffer,
                0,
                minOf(
                  chunkRemaining,
                  buffer.size,
                ),
              )
            if (count < 0) {
              throw IllegalStateException(
                "Torrent file ended before requested range",
              )
            }
            output.write(buffer, 0, count)
            chunkRemaining -= count
            offset += count
            remaining -= count
          }
          output.flush()
        }
      } finally {
        input?.close()
      }
    }

    fun close() {
      try {
        server.close()
      } catch (_: Throwable) {
      }
      acceptor.shutdownNow()
      clients.shutdownNow()
    }
  }
}
