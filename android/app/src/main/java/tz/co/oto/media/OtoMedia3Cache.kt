package tz.co.oto.media

import android.content.Context
import android.os.StatFs
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File

@UnstableApi
object OtoMedia3Cache {
  private const val MAX_CACHE_BYTES = 512L * 1024L * 1024L
  private const val MIN_CACHE_BYTES = 64L * 1024L * 1024L
  private const val AUDIO_BYTES_PER_SECOND = 32L * 1024L
  // Torrent-backed loopback routes may wait for a verified piece before
  // responding. Keep the HTTP read timeout longer than the native route's
  // 30-second piece wait so Media3 does not cancel the request first.
  private const val HTTP_READ_TIMEOUT_MS = 35_000
  @Volatile private var instance: SimpleCache? = null

  // Streaming cache size: up to 512 MB, but no more than a tenth of the free
  // space when the cache opens (at least 64 MB), so a nearly full phone
  // isn't pushed further (D5).
  fun streamingCacheBytes(context: Context): Long {
    val free = runCatching { StatFs(context.cacheDir.path).availableBytes }.getOrDefault(MAX_CACHE_BYTES * 10)
    return (free / 10).coerceIn(MIN_CACHE_BYTES, MAX_CACHE_BYTES)
  }

  fun cache(context: Context): SimpleCache =
    instance ?: synchronized(this) {
      instance ?: SimpleCache(
        File(context.cacheDir, "oto-media3"),
        LeastRecentlyUsedCacheEvictor(streamingCacheBytes(context)),
        OtoDownloads.databaseProvider(context),
      ).also { instance = it }
    }

  // Playback reads downloaded chapters first (never written here), then the
  // streaming cache, then the network.
  fun dataSourceFactory(context: Context): CacheDataSource.Factory =
    CacheDataSource.Factory()
      .setCache(OtoDownloads.cache(context))
      .setCacheWriteDataSinkFactory(null)
      .setUpstreamDataSourceFactory(streamingDataSourceFactory(context))
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

  fun streamingDataSourceFactory(context: Context): CacheDataSource.Factory =
    CacheDataSource.Factory()
      .setCache(cache(context))
      .setUpstreamDataSourceFactory(
        DefaultHttpDataSource.Factory()
          .setReadTimeoutMs(HTTP_READ_TIMEOUT_MS),
      )
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
    val dataSource = streamingDataSourceFactory(context).createDataSource()
    CacheWriter(dataSource, dataSpec, null, null).cache()
  }

  fun evict(context: Context, cacheKey: String) {
    val cache = cache(context)
    cache.getCachedSpans(cacheKey).forEach { span -> cache.removeSpan(span) }
  }
}
