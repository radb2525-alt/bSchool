// ═══════════════════════════════════════════
//              Storage Management
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Server Settings — Load/Save
// ═══════════════════════════════════════════
function loadServerSettings() {
    try {
        const saved = localStorage.getItem(SERVER_SETTINGS_KEY);
        if (saved) {
            serverSettings = { ...serverSettings, ...JSON.parse(saved) };
            console.log('💾 Server settings loaded:', serverSettings);
        }
    } catch (e) {
        console.log('⚠️ Could not load server settings:', e);
    }

    applyServerSettingsUI();
    updateWebSocketUrl();
}

function saveServerSettings() {
    try {
        localStorage.setItem(SERVER_SETTINGS_KEY, JSON.stringify(serverSettings));
        console.log('💾 Server settings saved:', serverSettings);
    } catch (e) {
        console.log('⚠️ Could not save server settings:', e);
    }
}

function applyServerSettingsUI() {
    // Radio buttons
    const defaultRadio = document.querySelector('input[name="serverMode"][value="default"]');
    const customRadio = document.querySelector('input[name="serverMode"][value="custom"]');

    const title = document.getElementById('serverSectionTitle');
    const dot = document.getElementById('serverStatusDot');

    if (serverSettings.useCustom) {
        if (customRadio) customRadio.checked = true;
        if (defaultRadio) defaultRadio.checked = false;

        document.getElementById('modeCustomLabel')?.classList.add('selected');
        document.getElementById('modeDefaultLabel')?.classList.remove('selected');

        document.getElementById('serverAddressBox')?.classList.add('visible');
        const input = document.getElementById('inputServerAddress');
        if (input) input.value = serverSettings.serverAddress || '';

        // آپدیت عنوان و نشانگر
        if (title) title.textContent = '⚙️ سرور سفارشی';
        if (dot) dot.classList.add('custom');

    } else {
        if (defaultRadio) defaultRadio.checked = true;
        if (customRadio) customRadio.checked = false;

        document.getElementById('modeDefaultLabel')?.classList.add('selected');
        document.getElementById('modeCustomLabel')?.classList.remove('selected');

        document.getElementById('serverAddressBox')?.classList.remove('visible');

        if (title) title.textContent = '⚙️ سرور پیش‌فرض';
        if (dot) dot.classList.remove('custom');
    }
}

// ═══════════════════════════════════════════
//              Chat Settings — Load/Save
// ═══════════════════════════════════════════
function loadChatSettings() {
    try {
        const saved = localStorage.getItem(CHAT_SETTINGS_KEY);
        if (saved) {
            chatSettings = { ...chatSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.log('⚠️ Could not load chat settings:', e);
    }
    applyChatSettingsUI();
}

function saveChatSettings() {
    chatSettings.sound = document.getElementById('settingSound')?.checked ?? true;
    chatSettings.icon = document.getElementById('settingIcon')?.checked ?? true;
    chatSettings.ticker = document.getElementById('settingTicker')?.checked ?? true;

    try {
        localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(chatSettings));
    } catch (e) {
        console.log('⚠️ Could not save chat settings:', e);
    }

    applyChatSettingsUI();
    updateChatTicker();
    console.log('💾 Chat settings saved:', chatSettings);
}

function applyChatSettingsUI() {
    const s = document.getElementById('settingSound');
    const i = document.getElementById('settingIcon');
    const t = document.getElementById('settingTicker');
    if (s) s.checked = chatSettings.sound;
    if (i) i.checked = chatSettings.icon;
    if (t) t.checked = chatSettings.ticker;

    // به‌روزرسانی دکمه قطع صدا
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        if (chatSettings.muted) {
            btn.textContent = '🔇 وصل صدا';
            btn.classList.add('muted');
        } else {
            btn.textContent = '🔊 قطع صدا';
            btn.classList.remove('muted');
        }
    }

    // نمایش/مخفی نوار پیام‌ها
    const ticker = document.getElementById('chatTicker');
    if (ticker) {
        if (chatSettings.ticker) {
            ticker.classList.remove('hidden');
        } else {
            ticker.classList.add('hidden');
        }
    }
}

// ═══════════════════════════════════════════
//              Clear All Storage
// ═══════════════════════════════════════════
function clearAllStorage() {
    try {
        localStorage.removeItem(SERVER_SETTINGS_KEY);
        localStorage.removeItem(CHAT_SETTINGS_KEY);
        console.log('🗑️ All settings cleared');
    } catch (e) {
        console.log('⚠️ Could not clear storage:', e);
    }
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ storage.js loaded');