// ═══════════════════════════════════════════
//              Sidebar Management
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Toggle Sidebar
// ═══════════════════════════════════════════
function toggleSidebar(name) {
    if (activeSidebar === name) {
        closeSidebar(name);
    } else {
        openSidebar(name);
    }
}

// ═══════════════════════════════════════════
//              Hover Sidebar
// ═══════════════════════════════════════════
function hoverSidebar(name) {
    // لغو timer بسته شدن این سایدبار
    if (sidebarCloseTimers[name]) {
        clearTimeout(sidebarCloseTimers[name]);
        delete sidebarCloseTimers[name];
    }
    openSidebar(name);
}

// ═══════════════════════════════════════════
//              Open Sidebar
// ═══════════════════════════════════════════
function openSidebar(name) {
    // ⭐ اگر سایدبار چت باز می‌شود، پیام‌ها را خوانده‌شده کن
    if (name === 'chat') {
        chatSidebarOpen = true;
        setTimeout(markChatAsRead, 500);
    }

    // بستن سایدبار قبلی
    if (activeSidebar && activeSidebar !== name) {
        closeSidebar(activeSidebar);
    }

    const panel = document.getElementById('sidebar' + name.charAt(0).toUpperCase() + name.slice(1));
    const trigger = document.getElementById('trigger' + name.charAt(0).toUpperCase() + name.slice(1));

    if (panel) panel.classList.add('open');
    if (trigger) trigger.classList.add('active');
    activeSidebar = name;
}

// ═══════════════════════════════════════════
//              Close Sidebar
// ═══════════════════════════════════════════
function closeSidebar(name) {
    const panel = document.getElementById('sidebar' + name.charAt(0).toUpperCase() + name.slice(1));
    const trigger = document.getElementById('trigger' + name.charAt(0).toUpperCase() + name.slice(1));

    if (panel) panel.classList.remove('open');
    if (trigger) {
        trigger.classList.remove('active');
        // ⭐ آیکون notify را حفظ کن (اگر پیام خوانده‌نشده هست)
        if (name === 'chat' && unreadCount > 0) {
            // notify را نگه دار
        }
    }
    if (activeSidebar === name) activeSidebar = null;

    // ⭐ اگر سایدبار چت بسته شد
    if (name === 'chat') {
        chatSidebarOpen = false;
    }
}

// ═══════════════════════════════════════════
//              Schedule Close (Delay)
// ═══════════════════════════════════════════
function scheduleClose(name) {
    // بستن با تأخیر — تا اگر موس دوباره برگشت، بسته نشود
    if (sidebarCloseTimers[name]) clearTimeout(sidebarCloseTimers[name]);
    sidebarCloseTimers[name] = setTimeout(() => {
        closeSidebar(name);
        delete sidebarCloseTimers[name];
    }, 300);
}

// ═══════════════════════════════════════════
//              Close All Sidebars
// ═══════════════════════════════════════════
function closeAllSidebars() {
    ['chat', 'participants', 'control'].forEach(name => {
        closeSidebar(name);
    });
}

// ═══════════════════════════════════════════
//              Update Participants List
// ═══════════════════════════════════════════
function updateParticipantsList() {
    const list = document.getElementById('participantsList');
    if (!list) return;
    list.innerHTML = '';

    if (roomMembers.length === 0) {
        list.innerHTML = '<div style="color:#666;font-size:10pt;text-align:center;padding:20px;">هیچ‌کس حاضر نیست</div>';
        return;
    }

    roomMembers.forEach(m => {
        const item = document.createElement('div');
        item.className = 'participant-item' + (m.role === 'teacher' ? ' teacher' : '');
        item.innerHTML = `
            <span class="role-icon">${m.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</span>
            <span class="name">${escapeHtml(m.name)}${m.id === userId ? ' (شما)' : ''}</span>
            <span class="status">🟢</span>
        `;
        list.appendChild(item);
    });
}

// ═══════════════════════════════════════════
//              Update Participants Bar (Top)
// ═══════════════════════════════════════════
function updateParticipantsBar() {
    // در نسخه جدید، نوار پایین صفحه حذف شده
    // این تابع برای سازگاری نگه داشته شده — بعداً می‌تواند حذف شود
}

// ═══════════════════════════════════════════
//              Close Sidebars on Outside Click
// ═══════════════════════════════════════════
document.addEventListener('click', (e) => {
    if (!activeSidebar) return;

    const panel = document.getElementById('sidebar' + activeSidebar.charAt(0).toUpperCase() + activeSidebar.slice(1));
    const trigger = document.getElementById('trigger' + activeSidebar.charAt(0).toUpperCase() + activeSidebar.slice(1));

    if (panel && !panel.contains(e.target) && trigger && !trigger.contains(e.target)) {
        closeSidebar(activeSidebar);
    }
});

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ sidebar.js loaded');