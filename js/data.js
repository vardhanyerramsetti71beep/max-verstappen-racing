/* All editable content for the Max Verstappen site lives here. */
window.MV = {
  number: '3',

  /* The header's music button plays this through YouTube's official embedded player. */
  song: { title: '33 Max Verstappen', artist: 'Carte Blanq & Maxx Power', label: 'Tu tu tu du', note: 'Official audio · Spinnin’ Records · YouTube', youtube: 'jG2AciJ3zHY' },

  /* Upcoming races (start times in UTC, approximate — check against the official calendar).
     The hero card shows the first race that hasn't started yet; after the last one it falls back to `offseason`. */
  races: [
    { event: 'São Paulo GP', circuit: 'Interlagos', start: '2026-11-08T17:00:00Z' },
    { event: 'Las Vegas GP', circuit: 'Las Vegas Strip', start: '2026-11-22T04:00:00Z' },
    { event: 'Qatar GP', circuit: 'Lusail', start: '2026-11-29T16:00:00Z' },
    { event: 'Abu Dhabi GP', circuit: 'Yas Marina', start: '2026-12-06T13:00:00Z' }
  ],
  offseason: { kicker: 'Next season', event: '2027 season', circuit: 'Calendar to confirm', date: 'DATE TBC' },

  /* Career timeline. Put real photos at `img` (any format the browser reads);
     until then the designed placeholder in `ph` is shown. */
  journey: [
    { year: '2013', title: 'CIK-FIA KZ World Champion', note: 'Also European champion in KF and KZ', img: 'images/history/2013-karting.webp', ph: 'images/ph/j-2013.svg', h: 32, top: 16, tick: 'var(--accent)' },
    { year: '2014', title: 'FIA Formula 3 European Championship', note: '10 race wins, 3rd overall · won the Masters of F3', img: 'images/history/2014-f3.webp', ph: 'images/ph/j-2014.svg', h: 28, top: 30, tick: 'var(--accent-2)' },
    { year: '2015', title: 'Formula 1 debut — Melbourne, Australia', note: 'Youngest driver ever to start an F1 race, aged 17', img: 'images/history/2015-debut.webp', ph: 'images/ph/j-2015.svg', h: 36, top: 12, tick: 'var(--accent-3)' },
    { year: '2016', title: 'Spanish Grand Prix — Barcelona, Spain', note: 'First F1 win, aged 18 — the youngest winner ever', img: 'images/history/2016-barcelona.webp', ph: 'images/ph/j-2016.svg', h: 34, top: 26, tick: 'var(--accent)' },
    { year: '2021', title: 'World Champion — Abu Dhabi', note: 'First Drivers’ title', img: 'images/history/2021-champion.webp', ph: 'images/ph/j-2021.svg', h: 30, top: 18, tick: 'var(--accent-2)' },
    { year: '2022', title: 'World Champion — second title', note: '15 wins in the RB18', img: 'images/car/rb18-studio.webp', ph: 'images/ph/j-2021.svg', h: 34, top: 20, tick: 'var(--accent)' },
    { year: '2023', title: 'World Champion — third title', note: 'Record 19 wins in a single season', img: 'images/history/2023-champion.webp', ph: 'images/ph/j-2023.svg', h: 38, top: 22, tick: 'var(--accent-3)' },
    { year: '2024', title: 'World Champion — fourth title', note: 'Four in a row, 2021–2024', img: 'images/history/2024-champion.webp', ph: 'images/ph/j-2024.svg', h: 28, top: 24, tick: 'var(--accent)' },
    { year: '2025', title: 'Championship runner-up', note: '2nd with 421 points', img: 'images/history/2025-season.webp', ph: 'images/ph/j-2025.svg', h: 32, top: 18, tick: 'var(--accent-2)' },
    { year: '2026', title: 'Mexico City Grand Prix — Mexico', note: 'Latest win, as car #3 · win 74', img: 'images/history/2026-mexico.webp', ph: 'images/ph/j-2026.svg', h: 36, top: 12, tick: 'var(--accent-3)' }
  ],

  /* Career numbers (Formula One). `dp` = decimal places shown. The first entry is the large featured tile. */
  stats: [
    { k: 'World Championships', v: 4, note: '2021 · 2022 · 2023 · 2024', feature: true },
    { k: 'Race wins', v: 74, note: 'First: 2016 Spanish GP' },
    { k: 'Podiums', v: 138 },
    { k: 'Pole positions', v: 50 },
    { k: 'Fastest laps', v: 38 },
    { k: 'Career points', v: 3705.5, dp: 1 },
    { k: 'Entries', v: 253, note: '252 starts' }
  ],
  /* Timing-sheet rows under the numbers */
  sheet: [
    ['Full name', 'Max Emilian Verstappen'],
    ['Nationality', 'Dutch'],
    ['2026 team', 'Red Bull Racing–Red Bull Ford'],
    ['Car number', '33 (2015–2021) · 1 (2022–2025) · 3 (2026)'],
    ['First entry', '2015 Australian Grand Prix'],
    ['First win', '2016 Spanish Grand Prix'],
    ['Last win', '2026 Mexico City Grand Prix'],
    ['Last entry', '2026 São Paulo Grand Prix'],
    ['2025 position', '2nd — 421 points'],
    ['Previous series', '2014 FIA F3 European'],
    ['Title before F1', '2014 Masters of F3']
  ],

  /* Garage line-up. Hotspot keys match the buttons in index.html. */
  lineup: [
    {
      id: 'f1', name: 'RB18', short: 'F1', kicker: 'Open wheel · 2022 title car', wd: 72,
      hero: 'Single-seater — MV livery',
      specs: [
        ['Car', 'Red Bull RB18 — 2022'],
        ['2022 season', 'World Champion — second title'],
        ['Car number', '33 (2015–2021) · 1 (2022–2025) · 3 (2026)'],
        ['2026 team', 'Red Bull Racing–Red Bull Ford']
      ],
      hotspots: { frontwing: 'Front wing', brakes: 'Front tyre — 18-inch wheel', livery: 'Sidepod — RB18 livery', cockpit: 'Cockpit + halo' },
      credit: 'Photo: RB18 studio launch, 2022'
    }
  ],

  socials: [
    { handle: '@maxverstappen1', img: 'images/social/s1.webp', ph: 'images/ph/s1.svg' },
    { handle: '@Max33Verstappen', img: 'images/social/s2.webp', ph: 'images/ph/s2.svg' },
    { handle: '@maxverstappen1', img: 'images/social/s3.webp', ph: 'images/ph/s3.svg' },
    { handle: '@Max33Verstappen', img: 'images/social/s4.webp', ph: 'images/ph/s4.svg' },
    { handle: '@maxverstappen1', img: 'images/social/s5.webp', ph: 'images/ph/s5.svg' }
  ],

  /* Circuit outline shown on the race card (100×100 box). */
  mapPath: 'M23.35 80.71C30.58 82.37 46.24 82.37 55.87 82.52C65.51 82.67 75.14 82.97 81.16 81.61C87.18 80.26 90.49 77.25 92.00 74.39C93.51 71.53 92.60 66.71 90.19 64.45C87.78 62.19 81.76 61.14 77.55 60.84C73.33 60.54 68.37 63.40 64.90 62.65C61.44 61.89 57.38 59.03 56.77 56.32C56.17 53.61 58.28 48.95 61.29 46.39C64.30 43.83 70.47 43.38 74.84 40.97C79.20 38.56 86.13 35.40 87.48 31.94C88.84 28.47 85.98 22.60 82.97 20.19C79.96 17.78 74.24 16.58 69.42 17.48C64.60 18.39 58.73 22.60 54.06 25.61C49.40 28.62 45.63 33.59 41.42 35.55C37.20 37.51 32.99 38.11 28.77 37.35C24.56 36.60 19.59 30.58 16.13 31.030C12.67 31.48 8.90 36.00 8.00 40.06C7.10 44.13 8.75 51.81 10.71 55.42C12.67 59.03 19.44 58.88 19.74 61.74C20.04 64.60 11.91 69.42 12.52 72.58C13.12 75.74 16.13 79.05 23.35 80.71Z'
};
