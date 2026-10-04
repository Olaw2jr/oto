import {
  formatClock,
  formatDuration,
  formatRemaining,
  parseDuration,
} from '../../app/data/format';

describe('parseDuration', () => {
  it.each([
    ['24h 6m', 24 * 3600 + 6 * 60],
    ['5h 35m', 5 * 3600 + 35 * 60],
    ['7 hrs and 17 mins', 7 * 3600 + 17 * 60],
    ['3h 51m', 3 * 3600 + 51 * 60],
    ['45 mins', 45 * 60],
  ])('reads %p', (text, seconds) => {
    expect(parseDuration(text)).toBe(seconds);
  });
});

describe('formatting', () => {
  it('formats a length like the canvas', () => {
    expect(formatDuration(11 * 3600 + 20 * 60)).toBe('11 h 20 min');
    expect(formatDuration(40 * 60)).toBe('40 min');
  });

  it('formats time left with zero-padded minutes', () => {
    expect(formatRemaining(8 * 3600 + 7 * 60 + 20)).toBe('8 h 07 min left');
    expect(formatRemaining(9 * 60)).toBe('9 min left');
  });

  it('formats a playback clock', () => {
    expect(formatClock(3 * 3600 + 12 * 60 + 40)).toBe('3:12:40');
    expect(formatClock(5 * 60 + 3)).toBe('5:03');
    expect(formatClock(-1)).toBe('0:00');
  });
});
