const { ipcRenderer } = require('electron');

// ── Config & State ─────────────────────────────────────────
const config = ipcRenderer.sendSync('get-config');
const initialState = ipcRenderer.sendSync('get-state');
let autoMode = initialState.autoMode;
let elapsedInterval = null;
let startTime = Date.now();

// ── DOM Elements ───────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const discordBadge = $('#discord-badge');
const chromeBadge = $('#chrome-badge');
const userInfo = $('#user-info');
const userName = $('#user-name');

const btnStart = $('#btn-start');
const btnStop = $('#btn-stop');
const manualSection = $('#manual-section');
const activityIcon = $('#activity-icon');
const activityPage = $('#activity-page');
const activityDetail = $('#activity-detail');
const pageGrid = $('#page-grid');
const previewDetails = $('#preview-details');
const previewState = $('#preview-state');
const previewElapsed = $('#preview-elapsed');

// Page icon mapping
const pageIcons = {
    dashboard: '🏠',
    labs: '🔬',
    learning: '📚',
    ctf: '🏁',
    practice: '🛡️',
    browsing: '🌐',
    profile: '👤',
    leaderboard: '🏆',
    login: '🔑',
    idle: '💤',
};

// ── Title Bar Buttons ──────────────────────────────────────
$('#btn-minimize').addEventListener('click', () => ipcRenderer.send('minimize-to-taskbar'));
$('#btn-tray').addEventListener('click', () => ipcRenderer.send('minimize-window'));
$('#btn-close').addEventListener('click', () => ipcRenderer.send('close-window'));

// Hide manual section since autoMode is strictly forced
manualSection.style.display = 'none';

// ── Render Page Grid (Manual Mode) ─────────────────────────
function renderPages() {
    if (!config.pages) return;
    pageGrid.innerHTML = '';
    for (const [id, page] of Object.entries(config.pages)) {
        const card = document.createElement('div');
        card.className = 'page-card';
        card.dataset.pageId = id;
        card.innerHTML = `
      <span class="page-icon">${page.icon || pageIcons[id] || '📄'}</span>
      <span class="page-name">${page.name}</span>
    `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.page-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            ipcRenderer.send('change-page', id);
            updatePreview(page.details, page.state);
            startTime = Date.now();
        });
        pageGrid.appendChild(card);
    }
}

// ── Preview ────────────────────────────────────────────────
function updatePreview(details, state) {
    previewDetails.textContent = details || '';
    previewDetails.style.display = details ? 'block' : 'none';
    previewState.textContent = state || '';
    previewState.style.display = state ? 'block' : 'none';
}

function updateElapsedTime() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;

    if (hours > 0) {
        previewElapsed.textContent = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        previewElapsed.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }
}

// ── Activity Display ───────────────────────────────────────
function updateActivityDisplay(page, details, state) {
    activityIcon.textContent = pageIcons[page] || '📄';
    activityPage.textContent = details || 'Waiting...';
    activityDetail.textContent = state || '';
    updatePreview(details, state);
}

// ── Controls ───────────────────────────────────────────────
btnStart.addEventListener('click', () => {
    ipcRenderer.send('start-rpc');
    btnStart.classList.add('hidden');
    btnStop.classList.remove('hidden');
    startTime = Date.now();
    if (elapsedInterval) clearInterval(elapsedInterval);
    elapsedInterval = setInterval(updateElapsedTime, 1000);
});

btnStop.addEventListener('click', () => {
    ipcRenderer.send('stop-rpc');
    btnStop.classList.add('hidden');
    btnStart.classList.remove('hidden');
    // We intentionally do not hide userInfo here, so the user card stays visible
    if (elapsedInterval) clearInterval(elapsedInterval);
    previewElapsed.textContent = '0:00';
});

// ── IPC Events ─────────────────────────────────────────────

// Discord bağlantı durumu
ipcRenderer.on('rpc-status', (_, data) => {
    if (data.connected) {
        discordBadge.classList.add('connected');
        discordBadge.querySelector('.status-text').textContent = 'Discord: Connected';
        if (data.user) {
            userName.textContent = data.user.username;
            userInfo.classList.remove('hidden');
            if (data.user.avatar && data.user.id) {
                const avatarUrl = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`;
                const userIcon = document.getElementById('user-icon');
                if (userIcon) {
                    userIcon.innerHTML = `<img src="${avatarUrl}" style="width: 18px; height: 18px; border-radius: 50%;" />`;
                }
            }
        }
    } else {
        discordBadge.classList.remove('connected');
        discordBadge.querySelector('.status-text').textContent = 'Discord: Disconnected';
    }
});

// Chrome bağlantı durumu
ipcRenderer.on('chrome-status', (_, data) => {
    if (data.connected) {
        chromeBadge.classList.add('connected');
        chromeBadge.querySelector('.status-text').textContent = 'Chrome: Connected';
    } else {
        chromeBadge.classList.remove('connected');
        chromeBadge.querySelector('.status-text').textContent = 'Chrome: Disconnected';
    }
});

// Sayfa güncellemesi (Chrome'dan)
ipcRenderer.on('page-update', (_, data) => {
    updateActivityDisplay(data.page, data.details, data.state);
    startTime = Date.now();
});

// Manuel sayfa değişikliği
ipcRenderer.on('page-changed', (_, pageId) => {
    if (config.pages && config.pages[pageId]) {
        const page = config.pages[pageId];
        updateActivityDisplay(pageId, page.details, page.state);
    }
});





// ── Init ───────────────────────────────────────────────────
renderPages();
updateElapsedTime();


// Mevcut durumu yansıt
if (initialState.isConnected) {
    discordBadge.classList.add('connected');
    discordBadge.querySelector('.status-text').textContent = 'Discord: Connected';
    if (initialState.rpcUser) {
        userName.textContent = initialState.rpcUser.username;
        userInfo.classList.remove('hidden');
        if (initialState.rpcUser.avatar && initialState.rpcUser.id) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${initialState.rpcUser.id}/${initialState.rpcUser.avatar}.png`;
            const userIcon = document.getElementById('user-icon');
            if (userIcon) {
                userIcon.innerHTML = `<img src="${avatarUrl}" style="width: 18px; height: 18px; border-radius: 50%;" />`;
            }
        }
    }
}

if (initialState.isChromeConnected) {
    chromeBadge.classList.add('connected');
    chromeBadge.querySelector('.status-text').textContent = 'Chrome: Connected';
}

if (initialState.currentDetails) {
    updateActivityDisplay(initialState.currentPage, initialState.currentDetails, initialState.currentState);
}
