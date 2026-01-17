import sharp from "sharp";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, "..", "com.zerodice0.chzzk.sdPlugin", "assets");

// CHZZK 브랜드 색상 (그린)
const CHZZK_GREEN = "#00FFA3";
const BLACK = "#000000";

async function createIcon(width, height, filename) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${Math.round(width * 0.1)}" fill="${CHZZK_GREEN}"/>
      <text x="${width / 2}" y="${height * 0.62}"
            font-family="Arial, sans-serif"
            font-size="${Math.round(height * 0.45)}"
            font-weight="bold"
            text-anchor="middle"
            fill="${BLACK}">C</text>
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

  await createIcon(144, 144, "plugin-icon.png");
  await createIcon(288, 288, "plugin-icon@2x.png");
  await createIcon(72, 72, "action-icon.png");
  await createIcon(144, 144, "action-icon@2x.png");
  await createIcon(56, 56, "category-icon.png");
  await createIcon(112, 112, "category-icon@2x.png");

  console.log("All icons generated successfully!");
}

main().catch(console.error);
