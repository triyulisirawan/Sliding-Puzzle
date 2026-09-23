// High-precision SVG pictures for Level 0 (2x2 Lion & 3x2 Elephant Picture Sliding Puzzle)
// 1. Grid 2x2 (Cute Lion / Singa Lucu): 400x400 (2 columns x 2 rows)
// 2. Grid 3x2 (Cute Elephant / Gajah Lucu): 600x400 (3 columns x 2 rows)

// --- 1. CUTE LION SVG (2x2 Grid) ---
const lionSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <!-- Sky Gradient -->
    <linearGradient id="lionSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fed7aa" />
      <stop offset="100%" stop-color="#ffedd5" />
    </linearGradient>

    <!-- Hill Gradient -->
    <linearGradient id="lionHill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>

    <!-- Lion Mane Gradient -->
    <linearGradient id="lionMane" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="50%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>

    <!-- Lion Face/Skin Gradient -->
    <linearGradient id="lionSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
  </defs>

  <!-- 1. SKY BACKGROUND -->
  <rect x="0" y="0" width="400" height="400" fill="url(#lionSky)" />

  <!-- 2. CONTINUOUS HILL - Seamless across x=200 at y=200 -->
  <path d="M 0 210 Q 100 185 200 200 Q 300 215 400 195 L 400 400 L 0 400 Z" fill="url(#lionHill)" />

  <!-- 3. RAINBOW IN SKY -->
  <g opacity="0.8">
    <path d="M 30 200 A 170 170 0 0 1 370 200" fill="none" stroke="#f43f5e" stroke-width="6" />
    <path d="M 40 200 A 160 160 0 0 1 360 200" fill="none" stroke="#fb923c" stroke-width="6" />
    <path d="M 50 200 A 150 150 0 0 1 350 200" fill="none" stroke="#facc15" stroke-width="6" />
    <path d="M 60 200 A 140 140 0 0 1 340 200" fill="none" stroke="#4ade80" stroke-width="6" />
    <path d="M 70 200 A 130 130 0 0 1 330 200" fill="none" stroke="#38bdf8" stroke-width="6" />
  </g>

  <!-- 4. SUN IN TILE 1 (Top Left) -->
  <g transform="translate(55, 55)">
    <circle cx="0" cy="0" r="24" fill="#facc15" />
    <circle cx="0" cy="0" r="29" fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="6 5" />
    <circle cx="-6" cy="-3" r="2.5" fill="#78350f" />
    <circle cx="6" cy="-3" r="2.5" fill="#78350f" />
    <path d="M -6 5 Q 0 11 6 5" fill="none" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" />
  </g>

  <!-- Cloud in Tile 2 (Top Right) -->
  <path d="M 310 50 Q 325 35 345 40 Q 360 28 375 45 Q 385 50 380 65 L 305 65 Z" fill="#ffffff" opacity="0.9" />

  <!-- 5. LION TAIL (Tile 3: x=30..130, y=240..310) -->
  <path d="M 150 270 Q 90 250 60 280 Q 50 290 55 300 Q 70 305 85 285 Q 110 275 150 290 Z" fill="url(#lionSkin)" />
  <!-- Fluffy Mane Tuft on Tail -->
  <circle cx="55" cy="295" r="14" fill="url(#lionMane)" />

  <!-- 6. LION BODY (Tile 3 & Tile 4: x=110..290, y=200..370) -->
  <path d="M 130 220 Q 110 280 120 340 Q 135 375 200 375 Q 265 375 280 340 Q 290 280 270 220 Z" fill="url(#lionSkin)" />

  <!-- Lion White Tummy -->
  <ellipse cx="200" cy="300" rx="55" ry="50" fill="#fef08a" opacity="0.9" />

  <!-- LION PAWS -->
  <!-- Left Paw (Tile 3: x=135..185, y=330..380) -->
  <rect x="135" y="335" width="45" height="42" rx="14" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
  <circle cx="147" cy="370" r="3.5" fill="#ffffff" />
  <circle cx="157" cy="373" r="3.5" fill="#ffffff" />
  <circle cx="167" cy="370" r="3.5" fill="#ffffff" />

  <!-- Right Paw (Tile 4: x=215..265, y=330..380) -->
  <rect x="220" y="335" width="45" height="42" rx="14" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
  <circle cx="233" cy="370" r="3.5" fill="#ffffff" />
  <circle cx="243" cy="373" r="3.5" fill="#ffffff" />
  <circle cx="253" cy="370" r="3.5" fill="#ffffff" />

  <!-- 7. LION GIANT FLUFFY MANE (Centered at x=200, y=160 across Tile 1 & 2 & 3 & 4) -->
  <g id="lion-mane-group">
    <circle cx="200" cy="160" r="95" fill="url(#lionMane)" />
    <!-- Fluffy Petal Petal Mane Ridges -->
    <circle cx="200" cy="58" r="20" fill="url(#lionMane)" />
    <circle cx="255" cy="72" r="20" fill="url(#lionMane)" />
    <circle cx="292" cy="112" r="20" fill="url(#lionMane)" />
    <circle cx="298" cy="165" r="20" fill="url(#lionMane)" />
    <circle cx="272" cy="215" r="20" fill="url(#lionMane)" />
    <circle cx="222" cy="248" r="20" fill="url(#lionMane)" />
    <circle cx="178" cy="248" r="20" fill="url(#lionMane)" />
    <circle cx="128" cy="215" r="20" fill="url(#lionMane)" />
    <circle cx="102" cy="165" r="20" fill="url(#lionMane)" />
    <circle cx="108" cy="112" r="20" fill="url(#lionMane)" />
    <circle cx="145" cy="72" r="20" fill="url(#lionMane)" />
  </g>

  <!-- 8. LION HEAD (Centered at x=200, y=160) -->
  <circle cx="200" cy="160" r="68" fill="url(#lionSkin)" stroke="#ca8a04" stroke-width="2" />

  <!-- Round Ears -->
  <circle cx="142" cy="110" r="18" fill="url(#lionSkin)" stroke="#ca8a04" stroke-width="2" />
  <circle cx="142" cy="110" r="10" fill="#fbcfe8" />
  <circle cx="258" cy="110" r="18" fill="url(#lionSkin)" stroke="#ca8a04" stroke-width="2" />
  <circle cx="258" cy="110" r="10" fill="#fbcfe8" />

  <!-- CUTE EYES -->
  <!-- Left Eye (Tile 1) -->
  <circle cx="170" cy="148" r="12" fill="#ffffff" stroke="#854d0e" stroke-width="2" />
  <circle cx="172" cy="148" r="7" fill="#0f172a" />
  <circle cx="175" cy="144" r="3" fill="#ffffff" />

  <!-- Right Eye (Tile 2) -->
  <circle cx="230" cy="148" r="12" fill="#ffffff" stroke="#854d0e" stroke-width="2" />
  <circle cx="228" cy="148" r="7" fill="#0f172a" />
  <circle cx="231" cy="144" r="3" fill="#ffffff" />

  <!-- Cute Snout & Pink Nose (x=200 exact center line) -->
  <ellipse cx="200" cy="172" rx="22" ry="16" fill="#ffffff" opacity="0.9" />
  <polygon points="200,162 190,172 210,172" fill="#f43f5e" rx="3" />
  <path d="M 200 172 L 200 180 M 200 180 Q 192 188 186 182 M 200 180 Q 208 188 214 182" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />

  <!-- Rosy Cheeks -->
  <ellipse cx="152" cy="165" rx="8" ry="5" fill="#f43f5e" opacity="0.5" />
  <ellipse cx="248" cy="165" rx="8" ry="5" fill="#f43f5e" opacity="0.5" />

  <!-- Cute Golden Crown on Lion Head -->
  <g transform="translate(200, 90)">
    <path d="M -16 0 L -8 -16 L 0 -6 L 8 -16 L 16 0 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
    <circle cx="-8" cy="-16" r="3" fill="#ef4444" />
    <circle cx="0" cy="-6" r="3" fill="#38bdf8" />
    <circle cx="8" cy="-16" r="3" fill="#ef4444" />
  </g>

  <!-- Flowers on Grass in Tile 3 & 4 -->
  <g transform="translate(45, 350)">
    <circle cx="0" cy="-6" r="5" fill="#f43f5e" />
    <circle cx="-5" cy="-2" r="5" fill="#f43f5e" />
    <circle cx="5" cy="-2" r="5" fill="#f43f5e" />
    <circle cx="0" cy="0" r="4" fill="#facc15" />
    <path d="M 0 4 L 0 18" stroke="#15803d" stroke-width="2.5" />
  </g>

  <g transform="translate(355, 345)">
    <circle cx="0" cy="-6" r="5" fill="#38bdf8" />
    <circle cx="-5" cy="-2" r="5" fill="#38bdf8" />
    <circle cx="5" cy="-2" r="5" fill="#38bdf8" />
    <circle cx="0" cy="0" r="4" fill="#ffffff" />
    <path d="M 0 4 L 0 18" stroke="#15803d" stroke-width="2.5" />
  </g>
