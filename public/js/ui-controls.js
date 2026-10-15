// ═══════════════════════════════════════════
//              UI Controls
//              v3.5.2 (Final)
// ═══════════════════════════════════════════

// ⭐ رمز اتاق (برای استفاده در connectWS)
let pendingRoomPassword = '';

// ═══════════════════════════════════════════
//              Join Room
// ═══════════════════════════════════════════
async function joinRoom() {
    roomId = document.getElementById('inputRoomId').value.trim();
    userName = document.getElementById('inputUserName').value.trim();
    userRole = document.getElementById('inputRole').value;

    if (!roomId || !userName) {
        alert('لطفاً همه فیلدها را پر کنید');
        return;
    }

    // ⭐ ذخیره رمز اتاق
    pendingRoomPassword = document.getElementById('inputRoomPassword')?.value || '';

    // ⭐ ذخیره تنظیمات سرور
    const selectedMode = document.querySelector('input[name="serverMode"]:checked')?.value || 'default';

    if (selectedMode === 'custom') {
        const address = document.getElementById('inputServerAddress')?.value.trim() || '';
        if (!address) {
            alert('⚠️ لطفاً آدرس سرور سفارشی را وارد کنید یا «تست اتصال» را بزنید');
            return;
        }

        serverSettings.useCustom = true;
        serverSettings.serverAddress = address;
        saveServerSettings();
        updateWebSocketUrl();
    } else {
        serverSettings.useCustom = false;
        saveServerSettings();
        updateWebSocketUrl();
    }

    console.log('🚀 Joining with WS URL:', WS_URL);

    // ⭐ مخفی کردن modal و نمایش اپ
    document.getElementById('joinModal').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    document.getElementById('displayRoomId').textContent = roomId;
    document.getElementById('infoRoomId').textContent = roomId;
    document.getElementById('infoRole').textContent = userRole === 'teacher' ? '👨‍🏫 معلم' : '👨‍🎓 دانش‌آموز';

    document.querySelectorAll('.teacher-only').forEach(el => {
        el.style.display = (userRole === 'teacher') ? '' : 'none';
    });

    // ⭐ راه‌اندازی اولیه view
    applyMode('grid');

    // ⭐ دریافت دوربین و میکروفن
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        const localVideoEl = document.getElementById('localVideo');
        if (!localVideoEl) {
            console.error('❌ localVideo element not found!');
            throw new Error('localVideo element missing');
        }

        localVideoEl.srcObject = localStream;
        localVideoEl.muted = true;
        localVideoEl.playsInline = true;

        try {
            await localVideoEl.play();
        } catch (e) {
            console.warn('⚠️ Autoplay failed:', e);
            document.body.addEventListener('click', () => {
                localVideoEl.play().catch(() => {});
            }, { once: true });
        }

        const label = document.getElementById('localLabel');
        if (label) {
            label.textContent = `🎥 ${escapeHtml(userName)} (شما)`;
            if (userRole === 'teacher') label.classList.add('teacher');
        }

        console.log('✅ Camera and mic active');

    } catch (e) {
        console.error('❌ getUserMedia error:', e);
        let msg = '⚠️ دسترسی به دوربین/میکروفن داده نشد\n\n';
        if (e.name === 'NotAllowedError') msg += 'شما اجازه نداده‌اید.';
        else if (e.name === 'NotFoundError') msg += 'دوربین یا میکروفن یافت نشد.';
        else if (e.name === 'NotReadableError') msg += 'دوربین توسط برنامه دیگری استفاده می‌شود.';
        else msg += e.message;
        alert(msg);
    }

    // ⭐ اتصال WebSocket
    connectWS();
}

// ═══════════════════════════════════════════
//              Toggle Mic
// ═══════════════════════════════════════════
function toggleMic() {
    micOn = !micOn;
    if (localStream) {
        localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    }
    const btn = document.getElementById('btnMic');
    if (btn) {
        btn.classList.toggle('active', micOn);
        btn.classList.toggle('off', !micOn);
    }
    const micStatus = document.getElementById('localMicStatus');
    if (micStatus) micStatus.textContent = micOn ? '🎤' : '🔇';
}

// ═══════════════════════════════════════════
//              Toggle Cam
// ═══════════════════════════════════════════
function toggleCam() {
    camOn = !camOn;
    if (localStream) {
        localStream.getVideoTracks().forEach(t => t.enabled = camOn);
    }
    const btn = document.getElementById('btnCam');
    if (btn) {
        btn.classList.toggle('active', camOn);
        btn.classList.toggle('off', !camOn);
    }
}

