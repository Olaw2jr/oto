package tz.co.oto.torrent

import android.content.Context
import android.net.ConnectivityManager
import android.util.Base64
import android.util.Log
import com.frostwire.jlibtorrent.AddTorrentParams
import com.frostwire.jlibtorrent.AlertListener
import com.frostwire.jlibtorrent.Priority
import com.frostwire.jlibtorrent.SessionManager
import com.frostwire.jlibtorrent.SessionParams
import com.frostwire.jlibtorrent.SettingsPack
import com.frostwire.jlibtorrent.TorrentHandle
import com.frostwire.jlibtorrent.TorrentInfo
import com.frostwire.jlibtorrent.TorrentFlags
import com.frostwire.jlibtorrent.alerts.Alert
import com.frostwire.jlibtorrent.alerts.AlertType
import com.frostwire.jlibtorrent.alerts.SaveResumeDataAlert
import com.frostwire.jlibtorrent.swig.settings_pack
import java.io.File
import java.io.FileOutputStream
import java.net.Inet6Address
import java.net.URI
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import javax.net.ssl.HttpsURLConnection

data class NativeTorrentFile(
  val index: Int,
  val path: String,
  val sizeBytes: Long,
)

data class NativeTorrentSession(
  val id: String,
  val infoHash: String?,
  val files: List<NativeTorrentFile>,
)

data class NativeTorrentProgress(
  val downloadedBytes: Long,
  val totalBytes: Long,
  val complete: Boolean,
)

data class TorrentSourceDescriptor(
  val torrentUri: String?,
  val magnetUri: String?,
  val infoHash: String?,
)

internal data class ActiveTorrentSession(
  val id: String,
  val info: TorrentInfo,
  val handle: TorrentHandle,
  val saveDir: File,
  val files: List<NativeTorrentFile>,
  val priorities: MutableMap<Int, Priority> =
    ConcurrentHashMap(),
  // Pieces playback has asked for in streamed files.
  val wantedPieces: MutableSet<Int> = ConcurrentHashMap.newKeySet(),
  // Loopback URLs that replaced this torrent's HTTPS web seeds.
  val proxiedSeeds: List<String> = emptyList(),
)

class JlibtorrentEngine(private val context: Context) {
  private val manager = SessionManager(false)
  private val sessions =
    ConcurrentHashMap<String, ActiveTorrentSession>()
  private val lifecycleLock = Any()
  // Created with the first HTTPS web seed, closed with the last torrent.
  private var proxy: WebSeedProxy? = null
  private val webSeedProxy: WebSeedProxy
    get() = synchronized(lifecycleLock) { proxy ?: WebSeedProxy().also { proxy = it } }

  @Volatile private var started = false

  private fun ensureStarted() {
    if (started) return
    synchronized(lifecycleLock) {
      if (!started) {
        val listen = activeListenInterfaces()
        Log.i(TAG, "Starting torrent session, listening on ${listen ?: "default"}")
        val settings = SettingsPack()
        listen?.let(settings::listenInterfaces)
        // Small web seed requests, so a seed switches to newly urgent pieces
        // quickly instead of finishing a 16 MiB request first.
        settings.setInteger(
          settings_pack.int_types.urlseed_max_request_bytes.swigValue(),
          1 shl 20,
        )
        manager.start(SessionParams(settings))
        started = true
      }
    }
  }

  // libtorrent's default 0.0.0.0 listen address needs the routing table,
  // which recent Android hides from apps ("enum_route ... not supported").
  // Without a listen socket libtorrent 2.0 can't open outgoing peer or web
  // seed connections either, so listen on the active network's addresses.
  private fun activeListenInterfaces(): String? {
    val connectivity =
      context.getSystemService(ConnectivityManager::class.java)
        ?: return null
    val link =
      connectivity.getLinkProperties(connectivity.activeNetwork)
        ?: return null
    return link.linkAddresses
      .map { it.address }
      .filter { !it.isLoopbackAddress && !it.isLinkLocalAddress }
      .mapNotNull { address ->
        val host = address.hostAddress?.substringBefore('%')
          ?: return@mapNotNull null
        if (address is Inet6Address) "[$host]:0" else "$host:0"
      }
      // Loopback, so libtorrent can reach the HTTPS web seed proxy.
      .plus("127.0.0.1:0")
      .joinToString(",")
  }

