// ════════════════════════════════════════════════════════════════
// Hackviser Discord RPC — Chrome Extension Background Service Worker
// Standalone Chrome Extension — No Electron app required
// ════════════════════════════════════════════════════════════════

// Discord OAuth2 Credentials
const DISCORD_CLIENT_ID = '1476565376513999030';
const DISCORD_CLIENT_SECRET = 'QPUsrB2mf4bMhxtnsnUcPKzIIeVVEm8U';
const DISCORD_REDIRECT_URI = 'https://hackviser-discord-rpc.vercel.app/';

// State tracking for popup
let discordLinked = false;
let currentPage = 'idle';
let currentDetails = '';
let currentState = '';
let startTimestamp = null;

// Load saved Discord linked state
chrome.storage.local.get(['discordLinked'], (result) => {
    if (result.discordLinked) {
        discordLinked = true;
    }
});

// ── URL Parsing ────────────────────────────────────────────────

function parseHackviserUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;

        if (!hostname.endsWith('hackviser.com')) {
            return null;
        }

        if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot') || pathname.startsWith('/reset')) {
            return { type: 'page', page: 'login', details: 'Logging In', state: null, sensitive: true };
        }

        if (pathname.startsWith('/home')) {
            return { type: 'page', page: 'home', details: 'Home Page', state: 'Viewing Home Page', sensitive: false };
        }

        if (pathname === '/') {
            return { type: 'page', page: 'home', details: null, state: null, sensitive: false };
        }

        if (pathname.startsWith('/dashboard')) {
            return { type: 'page', page: 'dashboard', details: 'Dashboard', state: 'Viewing Stats', sensitive: false };
        }

        if (pathname.startsWith('/academy')) {
            const subPage = extractPageTitle(pathname);
            return { type: 'page', page: 'academy', details: 'Academy', state: subPage || 'Browsing Categories', sensitive: false };
        }

        if (pathname.startsWith('/warmups') || pathname.startsWith('/warmup')) {
            const warmupName = extractPageTitle(pathname);
            return { type: 'page', page: 'warmups', details: 'Warmups', state: warmupName || 'Warming Up...', sensitive: false };
        }

        if (pathname.startsWith('/scenarios') || pathname.startsWith('/scenario')) {
            const scenarioName = extractPageTitle(pathname);
            return { type: 'page', page: 'scenarios', details: 'Scenarios', state: scenarioName || 'Running Scenario', sensitive: false };
        }

        if (pathname.startsWith('/missions') || pathname.startsWith('/mission')) {
            const missionName = extractPageTitle(pathname);
            return { type: 'page', page: 'missions', details: 'Missions', state: missionName || 'On a Mission', sensitive: false };
        }

        if (pathname.startsWith('/certifications') || pathname.startsWith('/certification')) {
            const certName = extractPageTitle(pathname);
            return { type: 'page', page: 'certifications', details: 'Certifications', state: certName || 'Viewing Certifications', sensitive: false };
        }

        if (pathname.startsWith('/labs') || pathname.startsWith('/lab') || pathname.startsWith('/machines')) {
            const labName = extractPageTitle(pathname);
            return { type: 'page', page: 'labs', details: 'Solving Labs', state: labName || 'Hacking in Progress...', sensitive: false };
        }

        if (pathname.startsWith('/support')) {
            return { type: 'page', page: 'support', details: 'Support', state: 'Getting Support', sensitive: false };
        }

        if (pathname.startsWith('/learning') || pathname.startsWith('/paths') || pathname.startsWith('/courses')) {
            return { type: 'page', page: 'learning', details: 'Learning Paths', state: 'Studying Cyber Security', sensitive: false };
        }

        if (pathname.startsWith('/ctf') || pathname.startsWith('/challenges')) {
            return { type: 'page', page: 'ctf', details: 'CTF Challenge', state: 'Capturing Flags', sensitive: false };
        }

        if (pathname.startsWith('/profile') || pathname.startsWith('/user') || pathname.startsWith('/settings')) {
            return { type: 'page', page: 'profile', details: 'Viewing Profile', state: null, sensitive: false };
        }

        if (pathname.startsWith('/leaderboard') || pathname.startsWith('/scoreboard') || pathname.startsWith('/ranking')) {
            return { type: 'page', page: 'leaderboard', details: 'Leaderboard', state: 'Checking Rankings', sensitive: false };
        }

        return { type: 'page', page: 'browsing', details: 'Browsing Platform', state: 'Exploring Content', sensitive: false };
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

// ── Update local state ─────────────────────────────────────────

function updatePageState(data) {
    if (data.type === 'page') {
        currentPage = data.page || 'idle';
        currentDetails = data.details || '';
        currentState = data.state || '';
        startTimestamp = Date.now();
    }
}

// ── Tab Monitoring ─────────────────────────────────────────────

function checkActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const tab = tabs[0];
        if (!tab.url) return;

        const pageData = parseHackviserUrl(tab.url);
        if (pageData) {
            updatePageState(pageData);
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
    if (message.type === 'pageTitle') {
        console.log('[Hackviser RPC] Page title:', message.title);
    }

    // Discord OAuth2 token received from callback page content script
    if (message.type === 'discord-linked') {
        console.log('[Hackviser RPC] Discord bağlantısı başarılı!');
        discordLinked = true;

        chrome.storage.local.set({
            discordLinked: true,
            discordAccessToken: message.accessToken,
            discordTokenType: message.tokenType,
        });

        sendResponse({ success: true });
        return true;
    }

    // Popup requests status
    if (message.type === 'getStatus') {
        sendResponse({
            discordLinked: discordLinked,
            currentPage: currentPage,
            currentDetails: currentDetails,
            currentState: currentState,
            startTimestamp: startTimestamp,
        });
        return true;
    }

    // Popup requests to unlink Discord
    if (message.type === 'unlinkDiscord') {
        discordLinked = false;
        chrome.storage.local.remove(['discordLinked', 'discordAccessToken', 'discordTokenType']);
        sendResponse({ success: true });
        return true;
    }
});