// ═══════════════════════════════════════════
//              Toggle Hand
// ═══════════════════════════════════════════
function toggleHand() {
    handRaised = !handRaised;
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: handRaised ? 'hand_raise' : 'hand_lower' }));
    }
    const btn = document.getElementById('btnHand');
    if (btn) btn.classList.toggle('raised', handRaised);
    const lbl = document.getElementById('localLabel');
    if (lbl) lbl.classList.toggle('hand-raised', handRaised);
}

// ═══════════════════════════════════════════
//              Toggle Whiteboard
// ═══════════════════════════════════════════
function toggleWhiteboard() {
    if (currentMode === 'whiteboard') {
        if (userRole === 'teacher') setMode('grid');
    } else {
        if (userRole === 'teacher') {
            setMode('whiteboard');
        } else {
            addSystemMessage('⚠️ فقط معلم می‌تواند تخته را فعال کند');
        }
    }
}

// ═══════════════════════════════════════════
//              Set Mode (معلم)
// ═══════════════════════════════════════════
function setMode(mode) {
    if (userRole !== 'teacher') return;
    if (!['grid', 'camera', 'whiteboard', 'screen'].includes(mode)) return;

    currentMode = mode;
    applyMode(mode);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'set_mode', mode }));
    }
}

// ═══════════════════════════════════════════
//              Apply Mode
// ═══════════════════════════════════════════
function applyMode(mode) {
    console.log('🎬 applyMode:', mode);
    currentMode = mode;

    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.removeProperty('display');
        v.style.removeProperty('visibility');
        v.style.removeProperty('opacity');
        v.setAttribute('aria-hidden', 'true');
    });

    const viewEl = document.getElementById(mode + 'View');
    if (viewEl) {
        viewEl.classList.add('active');
        viewEl.setAttribute('aria-hidden', 'false');
    }

    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = `${modeIcons[mode]} ${modeNames[mode]}`;
        indicator.className = 'mode-indicator ' + mode;
    }

    document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    if (mode !== 'camera') {
        const cv = document.getElementById('cameraViewVideo');
        if (cv) cv.srcObject = null;
    }
    if (mode !== 'screen' && !screenSharing) {
        const sv = document.getElementById('screenViewVideo');
        if (sv) sv.srcObject = null;
    }

    if (mode === 'whiteboard') {
        const msg = document.getElementById('noAccessMsg');
        if (!canViewWhiteboard()) {
            if (msg) msg.style.display = 'block';
        } else {
            if (msg) msg.style.display = 'none';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (typeof resizeCanvas === 'function') resizeCanvas();
                });
            });
            setTimeout(() => {
                if (typeof resizeCanvas === 'function') resizeCanvas();
            }, 200);
        }
        setTimeout(() => {
            if (typeof applyWBPermissions === 'function') applyWBPermissions();
        }, 150);
    } else {
        const msg = document.getElementById('noAccessMsg');
        if (msg) msg.style.display = 'none';
    }

    if (mode === 'camera' && userRole === 'teacher' && localStream) {
        const cv = document.getElementById('cameraViewVideo');
        if (cv) cv.srcObject = localStream;
    }
}

// ═══════════════════════════════════════════
//              Screen Share
// ═══════════════════════════════════════════
async function toggleScreenShare() {
    if (screenSharing) stopScreenShare();
    else await startScreenShare();
}

async function startScreenShare() {
    if (userRole !== 'teacher') {
        addSystemMessage('⚠️ فقط معلم می‌تواند صفحه را اشتراک بگذارد');
        return;
    }

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                frameRate: { ideal: 15, max: 30 },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        screenSharing = true;

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'screen_share_start' }));
        }

        const btn = document.getElementById('btnScreen');
        if (btn) btn.classList.add('off');

        const track = screenStream.getVideoTracks()[0];
        for (const pc of Object.values(peerConnections)) {
            const s = pc.getSenders().find(x => x.track && x.track.kind === 'video');
            if (s) await s.replaceTrack(track);
        }

        const sv = document.getElementById('screenViewVideo');
        if (sv) sv.srcObject = screenStream;

        setMode('screen');
        track.onended = () => stopScreenShare();

        addSystemMessage('🖥️ اشتراک صفحه شروع شد');
        console.log('✅ Screen share started');

    } catch (e) {
        console.error('❌ Screen share error:', e);
        screenSharing = false;
        screenStream = null;
        addSystemMessage(e.name === 'NotAllowedError' ? '⚠️ لغو شد' : '⚠️ ' + e.message);
    }
}

function stopScreenShare() {
    if (!screenSharing) return;

    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
    }
    screenSharing = false;

    const btn = document.getElementById('btnScreen');
    if (btn) btn.classList.remove('off');

    if (localStream) {
        const cam = localStream.getVideoTracks()[0];
        for (const pc of Object.values(peerConnections)) {
            const s = pc.getSenders().find(x => x.track && x.track.kind === 'video');
            if (s && cam) s.replaceTrack(cam);
        }
    }

    const sv = document.getElementById('screenViewVideo');
    if (sv) sv.srcObject = null;

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'screen_share_stop' }));
    }

    if (userRole === 'teacher') setMode('grid');
    addSystemMessage('🖥️ اشتراک صفحه متوقف شد');
}

