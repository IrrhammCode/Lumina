import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public/icons/lumina-512.svg");
const resourcesDir = path.join(root, "resources");
const iconPath = path.join(resourcesDir, "icon.png");
const splashPath = path.join(resourcesDir, "splash.png");
const appleTouchPath = path.join(root, "public/icons/apple-touch-icon.png");

const SAGE = "#E8EBE6";

async function main() {
  await fs.mkdir(resourcesDir, { recursive: true });

  const logo = await sharp(svgPath).resize(640, 640).png().toBuffer();

  await sharp(logo).resize(1024, 1024).png().toFile(iconPath);

  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: SAGE,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(splashPath);

  await sharp(logo).resize(180, 180).png().toFile(appleTouchPath);

  console.log("Generated:", iconPath, splashPath, appleTouchPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});