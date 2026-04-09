#!/usr/bin/env node
/**
 * generate-icons.js
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (dev dependency)
 * 
 * Generates all PWA icon sizes from a source SVG or PNG.
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// SVG source for the icon
const SOURCE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="114" fill="#4a3326"/>
  
  <!-- Book spine shadow -->
  <rect x="135" y="110" width="242" height="292" rx="12" fill="#3a2518"/>
  
  <!-- Book back cover -->
  <rect x="145" y="100" width="222" height="292" rx="12" fill="#8f6540"/>
  
  <!-- Book pages -->
  <rect x="155" y="108" width="210" height="276" rx="4" fill="#faf7f2"/>
  
  <!-- Page lines -->
  <line x1="180" y1="160" x2="340" y2="160" stroke="#e4d5c0" stroke-width="8" stroke-linecap="round"/>
  <line x1="180" y1="190" x2="340" y2="190" stroke="#e4d5c0" stroke-width="8" stroke-linecap="round"/>
  <line x1="180" y1="220" x2="320" y2="220" stroke="#e4d5c0" stroke-width="8" stroke-linecap="round"/>
  <line x1="180" y1="250" x2="340" y2="250" stroke="#e4d5c0" stroke-width="8" stroke-linecap="round"/>
  <line x1="180" y1="280" x2="300" y2="280" stroke="#e4d5c0" stroke-width="8" stroke-linecap="round"/>
  
  <!-- Bookmark ribbon -->
  <polygon points="310,100 340,100 340,185 325,170 310,185" fill="#a97d4f"/>
  
  <!-- Book front cover -->
  <rect x="165" y="100" width="12" height="292" rx="3" fill="#724f35"/>
</svg>
`;

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('❌ sharp not installed. Run: npm install --save-dev sharp');
    console.log('📝 Falling back to SVG placeholder icons...');
    generateSVGPlaceholders();
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const svgBuffer = Buffer.from(SOURCE_SVG);

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Generated icon-${size}.png`);
  }

  console.log('\n🎉 All icons generated successfully!');
}

function generateSVGPlaceholders() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const svg = SOURCE_SVG.replace('viewBox="0 0 512 512"', `width="${size}" height="${size}" viewBox="0 0 512 512"`);
    fs.writeFileSync(path.join(OUTPUT_DIR, `icon-${size}.png`), svg);
    console.log(`📝 Placeholder icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
