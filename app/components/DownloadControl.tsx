import React from 'react';
import {StyleSheet, View} from 'react-native';

import {formatMegabytes, useBookDownload} from '../state/downloads';
import {Button, TextLink, Txt} from '../ui';

// Download, progress and removal for one book. Hidden for books without
// rights-cleared audio.
export const DownloadControl = ({bookId}: {bookId: string}) => {
  const {available, status, error, download, remove} = useBookDownload(bookId);
  if (!available) return null;

  const percent = status.totalBytes
    ? Math.floor((status.bytesDownloaded / status.totalBytes) * 100)
    : 0;

  if (status.state === 'completed') {
    return (
      <View style={styles.row}>
        <Txt variant="caption">{`Downloaded · ${formatMegabytes(status.totalBytes)}`}</Txt>
        <TextLink label="Remove download" role="button" onPress={remove} />
      </View>
    );
  }
  if (status.state === 'downloading' || status.state === 'queued') {
    return (
      <View style={styles.row}>
        <Txt variant="caption">{`Downloading · ${percent}%`}</Txt>
        <TextLink
          label="Cancel"
          role="button"
          accessibilityLabel={`Cancel download, ${percent}% downloaded`}
          onPress={remove}
        />
      </View>
    );
  }
  if (status.state === 'paused') {
    return (
      <View style={styles.row}>
        <Txt variant="caption">Waiting for Wi-Fi</Txt>
        <TextLink label="Cancel" role="button" accessibilityLabel="Cancel download" onPress={remove} />
      </View>
    );
  }
  return (
    <View style={styles.block}>
      <Button
        icon="down"
        kind="secondary"
        label={status.state === 'failed' ? 'Download failed · Try again' : 'Download'}
        onPress={download}
        stretch
      />
      {error ? (
        <Txt variant="caption" color="danger" style={styles.error}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    minHeight: 44,
  },
  block: {marginTop: 12},
  error: {marginTop: 6},
});
