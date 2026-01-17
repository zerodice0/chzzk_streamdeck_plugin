import sharp from "sharp";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, "..", "com.zerodice0.chzzk.sdPlugin", "assets");

// CHZZK 브랜드 색상
const CHZZK_GREEN = "#00FFA3";
const BLACK = "#000000";
const DARK_BG = "#1A1A2E";

/**
 * Create a basic icon with text
 */
async function createIcon(width, height, filename, text = "C", bgColor = CHZZK_GREEN, textColor = BLACK) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${Math.round(width * 0.1)}" fill="${bgColor}"/>
      <text x="${width / 2}" y="${height * 0.65}"
            font-family="Arial, sans-serif"
            font-size="${Math.round(height * 0.45)}"
            font-weight="bold"
            text-anchor="middle"
            fill="${textColor}">${text}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(assetsDir, filename));

  console.log(`Created: ${filename}`);
}

/**
 * Create viewer count icon (person silhouette)
 */
async function createViewerCountIcon(width, height, filename) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${Math.round(width * 0.1)}" fill="${DARK_BG}"/>
      <!-- Person icon -->
      <circle cx="${width * 0.5}" cy="${height * 0.32}" r="${width * 0.15}" fill="${CHZZK_GREEN}"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.68}" rx="${width * 0.25}" ry="${height * 0.18}" fill="${CHZZK_GREEN}"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(assetsDir, filename));

  console.log(`Created: ${filename}`);
}

/**
 * Create live settings icon (gear/cog)
 */
async function createLiveSettingsIcon(width, height, filename) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.35;
  const innerR = width * 0.2;
  const toothCount = 8;
  const toothDepth = width * 0.1;

  // Create gear path
  let gearPath = "";
  for (let i = 0; i < toothCount * 2; i++) {
    const angle = (i * Math.PI) / toothCount;
    const r = i % 2 === 0 ? outerR : outerR - toothDepth;
    const x = cx + r * Math.cos(angle - Math.PI / 2);
    const y = cy + r * Math.sin(angle - Math.PI / 2);
    gearPath += (i === 0 ? "M" : "L") + `${x},${y}`;
  }
  gearPath += "Z";

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${Math.round(width * 0.1)}" fill="${DARK_BG}"/>
      <path d="${gearPath}" fill="${CHZZK_GREEN}"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${DARK_BG}"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(assetsDir, filename));

  console.log(`Created: ${filename}`);
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  // Stream Deck 아이콘 크기 규격
  // 플러그인 아이콘: 144x144 및 288x288 (@2x)
  // 액션 아이콘: 72x72 및 144x144 (@2x)
  // 카테고리 아이콘: 56x56 및 112x112 (@2x)

  // Plugin icon
  await createIcon(144, 144, "plugin-icon.png");
  await createIcon(288, 288, "plugin-icon@2x.png");

  // Category icon
  await createIcon(56, 56, "category-icon.png");
  await createIcon(112, 112, "category-icon@2x.png");

  // Viewer count action icon
  await createViewerCountIcon(72, 72, "viewer-count-icon.png");
  await createViewerCountIcon(144, 144, "viewer-count-icon@2x.png");

  // Live settings action icon
  await createLiveSettingsIcon(72, 72, "live-settings-icon.png");
  await createLiveSettingsIcon(144, 144, "live-settings-icon@2x.png");

  // Legacy action icon (keep for compatibility)
  await createIcon(72, 72, "action-icon.png");
  await createIcon(144, 144, "action-icon@2x.png");

  console.log("\nAll icons generated successfully!");
}

main().catch(console.error);
