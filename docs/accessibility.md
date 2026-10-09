# Accessibility (HA-01, HA-02)

## Automated checks (`npm test`)

- `__tests__/accessibility/screenAudit.test.tsx` renders every screen and fails
  on any control (a pressable host view) without an accessibility role or a
  name (its label, or its text).
- `__tests__/accessibility/textScaling.test.tsx`:
  - text follows the system font size, capped at 2× for body text and 1.5× for
    headings so layouts stay usable;
  - nothing sets `allowFontScaling={false}`;
  - the loading animation holds still when the system asks for reduced motion.
- UI kit tests cover roles, labels, states and the 44 pt minimum touch target
  for buttons, chips, switches, segmented controls and progress bars.

## Manual checklist before a release

Run on a physical Android phone (TalkBack) and iPhone (VoiceOver).

- [ ] Sign in, Home, Discover, Following, Clubs and You can be reached and
      read in a sensible order with swipe navigation.
- [ ] Every button announces what it does ("Resume Where the Crawdads Sing",
      "Bookmark this moment"), not just an icon name.
- [ ] Player: Play/Pause, skip and the Position control. Swiping up or down on
      Position skips by the configured intervals, and the elapsed and
      remaining times are announced.
- [ ] Sheets (sleep timer, bookmarks, shelf options) move focus into the sheet
      and back when closed.
- [ ] Error banners ("This book isn't available…", "Playback stopped…") are
      announced as alerts.
- [ ] With the largest system font size, no text is cut off on Home, the
      Player, the Book screen and Settings.
- [ ] With Reduce motion / Remove animations on, the loading screen doesn't
      animate.
- [ ] Colour contrast holds in both light and dark appearance.