  // libtorrent's own TLS fails on Android (#135); give it plain-HTTP loopback
  // URLs for HTTPS web seeds before the paused torrent starts.
  // Streamed torrent data stays only as a short-term cache: once no torrent
  // is open, drop directories unused for a week and keep the rest under a
  // size budget, oldest first (D5).
  private fun pruneStreamedData() {
    val root = File(context.filesDir, "authorized-torrents")
    val dirs = root.listFiles()?.filter { it.isDirectory } ?: return
    val now = System.currentTimeMillis()
    val (stale, fresh) = dirs.partition { now - lastUsed(it) > TORRENT_DATA_MAX_AGE_MS }
    stale.forEach { it.deleteRecursively() }
    var total = fresh.sumOf { size(it) }
    for (dir in fresh.sortedBy { lastUsed(it) }) {
      if (total <= TORRENT_DATA_BUDGET_BYTES) break
      total -= size(dir)
      dir.deleteRecursively()
    }
  }

  private fun lastUsed(dir: File): Long =
    dir.walkTopDown().maxOfOrNull { it.lastModified() } ?: dir.lastModified()

  private fun size(dir: File): Long =
    dir.walkTopDown().filter { it.isFile }.sumOf { it.length() }

  private fun proxyHttpsWebSeeds(handle: TorrentHandle): List<String> =
    handle.urlSeeds()
      .filter { it.startsWith("https://") }
      .map { seed ->
        handle.removeUrlSeed(seed)
        webSeedProxy.register(seed).also(handle::addUrlSeed)
      }

