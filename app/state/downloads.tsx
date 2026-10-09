import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

import type {BookDownloads, BookDownloadStatus} from '../downloads';
import {useSettings} from './settings';

const DownloadsContext = createContext<BookDownloads | null>(null);

// Shares the book downloader and keeps its Wi-Fi-only rule in step with
// Settings.
export const DownloadsProvider = ({
  books,
  children,
}: {
  books: BookDownloads;
  children: ReactNode;
}) => {
  const {wifiOnly} = useSettings();
  useEffect(() => {
    books.setWifiOnly(wifiOnly).catch(() => {});
  }, [books, wifiOnly]);
  return (
    <DownloadsContext.Provider value={books}>{children}</DownloadsContext.Provider>
  );
};

const useBooks = () => {
  const books = useContext(DownloadsContext);
  if (!books) throw new Error('Downloads need a DownloadsProvider');
  return books;
};

const NONE: BookDownloadStatus = {
  state: 'none',
  chaptersDone: 0,
  chapters: 0,
  bytesDownloaded: 0,
  totalBytes: 0,
};

// Android 13+ shows download progress only with notification permission.
const askForNotifications = async () => {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ).catch(() => undefined);
  }
};

export const useBookDownload = (bookId: string) => {
  const books = useBooks();
  const {wifiOnly} = useSettings();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<BookDownloadStatus>(NONE);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    books.bookStatus(bookId).then(setStatus, () => {});
  }, [books, bookId]);

  useEffect(() => {
    let active = true;
    books.canDownload(bookId).then(
      value => active && setAvailable(value),
      () => active && setAvailable(false),
    );
    refresh();
    const stop = books.subscribe(refresh);
    return () => {
      active = false;
      stop();
    };
  }, [books, bookId, refresh]);

  const download = useCallback(async () => {
    setError(null);
    try {
      await askForNotifications();
      await books.downloadBook(bookId, {wifiOnly});
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
    refresh();
  }, [books, bookId, wifiOnly, refresh]);

  const remove = useCallback(async () => {
    await books.removeBook(bookId).catch(() => {});
    refresh();
  }, [books, bookId, refresh]);

  return {available, status, error, download, remove};
};

export const useDownloadedBooks = () => {
  const books = useBooks();
  const [entries, setEntries] = useState<
    Array<{bookId: string; status: BookDownloadStatus}>
  >([]);
  const refresh = useCallback(async () => {
    const ids = await books.bookIds();
    setEntries(
      await Promise.all(ids.map(async bookId => ({bookId, status: await books.bookStatus(bookId)}))),
    );
  }, [books]);
  useEffect(() => {
    refresh().catch(() => {});
    return books.subscribe(() => {
      refresh().catch(() => {});
    });
  }, [books, refresh]);
  const remove = useCallback(
    async (bookId: string) => {
      await books.removeBook(bookId).catch(() => {});
      await refresh();
    },
    [books, refresh],
  );
  return {entries, remove};
};

export const formatMegabytes = (bytes: number) =>
  `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;
