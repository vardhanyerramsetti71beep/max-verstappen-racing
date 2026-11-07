"""Generate the placeholder SVGs for the Max Verstappen site."""
import os, sys, math, random

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
NAVY, RED, ORANGE, YELLOW = '#0e1430', '#e4002b', '#ff6b00', '#ffc906'
SANS = "'Arial Narrow','Helvetica Neue',Arial,sans-serif"
SERIF = "Didot,'Bodoni 72',Georgia,serif"
MONO = "'SF Mono',Consolas,monospace"


def write(name, svg):
    with open(os.path.join(OUT, name), 'w', encoding='utf8') as f:
        f.write(svg)


def grain(id_='g'):
    return (f"<filter id='{id_}'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/>"
            f"<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0'/></filter>")


def track_path(cx, cy, s, seed):
    rnd = random.Random(seed)
    pts = []
    n = 14
    for i in range(n):
        a = i / n * math.tau
        r = s * (0.65 + rnd.random() * 0.45)
        pts.append((cx + math.cos(a) * r * 1.35, cy + math.sin(a) * r))
    d = f"M {pts[0][0]:.0f} {pts[0][1]:.0f} "
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C {c1[0]:.0f} {c1[1]:.0f}, {c2[0]:.0f} {c2[1]:.0f}, {p2[0]:.0f} {p2[1]:.0f} "
    return d + 'Z'


