package tz.co.oto.media

import android.content.ComponentName
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.Executors

@UnstableApi
class OtoMedia3Module(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val EVENT = "oto-media3-playback"
  }

  private var controllerFuture: ListenableFuture<MediaController>? = null
  private var controller: MediaController? = null
  private val cacheExecutor = Executors.newSingleThreadExecutor()
  private val sleepTimer = OtoMedia3SleepTimer(reactContext)

  private val listener =
    object : Player.Listener {
      override fun onEvents(player: Player, events: Player.Events) {
        emitSnapshot(player)
      }
    }

  override fun getName(): String = "OtoMedia3"

  private fun ensureController(
    promise: Promise,
    block: (MediaController) -> Unit,
  ) {
    controller?.let {
      try {
        block(it)
      } catch (error: Throwable) {
        promise.reject("media3_operation_failed", error)
      }
      return
    }

    val future =
      controllerFuture ?: MediaController.Builder(
        reactContext,
        SessionToken(
          reactContext,
          ComponentName(
            reactContext,
            OtoMedia3PlaybackService::class.java,
          ),
        ),
      ).buildAsync().also { controllerFuture = it }

    future.addListener(
      {
        try {
          val ready = future.get()
          if (controller == null) {
            controller = ready
            ready.addListener(listener)
          }
          block(ready)
        } catch (error: Throwable) {
          promise.reject("media3_setup_failed", error)
        }
      },
      ContextCompat.getMainExecutor(reactContext),
    )
  }

  private fun mediaItem(data: ReadableMap): MediaItem {
    val mediaId = data.getString("id") ?: ""
    val extras =
      Bundle().apply {
        putString("bookId", data.getString("bookId"))
        putString("renditionId", data.getString("renditionId"))
        putString("chapterId", data.getString("chapterId"))
      }
    val metadata =
      MediaMetadata.Builder()
        .setTitle(data.getString("title"))
        .setExtras(extras)
        .build()
    val builder =
      MediaItem.Builder()
        .setMediaId(mediaId)
        .setUri(data.getString("url"))
        .setCustomCacheKey(mediaId)
        .setMediaMetadata(metadata)

    val streamType =
      if (data.hasKey("streamType") && !data.isNull("streamType")) {
        data.getString("streamType")
      } else {
        null
      }

    if (streamType == "hls") {
      builder.setMimeType(MimeTypes.APPLICATION_M3U8)
    } else if (data.hasKey("contentType") && !data.isNull("contentType")) {
      builder.setMimeType(data.getString("contentType"))
    }
    return builder.build()
  }

  private fun snapshot(player: Player): WritableMap {
    // After a failure Media3 sits idle with a playerError; report the error
    // so the app can tell the listener instead of going quiet.
    val state =
      when {
        player.playerError != null -> "error"
        player.playbackState == Player.STATE_IDLE -> "none"
        player.playbackState == Player.STATE_BUFFERING -> "buffering"
        player.playbackState == Player.STATE_READY ->
          if (player.isPlaying) "playing" else "ready"
        player.playbackState == Player.STATE_ENDED -> "ended"
        else -> "error"
      }
    return Arguments.createMap().apply {
      putString("state", state)
      player.currentMediaItem?.mediaId?.let {
        putString("trackId", it)
      }
      putDouble("positionSec", player.currentPosition / 1000.0)
      putDouble(
        "durationSec",
        if (player.duration == C.TIME_UNSET) 0.0
        else player.duration / 1000.0,
      )
      putDouble(
        "rate",
        player.playbackParameters.speed.toDouble(),
      )
      putInt(
        "activeIndex",
        if (player.currentMediaItemIndex == C.INDEX_UNSET) -1
        else player.currentMediaItemIndex,
      )
    }
  }

  private fun emitSnapshot(player: Player) {
    reactContext
      .getJSModule(
        DeviceEventManagerModule.RCTDeviceEventEmitter::class.java,
      )
      .emit(EVENT, snapshot(player))
  }

  @ReactMethod
  fun setup(promise: Promise) =
    ensureController(promise) { promise.resolve(null) }

  @ReactMethod
  fun reset(promise: Promise) =
    ensureController(promise) {
      it.stop()
      it.clearMediaItems()
      promise.resolve(null)
    }

  @ReactMethod
  fun setQueue(tracks: ReadableArray, promise: Promise) =
    ensureController(promise) { player ->
      val items =
        (0 until tracks.size()).mapNotNull { index ->
          tracks.getMap(index)?.let(::mediaItem)
        }
      player.setMediaItems(items)
      player.prepare()
      promise.resolve(null)
    }

  @ReactMethod
  fun skip(index: Int, positionSec: Double, promise: Promise) =
    ensureController(promise) {
      it.seekTo(index, (positionSec * 1000.0).toLong())
      promise.resolve(null)
    }

  @ReactMethod
  fun play(promise: Promise) =
    ensureController(promise) {
      it.play()
      promise.resolve(null)
    }

  @ReactMethod
  fun pause(promise: Promise) =
    ensureController(promise) {
      it.pause()
      promise.resolve(null)
    }

  @ReactMethod
  fun seekTo(positionSec: Double, promise: Promise) =
    ensureController(promise) {
      it.seekTo((positionSec * 1000.0).toLong())
      promise.resolve(null)
    }

  @ReactMethod
  fun seekBy(deltaSec: Double, promise: Promise) =
    ensureController(promise) {
      val next =
        (it.currentPosition + deltaSec * 1000.0)
          .toLong()
          .coerceAtLeast(0)
      it.seekTo(next)
      promise.resolve(null)
    }

  @ReactMethod
  fun setRate(rate: Double, promise: Promise) =
    ensureController(promise) {
      it.playbackParameters = PlaybackParameters(rate.toFloat())
      promise.resolve(null)
    }

  @ReactMethod
  fun getSnapshot(promise: Promise) =
    ensureController(promise) {
      promise.resolve(snapshot(it))
    }

  @ReactMethod
  fun updateOptions(
    @Suppress("UNUSED_PARAMETER") options: ReadableMap,
    promise: Promise,
  ) = ensureController(promise) { promise.resolve(null) }

  @ReactMethod
  fun setSleepTimerMinutes(minutes: Double, promise: Promise) {
    try {
      sleepTimer.setMinutes(minutes)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("media3_sleep_timer_invalid", error)
    }
  }

  @ReactMethod
  fun setSleepTimerEndOfChapter(
    trackIndex: Int,
    promise: Promise,
  ) {
    try {
      sleepTimer.setEndOfChapter(trackIndex)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("media3_sleep_timer_invalid", error)
    }
  }

  @ReactMethod
  fun clearSleepTimer(promise: Promise) {
    sleepTimer.clear()
    promise.resolve(null)
  }

  @ReactMethod
  fun getSleepTimerState(promise: Promise) {
    val state = sleepTimer.state()
    if (state == null) {
      promise.resolve(null)
      return
    }

    promise.resolve(
      Arguments.createMap().apply {
        putString("kind", state.kind)
        state.deadlineAtMs?.let {
          putDouble("deadlineAtMs", it.toDouble())
        }
        state.trackIndex?.let {
          putInt("trackIndex", it)
        }
      },
    )
  }

  @ReactMethod
  fun warmCache(
    uri: String,
    cacheKey: String,
    bufferSec: Double,
    promise: Promise,
  ) {
    cacheExecutor.execute {
      try {
        OtoMedia3Cache.warm(
          reactContext,
          uri,
          cacheKey,
          bufferSec,
        )
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("media3_cache_warm_failed", error)
      }
    }
  }

  @ReactMethod
  fun evictCache(cacheKey: String, promise: Promise) {
    cacheExecutor.execute {
      try {
        OtoMedia3Cache.evict(reactContext, cacheKey)
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("media3_cache_evict_failed", error)
      }
    }
  }

  @ReactMethod
  fun addListener(
    @Suppress("UNUSED_PARAMETER") eventName: String,
  ) {}

  @ReactMethod
  fun removeListeners(
    @Suppress("UNUSED_PARAMETER") count: Int,
  ) {}

  override fun invalidate() {
    controller?.removeListener(listener)
    controller?.release()
    controller = null
    controllerFuture = null
    cacheExecutor.shutdownNow()
    super.invalidate()
  }
}
