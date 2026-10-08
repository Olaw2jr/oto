package tz.co.oto.torrent

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import android.util.Log
import java.util.concurrent.Executors

class OtoTorrentModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val engine =
    JlibtorrentEngine(reactContext.applicationContext)
  private val rangeServer =
    LoopbackRangeServer(engine)
  private val executor = Executors.newCachedThreadPool()

  override fun getName(): String = "OtoTorrent"

  private fun execute(
    promise: Promise,
    operation: () -> Any?,
  ) {
    executor.execute {
      try {
        promise.resolve(operation())
      } catch (error: Throwable) {
        Log.e("OtoTorrent", "Native torrent operation failed", error)
        promise.reject(
          "oto_torrent_error",
          error.message,
          error,
        )
      }
    }
  }

  private fun source(
    input: ReadableMap,
  ): TorrentSourceDescriptor =
    TorrentSourceDescriptor(
      torrentUri =
        input.optionalString("torrentUri"),
      magnetUri =
        input.optionalString("magnetUri"),
      infoHash =
        input.optionalString("infoHash"),
    )

  private fun fileMap(
    file: NativeTorrentFile,
  ): WritableMap =
    Arguments.createMap().apply {
      putInt("index", file.index)
      putString("path", file.path)
      putDouble(
        "sizeBytes",
        file.sizeBytes.toDouble(),
      )
    }

  private fun sessionMap(
    session: NativeTorrentSession,
  ): WritableMap =
    Arguments.createMap().apply {
      putString("id", session.id)
      session.infoHash?.let {
        putString("infoHash", it)
      }
      val files = Arguments.createArray()
      session.files.forEach {
        files.pushMap(fileMap(it))
      }
      putArray("files", files)
    }

  @ReactMethod
  fun open(
    input: ReadableMap,
    resumeData: String?,
    promise: Promise,
  ) = execute(promise) {
    sessionMap(
      engine.open(
        source(input),
        resumeData,
      ),
    )
  }

  @ReactMethod
  fun close(
    sessionId: String,
    promise: Promise,
  ) = execute(promise) {
    engine.close(sessionId)
    null
  }

  @ReactMethod
  fun selectFile(
    sessionId: String,
    selector: ReadableMap,
    promise: Promise,
  ) = execute(promise) {
    val index =
      if (
        selector.hasKey("fileIndex") &&
        !selector.isNull("fileIndex")
      ) {
        selector.getInt("fileIndex")
      } else {
        null
      }
    val path =
      selector.optionalString("filePath")
    fileMap(
      engine.selectFile(
        sessionId,
        index,
        path,
      ),
    )
  }

  @ReactMethod
  fun setFilePriority(
    sessionId: String,
    fileIndex: Int,
    priority: String,
    promise: Promise,
  ) = execute(promise) {
    engine.setFilePriority(
      sessionId,
      fileIndex,
      priority,
    )
    null
  }

  @ReactMethod
  fun prioritizeRange(
    sessionId: String,
    fileIndex: Int,
    startByte: Double,
    endByte: Double,
    promise: Promise,
  ) = execute(promise) {
    engine.prioritizeRange(
      sessionId,
      fileIndex,
      startByte.toLong(),
      endByte.toLong(),
    )
    null
  }

  @ReactMethod
  fun getProgress(
    sessionId: String,
    fileIndex: Int,
    promise: Promise,
  ) = execute(promise) {
    val progress =
      engine.getProgress(sessionId, fileIndex)
    Arguments.createMap().apply {
      putDouble(
        "downloadedBytes",
        progress.downloadedBytes.toDouble(),
      )
      putDouble(
        "totalBytes",
        progress.totalBytes.toDouble(),
      )
      putBoolean(
        "complete",
        progress.complete,
      )
    }
  }

  @ReactMethod
  fun exportResumeData(
    sessionId: String,
    promise: Promise,
  ) = execute(promise) {
    engine.exportResumeData(sessionId)
  }

  @ReactMethod
  fun startRangeServer(
    input: ReadableMap,
    promise: Promise,
  ) = execute(promise) {
    val route =
      rangeServer.start(
        input.getString("sessionId")
          ?: throw IllegalArgumentException(
            "Range route requires sessionId",
          ),
        input.getInt("fileIndex"),
      )
    Arguments.createMap().apply {
      putString("routeId", route.routeId)
      putInt("port", route.port)
    }
  }

  @ReactMethod
  fun stopRangeServer(
    routeId: String,
    promise: Promise,
  ) = execute(promise) {
    rangeServer.stop(routeId)
    null
  }

  override fun invalidate() {
    rangeServer.shutdown()
    engine.shutdown()
    executor.shutdownNow()
    super.invalidate()
  }
}

private fun ReadableMap.optionalString(
  key: String,
): String? =
  if (hasKey(key) && !isNull(key)) {
    getString(key)
  } else {
    null
  }
