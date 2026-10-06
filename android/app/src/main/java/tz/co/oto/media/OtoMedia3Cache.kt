package tz.co.oto.media

import android.content.Context
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File

@UnstableApi
object OtoMedia3Cache {
  private const val CACHE_BYTES = 512L * 1024L * 1024L
  private const val AUDIO_BYTES_PER_SECOND = 32L * 1024L
  @Volatile private var instance: SimpleCache? = null

  fun cache(context: Context): SimpleCache =
    instance ?: synchronized(this) {
      instance ?: SimpleCache(
        File(context.cacheDir, "oto-media3"),
        LeastRecentlyUsedCacheEvictor(CACHE_BYTES),
        StandaloneDatabaseProvider(context),
      ).also { instance = it }
    }

  fun dataSourceFactory(context: Context): CacheDataSource.Factory =
    CacheDataSource.Factory()
      .setCache(cache(context))
      .setUpstreamDataSourceFactory(DefaultHttpDataSource.Factory())
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

  fun warm(context: Context, uri: String, cacheKey: String, bufferSec: Double) {
    val targetBytes = maxOf(
      256L * 1024L,
      (bufferSec * AUDIO_BYTES_PER_SECOND).toLong(),
    )
    val dataSpec = DataSpec.Builder()
      .setUri(uri)
      .setKey(cacheKey)
      .setLength(targetBytes)
      .build()
    val dataSource = dataSourceFactory(context).createDataSource() as CacheDataSource
    CacheWriter(dataSource, dataSpec, null, null).cache()
  }

  fun evict(context: Context, cacheKey: String) {
    val cache = cache(context)
    cache.getCachedSpans(cacheKey).forEach { span -> cache.removeSpan(span) }
  }
}
