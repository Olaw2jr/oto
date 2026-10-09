package tz.co.oto.media

import android.app.Notification
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.offline.Download
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadNotificationHelper
import androidx.media3.exoplayer.offline.DownloadService
import androidx.media3.exoplayer.scheduler.Scheduler
import tz.co.oto.R

// Runs downloads in the background as a data-sync foreground service, with a
// progress notification. Downloads resume the next time the app starts.
@UnstableApi
class OtoMedia3DownloadService :
  DownloadService(
    FOREGROUND_NOTIFICATION_ID,
    DEFAULT_FOREGROUND_NOTIFICATION_UPDATE_INTERVAL,
    CHANNEL_ID,
    R.string.downloads_channel_name,
    0,
  ) {
  private val notifications by lazy {
    DownloadNotificationHelper(this, CHANNEL_ID)
  }

  override fun getDownloadManager(): DownloadManager = OtoDownloads.manager(this)

  override fun getScheduler(): Scheduler? = null

  override fun getForegroundNotification(
    downloads: MutableList<Download>,
    notMetRequirements: Int,
  ): Notification =
    notifications.buildProgressNotification(
      this,
      android.R.drawable.stat_sys_download,
      null,
      if (notMetRequirements != 0) getString(R.string.downloads_waiting_for_wifi) else null,
      downloads,
      notMetRequirements,
    )

  companion object {
    const val CHANNEL_ID = "oto-downloads"
    const val FOREGROUND_NOTIFICATION_ID = 4210
  }
}
