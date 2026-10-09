package tz.co.oto.media

import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.offline.Download
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

// JS bridge for D2 downloads. Download metadata (book, title, trusted source)
// travels in DownloadRequest.data, so Media3's own index is the only store.
@UnstableApi
class OtoDownloadsModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val manager: DownloadManager by lazy { OtoDownloads.manager(reactContext) }
  private val handler = Handler(Looper.getMainLooper())

  // Media3 only reports state changes, so poll progress while downloading.
  private val progressTicker =
    object : Runnable {
      override fun run() {
        val active = manager.currentDownloads.filter { it.state == Download.STATE_DOWNLOADING }
        active.forEach { emit(status(it)) }
        if (active.isNotEmpty()) handler.postDelayed(this, PROGRESS_INTERVAL_MS)
      }
    }

  private val listener =
    object : DownloadManager.Listener {
      override fun onDownloadChanged(
        downloadManager: DownloadManager,
        download: Download,
        finalException: Exception?,
      ) {
        emit(status(download))
        handler.removeCallbacks(progressTicker)
        handler.post(progressTicker)
      }

      override fun onDownloadRemoved(downloadManager: DownloadManager, download: Download) {
        emit(status(download).apply { putString("state", "removed") })
      }
    }

  override fun getName(): String = "OtoDownloads"

  override fun initialize() {
    super.initialize()
    handler.post { manager.addListener(listener) }
  }

  @ReactMethod
  fun start(request: ReadableMap, promise: Promise) {
    try {
      val data =
        JSONObject()
          .put("bookId", request.getString("bookId"))
          .put("title", request.getString("title"))
          .put("cacheKey", request.getString("cacheKey"))
          .apply {
            if (request.hasKey("trustedSourceId") && !request.isNull("trustedSourceId")) {
              put("trustedSourceId", request.getString("trustedSourceId"))
            }
            if (request.hasKey("sizeBytes") && !request.isNull("sizeBytes")) {
              put("sizeBytes", request.getDouble("sizeBytes"))
            }
          }
      val download =
        DownloadRequest.Builder(
          requireNotNull(request.getString("id")),
          Uri.parse(requireNotNull(request.getString("uri"))),
        )
          .setCustomCacheKey(request.getString("cacheKey"))
          .setData(data.toString().toByteArray(Charsets.UTF_8))
          .build()
      val wifiOnly = request.hasKey("wifiOnly") && request.getBoolean("wifiOnly")
      DownloadService.sendSetRequirements(
        reactContext,
        OtoMedia3DownloadService::class.java,
        OtoDownloads.requirementsFor(wifiOnly),
        false,
      )
      DownloadService.sendAddDownload(
        reactContext,
        OtoMedia3DownloadService::class.java,
        download,
        false,
      )
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("download_start_failed", error)
    }
  }

  @ReactMethod
  fun remove(id: String, promise: Promise) {
    DownloadService.sendRemoveDownload(
      reactContext,
      OtoMedia3DownloadService::class.java,
      id,
      false,
    )
    promise.resolve(null)
  }

  @ReactMethod
  fun setWifiOnly(wifiOnly: Boolean, promise: Promise) {
    DownloadService.sendSetRequirements(
      reactContext,
      OtoMedia3DownloadService::class.java,
      OtoDownloads.requirementsFor(wifiOnly),
      false,
    )
    promise.resolve(null)
  }

  @ReactMethod
  fun list(promise: Promise) {
    try {
      val result = Arguments.createArray()
      manager.downloadIndex.getDownloads().use { cursor ->
        while (cursor.moveToNext()) result.pushMap(status(cursor.download))
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("download_list_failed", error)
    }
  }

  @ReactMethod
  fun playbackSource(id: String, promise: Promise) {
    try {
      val download = manager.downloadIndex.getDownload(id)
      if (download == null || download.state != Download.STATE_COMPLETED) {
        promise.resolve(null)
        return
      }
      val data = metadata(download)
      promise.resolve(
        Arguments.createMap().apply {
          putString("kind", "https")
          putString("uri", download.request.uri.toString())
          data.optString("trustedSourceId").takeIf { it.isNotEmpty() }?.let {
            putString("trustedSourceId", it)
          }
        },
      )
    } catch (error: Exception) {
      promise.reject("download_source_failed", error)
    }
  }

  @ReactMethod
  fun freeSpace(promise: Promise) {
    try {
      promise.resolve(StatFs(reactContext.noBackupFilesDir.path).availableBytes.toDouble())
    } catch (error: Exception) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}

  @ReactMethod
  fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {}

  override fun invalidate() {
    handler.removeCallbacks(progressTicker)
    handler.post { manager.removeListener(listener) }
    super.invalidate()
  }

  private fun metadata(download: Download): JSONObject =
    runCatching { JSONObject(String(download.request.data, Charsets.UTF_8)) }
      .getOrDefault(JSONObject())

  private fun status(download: Download): WritableMap {
    val data = metadata(download)
    val waiting =
      download.state == Download.STATE_QUEUED && manager.notMetRequirements != 0
    return Arguments.createMap().apply {
      putString("id", download.request.id)
      putString("bookId", data.optString("bookId"))
      putString(
        "state",
        when (download.state) {
          Download.STATE_DOWNLOADING -> "downloading"
          Download.STATE_COMPLETED -> "completed"
          Download.STATE_FAILED -> "failed"
          Download.STATE_STOPPED -> "paused"
          else -> if (waiting) "paused" else "queued"
        },
      )
      putDouble("bytesDownloaded", download.bytesDownloaded.toDouble())
      val total =
        if (download.contentLength > 0) download.contentLength.toDouble()
        else data.optDouble("sizeBytes", 0.0)
      if (total > 0) putDouble("totalBytes", total)
      if (waiting) putString("error", "waiting-for-wifi")
      if (download.state == Download.STATE_FAILED) putString("error", "download-failed")
    }
  }

  private fun emit(status: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT, status)
  }

  companion object {
    private const val EVENT = "oto-downloads"
    private const val PROGRESS_INTERVAL_MS = 1_000L
  }
}
