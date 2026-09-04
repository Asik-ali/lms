import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';

const root = 'android/app/src/main/res';
const SRC = 'src/assets/image.png';
const NAVY = '#001020';

const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const splashPort = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
};

const splashLand = {
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
};

const fallbackSplash = [480, 320];

function outPath(...parts) {
  const p = path.join(root, ...parts);
  return p;
}

async function gen() {
  // Launcher icons (legacy): direct resize of logo
  for (const [dir, size] of Object.entries(launcherSizes)) {
    await sharp(SRC).resize(size, size).toFile(outPath(dir, 'ic_launcher.png'));
    await sharp(SRC).resize(size, size).toFile(outPath(dir, 'ic_launcher_round.png'));
    console.log('launcher', dir, size);
  }

  // Adaptive foreground: logo inset with padding on transparent canvas
  for (const [dir, size] of Object.entries(foregroundSizes)) {
    const pad = Math.round(size * 0.2);
    const inner = size - pad * 2;
    const logo = await sharp(SRC).resize(inner, inner).toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: logo, left: pad, top: pad }])
      .png()
      .toFile(outPath(dir, 'ic_launcher_foreground.png'));
    console.log('foreground', dir, size);
  }

  async function makeSplash(dirPath, [w, h]) {
    const logo = await sharp(SRC).resize(Math.round(w * 0.5), Math.round(w * 0.5)).toBuffer();
    await sharp({
      create: { width: w, height: h, channels: 3, background: NAVY },
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toFile(outPath(dirPath, 'splash.png'));
    console.log('splash', dirPath, w + 'x' + h);
  }

  for (const [dir, dims] of Object.entries(splashPort)) await makeSplash(dir, dims);
  for (const [dir, dims] of Object.entries(splashLand)) await makeSplash(dir, dims);
  await makeSplash('drawable', fallbackSplash);
}

gen().then(() => console.log('DONE')).catch((e) => { console.error(e); process.exit(1); });
