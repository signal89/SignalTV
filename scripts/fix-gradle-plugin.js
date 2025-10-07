// scripts/fix-gradle-plugin.js
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@react-native', 'gradle-plugin', 'build.gradle.kts');

try {
  if (fs.existsSync(target)) {
    const bak = target + '.bak';
    if (!fs.existsSync(bak)) {
      fs.copyFileSync(target, bak);
      console.log('[fix-gradle-plugin] backup created:', bak);
    }
    // Write a minimal noop stub so Gradle won't try to compile serviceOf
    const stub = `// No-op stub replaced by postinstall to avoid using serviceOf\n// Original content backed up as build.gradle.kts.bak\n`;
    fs.writeFileSync(target, stub, 'utf8');
    console.log('[fix-gradle-plugin] Patched build.gradle.kts -> noop');
  } else {
    console.log('[fix-gradle-plugin] target not found (ok if package was overridden):', target);
  }
} catch (err) {
  console.error('[fix-gradle-plugin] ERROR', err);
  // don't fail install — exit normally
}
