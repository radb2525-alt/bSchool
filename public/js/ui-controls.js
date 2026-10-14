// ═══════════════════════════════════════════
//              UI Controls
//              v3.5.1 (Fixed View Switching)
// ═══════════════════════════════════════════

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

    // ⭐ ذخیره تنظیمات سرور قبل از ورود
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

    // ⭐ نمایش/مخفی کردن عناصر مخصوص معلم
    document.querySelectorAll('.teacher-only').forEach(el => {
        el.style.display = (userRole === 'teacher') ? '' : 'none';
    });

    // ⭐ راه‌اندازی اولیه view (grid)
    applyMode('grid');

    // ⭐ دریافت دسترسی دوربین و میکروفن
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // ⭐ عنصر video محلی
        const localVideoEl = document.getElementById('localVideo');
        if (!localVideoEl) {
            console.error('❌ localVideo element not found!');
            throw new Error('localVideo element missing');
        }

        // ⭐ تنظیم stream
        localVideoEl.srcObject = localStream;
        localVideoEl.muted = true;
        localVideoEl.playsInline = true;

        // ⭐ پخش خودکار
        try {
            await localVideoEl.play();
        } catch (e) {
            console.warn('⚠️ Autoplay failed:', e);
            document.body.addEventListener('click', () => {
                localVideoEl.play().catch(() => {});
            }, { once: true });
        }

        // ⭐ label
        const label = document.getElementById('localLabel');
        if (label) {
            label.textContent = `🎥 ${escapeHtml(userName)} (شما)`;
            if (userRole === 'teacher') label.classList.add('teacher');
        }

        console.log('✅ Camera and mic active');
        console.log('   - Video tracks:', localStream.getVideoTracks().length);
        console.log('   - Audio tracks:', localStream.getAudioTracks().length);

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
//              Toggle Hand (Raise)
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
//              Apply Mode (⭐ اصلی — اصلاح‌شده)
// ═══════════════════════════════════════════
function applyMode(mode) {
    console.log('🎬 applyMode:', mode);
    currentMode = mode;

    // ⭐ ۱. مخفی کردن همه viewها با پاک کردن inline styles
    //    (این مرحله مهم است — قبلاً inline display: flex باقی می‌ماند)
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.removeProperty('display');
        v.style.removeProperty('visibility');
        v.style.removeProperty('opacity');
        v.setAttribute('aria-hidden', 'true');
    });

    // ⭐ ۲. نمایش view انتخابی (فقط با class، نه inline style)
    const viewId = mode + 'View';
    const viewEl = document.getElementById(viewId);

    if (viewEl) {
        viewEl.classList.add('active');
        viewEl.setAttribute('aria-hidden', 'false');
        console.log(`✅ Activated ${viewId}`);
    } else {
        console.error(`❌ View not found: ${viewId}`);
    }

    // ⭐ ۳. آپدیت indicator
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = `${modeIcons[mode]} ${modeNames[mode]}`;
        indicator.className = 'mode-indicator ' + mode;
    }

    // ⭐ ۴. آپدیت دکمه‌های mode (سایدبار)
    document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    // ⭐ ۵. پاک کردن srcObjectهای غیرضروری
    if (mode !== 'camera') {
        const cv = document.getElementById('cameraViewVideo');
        if (cv) cv.srcObject = null;
    }
    if (mode !== 'screen' && !screenSharing) {
        const sv = document.getElementById('screenViewVideo');
        if (sv) sv.srcObject = null;
    }

    // ⭐ ۶. مدیریت whiteboard
    if (mode === 'whiteboard') {
        const msg = document.getElementById('noAccessMsg');

        if (!canViewWhiteboard()) {
            if (msg) msg.style.display = 'block';
        } else {
            if (msg) msg.style.display = 'none';

            // ⭐ resize با double rAF
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (typeof resizeCanvas === 'function') resizeCanvas();
                });
            });

            // ⭐ resize دوم بعد از ۲۰۰ms (برای موارد خاص)
            setTimeout(() => {
                if (typeof resizeCanvas === 'function') resizeCanvas();
            }, 200);
        }

        // ⭐ اعمال permissions
        setTimeout(() => {
            if (typeof applyWBPermissions === 'function') applyWBPermissions();
        }, 150);

    } else {
        // ⭐ مخفی کردن پیام دسترسی
        const msg = document.getElementById('noAccessMsg');
        if (msg) msg.style.display = 'none';
    }

    // ⭐ ۷. حالت camera (فقط معلم)
    if (mode === 'camera' && userRole === 'teacher' && localStream) {
        const cv = document.getElementById('cameraViewVideo');
        if (cv) cv.srcObject = localStream;
    }

    console.log('✅ applyMode finished');
}

// ═══════════════════════════════════════════
//              Toggle Screen Share
// ═══════════════════════════════════════════
async function toggleScreenShare() {
    if (screenSharing) stopScreenShare();
    else await startScreenShare();
}

// ═══════════════════════════════════════════
//              Start Screen Share
// ═══════════════════════════════════════════
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

        // ⭐ ارسال track به همه peerها
        const track = screenStream.getVideoTracks()[0];
        for (const pc of Object.values(peerConnections)) {
            const s = pc.getSenders().find(x => x.track && x.track.kind === 'video');
            if (s) await s.replaceTrack(track);
        }

        // ⭐ نمایش محلی
        const sv = document.getElementById('screenViewVideo');
        if (sv) sv.srcObject = screenStream;

        // ⭐ تغییر mode به screen
        setMode('screen');

        // ⭐ توقف خودکار
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

// ═══════════════════════════════════════════
//              Stop Screen Share
// ═══════════════════════════════════════════
function stopScreenShare() {
    if (!screenSharing) return;

    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
    }
    screenSharing = false;

    const btn = document.getElementById('btnScreen');
    if (btn) btn.classList.remove('off');

    // ⭐ بازگشت دوربین
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

    // ⭐ بازگشت به grid
    if (userRole === 'teacher') setMode('grid');

    addSystemMessage('🖥️ اشتراک صفحه متوقف شد');
}

// ═══════════════════════════════════════════
//              Leave Room
// ═══════════════════════════════════════════
function leaveRoom() {
    if (!confirm('از کلاس خارج می‌شوید؟')) return;

    intentionalClose = true;

    if (screenSharing) stopScreenShare();
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    Object.keys(peerConnections).forEach(id => {
        try { peerConnections[id].close(); } catch(e){}
    });

    if (ws) ws.close();
    location.reload();
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ ui-controls.js loaded (v3.5.1)');