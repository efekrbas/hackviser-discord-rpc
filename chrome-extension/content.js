// ════════════════════════════════════════════════════════════════
// Hackviser Discord RPC — Content Script
// ════════════════════════════════════════════════════════════════

(function () {
    'use strict';
    // Single Page Application (SPA) sayfa geçişlerini yakala
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // Background'a sayfanın değiştiğini haber ver
            chrome.runtime.sendMessage({ type: 'pageTitle', title: document.title });
        }
    }).observe(document, { subtree: true, childList: true });
})();
