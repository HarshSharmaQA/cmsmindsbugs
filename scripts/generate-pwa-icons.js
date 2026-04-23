#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * PWA Icon Generator
 * Generates all required PWA icons from a source image
 * 
 * Usage: node scripts/generate-pwa-icons.js path/to/logo.png
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
];

console.log('🎨 BugScribe PWA Icon Generator\n');

// Check if source image is provided
const sourceImage = process.argv[2];

if (!sourceImage) {
  console.log('❌ Error: No source image provided\n');
  console.log('Usage: node scripts/generate-pwa-icons.js path/to/logo.png\n');
  console.log('Requirements:');
  console.log('  - Source image should be at least 512x512 pixels');
  console.log('  - PNG format recommended');
  console.log('  - Square aspect ratio (1:1)\n');
  console.log('Example:');
  console.log('  node scripts/generate-pwa-icons.js public/logo.png\n');
  process.exit(1);
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.log(`❌ Error: Source image not found: ${sourceImage}\n`);
  process.exit(1);
}

console.log(`📁 Source image: ${sourceImage}\n`);

// Check if ImageMagick or Sharp is available
const { execSync } = require('child_process');

let useImageMagick = false;
let useSharp = false;

try {
  execSync('convert --version', { stdio: 'ignore' });
  useImageMagick = true;
  console.log('✅ ImageMagick detected\n');
} catch (e) {
  try {
    require('sharp');
    useSharp = true;
    console.log('✅ Sharp detected\n');
  } catch (e) {
    console.log('❌ Error: Neither ImageMagick nor Sharp is installed\n');
    console.log('Please install one of the following:\n');
    console.log('Option 1: ImageMagick (recommended)');
    console.log('  - Windows: https://imagemagick.org/script/download.php');
    console.log('  - Mac: brew install imagemagick');
    console.log('  - Linux: sudo apt-get install imagemagick\n');
    console.log('Option 2: Sharp (npm package)');
    console.log('  npm install sharp\n');
    process.exit(1);
  }
}

// Generate icons
console.log('🔨 Generating icons...\n');

const outputDir = path.join(process.cwd(), 'public');

if (useImageMagick) {
  // Use ImageMagick
  ICON_SIZES.forEach(({ size, name }) => {
    const outputPath = path.join(outputDir, name);
    try {
      execSync(`convert "${sourceImage}" -resize ${size}x${size} "${outputPath}"`);
      console.log(`  ✅ ${name} (${size}x${size})`);
    } catch (e) {
      console.log(`  ❌ Failed to generate ${name}`);
    }
  });
} else if (useSharp) {
  // Use Sharp
  const sharp = require('sharp');
  
  Promise.all(
    ICON_SIZES.map(async ({ size, name }) => {
      const outputPath = path.join(outputDir, name);
      try {
        await sharp(sourceImage)
          .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toFile(outputPath);
        console.log(`  ✅ ${name} (${size}x${size})`);
      } catch (e) {
        console.log(`  ❌ Failed to generate ${name}`);
      }
    })
  ).then(() => {
    console.log('\n✅ All icons generated successfully!\n');
    console.log('📁 Icons saved to: public/\n');
    console.log('Next steps:');
    console.log('  1. Verify icons in public/ folder');
    console.log('  2. Deploy your app');
    console.log('  3. Test PWA installation\n');
  });
  
  return;
}

console.log('\n✅ All icons generated successfully!\n');
console.log('📁 Icons saved to: public/\n');
console.log('Next steps:');
console.log('  1. Verify icons in public/ folder');
console.log('  2. Deploy your app');
console.log('  3. Test PWA installation\n');
