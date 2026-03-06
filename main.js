// Ensure Electron runs in browser mode, not as plain Node.js
delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const RPC = require('discord-rpc');
const { WebSocketServer } = require('ws');

// ── Config ─────────────────────────────────────────────────────
function loadConfig() {
    const possiblePaths = [
        path.join(process.resourcesPath || '', 'config.json'),
        path.join(path.dirname(process.execPath), 'config.json'),
        path.join(__dirname, 'config.json'),
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf-8'));
        }
    }
    throw new Error('config.json bulunamadı!');
}

let config = loadConfig();
const CLIENT_ID = config.clientId;

// ── State ──────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let rpc = null;
let wss = null;
let isConnected = false;
let isRpcActive = false;
let isChromeConnected = false;
let currentPage = 'idle';
let currentDetails = '';
let currentState = '';

let startTimestamp = new Date();

// ── Electron Window ────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 480,
        height: 680,
        resizable: false,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, 'images', '1679414162991.jpg'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (e) => {
        if (isRpcActive) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
}

// ── System Tray ────────────────────────────────────────────────
function createTray() {
    const iconPath = path.join(__dirname, 'images', '1679414162991.jpg');
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Hackviser RPC');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Hackviser RPC', enabled: false },
        { type: 'separator' },
        { label: 'Göster', click: () => { mainWindow.show(); mainWindow.focus(); } },
        { type: 'separator' },
        { label: 'Çıkış', click: () => { isRpcActive = false; app.quit(); } },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── WebSocket Server (Chrome Extension Bağlantısı) ─────────────
function createWebSocketServer() {
    wss = new WebSocketServer({ host: '127.0.0.1', port: 6969 });

    wss.on('connection', (socket) => {
        isChromeConnected = true;
        sendToRenderer('chrome-status', { connected: true });
        console.log('[WS] Chrome extension bağlandı');

        socket.on('message', (raw) => {
            try {
                const data = JSON.parse(raw.toString());

                if (data.type === 'heartbeat') return;

                if (data.type === 'page') {
                    handlePageUpdate(data);
                }



                if (data.type === 'pageTitle') {
                    sendToRenderer('page-title', { title: data.title });
                }
            } catch (e) {
                console.log('[WS] Parse hatası:', e);
            }
        });

        socket.on('close', () => {
            isChromeConnected = false;
            // Chrome bağlantısı koptuğunda presence'ı silme — son aktiviteyi koru
            sendToRenderer('chrome-status', { connected: false });
            console.log('[WS] Chrome extension bağlantısı kesildi — presence korunuyor');
        });
    });

    wss.on('error', (err) => {
        console.log('[WS] Server hatası:', err.message);
    });

    console.log('[WS] WebSocket server port 6969 dinliyor');
}

function handlePageUpdate(data) {
    if (data.page === 'idle') {
        // Hackviser'da değil — son aktiviteyi koru, hiçbir şey yapma
        return;
    } else if (data.sensitive) {
        // Login sayfası — hassas bilgi gösterme, sadece 'Logging In' göster
        currentPage = data.page;
        currentDetails = 'Logging In';
        currentState = '';
    } else {
        currentPage = data.page;
        currentDetails = data.details !== undefined ? data.details : 'Browsing Platform';
        currentState = data.state !== undefined ? data.state : '';
    }

    startTimestamp = new Date();
    sendToRenderer('page-update', {
        page: currentPage,
        details: currentDetails,
        state: currentState,
        sensitive: data.sensitive || false
    });

    if (isConnected) updateActivity();
}

// ── Discord RPC ────────────────────────────────────────────────
function createRpcClient() {
    rpc = new RPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
        isConnected = true;
        sendToRenderer('rpc-status', { connected: true, user: rpc.user });
        updateActivity();
    });

    rpc.on('disconnected', () => {
        isConnected = false;
        sendToRenderer('rpc-status', { connected: false });
        setTimeout(() => connectRpc(), 5000);
    });
}

function connectRpc() {
    if (!rpc) createRpcClient();
    rpc.login({ clientId: CLIENT_ID }).catch(() => {
        isConnected = false;
        sendToRenderer('rpc-status', { connected: false });
        setTimeout(() => connectRpc(), 5000);
    });
}

function disconnectRpc() {
    if (rpc) {
        rpc.clearActivity().catch(() => { });
        rpc.destroy().catch(() => { });
        rpc = null;
        isConnected = false;
        sendToRenderer('rpc-status', { connected: false });
    }
}

function updateActivity() {
    if (!rpc || !isConnected) return;
    if (currentPage === 'idle' || !isRpcActive) {
        rpc.clearActivity().catch(() => { });
        return;
    }

    const rp = config.richPresence;

    // Discord activity
    const details = (currentDetails && currentDetails.trim() !== '') ? currentDetails : null;
    const state = (currentState && currentState.trim() !== '') ? currentState : null;

    const activity = {
        startTimestamp: startTimestamp,
        largeImageKey: rp.largeImageKey,
        largeImageText: rp.largeImageText,
        smallImageKey: rp.smallImageKey,
        smallImageText: rp.smallImageText,
        instance: false,
    };

    if (details) {
        activity.details = details;
    }

    if (state) {
        activity.state = state;
    }

    if (rp.buttons && rp.buttons.length > 0) {
        activity.buttons = rp.buttons.slice(0, 2);
    }

    rpc.setActivity(activity).catch(() => { });
}

// ── IPC Handlers ───────────────────────────────────────────────
function sendToRenderer(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}

function setupIpcHandlers() {
    ipcMain.on('start-rpc', () => {
        isRpcActive = true;
        startTimestamp = new Date();
        if (isConnected) {
            updateActivity();
        } else {
            connectRpc();
        }
    });

    ipcMain.on('stop-rpc', () => {
        isRpcActive = false;
        if (rpc && isConnected) {
            rpc.clearActivity().catch(() => { });
        }
    });

    ipcMain.on('change-page', (_, pageId) => {
        const pages = config.pages;
        if (pages && pages[pageId]) {
            currentPage = pageId;
            currentDetails = pages[pageId].details;
            currentState = pages[pageId].state || '';
            startTimestamp = new Date();
            if (isConnected) updateActivity();
            sendToRenderer('page-changed', pageId);
        }
    });



    ipcMain.on('get-config', (event) => {
        event.returnValue = config;
    });

    ipcMain.on('get-state', (event) => {
        event.returnValue = {
            isChromeConnected,
            isConnected,
            isRpcActive,
            currentPage,
            currentDetails,
            currentState,
            rpcUser: rpc ? rpc.user : null,
        };
    });

    ipcMain.on('minimize-window', () => {
        if (mainWindow) mainWindow.hide();
    });

    ipcMain.on('close-window', () => {
        // Kapat butonuna basınca tamamen kapatma — tray'a küçült
        if (mainWindow) mainWindow.hide();
    });

    ipcMain.on('minimize-to-taskbar', () => {
        if (mainWindow) mainWindow.minimize();
    });
}

// ── App Lifecycle ──────────────────────────────────────────────
app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
    createTray();
    createWebSocketServer();
    connectRpc();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    isRpcActive = false;
    disconnectRpc();
    if (wss) wss.close();
});
