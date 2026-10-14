// ═══════════════════════════════════════════
//              Main Application
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              DOM Ready
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App v3.5 initializing...');

    // راه‌اندازی تخته سفید
    initWhiteboard();

    // ⭐ شنونده تغییر اندازه پنجره
    window.addEventListener('resize', () => {
        if (currentMode === 'whiteboard') {
            resizeCanvas();
        }
    });

    // ⭐ شنونده تغییر اندازه view (ResizeObserver)
    if (window.ResizeObserver) {
        const wbView = document.getElementById('whiteboardView');
        if (wbView) {
            const ro = new ResizeObserver(() => {
                if (currentMode === 'whiteboard') {
                    resizeCanvas();
                }
            });
            ro.observe(wbView);
        }
    }

    // بارگذاری تنظیمات
    loadChatSettings();
    loadServerSettings();

    // ⭐ فعال‌سازی AudioContext با اولین تعامل کاربر
    document.body.addEventListener('click', function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {}
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.body.removeEventListener('click', initAudio);
    }, { once: true });

    // ⭐ بررسی امنیت بستر (برای دوربین/میکروفن)
    if (!isSecureContext() && location.hostname !== 'localhost') {
        console.warn('⚠️ HTTPS not detected — camera may not work');
    }

    console.log('✅ App v3.5 ready');
});

// ═══════════════════════════════════════════
//              Ping (Keep-Alive)
// ═══════════════════════════════════════════
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);

// ═══════════════════════════════════════════
//              Before Unload — Cleanup
// ═══════════════════════════════════════════
window.addEventListener('beforeunload', () => {
    console.log('👋 Unloading — cleaning up');

    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
    }
    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
    }

    Object.keys(peerConnections).forEach(id => {
        try { peerConnections[id].close(); } catch(e){}
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
});

// ═══════════════════════════════════════════
//              Global Error Handler
// ═══════════════════════════════════════════
window.addEventListener('error', (e) => {
    console.error('❌ Global error:', e.message, 'at', e.filename, ':', e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled promise rejection:', e.reason);
});

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ main.js loaded');