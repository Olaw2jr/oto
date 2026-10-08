package tz.co.oto.media

import android.content.Context
import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi

@UnstableApi
class OtoMedia3SleepTimer(
  context: Context,
  private val now: () -> Long = System::currentTimeMillis,
) {
  data class State(
    val kind: String,
    val deadlineAtMs: Long? = null,
    val trackIndex: Int? = null,
  )

  private val preferences =
    context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

  fun setMinutes(minutes: Double) {
    require(minutes.isFinite() && minutes > 0.0) {
      "Sleep timer minutes must be positive finite minutes"
    }
    preferences.edit()
      .putString(KEY_KIND, KIND_DEADLINE)
      .putLong(KEY_DEADLINE, now() + (minutes * 60_000.0).toLong())
      .remove(KEY_TRACK_INDEX)
      .apply()
  }

  fun setEndOfChapter(trackIndex: Int) {
    require(trackIndex >= 0) {
      "Sleep timer chapter index must be non-negative"
    }
    preferences.edit()
      .putString(KEY_KIND, KIND_CHAPTER)
      .putInt(KEY_TRACK_INDEX, trackIndex)
      .remove(KEY_DEADLINE)
      .apply()
  }

  fun clear() {
    preferences.edit().clear().apply()
  }

  fun state(): State? =
    when (preferences.getString(KEY_KIND, null)) {
      KIND_DEADLINE ->
        State(
          kind = KIND_DEADLINE,
          deadlineAtMs = preferences.getLong(KEY_DEADLINE, 0L),
        )
      KIND_CHAPTER ->
        State(
          kind = KIND_CHAPTER,
          trackIndex = preferences.getInt(KEY_TRACK_INDEX, C.INDEX_UNSET),
        )
      else -> null
    }

  fun onProgress(player: Player) {
    val current = state()
    if (
      current?.kind == KIND_DEADLINE &&
      (current.deadlineAtMs ?: Long.MAX_VALUE) <= now()
    ) {
      clear()
      player.pause()
    }
  }

  fun onActiveTrackChanged(
    lastIndex: Int,
    index: Int,
    player: Player,
  ) {
    val current = state()
    if (
      current?.kind == KIND_CHAPTER &&
      current.trackIndex == lastIndex &&
      index != lastIndex
    ) {
      clear()
      if (index != C.INDEX_UNSET) {
        player.pause()
      }
    }
  }

  fun onQueueEnded(lastIndex: Int) {
    val current = state()
    if (
      current?.kind == KIND_CHAPTER &&
      current.trackIndex == lastIndex
    ) {
      clear()
    }
  }

  companion object {
    private const val PREFERENCES = "oto.audio.sleepTimer.media3"
    private const val KEY_KIND = "kind"
    private const val KEY_DEADLINE = "deadlineAtMs"
    private const val KEY_TRACK_INDEX = "trackIndex"
    private const val KIND_DEADLINE = "deadline"
    private const val KIND_CHAPTER = "chapter"
  }
}
