// Launcher script - spawns Electron with clean environment
const { spawn } = require('child_process');
const path = require('path');

const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const appPath = __dirname;

// Clone env and remove ELECTRON_RUN_AS_NODE
const env = Object.assign({}, process.env);
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [appPath, '--no-sandbox'], {
    env: env,
    stdio: 'inherit',
    detached: true,
});

child.unref();
process.exit(0);