def photo_card(name, w, h, big, title, sub, file_hint, hue_a, hue_b, seed, big_size=None):
    big_size = big_size or int(h * .42)
    d = track_path(w * .68, h * .42, min(w, h) * .26, seed)
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'>
<defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='{hue_a}'/><stop offset='1' stop-color='{hue_b}'/></linearGradient>
<radialGradient id='glow' cx='.75' cy='.3' r='.7'><stop offset='0' stop-color='#ffffff' stop-opacity='.18'/><stop offset='1' stop-color='#ffffff' stop-opacity='0'/></radialGradient>
{grain()}</defs>
<rect width='{w}' height='{h}' fill='url(#bg)'/><rect width='{w}' height='{h}' fill='url(#glow)'/>
<path d='{d}' fill='none' stroke='#ffffff' stroke-opacity='.10' stroke-width='{min(w, h) * .06:.0f}' stroke-linejoin='round'/>
<path d='{d}' fill='none' stroke='#ffffff' stroke-opacity='.55' stroke-width='3' stroke-dasharray='10 10'/>
<g transform='skewX(-24)'><rect x='{w * .07 + h * .05:.0f}' y='{h * .1:.0f}' width='{w * .1:.0f}' height='{h * .012:.0f}' fill='{RED}'/><rect x='{w * .18 + h * .05:.0f}' y='{h * .1:.0f}' width='{w * .065:.0f}' height='{h * .012:.0f}' fill='{ORANGE}'/><rect x='{w * .255 + h * .05:.0f}' y='{h * .1:.0f}' width='{w * .035:.0f}' height='{h * .012:.0f}' fill='{YELLOW}'/></g>
<text x='{w * .06:.0f}' y='{h * .86:.0f}' font-family="{SANS}" font-weight='900' font-size='{big_size}' fill='#ffffff' fill-opacity='.92' letter-spacing='-4'>{big}</text>
<text x='{w * .065:.0f}' y='{h * .93:.0f}' font-family="{SERIF}" font-style='italic' font-size='{h * .05:.0f}' fill='{YELLOW}'>{title}</text>
<text x='{w * .94:.0f}' y='{h * .08:.0f}' text-anchor='end' font-family="{MONO}" font-size='{max(14, h * .022):.0f}' fill='#ffffff' fill-opacity='.65' letter-spacing='2'>{sub}</text>
<text x='{w * .94:.0f}' y='{h * .955:.0f}' text-anchor='end' font-family="{MONO}" font-size='{max(12, h * .018):.0f}' fill='#ffffff' fill-opacity='.45' letter-spacing='1.5'>ADD PHOTO → {file_hint}</text>
<rect width='{w}' height='{h}' filter='url(#g)' opacity='.6'/>
</svg>"""
    write(name, svg)


# ---- timeline cards
J = [
    ('j-2013', '2013', 'karting world champion', 'KZ · VARENNES', 'images/history/2013-karting.webp', '#1b2a66', '#0b1026'),
    ('j-2014', '2014', 'formula 3 european', '10 WINS', 'images/history/2014-f3.webp', '#2b1840', '#0b1026'),
    ('j-2015', '2015', 'f1 debut, aged 17', 'MELBOURNE', 'images/history/2015-debut.webp', '#123a5c', '#0a1024'),
    ('j-2016', '2016', 'first win, aged 18', 'BARCELONA', 'images/history/2016-barcelona.webp', '#5c1222', '#100a18'),
    ('j-2021', '2021', 'world champion', 'ABU DHABI', 'images/history/2021-champion.webp', '#3a2a06', '#0e1430'),
    ('j-2023', '2023', '19 wins in a season', 'TITLE 3', 'images/history/2023-champion.webp', '#5a2a08', '#0e1430'),
    ('j-2024', '2024', 'four in a row', 'TITLE 4', 'images/history/2024-champion.webp', '#16304f', '#060912'),
    ('j-2025', '2025', 'runner-up, 421 points', 'P2', 'images/history/2025-season.webp', '#2a2f45', '#07080f'),
    ('j-2026', '2026', 'mexico city win', 'CAR #3', 'images/history/2026-mexico.webp', '#0f5132', '#5a0d16'),
]
for i, (n, y, t, s, f, a, b) in enumerate(J):
    photo_card(n + '.svg', 1500, 1000, y, t, s, f, a, b, i + 3)

photo_card('paddock-zandvoort.svg', 1200, 1500, '#3', 'zandvoort', 'PADDOCK', 'images/paddock/paddock-zandvoort.webp', '#ff6b00', '#7a1a08', 41, 620)
photo_card('onoff-track.svg', 1800, 1200, '', '', 'ON TRACK', 'images/car/car-action.webp', '#22314f', '#0a0c14', 51)
photo_card('onoff-sim.svg', 1800, 1200, '', '', 'SIM RIG', 'images/offtrack/sim-rig.webp', '#3b145a', '#0a0612', 52)
socials = [('s1', '#ff6b00', '#5a1406', 'LIGHTS OUT'), ('s2', '#0e1430', '#1d3a8a', 'P1'), ('s3', '#e4002b', '#2a0610', 'SIMPLY LOVELY'),
           ('s4', '#1c1c24', '#3a3f52', 'GARAGE'), ('s5', '#ffc906', '#a8520a', '#3')]
for i, (n, a, b, word) in enumerate(socials):
    photo_card(n + '.svg', 800, 1400, word if len(word) < 4 else '', word.lower() if len(word) >= 4 else 'max verstappen', 'POST', f'images/social/{n}.webp', a, b, 60 + i, 420)

# ---- monogram
write('mv-monogram.svg', f"""<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
<rect width='64' height='64' rx='14' fill='{NAVY}'/>
<path d='M10 46 V18 L22 36 L34 18 V46' fill='none' stroke='#fff' stroke-width='6' stroke-linejoin='miter'/>
<path d='M38 18 L46 46 L54 18' fill='none' stroke='{YELLOW}' stroke-width='6'/>
<rect x='10' y='51' width='16' height='3' fill='{RED}'/><rect x='28' y='51' width='10' height='3' fill='{ORANGE}'/><rect x='40' y='51' width='6' height='3' fill='{YELLOW}'/>
</svg>""")

# ---- helmet (front view, square)
write('hero-helmet.svg', f"""<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000' viewBox='0 0 1000 1000'>
<defs>
<radialGradient id='shell' cx='.38' cy='.28' r='.85'><stop offset='0' stop-color='#3a4a8c'/><stop offset='.45' stop-color='{NAVY}'/><stop offset='1' stop-color='#05070f'/></radialGradient>
<linearGradient id='visor' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffd23a'/><stop offset='.35' stop-color='#ff7a1a'/><stop offset='.7' stop-color='#e4002b'/><stop offset='1' stop-color='#6a0a2a'/></linearGradient>
<linearGradient id='shine' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.75'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient>
<clipPath id='c'><path d='M500 70 C 760 70 900 250 905 500 C 908 660 880 790 800 880 L 640 930 L 360 930 L 200 880 C 120 790 92 660 95 500 C 100 250 240 70 500 70 Z'/></clipPath>
</defs>
<ellipse cx='500' cy='960' rx='330' ry='26' fill='#000' opacity='.18'/>
<path d='M500 70 C 760 70 900 250 905 500 C 908 660 880 790 800 880 L 640 930 L 360 930 L 200 880 C 120 790 92 660 95 500 C 100 250 240 70 500 70 Z' fill='url(#shell)'/>
<g clip-path='url(#c)'>
  <path d='M60 300 C 300 220 700 220 940 300 L 940 340 C 700 262 300 262 60 340 Z' fill='{RED}'/>
  <path d='M60 345 C 300 268 700 268 940 345 L 940 372 C 700 296 300 296 60 372 Z' fill='{ORANGE}'/>
  <path d='M60 377 C 300 302 700 302 940 377 L 940 396 C 700 322 300 322 60 396 Z' fill='{YELLOW}'/>
  <path d='M500 70 L 470 70 L 470 260 L 530 260 L 530 70 Z' fill='{YELLOW}' opacity='.9'/>
  <path d='M120 720 C 300 800 700 800 880 720 L 900 940 L 100 940 Z' fill='#05070f'/>
  <path d='M150 760 C 320 830 680 830 850 760' stroke='{RED}' stroke-width='16' fill='none'/>