// ═══════════════════════════════════════════
//              Leave Room
// ═══════════════════════════════════════════
function leaveRoom() {
    if (!confirm('از کلاس خارج می‌شوید؟')) return;

    intentionalClose = true;
    
    // ⭐ ارسال user_leaving قبل از قطع اتصال
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({ type: 'user_leaving' }));
            console.log('👋 user_leaving sent');
        } catch (e) {}
        
        // ⭐ کمی صبر کن تا پیام ارسال شود
        setTimeout(() => {
            if (screenSharing) stopScreenShare();
            if (localStream) localStream.getTracks().forEach(t => t.stop());

            Object.keys(peerConnections).forEach(id => {
                try { peerConnections[id].close(); } catch(e){}
            });

            if (ws) ws.close();
            location.reload();
        }, 200);
    } else {
        // در صورت نبود اتصال، فوری خروج
        if (screenSharing) stopScreenShare();
        if (localStream) localStream.getTracks().forEach(t => t.stop());

        Object.keys(peerConnections).forEach(id => {
            try { peerConnections[id].close(); } catch(e){}
        });

        if (ws) ws.close();
        location.reload();
    }
}

// ═══════════════════════════════════════════
//              Room Security Functions
// ═══════════════════════════════════════════

function openPasswordModal() {
    if (userRole !== 'teacher') return;

    document.getElementById('newRoomPassword').value = '';
    document.getElementById('confirmRoomPassword').value = '';
    const errorEl = document.getElementById('passwordError');
    if (errorEl) errorEl.style.display = 'none';

    document.getElementById('passwordModal').classList.add('show');
    setTimeout(() => document.getElementById('newRoomPassword')?.focus(), 100);
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.remove('show');
}

function saveRoomPassword() {
    const newPass = document.getElementById('newRoomPassword').value.trim();
    const confirmPass = document.getElementById('confirmRoomPassword').value.trim();

    if (!newPass) {
        showPasswordError('لطفاً رمز را وارد کنید');
        return;
    }
    if (newPass.length < 4) {
        showPasswordError('رمز باید حداقل ۴ کاراکتر باشد');
        return;
    }
    if (newPass.length > 8) {
        showPasswordError('رمز نباید بیشتر از ۸ کاراکتر باشد');
        return;
    }
    if (newPass !== confirmPass) {
        showPasswordError('رمز و تأیید آن یکسان نیستند');
        return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'set_room_password',
            password: newPass
        }));
        console.log('🔐 Password sent to server');
    }

    closePasswordModal();
    addSystemMessage('🔐 رمز اتاق تعیین شد');
}

function showPasswordError(msg) {
    const el = document.getElementById('passwordError');
    if (!el) return;
    el.className = 'connection-result visible error';
    el.innerHTML = `<div class="result-title">❌ خطا</div><div class="result-detail">${msg}</div>`;
    el.style.display = 'block';
}

function removeRoomPassword() {
    if (userRole !== 'teacher') return;
    if (!confirm('آیا از حذف رمز اتاق مطمئن هستید؟')) return;

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'remove_room_password' }));
    }
    addSystemMessage('🔓 رمز اتاق حذف شد');
}

function toggleRoomLock() {
    if (userRole !== 'teacher') return;

    const isLocked = roomSecurity.locked;
    const action = isLocked ? 'باز کردن' : 'قفل کردن';

    if (!confirm(`آیا از ${action} اتاق مطمئن هستید؟`)) return;

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: isLocked ? 'unlock_room' : 'lock_room'
        }));
    }
}

