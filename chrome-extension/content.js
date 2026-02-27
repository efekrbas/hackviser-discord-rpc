// ════════════════════════════════════════════════════════════════
// Hackviser Discord RPC — Content Script
// Runs on hackviser.com AND the OAuth callback page
// ════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ── Discord OAuth Callback Detection ──────────────────────────
    // Check if this page has a discord token saved (from callback page)
    function checkForDiscordToken() {
        try {
            const stored = localStorage.getItem('hackviser_discord_token');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.linked && data.access_token) {
                    chrome.runtime.sendMessage({
                        type: 'discord-linked',
                        accessToken: data.access_token,
                        tokenType: data.token_type,
                    });
                    console.log('[Hackviser RPC] Discord token extension\'a gönderildi!');
                }
            }
        } catch (e) { }
    }

    // Check immediately and also after a delay (for callback page token exchange)
    checkForDiscordToken();
    setTimeout(checkForDiscordToken, 3000);
    setTimeout(checkForDiscordToken, 6000);

    // ── Hackviser Page Tracking ───────────────────────────────────
    const pathname = window.location.pathname;

    if (pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/forgot') ||
        pathname.startsWith('/reset')) {
        return;
    }

    function sendPageTitle() {
        try {
            const title = document.title;
            if (title) {
                chrome.runtime.sendMessage({
                    type: 'pageTitle',
                    title: title
                });
            }
        } catch (e) { }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(sendPageTitle, 2000);
        });
    } else {
        setTimeout(sendPageTitle, 2000);
    }

    setInterval(sendPageTitle, 30000);
})();