  private fun readHttpsTorrent(uri: String): ByteArray {
    var current = URI(uri)
    require(current.scheme.equals("https", ignoreCase = true)) {
      "Torrent descriptor must use HTTPS"
    }
    var redirects = 0
    while (true) {
      val connection =
        current.toURL().openConnection() as HttpsURLConnection
      connection.connectTimeout = 10_000
      connection.readTimeout = 20_000
      connection.instanceFollowRedirects = false
      connection.setRequestProperty(
        "User-Agent",
        "oto/0.0.1 authorized-torrent-runtime",
      )
      try {
        val status = connection.responseCode
        if (status in 300..399) {
          require(redirects < 5) {
            "Too many redirects while fetching torrent metadata"
          }
          val location = connection.getHeaderField("Location")
            ?: throw IllegalArgumentException(
              "Torrent metadata redirect has no Location",
            )
          val next = current.resolve(location)
          require(next.scheme.equals("https", ignoreCase = true)) {
            "Torrent metadata redirect must remain HTTPS"
          }
          current = next
          redirects += 1
          continue
        }
        require(status in 200..299) {
          "Torrent metadata request failed: HTTP $status"
        }
        connection.inputStream.use { input ->
          val limit = 2 * 1024 * 1024
          val buffer = ByteArray(16 * 1024)
          val output = java.io.ByteArrayOutputStream()
          while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            output.write(buffer, 0, count)
            require(output.size() <= limit) {
              "Torrent descriptor exceeds 2 MiB"
            }
          }
          return output.toByteArray()
        }
      } finally {
        connection.disconnect()
      }
    }
  }

  private fun descriptorMagnet(
    source: TorrentSourceDescriptor,
  ): String? =
    source.magnetUri
      ?: source.infoHash?.let {
        "magnet:?xt=urn:btih:${it.trim()}"
      }

  private fun resolveInfo(
    source: TorrentSourceDescriptor,
  ): TorrentInfo {
    source.torrentUri?.let { uri ->
      return TorrentInfo.bdecode(readHttpsTorrent(uri))
    }

    val magnet = descriptorMagnet(source)
      ?: throw IllegalArgumentException(
        "Torrent source requires a descriptor, magnet URI or info hash",
      )
    require(magnet.startsWith("magnet:?")) {
      "Torrent magnet URI is invalid"
    }

    val metadataDir =
      File(context.cacheDir, "oto-torrent-metadata")
        .apply { mkdirs() }
    val data = manager.fetchMagnet(magnet, 30, metadataDir)
      ?: throw IllegalStateException(
        "Torrent metadata could not be resolved",
      )
    return TorrentInfo.bdecode(data)
  }

  private fun findHandle(info: TorrentInfo): TorrentHandle {
    val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
    while (System.nanoTime() < deadline) {
      val v1 = info.infoHashV1()
      if (v1 != null) {
        manager.find(v1)?.let { handle ->
          if (handle.isValid()) return handle
        }
      }
      val v2 = info.infoHashV2()
      if (v2 != null) {
        manager.find(v2)?.let { handle ->
          if (handle.isValid()) return handle
        }
      }
      Thread.sleep(50)
    }
    throw IllegalStateException(
      "Timed out waiting for native torrent handle",
    )
  }

  private fun infoHash(info: TorrentInfo): String? =
    info.infoHashV1()?.toHex()
      ?: info.infoHashV2()?.toHex()

  private fun restoreResume(
    sessionId: String,
    resumeData: String?,
  ): File? {
    if (resumeData.isNullOrBlank()) return null
    val bytes = Base64.decode(resumeData, Base64.NO_WRAP)
    val resumeDir =
      File(context.cacheDir, "oto-torrent-resume")
        .apply { mkdirs() }
    return File(resumeDir, "$sessionId.fastresume")
      .also { file ->
        FileOutputStream(file).use { it.write(bytes) }
      }
  }

  fun open(
    source: TorrentSourceDescriptor,
    resumeData: String?,
  ): NativeTorrentSession {
    ensureStarted()
    val info = resolveInfo(source)
    require(info.isValid()) { "Invalid torrent metadata" }

    val sessionId = UUID.randomUUID().toString()
    val hash = infoHash(info) ?: sessionId
    val safeHash = hash.replace(Regex("[^A-Za-z0-9._-]"), "_")
    val saveDir =
      File(context.filesDir, "authorized-torrents/$safeHash")
        .apply { mkdirs() }
    val priorities =
      Priority.array(Priority.IGNORE, info.numFiles())
    val resumeFile = restoreResume(sessionId, resumeData)

    manager.download(
      info,
      saveDir,
      resumeFile,
      priorities,
      null,
      TorrentFlags.PAUSED,
    )

    val handle = findHandle(info)
    val proxiedSeeds = proxyHttpsWebSeeds(handle)
    handle.resume()

    val storage = info.files()
    val files =
      (0 until storage.numFiles()).map { index ->
        NativeTorrentFile(
          index = index,
          path = storage.filePath(index),
          sizeBytes = storage.fileSize(index),
        )
      }

    val active = ActiveTorrentSession(
      id = sessionId,
      info = info,
      handle = handle,
      saveDir = saveDir,
      files = files,
      proxiedSeeds = proxiedSeeds,
    )
    sessions[sessionId] = active

    resumeFile?.delete()

    return NativeTorrentSession(
      id = sessionId,
      infoHash = infoHash(info),
      files = files,
    )
  }

  private fun session(sessionId: String): ActiveTorrentSession =
    sessions[sessionId]
      ?: throw IllegalArgumentException(
        "Unknown torrent session: $sessionId",
      )

  fun close(sessionId: String) {
    val active = sessions.remove(sessionId) ?: return
    if (active.handle.isValid()) {
      active.handle.pause()
      manager.remove(active.handle)
    }
    active.proxiedSeeds.forEach { webSeedProxy.unregister(it) }
    // With no torrents left, stop libtorrent (listen sockets, DHT, trackers)
    // until the next open (#138).
    synchronized(lifecycleLock) {
      if (sessions.isEmpty()) {
        if (started) {
          manager.stop()
          started = false
        }
        proxy?.close()
        proxy = null
        pruneStreamedData()
      }
    }
  }

  fun selectFile(
    sessionId: String,
    fileIndex: Int?,
    filePath: String?,
  ): NativeTorrentFile {
    val active = session(sessionId)
    val byIndex =
      fileIndex?.let { index ->
        active.files.firstOrNull { it.index == index }
      }
    val normalizedPath =
      filePath?.replace('\\', '/')?.removePrefix("./")
    val byPath =
      normalizedPath?.let { expected ->
        active.files.firstOrNull {
          it.path.replace('\\', '/').removePrefix("./") == expected
        }
      }

    val selected =
      when {
        fileIndex != null && filePath != null -> {
          require(
            byIndex != null &&
              byPath != null &&
              byIndex.index == byPath.index,
          ) {
            "Torrent file selector does not identify one exact file"
          }
          byIndex
        }
        fileIndex != null -> byIndex
        filePath != null -> byPath
        else -> null
      }

    return selected
      ?: throw IllegalArgumentException("Torrent file not found")
  }

  fun setFilePriority(
    sessionId: String,
    fileIndex: Int,
    priority: String,
  ) {
    val active = session(sessionId)
    require(active.files.any { it.index == fileIndex }) {
      "Torrent file not found"
    }
    val mapped =
      when (priority) {
        "off" -> Priority.IGNORE
        "normal" -> Priority.NORMAL
        // Below the SEVEN that prioritizeRange gives the pieces playback
        // is waiting for, so those come first.
        "high" -> Priority.FIVE
        else -> throw IllegalArgumentException(
          "Unsupported torrent file priority: $priority",
        )
      }
    active.priorities[fileIndex] = mapped

    val priorities =
      Priority.array(Priority.IGNORE, active.info.numFiles())
    active.priorities.forEach { (index, value) ->
      priorities[index] = value
    }
    active.handle.prioritizeFiles(priorities)
    applyStreamingPieces(active)
  }

  // libtorrent writes pieces of a priority-0 file into its hidden .parts
  // file, where the range server can't read them. Make the file being played
  // wanted at the lowest priority; this moves any parted pieces into it.
  // Must run before piece priorities, since file priorities reset them.
  private fun ensureFileWanted(active: ActiveTorrentSession, fileIndex: Int) {
    if ((active.priorities[fileIndex] ?: Priority.IGNORE) != Priority.IGNORE) return
    active.priorities[fileIndex] = Priority.NORMAL
    val priorities = Priority.array(Priority.IGNORE, active.info.numFiles())
    active.priorities.forEach { (index, value) -> priorities[index] = value }
    active.handle.prioritizeFiles(priorities)
    applyStreamingPieces(active)
  }

  // A streamed file sits at Priority.NORMAL only so its pieces are written to
  // the file, but that priority wants the whole file. File-priority changes
  // reset piece priorities to their file's, so after each one, drop every
  // piece still at the streaming level that playback didn't ask for (#138).
  // Pieces shared with an offline download sit higher and are kept.
  private fun applyStreamingPieces(active: ActiveTorrentSession) {
    if (active.priorities.values.none { it == Priority.NORMAL }) return
    active.wantedPieces.removeAll { active.handle.havePiece(it) }
    val pieces = active.handle.piecePriorities()
    for (index in pieces.indices) {
      if (index in active.wantedPieces) {
        pieces[index] = Priority.SEVEN
      } else if (pieces[index] == Priority.NORMAL) {
        pieces[index] = Priority.IGNORE
      }
    }
    active.handle.prioritizePieces(pieces)
  }

  fun prioritizeRange(
    sessionId: String,
    fileIndex: Int,
    startByte: Long,
    endByte: Long,
  ) {
    val active = session(sessionId)
    val file = selectFile(sessionId, fileIndex, null)
    require(startByte >= 0 && endByte >= startByte) {
      "Torrent byte range is invalid"
    }
    require(startByte < file.sizeBytes) {
      "Torrent byte range starts beyond the selected file"
    }

    ensureFileWanted(active, fileIndex)
    val boundedEnd = minOf(endByte, file.sizeBytes - 1)
    val first =
      active.info.mapFile(fileIndex, startByte, 1).piece()
    val last =
      active.info.mapFile(fileIndex, boundedEnd, 1).piece()

    active.wantedPieces.addAll(first..last)
    for (piece in first..last) {
      active.handle.piecePriority(piece, Priority.SEVEN)
      active.handle.setPieceDeadline(
        piece,
        100 + (piece - first) * 75,
      )
    }
  }

  fun getProgress(
    sessionId: String,
    fileIndex: Int,
  ): NativeTorrentProgress {
    val active = session(sessionId)
    val file = selectFile(sessionId, fileIndex, null)
    val progress = active.handle.fileProgress()
    val downloaded =
      progress.getOrNull(fileIndex)
        ?.coerceIn(0L, file.sizeBytes)
        ?: 0L
    return NativeTorrentProgress(
      downloadedBytes = downloaded,
      totalBytes = file.sizeBytes,
      complete = downloaded >= file.sizeBytes,
    )
  }

  fun exportResumeData(sessionId: String): String? {
    val active = session(sessionId)
    if (!active.handle.isValid()) return null

    val expectedMagnet = active.handle.makeMagnetUri()
    val latch = CountDownLatch(1)
    var encoded: String? = null
    val listener =
      object : AlertListener {
        override fun types(): IntArray =
          intArrayOf(
            AlertType.SAVE_RESUME_DATA.swig(),
            AlertType.SAVE_RESUME_DATA_FAILED.swig(),
          )

        override fun alert(alert: Alert<*>) {
          val torrentAlert =
            alert as? com.frostwire.jlibtorrent.alerts.TorrentAlert<*>
              ?: return
          if (
            torrentAlert.handle().makeMagnetUri() != expectedMagnet
          ) {
            return
          }

          if (alert is SaveResumeDataAlert) {
            val bytes =
              AddTorrentParams
                .writeResumeData(alert.params())
                .bencode()
            encoded =
              Base64.encodeToString(bytes, Base64.NO_WRAP)
          }
          latch.countDown()
        }
      }

    manager.addListener(listener)
    try {
      active.handle.saveResumeData()
      if (!latch.await(5, TimeUnit.SECONDS)) {
        throw IllegalStateException(
          "Timed out exporting torrent resume data",
        )
      }
      return encoded
    } finally {
      manager.removeListener(listener)
    }
  }

  internal fun fileFor(
    sessionId: String,
    fileIndex: Int,
  ): Pair<ActiveTorrentSession, File> {
    val active = session(sessionId)
    val file = selectFile(sessionId, fileIndex, null)
    val root = active.saveDir.canonicalFile
    val target = File(root, file.path).canonicalFile
    require(
      target.path == root.path ||
        target.path.startsWith(root.path + File.separator),
    ) {
      "Torrent file path escapes the session directory"
    }
    return active to target
  }

  internal fun awaitRange(
    sessionId: String,
    fileIndex: Int,
    startByte: Long,
    endByte: Long,
    timeoutMs: Long = 30_000,
  ): Boolean {
    prioritizeRange(
      sessionId,
      fileIndex,
      startByte,
      endByte,
    )
    val active = session(sessionId)
    val first =
      active.info.mapFile(fileIndex, startByte, 1).piece()
    val last =
      active.info.mapFile(fileIndex, endByte, 1).piece()
    val deadline =
      System.nanoTime() +
        TimeUnit.MILLISECONDS.toNanos(timeoutMs)

    var nextReprioritize = System.nanoTime() + REPRIORITIZE_EVERY_NANOS
    while (System.nanoTime() < deadline) {
      // Another file's priority change resets piece priorities; keep the
      // range playback is waiting for at the top.
      if (System.nanoTime() >= nextReprioritize) {
        prioritizeRange(sessionId, fileIndex, startByte, endByte)
        nextReprioritize = System.nanoTime() + REPRIORITIZE_EVERY_NANOS
      }
      var complete = true
      for (piece in first..last) {
        if (!active.handle.havePiece(piece)) {
          complete = false
          break
        }
      }
      if (complete) return true
      try {
        Thread.sleep(25)
      } catch (interrupted: InterruptedException) {
        Thread.currentThread().interrupt()
        return false
      }
    }
    logStalledRange(active, first, last)
    return false
  }

  // What the swarm looked like when a range stalled, for device debugging.
  private fun logStalledRange(
    active: ActiveTorrentSession,
    first: Int,
    last: Int,
  ) {
    val status = active.handle.status()
    if (status == null) {
      Log.w(TAG, "Torrent range stalled: pieces $first..$last, no status")
      return
    }
    Log.w(
      TAG,
      "Torrent range stalled: pieces $first..$last state=${status.state()} " +
        "peers=${status.numPeers()} seeds=${status.numSeeds()} " +
        "connections=${status.numConnections()} known=${status.listPeers()} " +
        "rate=${status.downloadRate()} progress=${status.progress()} " +
        "error=${status.errorCode()?.message()} " +
        "trackers=${active.handle.trackers().size} " +
        "webSeeds=${active.handle.urlSeeds().size} " +
        "dht=${manager.isDhtRunning}",
    )
  }

  fun shutdown() {
    sessions.keys.toList().forEach(::close)
    synchronized(lifecycleLock) {
      if (started) {
        manager.stop()
        started = false
      }
    }
  }
}

private const val TAG = "OtoTorrent"

private val REPRIORITIZE_EVERY_NANOS = TimeUnit.SECONDS.toNanos(2)
private const val TORRENT_DATA_MAX_AGE_MS = 7L * 24 * 60 * 60 * 1000
private const val TORRENT_DATA_BUDGET_BYTES = 256L * 1024 * 1024
