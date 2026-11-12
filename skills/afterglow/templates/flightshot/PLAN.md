# FlightShot 曬機 · afterglow (example)

**Product:** FlightShot (曬機), an iPhone app that turns a flight into share cards for your story.
**Sources:** `ridemountainpig/flightshot-website` (`src/i18n/locales/en.ts`, README); card images are the app's own renders.
**Look / device:** amber, terminal (keyboard), knob chapter through green, white, cyan. 4 chapters + end, 24.4 s, 30 fps.

| Chapter | Caption | Action → result | Source |
| --- | --- | --- | --- |
| boot | Press POWER to boot | cursor presses POWER → screen opens → home: "Before takeoff, show it off." | hero title |
| scan | Scan your boarding pass · ✓ Recognized | types `boarding-pass.jpg`, ⏎ SCAN → scan line over the real pass card → TPE ✈ NGO, CI 150, 08:40 → 12:20 +1H | hero.lede, steps 01, ScanVisual |
| knob | Turn the knob: amber, green, white, cyan | three knob clicks → the device changes look; the screen shows the real cards | gallery.title "42 cards. One of them is you." |
| share | Hit ⏎ SHARE. Straight to your story. · 1 tap | ⏎ SHARE → the magazine-cover card grows into the story frame; share log; glyph rain | hero.lede "straight into your Instagram story", "share in 1 tap" |
| end | >_ FlightShot · Before takeoff, show it off. · scan · share · story | | hero, privacy ("No account", "No tracking", "Stays on your phone") |

The terminal, its commands (`flightshot scan`, `flightshot cards`, `flightshot share`) and the boot lines are a
stylisation of the app's steps, not a real CLI. Legal line: "Cards show the app's sample flight. Not affiliated with any airline."
