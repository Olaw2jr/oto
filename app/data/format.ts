// Reads mock durations such as "24h 6m" or "7 hrs and 17 mins".
export const parseDuration = (text: string) => {
  const hours = /(\d+)\s*h/.exec(text);
  const minutes = /(\d+)\s*m/.exec(text);
  return (
    (hours ? Number(hours[1]) * 3600 : 0) +
    (minutes ? Number(minutes[1]) * 60 : 0)
  );
};

const pad = (n: number) => String(n).padStart(2, '0');

const split = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
};

// "11 h 20 min"
export const formatDuration = (seconds: number) => {
  const {h, m} = split(seconds);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

// "8 h 07 min left"
export const formatRemaining = (seconds: number) => {
  const {h, m} = split(seconds);
  return h > 0 ? `${h} h ${pad(m)} min left` : `${m} min left`;
};

// "3:12:40" or "5:03"
export const formatClock = (seconds: number) => {
  const {h, m, s} = split(seconds);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
