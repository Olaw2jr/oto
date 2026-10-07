package tz.co.oto.media

import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaLibraryService.LibraryParams
import androidx.media3.session.MediaLibraryService.MediaLibrarySession
import androidx.media3.session.MediaSession
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

@UnstableApi
class OtoMedia3PlaybackService : MediaLibraryService() {
  companion object {
    private const val ROOT_ID = "oto:root"
    private const val SLEEP_TIMER_TICK_MS = 1_000L
  }

  private var session: MediaLibrarySession? = null
  private var player: ExoPlayer? = null
  private lateinit var sleepTimer: OtoMedia3SleepTimer
  private var lastMediaItemIndex = C.INDEX_UNSET
  private val handler = Handler(Looper.getMainLooper())

  private val sleepTimerListener =
    object : Player.Listener {
      override fun onMediaItemTransition(
        mediaItem: MediaItem?,
        reason: Int,
      ) {
        val activePlayer = player ?: return
        val index = activePlayer.currentMediaItemIndex
        sleepTimer.onActiveTrackChanged(
          lastMediaItemIndex,
          index,
          activePlayer,
        )
        lastMediaItemIndex = index
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED) {
          sleepTimer.onQueueEnded(lastMediaItemIndex)
        }
      }
    }

  private val sleepTimerTick =
    object : Runnable {
      override fun run() {
        player?.let(sleepTimer::onProgress)
        handler.postDelayed(this, SLEEP_TIMER_TICK_MS)
      }
    }

  private fun rootItem(): MediaItem =
    MediaItem.Builder()
      .setMediaId(ROOT_ID)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle("Oto")
          .setIsBrowsable(true)
          .setIsPlayable(false)
          .build(),
      )
      .build()

  private fun playable(item: MediaItem): MediaItem =
    item.buildUpon()
      .setMediaMetadata(
        item.mediaMetadata.buildUpon()
          .setIsBrowsable(false)
          .setIsPlayable(true)
          .build(),
      )
      .build()

  private val callback =
    object : MediaLibrarySession.Callback {
      override fun onGetLibraryRoot(
        session: MediaLibrarySession,
        browser: MediaSession.ControllerInfo,
        params: LibraryParams?,
      ): ListenableFuture<LibraryResult<MediaItem>> =
        Futures.immediateFuture(
          LibraryResult.ofItem(rootItem(), params),
        )

      override fun onGetChildren(
        session: MediaLibrarySession,
        browser: MediaSession.ControllerInfo,
        parentId: String,
        page: Int,
        pageSize: Int,
        params: LibraryParams?,
      ): ListenableFuture<
        LibraryResult<ImmutableList<MediaItem>>
      > {
        if (parentId != ROOT_ID) {
          return Futures.immediateFuture(
            LibraryResult.ofError(
              LibraryResult.RESULT_ERROR_BAD_VALUE,
              params,
            ),
          )
        }

        val player = session.player
        val start = (page * pageSize).coerceAtMost(player.mediaItemCount)
        val end =
          (start + pageSize).coerceAtMost(player.mediaItemCount)
        val items =
          (start until end).map { index ->
            playable(player.getMediaItemAt(index))
          }

        return Futures.immediateFuture(
          LibraryResult.ofItemList(items, params),
        )
      }

      override fun onGetItem(
        session: MediaLibrarySession,
        browser: MediaSession.ControllerInfo,
        mediaId: String,
      ): ListenableFuture<LibraryResult<MediaItem>> {
        if (mediaId == ROOT_ID) {
          return Futures.immediateFuture(
            LibraryResult.ofItem(rootItem(), null),
          )
        }

        val player = session.player
        val item =
          (0 until player.mediaItemCount)
            .map(player::getMediaItemAt)
            .firstOrNull { it.mediaId == mediaId }

        return Futures.immediateFuture(
          if (item == null) {
            LibraryResult.ofError(
              LibraryResult.RESULT_ERROR_BAD_VALUE,
            )
          } else {
            LibraryResult.ofItem(playable(item), null)
          },
        )
      }
    }

  override fun onCreate() {
    super.onCreate()
    sleepTimer = OtoMedia3SleepTimer(this)
    val playbackPlayer = ExoPlayer.Builder(this)
      .setMediaSourceFactory(
        DefaultMediaSourceFactory(
          OtoMedia3Cache.dataSourceFactory(this),
        ),
      )
      .build()
      .apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
            .setUsage(C.USAGE_MEDIA)
            .build(),
          true,
        )
        setHandleAudioBecomingNoisy(true)
      }
    player = playbackPlayer
    lastMediaItemIndex = playbackPlayer.currentMediaItemIndex
    playbackPlayer.addListener(sleepTimerListener)
    session =
      MediaLibrarySession.Builder(this, playbackPlayer, callback)
        .build()
    handler.post(sleepTimerTick)
  }

  override fun onGetSession(
    controllerInfo: MediaSession.ControllerInfo,
  ): MediaLibrarySession? = session

  override fun onDestroy() {
    handler.removeCallbacks(sleepTimerTick)
    player?.removeListener(sleepTimerListener)
    session?.run {
      player.release()
      release()
    }
    player = null
    session = null
    super.onDestroy()
  }
}
