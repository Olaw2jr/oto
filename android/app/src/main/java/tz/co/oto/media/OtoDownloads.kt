package tz.co.oto.media

import android.content.Context
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.scheduler.Requirements
import java.io.File
import java.util.concurrent.Executors

// Offline downloads (D2). Downloaded chapters live in their own cache, which
// is never evicted and stays out of backups, and are played through the same
// HTTPS URL and cache key as streaming (see OtoMedia3Cache).
@UnstableApi
object OtoDownloads {
  @Volatile private var database: StandaloneDatabaseProvider? = null
  @Volatile private var downloadCache: SimpleCache? = null
  @Volatile private var manager: DownloadManager? = null

  fun databaseProvider(context: Context): StandaloneDatabaseProvider =
    database ?: synchronized(this) {
      database ?: StandaloneDatabaseProvider(context.applicationContext)
        .also { database = it }
    }

  fun cache(context: Context): SimpleCache =
    downloadCache ?: synchronized(this) {
      downloadCache ?: SimpleCache(
        File(context.noBackupFilesDir, "oto-downloads"),
        NoOpCacheEvictor(),
        databaseProvider(context),
      ).also { downloadCache = it }
    }

  fun manager(context: Context): DownloadManager =
    manager ?: synchronized(this) {
      manager ?: DownloadManager(
        context.applicationContext,
        databaseProvider(context),
        cache(context),
        DefaultHttpDataSource.Factory(),
        Executors.newFixedThreadPool(2),
      ).apply {
        maxParallelDownloads = 2
        requirements = requirementsFor(wifiOnly = true)
      }.also { manager = it }
    }

  fun requirementsFor(wifiOnly: Boolean): Requirements =
    Requirements(
      if (wifiOnly) Requirements.NETWORK_UNMETERED else Requirements.NETWORK,
    )
}