</g>
<path d='M165 470 C 170 405 300 400 500 400 C 700 400 830 405 835 470 L 828 600 C 820 650 720 680 500 680 C 280 680 180 650 172 600 Z' fill='url(#visor)'/>
<path d='M210 455 C 330 432 470 430 560 432 L 520 470 C 420 468 300 474 205 492 Z' fill='url(#shine)' opacity='.8'/>
<path d='M165 470 C 170 405 300 400 500 400 C 700 400 830 405 835 470' stroke='#05070f' stroke-width='14' fill='none'/>
<circle cx='150' cy='540' r='34' fill='#11162e' stroke='#5a6390' stroke-width='6'/><circle cx='850' cy='540' r='34' fill='#11162e' stroke='#5a6390' stroke-width='6'/>
<path d='M380 690 L 620 690 L 600 760 L 400 760 Z' fill='#11162e'/>
<g fill='#fff' fill-opacity='.8'><rect x='410' y='705' width='180' height='10' rx='5'/><rect x='420' y='725' width='160' height='10' rx='5'/><rect x='430' y='745' width='140' height='8' rx='4'/></g>
<text x='500' y='215' text-anchor='middle' font-family="{SANS}" font-weight='900' font-style='italic' font-size='120' fill='#fff' fill-opacity='.95'>3</text>
<path d='M300 140 C 420 95 580 95 700 140' stroke='#fff' stroke-opacity='.25' stroke-width='14' fill='none' stroke-linecap='round'/>
</svg>""")

# ---- portrait (bust in race suit; head sits under the helmet slot)
write('hero-portrait.svg', f"""<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='2000' viewBox='0 0 1600 2000'>
<defs>
<linearGradient id='suit' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1d2a5c'/><stop offset='1' stop-color='{NAVY}'/></linearGradient>
<linearGradient id='skin' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e6b996'/><stop offset='1' stop-color='#c99474'/></linearGradient>
</defs>
<path d='M700 1000 L 900 1000 L 920 1120 L 680 1120 Z' fill='url(#skin)'/>
<ellipse cx='800' cy='820' rx='270' ry='300' fill='url(#skin)'/>

<path d='M180 2000 C 170 1500 280 1240 560 1130 L 700 1080 L 800 1180 L 900 1080 L 1040 1130 C 1320 1240 1430 1500 1420 2000 Z' fill='url(#suit)'/>
<path d='M640 1060 L 800 1190 L 960 1060 L 1000 1110 L 800 1290 L 600 1110 Z' fill='{RED}'/>
<path d='M612 1118 L 800 1290 L 988 1118' stroke='{YELLOW}' stroke-width='18' fill='none'/>
<path d='M240 1560 C 500 1500 1100 1500 1360 1560 L 1370 1630 C 1100 1570 500 1570 230 1630 Z' fill='{RED}'/>
<path d='M235 1640 C 500 1580 1100 1580 1365 1640 L 1368 1680 C 1100 1622 500 1622 232 1680 Z' fill='{ORANGE}'/>
<path d='M233 1690 C 500 1632 1100 1632 1367 1690 L 1368 1715 C 1100 1660 500 1660 232 1715 Z' fill='{YELLOW}'/>
<g font-family="{SANS}" font-weight='900' fill='#fff' fill-opacity='.9'>
  <text x='800' y='1470' text-anchor='middle' font-size='120' font-style='italic'>MV</text>
  <text x='420' y='1400' text-anchor='middle' font-size='54' fill-opacity='.55'>#3</text>
  <text x='1180' y='1400' text-anchor='middle' font-size='54' fill-opacity='.55'>NL</text>
</g>
<text x='800' y='1880' text-anchor='middle' font-family="{MONO}" font-size='30' fill='#fff' fill-opacity='.4' letter-spacing='4'>ADD PHOTO → images/hero/max-face.webp</text>
</svg>""")
print('ok', len(os.listdir(OUT)))
