package tz.co.oto.media

import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaLibraryService.MediaLibrarySession
import androidx.media3.session.MediaSession

@UnstableApi
class OtoMedia3PlaybackService : MediaLibraryService() {
  private var session: MediaLibrarySession? = null
  private val callback = object : MediaLibrarySession.Callback {}

  override fun onCreate() {
    super.onCreate()
    val player = ExoPlayer.Builder(this)
      .setMediaSourceFactory(
        DefaultMediaSourceFactory(OtoMedia3Cache.dataSourceFactory(this)),
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
    session = MediaLibrarySession.Builder(this, player, callback).build()
  }

  override fun onGetSession(
    controllerInfo: MediaSession.ControllerInfo,
  ): MediaLibrarySession? = session

  override fun onDestroy() {
    session?.run {
      player.release()
      release()
    }
    session = null
    super.onDestroy()
  }
}
