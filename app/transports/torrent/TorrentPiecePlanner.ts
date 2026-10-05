export type TorrentBufferPlanInput = {
  fileSizeBytes: number;
  durationSec: number;
  positionSec: number;
  lookBehindSec?: number;
  bufferAheadSec?: number;
};

export type TorrentByteRange = {
  startByte: number;
  endByte: number;
};

export class TorrentPiecePlanner {
  plan(input: TorrentBufferPlanInput): TorrentByteRange {
    if (input.fileSizeBytes <= 0 || input.durationSec <= 0) {
      return {startByte: 0, endByte: 0};
    }

    const positionSec = Math.min(
      input.durationSec,
      Math.max(0, input.positionSec),
    );
    const lookBehindSec = Math.max(0, input.lookBehindSec ?? 5);
    const bufferAheadSec = Math.max(1, input.bufferAheadSec ?? 120);
    const bytesPerSecond = input.fileSizeBytes / input.durationSec;
    const startSec = Math.max(0, positionSec - lookBehindSec);
    const endSec = Math.min(
      input.durationSec,
      positionSec + bufferAheadSec,
    );
    const startByte = Math.min(
      input.fileSizeBytes - 1,
      Math.max(0, Math.floor(startSec * bytesPerSecond)),
    );
    const exclusiveEnd = Math.max(
      startByte + 1,
      Math.ceil(endSec * bytesPerSecond),
    );
    const endByte = Math.min(input.fileSizeBytes - 1, exclusiveEnd - 1);

    return {startByte, endByte};
  }
}
