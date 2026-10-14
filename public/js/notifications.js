// ═══════════════════════════════════════════
//              Chat Notifications
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Toggle Sound Mute
// ═══════════════════════════════════════════
function toggleSoundMute() {
    chatSettings.muted = !chatSettings.muted;
    try {
        localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(chatSettings));
    } catch (e) {}
    applyChatSettingsUI();
    console.log('🔊 Muted:', chatSettings.muted);
}

// ═══════════════════════════════════════════
//              Play Ding Sound
// ═══════════════════════════════════════════
async function playDing(isTest = false) {
    if (!isTest && (!chatSettings.sound || chatSettings.muted)) return;

    // ═══ ۱. تلاش برای فایل خارجی ═══
    try {
        if (!notificationAudio) {
            notificationAudio = new Audio('notification.mp3');
            notificationAudio.volume = 0.5;
        }
        notificationAudio.currentTime = 0;
        await notificationAudio.play();
        console.log('🔔 Played from file');
        return;
    } catch (e) {
        // فایل نیست، تولید می‌کنیم
    }

    // ═══ ۲. تولید صدا با Web Audio API ═══
    playGeneratedDing();
}

// ═══════════════════════════════════════════
//              Generate Ding Sound
// ═══════════════════════════════════════════
function playGeneratedDing() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume اگر معلق است (برای autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;

        // ═══ صدای اول (بالا) ═══
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 880;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc1.start(now);
        osc1.stop(now + 0.4);

        // ═══ صدای دوم (پایین) ═══
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 660;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.2, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12 + 0.3);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.12 + 0.3);

        console.log('🔔 Played generated ding');
    } catch (e) {
        console.error('❌ Audio error:', e);
    }
}

// ═══════════════════════════════════════════
//              Update Chat Ticker (Header)
// ═══════════════════════════════════════════
function updateChatTicker() {
    const ticker = document.getElementById('chatTicker');
    if (!ticker) return;

    if (!chatSettings.ticker) {
        ticker.classList.add('hidden');
        return;
    }

    // اگر پیامی نیست
    if (lastMessages.length === 0) {
        ticker.classList.add('hidden');
        return;
    }

    ticker.classList.remove('hidden');

    // نمایش ۳ پیام آخر (خط ۱ = قدیمی‌تر، خط ۳ = جدیدتر)
    const lines = [
        document.getElementById('tickerLine1'),
        document.getElementById('tickerLine2'),
        document.getElementById('tickerLine3')
    ];

    const displayMessages = lastMessages.slice(-3);

    lines.forEach((line, idx) => {
        if (!line) return;
        const msg = displayMessages[idx];
        if (msg) {
            line.innerHTML = `<span class="ticker-user">💬 ${escapeHtml(msg.user)}:</span> <span class="ticker-message">${escapeHtml(msg.message)}</span>`;
            line.style.display = 'flex';
        } else {
            line.innerHTML = '';
            line.style.display = 'none';
        }
    });
}

// ═══════════════════════════════════════════
//              Add Message to Ticker
// ═══════════════════════════════════════════
function addMessageToTicker(user, message, time) {
    lastMessages.push({ user, message, time });
    // فقط ۳ پیام آخر را نگه دار
    if (lastMessages.length > 3) {
        lastMessages = lastMessages.slice(-3);
    }
    updateChatTicker();
}

// ═══════════════════════════════════════════
//              Chat Icon Notification
// ═══════════════════════════════════════════
function setChatIconNotify(hasNew) {
    const icon = document.getElementById('triggerChat');
    if (!icon) return;

    if (hasNew && chatSettings.icon && !chatSidebarOpen) {
        icon.classList.add('notify');
    } else {
        icon.classList.remove('notify');
    }
}

// ═══════════════════════════════════════════
//              Mark Chat as Read
// ═══════════════════════════════════════════
function markChatAsRead() {
    unreadCount = 0;
    setChatIconNotify(false);
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ notifications.js loaded');