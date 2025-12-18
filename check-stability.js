import { execSync } from 'child_process';
import fs from 'fs';

const STABILITY_THRESHOLD_DAYS = 14;
const msPerDay = 24 * 60 * 60 * 1000;
const now = new Date();

console.log(`--- PolyGlot Caller: Stability Audit ---`);
console.log(`Policy: Only recommend updates released > ${STABILITY_THRESHOLD_DAYS} days ago.\n`);

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

let updatesFound = false;

for (const [name, currentVersion] of Object.entries(allDeps)) {
  try {
    // Get time data for all versions of the package
    const timeData = JSON.parse(execSync(`npm view ${name} time --json`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString());
    const latestVersion = execSync(`npm view ${name} version`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();

    if (currentVersion === latestVersion) {
      continue;
    }

    const releaseDate = new Date(timeData[latestVersion]);
    const ageInDays = Math.floor((now - releaseDate) / msPerDay);

    if (ageInDays >= STABILITY_THRESHOLD_DAYS) {
      console.log(`✅ [STABLE UPDATE] ${name}: ${currentVersion} -> ${latestVersion}`);
      console.log(`   Released: ${releaseDate.toLocaleDateString()} (${ageInDays} days ago)`);
      updatesFound = true;
    } else {
      console.log(`⏳ [HOLDING] ${name}: v${latestVersion} is available but too new (${ageInDays} days old).`);
      console.log(`   Waiting for it to reach ${STABILITY_THRESHOLD_DAYS} days for safety.`);
    }
  } catch (e) {
    console.error(`❌ Could not check ${name}.`);
  }
}

if (!updatesFound) {
  console.log(`\nAll dependencies are up to date within your stability policy.`);
} else {
  console.log(`\nTo update stable packages, run: npm install [package-name]@latest`);
}
