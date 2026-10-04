import toHHMMSS from '../../app/utils/time';

describe('toHHMMSS', () => {
  it.each([
    [0, '00:00'],
    [51, '00:51'],
    [3343, '55:43'],
    [18000, '05:00:00'],
    [68580, '19:03:00'],
    ['125', '02:05'],
  ])('formats %p seconds as %p', (input, expected) => {
    expect(toHHMMSS(input)).toBe(expected);
  });
});