function updateSecurityUI() {
    const statusEl = document.getElementById('roomSecurityStatus');
    const passEl = document.getElementById('roomPasswordStatus');
    const setBtn = document.getElementById('btnSetPassword');
    const removeBtn = document.getElementById('btnRemovePassword');
    const lockBtn = document.getElementById('btnLockRoom');

    if (!statusEl || !passEl) return;

    if (roomSecurity.locked) {
        statusEl.textContent = '🔒 قفل کامل';
        statusEl.className = 'value locked';
    } else {
        statusEl.textContent = '🔓 باز';
        statusEl.className = 'value unlocked';
    }

    if (roomSecurity.hasPassword) {
        passEl.textContent = 'دارد ●●●●';
        passEl.className = 'value has-password';
    } else {
        passEl.textContent = 'ندارد';
        passEl.className = 'value';
    }

    if (setBtn) {
        setBtn.textContent = roomSecurity.hasPassword ? '✏️ تغییر رمز' : '🔑 تعیین رمز';
    }
    if (removeBtn) {
        removeBtn.style.display = roomSecurity.hasPassword ? 'block' : 'none';
    }
    if (lockBtn) {
        lockBtn.textContent = roomSecurity.locked ? '🔓 باز کردن اتاق' : '🔒 قفل کامل اتاق';
        lockBtn.className = 'control-btn ' + (roomSecurity.locked ? '' : 'secondary');
    }
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ ui-controls.js loaded (v3.5.2)');

// ⭐ چک امنیت اتاق و نمایش/مخفی فیلد رمز
async function checkRoomSecurityBeforeJoin() {
    const roomIdInput = document.getElementById('inputRoomId');
    if (!roomIdInput) return;

    const roomId = roomIdInput.value.trim();
    if (!roomId) return;

    const passwordField = document.getElementById('passwordField');
    if (!passwordField) return;

    try {
        const baseUrl = WS_URL.replace(/^ws/, 'http').replace(/\/ws$/, '');
        const res = await fetch(`${baseUrl}/api/room/${roomId}/security`);
        
        if (!res.ok) {
            // خطا — فیلد را مخفی کن
            passwordField.style.display = 'none';
            return;
        }
        
        const data = await res.json();
        
        // اگر رمز دارد یا قفل است → نمایش فیلد
        if (data.hasPassword || data.locked) {
            passwordField.style.display = 'block';
        } else {
            passwordField.style.display = 'none';
        }
        
    } catch (e) {
        console.warn('Could not check room security:', e);
        // در صورت خطا — فیلد را نمایش بده برای اطمینان
        passwordField.style.display = 'block';
    }
}

// ⭐ شنونده تغییر در کد اتاق
document.addEventListener('DOMContentLoaded', () => {
    const roomIdInput = document.getElementById('inputRoomId');
    if (roomIdInput) {
        roomIdInput.addEventListener('blur', checkRoomSecurityBeforeJoin);
        roomIdInput.addEventListener('change', checkRoomSecurityBeforeJoin);
    }
});

// ═══════════════════════════════════════════
//              Class Ended Handling
// ═══════════════════════════════════════════

let classEndCountdown = null;

// ⭐ نمایش Modal پایان کلاس
function showClassEnded(reason, message, delaySeconds) {
    console.log('🔴 Class ended:', reason);
    
    // جلوگیری از چندبار
    if (document.getElementById('classEndedModal').classList.contains('show')) return;
    
    // پیام
    const msgEl = document.getElementById('classEndedMessage');
    if (msgEl) {
        let fullMsg = message || 'کلاس تمام شد';
        if (reason === 'teacher_left') {
            fullMsg = 'معلم از کلاس خارج شد';
        }
        msgEl.textContent = fullMsg;
    }
    
    // نمایش Modal
    document.getElementById('classEndedModal').classList.add('show');
    
    // شمارش معکوس
    let countdown = delaySeconds || 5;
    const circleEl = document.getElementById('countdownCircle');
    
    if (circleEl) {
        circleEl.textContent = countdown;
        circleEl.classList.add('counting');
    }
    
    classEndCountdown = setInterval(() => {
        countdown--;
        
        if (circleEl) {
            circleEl.textContent = countdown;
            // انیمیشن مجدد
            circleEl.classList.remove('counting');
            void circleEl.offsetWidth;
            circleEl.classList.add('counting');
        }
        
        if (countdown <= 0) {
            clearInterval(classEndCountdown);
            classEndCountdown = null;
            endClassNow();
        }
    }, 1000);
}

// ⭐ خروج فوری
function endClassNow() {
    console.log('🚪 Ending class now...');
    
    // لغو شمارش
    if (classEndCountdown) {
        clearInterval(classEndCountdown);
        classEndCountdown = null;
    }
    
    // قطع اتصالات
    intentionalClose = true;
    
    if (screenSharing && typeof stopScreenShare === 'function') {
        try { stopScreenShare(); } catch (e) {}
    }
    
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
    }
    
    Object.keys(peerConnections).forEach(id => {
        try { peerConnections[id].close(); } catch(e) {}
    });
    
    if (ws) {
        try { ws.close(); } catch (e) {}
    }
    
    // بازگشت به صفحه ورود
    setTimeout(() => {
        location.reload();
    }, 300);
}

// ⭐ لغو پایان کلاس (اگر معلم برگشت)
function cancelClassEnded() {
    console.log('✅ Teacher returned — cancelling class end');
    
    if (classEndCountdown) {
        clearInterval(classEndCountdown);
        classEndCountdown = null;
    }
    
    document.getElementById('classEndedModal').classList.remove('show');
    addSystemMessage('✅ معلم برگشت — کلاس ادامه می‌یابد');
}