</svg>`;

// --- 2. CUTE ELEPHANT SVG (3x2 Grid) ---
const elephantSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <!-- Sky Background Gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc" />
      <stop offset="60%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#fef08a" />
    </linearGradient>

    <!-- Hill Gradients -->
    <linearGradient id="hillBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="100%" stop-color="#22c55e" />
    </linearGradient>

    <linearGradient id="hillFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>

    <!-- Cute Elephant Blue Gradient -->
    <linearGradient id="elephantSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="50%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>

    <!-- Inner Ear Pink Gradient -->
    <linearGradient id="earPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbcfe8" />
      <stop offset="100%" stop-color="#f472b6" />
    </linearGradient>

    <!-- Tummy Pastel Gradient -->
    <linearGradient id="tummyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>

    <!-- Water Bubble Glow -->
    <radialGradient id="bubbleGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.8" />
    </radialGradient>
  </defs>

  <!-- 1. SKY BACKGROUND -->
  <rect x="0" y="0" width="600" height="400" fill="url(#skyGrad)" />

  <!-- 2. CONTINUOUS BACK HILL -->
  <path d="M 0 170 Q 100 140 200 150 Q 300 160 400 160 Q 500 160 600 180 L 600 400 L 0 400 Z" fill="url(#hillBackGrad)" />

  <!-- 3. CONTINUOUS FRONT HILL -->
  <path d="M 0 220 Q 100 190 200 210 Q 300 200 400 200 Q 500 200 600 230 L 600 400 L 0 400 Z" fill="url(#hillFrontGrad)" />

  <!-- 4. RAINBOW IN SKY -->
  <g opacity="0.85">
    <path d="M 50 200 A 250 250 0 0 1 550 200" fill="none" stroke="#f43f5e" stroke-width="8" />
    <path d="M 60 200 A 240 240 0 0 1 540 200" fill="none" stroke="#fb923c" stroke-width="8" />
    <path d="M 70 200 A 230 230 0 0 1 530 200" fill="none" stroke="#facc15" stroke-width="8" />
    <path d="M 80 200 A 220 220 0 0 1 520 200" fill="none" stroke="#4ade80" stroke-width="8" />
    <path d="M 90 200 A 210 210 0 0 1 510 200" fill="none" stroke="#38bdf8" stroke-width="8" />
  </g>

  <!-- 5. BRIGHT SUN IN TILE 1 -->
  <g transform="translate(65, 60)">
    <circle cx="0" cy="0" r="28" fill="#facc15" />
    <circle cx="0" cy="0" r="34" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="8 6" />
    <circle cx="-8" cy="-4" r="3" fill="#78350f" />
    <circle cx="8" cy="-4" r="3" fill="#78350f" />
    <path d="M -8 6 Q 0 14 8 6" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round" />
    <circle cx="-13" cy="3" r="3.5" fill="#f87171" opacity="0.6" />
    <circle cx="13" cy="3" r="3.5" fill="#f87171" opacity="0.6" />
  </g>

  <!-- Cloud in Tile 3 -->
  <path d="M 470 70 Q 485 50 510 55 Q 530 40 550 60 Q 565 65 560 85 L 465 85 Z" fill="#ffffff" opacity="0.9" />

  <!-- 6. CUTE ELEPHANT TAIL -->
  <path d="M 180 270 Q 130 260 100 290 Q 90 300 95 310 Q 110 315 125 295 Q 150 280 180 295 Z" fill="url(#elephantSkin)" />
  <path d="M 95 310 Q 80 325 85 335 Q 100 330 105 315 Z" fill="#f472b6" />

  <!-- 7. ELEPHANT MAIN CHUBBY BODY -->
  <path d="M 190 200 Q 150 250 160 320 Q 170 370 230 375 Q 300 380 370 375 Q 430 370 440 320 Q 450 250 410 200 Z" fill="url(#elephantSkin)" />

  <!-- ELEPHANT PASTEL TUMMY PATCH -->
  <ellipse cx="300" cy="295" rx="70" ry="60" fill="url(#tummyGrad)" opacity="0.9" />

  <!-- ELEPHANT FEET -->
  <rect x="180" y="325" width="45" height="50" rx="16" fill="#3b82f6" />
  <circle cx="192" cy="368" r="4" fill="#ffffff" />
  <circle cx="202" cy="371" r="4" fill="#ffffff" />
  <circle cx="212" cy="368" r="4" fill="#ffffff" />

  <rect x="245" y="330" width="48" height="52" rx="16" fill="#60a5fa" />
  <circle cx="258" cy="375" r="4.5" fill="#ffffff" />
  <circle cx="269" cy="378" r="4.5" fill="#ffffff" />
  <circle cx="280" cy="375" r="4.5" fill="#ffffff" />

  <rect x="310" y="330" width="48" height="52" rx="16" fill="#60a5fa" />
  <circle cx="323" cy="375" r="4.5" fill="#ffffff" />
  <circle cx="334" cy="378" r="4.5" fill="#ffffff" />
  <circle cx="345" cy="375" r="4.5" fill="#ffffff" />

  <rect x="375" y="325" width="45" height="50" rx="16" fill="#3b82f6" />
  <circle cx="387" cy="368" r="4" fill="#ffffff" />
  <circle cx="397" cy="371" r="4" fill="#ffffff" />
  <circle cx="407" cy="368" r="4" fill="#ffffff" />

  <!-- 8. ELEPHANT BIG EARS -->
  <path d="M 230 110 C 130 50 100 170 210 215 C 225 210 235 180 235 150 Z" fill="url(#elephantSkin)" />
  <path d="M 225 120 C 150 75 125 160 210 200 C 220 195 228 175 228 150 Z" fill="url(#earPink)" opacity="0.85" />

  <path d="M 370 110 C 470 50 500 170 390 215 C 375 210 365 180 365 150 Z" fill="url(#elephantSkin)" />
  <path d="M 375 120 C 450 75 475 160 390 200 C 380 195 372 175 372 150 Z" fill="url(#earPink)" opacity="0.85" />

  <!-- 9. CUTE ELEPHANT BIG HEAD -->
  <ellipse cx="300" cy="135" rx="85" ry="70" fill="url(#elephantSkin)" />

  <!-- CUTE SHINY BIG EYES -->
  <circle cx="265" cy="120" r="14" fill="#ffffff" stroke="#1d4ed8" stroke-width="2" />
  <circle cx="267" cy="120" r="8" fill="#0f172a" />
  <circle cx="270" cy="116" r="3.5" fill="#ffffff" />
  <circle cx="263" cy="123" r="1.5" fill="#ffffff" />

  <circle cx="335" cy="120" r="14" fill="#ffffff" stroke="#1d4ed8" stroke-width="2" />
  <circle cx="333" cy="120" r="8" fill="#0f172a" />
  <circle cx="336" cy="116" r="3.5" fill="#ffffff" />
  <circle cx="329" cy="123" r="1.5" fill="#ffffff" />

  <!-- Rosy Blushing Cheeks -->
  <ellipse cx="242" cy="142" rx="9" ry="6" fill="#f43f5e" opacity="0.5" />
  <ellipse cx="358" cy="142" rx="9" ry="6" fill="#f43f5e" opacity="0.5" />

  <!-- Crown on Head -->
  <g transform="translate(300, 68)">
    <path d="M -15 0 L -8 -15 L 0 -5 L 8 -15 L 15 0 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
    <circle cx="-8" cy="-15" r="3" fill="#f43f5e" />
    <circle cx="0" cy="-5" r="3" fill="#38bdf8" />
    <circle cx="8" cy="-16" r="3" fill="#f43f5e" />
  </g>

  <!-- White Tusks -->
  <path d="M 268 158 Q 252 170 255 185 Q 268 178 276 164 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
  <path d="M 332 158 Q 348 170 345 185 Q 332 178 324 164 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- 10. ELEPHANT CUTE TRUNK -->
  <path d="M 282 155 Q 285 220 310 245 Q 335 260 360 235 Q 370 215 355 205 Q 340 210 335 225 Q 315 230 302 190 Q 298 155 298 155 Z" fill="url(#elephantSkin)" stroke="#2563eb" stroke-width="1.5" />

  <path d="M 288 175 Q 295 178 298 175" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <path d="M 290 190 Q 298 193 302 190" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <path d="M 296 208 Q 306 212 312 208" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.6" />

  <!-- 11. WATER BUBBLES & HEARTS -->
  <circle cx="380" cy="190" r="16" fill="url(#bubbleGrad)" />
  <path d="M 380 190 C 380 186, 374 182, 370 187 C 366 192, 372 198, 380 202 C 388 198, 394 192, 390 187 C 386 182, 380 186, 380 190 Z" fill="#f43f5e" opacity="0.8" />

  <circle cx="410" cy="160" r="12" fill="url(#bubbleGrad)" />
  <circle cx="395" cy="130" r="9" fill="url(#bubbleGrad)" />
  <circle cx="430" cy="125" r="14" fill="url(#bubbleGrad)" />

  <!-- 12. FLOWERS & BUTTERFLIES ON GROUND -->
  <g transform="translate(60, 355)">
    <circle cx="0" cy="-8" r="6" fill="#f43f5e" />
    <circle cx="-7" cy="-3" r="6" fill="#f43f5e" />
    <circle cx="7" cy="-3" r="6" fill="#f43f5e" />
    <circle cx="0" cy="0" r="5" fill="#facc15" />
    <path d="M 0 5 L 0 25" stroke="#15803d" stroke-width="3" />
  </g>

  <g transform="translate(480, 350)">
    <circle cx="0" cy="-7" r="6" fill="#ec4899" />
    <circle cx="-6" cy="-3" r="6" fill="#ec4899" />
    <circle cx="6" cy="-3" r="6" fill="#ec4899" />
    <circle cx="0" cy="0" r="5" fill="#facc15" />
    <path d="M 0 5 L 0 22" stroke="#15803d" stroke-width="3" />
  </g>
</svg>`;

