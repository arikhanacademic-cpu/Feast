# The Great Pancake Stack

An independent, full-viewport Feastoria browser game. This repository is separate from the main Feastoria game and other minigames. No other project is required or changed.

## Play and develop

Requires Node 24 (Node 22 also supports the server and test runner). Runtime has **no package dependencies**, build step, API, secrets, or remote asset requests.

```sh
npm ci --cache /tmp/pancake-npm-cache
npm start
```

Server: port 4173, override with `PORT`. Open through your hosting environment's supported preview or serve the static files on any HTTPS static host. Use this existing checkout; cloud tasks are already isolated and need no extra Git worktree.

- Arrow keys / A and D: move with acceleration.
- Hold Space / diamond button: steady, at reduced speed.
- Drag the catching area: guide toward your pointer, using the same physics limits.
- Large left/right buttons support held touch input alongside steady.
- Escape / P: pause or resume. Focus loss and page hiding pause automatically.
- Stand still near the serving table to place the plate. The destination appears across the kitchen, with three marked bumps along the route.

Three timed catch stages lead into untimed delivery stages. Pancakes bank 100, butter 75, syrup 100; toppings stay with their pancake and are lost if it drops. Burnt catches deduct 50 from that round's food value (floor zero); a nonempty delivery adds at most 150 for time. Only deliveries are banked. Best score is saved locally when browser storage is available.

## Validation

```sh
npm test
# With npm start running, and Chromium installed:
npm run test:browser
# Optional executable override: CHROMIUM_PATH=/path/to/chromium
```

`physics.js` is DOM-free. A 120 Hz fixed step drives individual spring-damped pancake positions and rotations. Overhang must exceed a support threshold for a sustained period before that segment detaches. Detached pieces become independent falling debris. Rendering interpolates positions. `game.js` owns one animation loop and clears held inputs on pause, blur and pointer cancellation. Resizing changes presentation only.

The browser suite uses Playwright's virtual clock and real keyboard/pointer controls, reads diagnostic state without editing it, plays all three rounds and the lesson, and verifies pause, restart, resize, scoring, best-score storage and reduced-motion layout.

## Art and sound

- `assets/kitchen.png`: original AI-generated layered-use background, generated for this game. It contains no moving props or UI.
- `art.js`: original transparent Canvas vector artwork for characters, food, plate, copper pan, table and animated poses. Each pancake is drawn independently.
- **Ari and Yaz are explicitly provisional stand-ins. Their referenced model sheets were not attached or available in the workspace. Replace their temporary vector designs against supplied authoritative references before calling the character art approved.**
- `audio.js`: original synthesized music-box melody and kitchen-like effects using Web Audio, including toss, catch, syrup, spill, bell and delivery sounds. No recorded soundtrack or supplied audio is claimed. Music and FX have separate switches; sound begins after interaction.
- Fonts are locally bundled Fraunces and DM Sans under their included SIL Open Font Licenses. No font CDN is needed at runtime.
- Reduced motion removes decorative tower sway, reduces step swing and pop-up movement, and retains essential stack and trajectory feedback.

## Separate-site publishing

`.github/workflows/pages.yml` deploys only this standalone game to GitHub Pages, using a narrowly scoped artifact rather than publishing tests, dependencies or server files. GitHub Pages must be enabled with **GitHub Actions** as its source in the repository settings. Then push `main` or run the workflow manually. Deployment requires repository access and Pages availability for the account. No deployment has happened until a successful workflow and an HTTP smoke test are confirmed.

A portable static site is made with:

```sh
npm run package:site
```

The `site/` folder can be uploaded to another independent static host. It has no dependency on Node at runtime.
