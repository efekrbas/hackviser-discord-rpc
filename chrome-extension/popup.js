// ════════════════════════════════════════════════════════════════
// Hackviser Discord RPC — Chrome Extension Popup
// Eklenti ikonuna tıklayınca açılan menü (Standalone — no Electron needed)
// ════════════════════════════════════════════════════════════════

const DISCORD_OAUTH_URL = 'https://discord.com/oauth2/authorize?client_id=1476565376513999030&response_type=code&redirect_uri=https%3A%2F%2Fhackviser-discord-rpc.vercel.app%2F&scope=identify+activities.write';

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
    home: '🏠',
    academy: '🎓',
    warmups: '🔥',
    scenarios: '🎯',
    missions: '🚀',
    certifications: '📜',
    support: '💬',
};

// DOM Elements
const discordIndicator = document.querySelector('#discord-status .status-indicator');
const discordStatusText = document.getElementById('discord-status-text');
const activityCard = document.getElementById('activity-card');
const activitySection = document.getElementById('activity-section');
const discordAlert = document.getElementById('discord-alert');
const btnLinkDiscord = document.getElementById('btn-link-discord');

// Link Discord button → open OAuth2 URL
btnLinkDiscord.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: DISCORD_OAUTH_URL });
});

// Get status from background script
function refreshStatus() {
    chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
        if (chrome.runtime.lastError || !response) {
            setDiscordStatus(false);
            setActivityIdle();
            showDiscordAlert(true);
            return;
        }

        const isDiscordOk = response.discordLinked;
        setDiscordStatus(isDiscordOk);
        showDiscordAlert(!isDiscordOk);

        if (response.currentPage && response.currentPage !== 'idle') {
            setActivity(
                response.currentPage,
                response.currentDetails,
                response.currentState,
                response.startTimestamp
            );
        } else {
            setActivityIdle();
        }
    });
}

function showDiscordAlert(show) {
    if (show) {
        discordAlert.classList.remove('hidden');
    } else {
        discordAlert.classList.add('hidden');
    }
}

function setDiscordStatus(connected) {
    if (connected) {
        discordIndicator.classList.remove('disconnected');
        discordIndicator.classList.add('connected');
        discordStatusText.textContent = 'Connected';
        discordStatusText.style.color = '#7AFF4C';
    } else {
        discordIndicator.classList.remove('connected');
        discordIndicator.classList.add('disconnected');
        discordStatusText.textContent = 'Disconnected';
        discordStatusText.style.color = '';
    }
}

function setActivity(page, details, state, startTimestamp) {
    activityCard.classList.add('active');
    activityCard.classList.remove('no-activity');

    activityCard.innerHTML = `
        <div class="activity-card-left">
            <img src="icon128.png" alt="Hackviser" class="activity-image">
            <div class="activity-badge">${pageIcons[page] || '📄'}</div>
        </div>
        <div class="activity-info">
            <div class="activity-name">Hackviser</div>
            <div class="activity-details">${details || 'Browsing Platform'}</div>
            <div class="activity-state">${state || ''}</div>
            <div class="activity-time">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${formatElapsedTime(startTimestamp)}</span>
            </div>
        </div>
    `;
}

function setActivityIdle() {
    activityCard.classList.remove('active');
    activityCard.classList.add('no-activity');
    activityCard.innerHTML = `
        <div class="no-activity-icon">💤</div>
        <div class="no-activity-text">No active presence</div>
    `;
}

function formatElapsedTime(startTimestamp) {
    if (!startTimestamp) return '0:00 elapsed';

    const now = Date.now();
    const start = new Date(startTimestamp).getTime();
    const elapsed = Math.floor((now - start) / 1000);

    if (elapsed < 0) return '0:00 elapsed';

    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;

    if (hours > 0) {
        return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} elapsed`;
    }
    return `${mins}:${String(secs).padStart(2, '0')} elapsed`;
}

// Refresh on popup open
refreshStatus();

// Auto-refresh every 2 seconds
setInterval(refreshStatus, 2000);