export const LEVEL_0_LION_URL = `data:image/svg+xml;utf8,${encodeURIComponent(lionSvgContent)}`;
export const LEVEL_0_ELEPHANT_URL = `data:image/svg+xml;utf8,${encodeURIComponent(elephantSvgContent)}`;
export const LEVEL_0_PICTURE_URL = LEVEL_0_ELEPHANT_URL; // Default fallback alias

/**
 * Returns the CSS style for a Level 0 tile slice
 * Support both Grid 2x2 (Cute Lion: 3 tiles #1..#3) and Grid 3x2 (Cute Elephant: 5 tiles #1..#5)
 */
export function getLevel0TileStyle(
  tileValue: number,
  gridCols: number = 3,
  gridRows: number = 2
): React.CSSProperties {
  const maxTile = gridCols * gridRows - 1;
  if (tileValue < 1 || tileValue > maxTile) return {};

  const colIndex = (tileValue - 1) % gridCols;
  const rowIndex = Math.floor((tileValue - 1) / gridCols);

  if (gridCols === 2 && gridRows === 2) {
    // 2x2 Grid (Singa Lucu 🦁)
    // colIndex: 0 (0%), 1 (100%)
    // rowIndex: 0 (0%), 1 (100%)
    const posX = colIndex * 100;
    const posY = rowIndex * 100;

    return {
      backgroundImage: `url("${LEVEL_0_LION_URL}")`,
      backgroundSize: '200% 200%',
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
      backgroundOrigin: 'border-box',
      backgroundClip: 'border-box',
    };
  } else {
    // 3x2 Grid (Gajah Lucu 🐘)
    // colIndex: 0 (0%), 1 (50%), 2 (100%)
    // rowIndex: 0 (0%), 1 (100%)
    const posX = colIndex * 50;
    const posY = rowIndex * 100;

    return {
      backgroundImage: `url("${LEVEL_0_ELEPHANT_URL}")`,
      backgroundSize: '300% 200%',
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
      backgroundOrigin: 'border-box',
      backgroundClip: 'border-box',
    };
  }
}
