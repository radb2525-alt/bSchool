// ═══════════════════════════════════════════
//              Server Settings & Connection Test
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Toggle Server Section (Accordion)
// ═══════════════════════════════════════════
let serverSectionOpen = false;

function toggleServerSection() {
    serverSectionOpen = !serverSectionOpen;

    const body = document.getElementById('serverSectionBody');
    const icon = document.getElementById('serverToggleIcon');

    if (serverSectionOpen) {
        body.classList.add('open');
        icon.classList.add('open');
    } else {
        body.classList.remove('open');
        icon.classList.remove('open');
    }
}

// ═══════════════════════════════════════════
//              Toggle Server Mode (Default/Custom)
// ═══════════════════════════════════════════
function toggleServerMode() {
    const selectedMode = document.querySelector('input[name="serverMode"]:checked').value;
    const isCustom = selectedMode === 'custom';

    // ذخیره
    serverSettings.useCustom = isCustom;

    // UI
    document.getElementById('modeDefaultLabel')?.classList.toggle('selected', !isCustom);
    document.getElementById('modeCustomLabel')?.classList.toggle('selected', isCustom);
    document.getElementById('serverAddressBox')?.classList.toggle('visible', isCustom);

    // آپدیت عنوان و نشانگر
    const title = document.getElementById('serverSectionTitle');
    const dot = document.getElementById('serverStatusDot');
    if (isCustom) {
        if (title) title.textContent = '⚙️ سرور سفارشی';
        if (dot) dot.classList.add('custom');
    } else {
        if (title) title.textContent = '⚙️ سرور پیش‌فرض';
        if (dot) dot.classList.remove('custom');
    }

    // ذخیره
    saveServerSettings();

    // پاک کردن نتیجه تست
    const result = document.getElementById('connectionResult');
    if (result) {
        result.classList.remove('visible');
        result.innerHTML = '';
    }

    // به‌روزرسانی URL
    updateWebSocketUrl();
}

// ═══════════════════════════════════════════
//              Set Server Example (Click to Fill)
// ═══════════════════════════════════════════
function setServerExample(url) {
    const input = document.getElementById('inputServerAddress');
    if (input) {
        input.value = url;
        serverSettings.serverAddress = url;
        saveServerSettings();
        updateWebSocketUrl();

        // پاک کردن نتیجه تست قبلی
        const result = document.getElementById('connectionResult');
        if (result) {
            result.classList.remove('visible');
            result.innerHTML = '';
        }
    }
}

// ═══════════════════════════════════════════
//              Test Server Connection
// ═══════════════════════════════════════════
async function testServerConnection() {
    const input = document.getElementById('inputServerAddress');
    const result = document.getElementById('connectionResult');
    const btn = document.getElementById('testConnectionBtn');

    let address = input.value.trim();

    if (!address) {
        showConnectionResult('error', '❌ آدرس سرور خالی است', 'لطفاً آدرس سرور را وارد کنید');
        return;
    }

    // نرمال‌سازی
    address = normalizeUrl(address);
    input.value = address;

    // ذخیره
    serverSettings.serverAddress = address;
    saveServerSettings();

    // UI: حالت در حال تست
    btn.disabled = true;
    btn.textContent = '⏳ در حال تست...';
    showConnectionResult('loading', '⏳ در حال بررسی...', 'لطفاً صبر کنید...');

    const startTime = Date.now();

    try {
        // ═══ ۱. تست HTTP — Health endpoint ═══
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const httpRes = await fetch(address + '/health', {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!httpRes.ok) {
            throw new Error('HTTP ' + httpRes.status);
        }

        const healthData = await httpRes.json();

        if (healthData.status !== 'ok') {
            throw new Error('سرور پاسخ نامعتبر');
        }

        // ═══ ۲. تست WebSocket ═══
        const wsUrl = buildWebSocketUrl(address);

        const wsTest = await new Promise((resolve) => {
            const testWs = new WebSocket(wsUrl);
            const timeout = setTimeout(() => {
                testWs.close();
                resolve({ ok: false, error: 'WebSocket تایم‌اوت (۵ ثانیه)' });
            }, 5000);

            testWs.onopen = () => {
                clearTimeout(timeout);
                testWs.close();
                resolve({ ok: true });
            };

            testWs.onerror = () => {
                clearTimeout(timeout);
                resolve({ ok: false, error: 'WebSocket خطا' });
            };
        });

        if (!wsTest.ok) {
            throw new Error(wsTest.error);
        }

        // ═══ ✅ موفق ═══
        const elapsed = Date.now() - startTime;
        const version = healthData.service || healthData.version || 'نامشخص';
        const uptime = healthData.uptime ? Math.floor(healthData.uptime) + ' ثانیه' : '—';

        showConnectionResult('success',
            '✅ اتصال برقرار شد',
            `📊 نسخه سرور: ${version}<br>🕐 زمان پاسخ: ${elapsed}ms<br>⚡ Uptime: ${uptime}`
        );

        // ذخیره
        serverSettings.serverAddress = address;
        saveServerSettings();
        updateWebSocketUrl();

    } catch (e) {
        let errorMsg = '❌ اتصال برقرار نشد';
        let details = '';

        if (e.name === 'AbortError') {
            details = '⏱️ سرور پاسخ نداد (تایم‌اوت ۵ ثانیه)';
        } else if (e.message.includes('HTTP')) {
            details = '🚫 سرور پاسخ خطا داد: ' + e.message;
        } else if (e.message.includes('WebSocket')) {
            details = '🔌 WebSocket برقرار نشد: ' + e.message;
        } else if (e.message.includes('Failed to fetch') || e.name === 'TypeError') {
            details = '🌐 سرور در دسترس نیست<br>• آدرس را چک کنید<br>• سرور روشن است؟<br>• پورت باز است؟';
        } else {
            details = '⚠️ ' + e.message;
        }

        showConnectionResult('error', errorMsg, details);

    } finally {
        btn.disabled = false;
        btn.textContent = '🔌 تست اتصال';
    }
}

// ═══════════════════════════════════════════
//              Show Connection Result
// ═══════════════════════════════════════════
function showConnectionResult(type, title, detail) {
    const result = document.getElementById('connectionResult');
    if (!result) return;

    result.className = 'connection-result visible ' + type;
    result.innerHTML = `
        <div class="result-title">${title}</div>
        <div class="result-detail">${detail}</div>
    `;
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ server-settings.js loaded');