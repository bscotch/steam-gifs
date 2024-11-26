// Sync the package.json and the tauri.conf.json versions
import { readFileSync, writeFileSync } from 'node:fs';
import manifest from '../package.json' with { type: 'json' };

const tauriConfPath = './src-tauri/tauri.conf.json';
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = manifest.version;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));
