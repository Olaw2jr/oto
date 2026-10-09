package tz.co.oto.torrent

import android.util.Base64
import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.URL
import java.security.SecureRandom
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import javax.net.ssl.HttpsURLConnection

// libtorrent's bundled OpenSSL can't open TLS connections on Android
// ("init fail (BIO routines)"), so HTTPS web seeds never deliver data (#135).
// This loopback proxy gives libtorrent a plain-HTTP URL per HTTPS seed and
// fetches each request with Android's own TLS stack. It listens only on
// 127.0.0.1, forwards only to the seed it registered under a random token,
// and only for GET and HEAD.
internal class WebSeedProxy {
  private val server = ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"))
  private val seeds = ConcurrentHashMap<String, String>()
  private val random = SecureRandom()
  private val clients = Executors.newCachedThreadPool()
  private val acceptor = Executors.newSingleThreadExecutor()

  init {
    acceptor.execute {
      while (!server.isClosed) {
        try {
          val socket = server.accept()
          clients.execute {
            try {
              socket.use(::serve)
            } catch (error: Throwable) {
              Log.w(TAG, "Web seed request failed", error)
            }
          }
        } catch (_: Throwable) {
          // Closed.
        }
      }
    }
  }

  // The plain-HTTP URL libtorrent should use instead of `seed`.
  fun register(seed: String): String {
    require(seed.startsWith("https://")) { "Only HTTPS web seeds are proxied" }
    val bytes = ByteArray(24).also(random::nextBytes)
    val token =
      Base64.encodeToString(
        bytes,
        Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP,
      )
    seeds[token] = seed
    return "http://127.0.0.1:${server.localPort}/$token/"
  }

  // Forget a seed registered by register(); its loopback URL stops working.
  fun unregister(url: String) {
    val token = url.substringAfter("127.0.0.1:").substringAfter('/').substringBefore('/')
    seeds.remove(token)
  }

  fun close() {
    seeds.clear()
    server.close()
    acceptor.shutdownNow()
    clients.shutdownNow()
  }

  private fun serve(socket: Socket) {
    socket.soTimeout = 30_000
    val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.ISO_8859_1))
    val requestLine = reader.readLine() ?: return
    val parts = requestLine.split(' ')
    val output = socket.getOutputStream()
    if (parts.size != 3) return respond(output, 400, "Bad Request")
    val (method, target) = parts
    if (method != "GET" && method != "HEAD") {
      return respond(output, 405, "Method Not Allowed")
    }
    val headers = readHeaders(reader)

    val path = target.removePrefix("/")
    val token = path.substringBefore('/')
    val seed = seeds[token] ?: return respond(output, 404, "Not Found")
    val requested = joinSeed(seed, path.substringAfter('/', ""))
    val connection = URL(direct(requested)).openConnection() as HttpsURLConnection
    connection.requestMethod = method
    connection.connectTimeout = 15_000
    connection.readTimeout = 30_000
    // HTTPS-to-HTTPS redirects only (archive.org/download → storage node).
    connection.instanceFollowRedirects = true
    connection.setRequestProperty("User-Agent", "oto/0.0.1 web-seed-proxy")
    headers["range"]?.let { connection.setRequestProperty("Range", it) }

    val status = connection.responseCode
    if (status >= 400) {
      // The node may have moved; go through archive.org again next time.
      redirects.keys.removeAll { requested.startsWith(it) }
    } else {
      rememberRedirect(requested, connection.url.toString())
    }
    val body =
      if (status >= 400) connection.errorStream else connection.inputStream
    val response = StringBuilder("HTTP/1.1 $status ${connection.responseMessage ?: ""}\r\n")
    for (name in FORWARDED_HEADERS) {
      connection.getHeaderField(name)?.let {
        response.append(name).append(": ").append(it).append("\r\n")
      }
    }
    response.append("Connection: close\r\n\r\n")
    output.write(response.toString().toByteArray(Charsets.ISO_8859_1))
    // Read bodies to the end and never disconnect(), so HttpsURLConnection
    // keeps the TLS connection for the next request instead of paying a new
    // handshake every time.
    body?.use { input ->
      if (method == "GET") input.copyTo(output, 64 * 1024) else input.skip(Long.MAX_VALUE)
    }
    output.flush()
  }

  // archive.org/download/<item>/… redirects every request to the item's
  // storage node; once seen, send later requests there directly.
  private val redirects = ConcurrentHashMap<String, String>()

  private fun rememberRedirect(requested: String, final: String) {
    if (requested == final) return
    // Map the item's directory to the node's directory, never wider.
    if (requested.substringAfterLast('/') != final.substringAfterLast('/')) return
    redirects[requested.substringBeforeLast('/') + "/"] =
      final.substringBeforeLast('/') + "/"
  }

  private fun direct(requested: String): String {
    for ((from, to) in redirects) {
      if (requested.startsWith(from)) return to + requested.removePrefix(from)
    }
    return requested
  }

  private fun joinSeed(seed: String, rest: String): String =
    if (seed.endsWith("/") || rest.isEmpty()) seed + rest else seed

  private fun readHeaders(reader: BufferedReader): Map<String, String> {
    val headers = HashMap<String, String>()
    repeat(100) {
      val line = reader.readLine() ?: return headers
      if (line.isEmpty()) return headers
      val split = line.indexOf(':')
      if (split > 0) {
        headers[line.substring(0, split).trim().lowercase(Locale.US)] =
          line.substring(split + 1).trim()
      }
    }
    throw IllegalArgumentException("Too many HTTP headers")
  }

  private fun respond(output: OutputStream, status: Int, reason: String) {
    output.write(
      "HTTP/1.1 $status $reason\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
        .toByteArray(Charsets.ISO_8859_1),
    )
    output.flush()
  }

  private companion object {
    const val TAG = "OtoTorrent"
    val FORWARDED_HEADERS =
      listOf("Content-Type", "Content-Length", "Content-Range", "Accept-Ranges")
  }
}
