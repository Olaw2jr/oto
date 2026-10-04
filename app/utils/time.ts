const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);

// Formats a duration in seconds as MM:SS, or HH:MM:SS once it reaches an hour.
const toHHMMSS = (secs: number | string) => {
  const total = Math.floor(Number(secs));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;

  return [hours, minutes, seconds]
    .map(pad)
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
};

export default toHHMMSS;
