#!/usr/bin/env node

/**
 * Deployment Check Script
 * Run this script to verify your app is ready for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Checking deployment readiness...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'netlify.toml',
  'vite.config.ts',
  'tsconfig.json',
  'public/_redirects',
  'public/Profilepicture.jpg',
  'src/App.tsx',
  'src/main.tsx'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n🔧 Checking build configuration:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');

if (packageJson.scripts && packageJson.scripts.build) {
  console.log('  ✅ Build script found');
} else {
  console.log('  ❌ Build script missing');
  allFilesExist = false;
}

if (netlifyToml.includes('command = "npm run build"')) {
  console.log('  ✅ Netlify build command configured');
} else {
  console.log('  ❌ Netlify build command not configured');
  allFilesExist = false;
}

if (netlifyToml.includes('publish = "dist"')) {
  console.log('  ✅ Netlify publish directory configured');
} else {
  console.log('  ❌ Netlify publish directory not configured');
  allFilesExist = false;
}

console.log('\n📦 Checking if build directory exists:');
if (fs.existsSync('dist')) {
  console.log('  ✅ Build directory exists');
  const distContents = fs.readdirSync('dist');
  console.log(`  📄 Build directory contains: ${distContents.length} files`);
} else {
  console.log('  ⚠️  Build directory does not exist (run "npm run build" first)');
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 Your app is ready for Netlify deployment!');
  console.log('\n📋 Next steps:');
  console.log('  1. Push your code to GitHub');
  console.log('  2. Go to https://netlify.com');
  console.log('  3. Click "Add new site" → "Import an existing project"');
  console.log('  4. Connect your GitHub repository');
  console.log('  5. Netlify will auto-detect settings and deploy!');
} else {
  console.log('❌ Some files are missing. Please check the errors above.');
  console.log('\n💡 Run "npm run build" to generate the dist directory');
}

console.log('\n📖 For more help, see the README.md file');
