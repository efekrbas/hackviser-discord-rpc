// ════════════════════════════════════════════════════════════════
// Hackviser Discord RPC — Background Service Worker
// Communicates with the Electron App via WebSocket
// ════════════════════════════════════════════════════════════════

let appConnected = false;
let ws = null;

let currentPage = 'idle';
let currentDetails = '';
let currentState = '';
let startTimestamp = null;
let currentTabId = null;

// ── WebSocket Connection to Electron App ───────────────────────
function connectWebSocket() {
    if (ws) {
        try { ws.close(); } catch (e) { }
    }

    // Connect to Electron's WebSocket Server
    ws = new WebSocket('ws://127.0.0.1:6969');

    ws.onopen = () => {
        console.log('[Hackviser Extension] Connected to Electron App.');
        appConnected = true;

        // Gecikmeli olarak aktif sekmeyi tekrar kontrol et ki app'e gitsin
        setTimeout(checkActiveTab, 1000);
    };

    ws.onclose = () => {
        console.log('[Hackviser Extension] Disconnected from Electron App. Retrying in 5 seconds...');
        appConnected = false;
        ws = null;
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = () => {
        // Hata durumunda onclose tetiklenecek
    };
}

function sendToApp(page, details, state, sensitive = false) {
    currentPage = page;
    currentDetails = details;
    currentState = state;
    startTimestamp = Date.now();

    if (ws && appConnected) {
        ws.send(JSON.stringify({
            type: 'page',
            page: page,
            details: details,
            state: state,
            sensitive: sensitive
        }));
    }
}

// ── URL Parsing ────────────────────────────────────────────────

function parseHackviserUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;

        if (!hostname.endsWith('hackviser.com')) return null;

        if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot') || pathname.startsWith('/reset')) {
            return { page: 'login', details: 'Logging In', state: null, sensitive: true };
        }

        if (pathname.startsWith('/home') || pathname === '/') {
            if (hostname === 'hackviser.com') {
                return { page: 'browsing', details: '', state: '', sensitive: false };
            }
            return { page: 'home', details: 'Home Page', state: 'Viewing Home Page', sensitive: false };
        }

        if (pathname.startsWith('/dashboard')) {
            return { page: 'dashboard', details: 'Dashboard', state: 'Viewing Stats', sensitive: false };
        }

        if (pathname.startsWith('/academy')) {
            const subPage = extractPageTitle(pathname);
            return { page: 'academy', details: 'Academy', state: subPage || 'Browsing Categories', sensitive: false };
        }

        if (pathname.startsWith('/warmups') || pathname.startsWith('/warmup')) {
            const warmupName = extractPageTitle(pathname);
            return { page: 'warmups', details: 'Warmups', state: warmupName || 'Warming Up...', sensitive: false };
        }

        if (pathname.startsWith('/scenarios') || pathname.startsWith('/scenario')) {
            const scenarioName = extractPageTitle(pathname);
            return { page: 'scenarios', details: 'Scenarios', state: scenarioName || 'Running Scenario', sensitive: false };
        }

        if (pathname.startsWith('/missions') || pathname.startsWith('/mission')) {
            const missionName = extractPageTitle(pathname);
            return { page: 'missions', details: 'Missions', state: missionName || 'On a Mission', sensitive: false };
        }

        if (pathname.startsWith('/certifications') || pathname.startsWith('/certification')) {
            const certName = extractPageTitle(pathname);
            return { page: 'certifications', details: 'Certifications', state: certName || 'Viewing Certifications', sensitive: false };
        }

        if (pathname.startsWith('/labs') || pathname.startsWith('/lab') || pathname.startsWith('/machines')) {
            const labName = extractPageTitle(pathname);
            return { page: 'labs', details: 'Solving Labs', state: labName || 'Hacking in Progress...', sensitive: false };
        }

        if (pathname.startsWith('/support')) {
            return { page: 'support', details: 'Support', state: 'Getting Support', sensitive: false };
        }

        if (pathname.startsWith('/learning') || pathname.startsWith('/paths') || pathname.startsWith('/courses')) {
            return { page: 'learning', details: 'Learning Paths', state: 'Studying Cyber Security', sensitive: false };
        }

        if (pathname.startsWith('/ctf') || pathname.startsWith('/challenges')) {
            return { page: 'ctf', details: 'CTF Challenge', state: 'Capturing Flags', sensitive: false };
        }

        if (pathname.startsWith('/profile') || pathname.startsWith('/user') || pathname.startsWith('/settings')) {
            return { page: 'profile', details: 'Viewing Profile', state: null, sensitive: false };
        }

        if (pathname.startsWith('/leaderboard') || pathname.startsWith('/scoreboard') || pathname.startsWith('/ranking')) {
            return { page: 'leaderboard', details: 'Leaderboard', state: 'Checking Rankings', sensitive: false };
        }

        return { page: 'browsing', details: 'Browsing Platform', state: '', sensitive: false };
    } catch (e) {
        return null;
    }
}

function extractPageTitle(pathname) {
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts.length >= 2) {
        const slug = parts[parts.length - 1];
        return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return null;
}

// ── Tab Monitoring ─────────────────────────────────────────────

function checkActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const tab = tabs[0];

        if (!tab.url) return;

        const pageData = parseHackviserUrl(tab.url);

        if (pageData) {
            currentTabId = tab.id;
            sendToApp(pageData.page, pageData.details, pageData.state, pageData.sensitive);
        } else {
            // Eğer aktif sekme hackviser değilse ve en son hackviser'daysak idle yap
            if (currentPage !== 'idle') {
                sendToApp('idle', '', '', false);
                currentTabId = null;
            }
        }
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id === tabId) {
                checkActiveTab();
            }
        });
    }
});

chrome.tabs.onActivated.addListener(() => {
    checkActiveTab();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        checkActiveTab();
    }
});

// ── Message Handlers ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Popup requests status
    if (message.type === 'getStatus') {
        sendResponse({
            appConnected: appConnected,
            currentPage: currentPage,
            currentDetails: currentDetails,
            currentState: currentState,
            startTimestamp: startTimestamp,
        });
        return true;
    }
});

// ── Init ───────────────────────────────────────────────────────
connectWebSocket();
