#!/usr/bin/env bash
# Runs the Android app with JDK 11–17 (17 preferred). React Native 0.71 builds with Android
# Gradle Plugin 7.x, which cannot dex classes compiled by newer JDKs.
set -euo pipefail

java_major() {
  "$1/bin/java" -version 2>&1 | awk -F'"' '/version/ {split($2, v, "."); print (v[1] == "1" ? v[2] : v[1])}'
}

current="${JAVA_HOME:-}"
major="$( [ -n "$current" ] && java_major "$current" || echo 0 )"
if [ "$major" -lt 11 ] || [ "$major" -gt 17 ]; then
  if [ -x /usr/libexec/java_home ] && jdk17="$(/usr/libexec/java_home -v 17 2>/dev/null)"; then
    export JAVA_HOME="$jdk17"
    echo "Using JDK 17 at $JAVA_HOME"
  else
    echo "oto's Android build needs JDK 17. Install it and set JAVA_HOME to it." >&2
    exit 1
  fi
fi

if [ "${OTO_JDK_CHECK_ONLY:-}" = "1" ]; then
  echo "JAVA_HOME=$JAVA_HOME"
  exit 0
fi

exec npx react-native run-android "$@"
