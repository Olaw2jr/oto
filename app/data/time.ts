const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// "Sunday evening" / "Good evening" for the Home header.
export const dayGreeting = (date = new Date()) => {
  const hour = date.getHours();
  const part =
    hour >= 5 && hour < 12
      ? 'morning'
      : hour >= 12 && hour < 17
      ? 'afternoon'
      : hour >= 17 && hour < 22
      ? 'evening'
      : 'night';
  return {
    label: `${weekdays[date.getDay()]} ${part}`,
    hello: `Good ${part === 'night' ? 'evening' : part}`,
  };
};
