# Form Coach

A web app that coaches exercise form using pose tracking that runs entirely in the browser.
Camera video never leaves the device; answers and settings are saved in localStorage only.

**Live site:** https://panpan123nick.github.io/FormCoach/
(On a phone: open it in Safari, tap Share → **Add to Home Screen** to install it like an app.)

## Run it

```bash
npm install      # first time only
npm run dev      # start the app at http://localhost:5173
npm test         # run the unit tests
npm run dev:phone  # same app over https, so a phone on your Wi-Fi can use the camera
```

**Testing on a phone:** run `npm run dev:phone`, then open the `https://` "Network" address it
prints on your phone (same Wi-Fi). Your phone will warn that the certificate isn't trusted; that's
expected for a local test server, so continue anyway. Camera access only works on https pages.

## Publishing to GitHub Pages

The built site lives in `docs/`, and GitHub Pages publishes that folder.
After changing the code:

1. `npm run build` (rebuilds `docs/`)
2. Upload the changed files to GitHub (or push with git)
3. Wait a minute or two for GitHub Pages to update

To redraw the app icons: `node scripts/make-icons.mjs`

## Status

- [x] Phase 1 – Onboarding survey (9 questions, safety notice, review & edit)
- [x] Phase 2 – Setup directions and camera check
- [x] Phase 3 – Workout tracking (reps, plank timer, spoken cues, STOP button, plan)
- [ ] Phase 4 – Settings (voice, language, feedback style, clear data)

## Where things are

| Folder | What's in it |
|---|---|
| `src/survey/questions.js` | The survey questions, as data. Edit here to add/change questions. |
| `src/survey/surveyLogic.js` | Survey rules ("None" option, safety check, answered or not). |
| `src/i18n/en.json` | Every piece of on-screen text. Add `es.json`, `zh.json` for other languages. |
| `src/storage/storage.js` | Saving/loading from localStorage. |
| `src/intro/` | Boot animation and title screen. |
| `src/setup/` | Setup directions and the live camera check. |
| `src/pose/` | Pose model loading, landmark names, full-body check, skeleton drawing. |
| `src/exercises/exercises.js` | **All form thresholds** (angles, plank limits). Tune these after real testing. |
| `src/workout/` | Plan generator, live workout session, stopped and done screens. |
| `src/voice/` | Spoken cues and the "don't nag" timing rules. |
| `public/models/` | The pose model, served by the app itself (no outside downloads at runtime). |
| `src/components/PoseFigure.jsx` | The animated skeleton mascot. |
| `src/styles/` | `global.css` (colors, survey, home), `intro.css` (boot, mascot) and `poster.css` (title screen). |
