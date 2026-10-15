// ═══════════════════════════════════════════
//              Modals Management
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Help Modal
// ═══════════════════════════════════════════
function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.add('show');
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.remove('show');
}

// ═══════════════════════════════════════════
//              Permissions Modal
// ═══════════════════════════════════════════
function openPermissionsModal() {
    if (userRole !== 'teacher') return;

    // پر کردن radio buttons
    document.querySelectorAll('input[name="viewMode"]').forEach(r => {
        r.checked = r.value === wbPermissions.viewMode;
    });
    document.querySelectorAll('input[name="drawMode"]').forEach(r => {
        r.checked = r.value === wbPermissions.drawMode;
    });

    // ساخت checkboxes
    buildUserCheckboxes('viewersCheckboxes', wbPermissions.viewers, 'viewer');
    buildUserCheckboxes('drawersCheckboxes', wbPermissions.drawers, 'drawer');

    // نمایش/مخفی user-list
    toggleUserList('viewersList', wbPermissions.viewMode === 'selected');
    toggleUserList('drawersList', wbPermissions.drawMode === 'selected');

    // اتصال رویدادها
    document.querySelectorAll('input[name="viewMode"]').forEach(r => {
        r.onchange = () => toggleUserList('viewersList', r.value === 'selected');
    });
    document.querySelectorAll('input[name="drawMode"]').forEach(r => {
        r.onchange = () => toggleUserList('drawersList', r.value === 'selected');
    });

    // نمایش modal
    const modal = document.getElementById('permissionsModal');
    if (modal) modal.classList.add('show');
}

function closePermissionsModal() {
    const modal = document.getElementById('permissionsModal');
    if (modal) modal.classList.remove('show');
}

// ═══════════════════════════════════════════
//              Toggle User List Visibility
// ═══════════════════════════════════════════
function toggleUserList(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.add('visible');
    else el.classList.remove('visible');
}

// ═══════════════════════════════════════════
//              Build User Checkboxes
// ═══════════════════════════════════════════
function buildUserCheckboxes(containerId, selectedIds, role) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const students = roomMembers.filter(m => m.role === 'student' && m.id !== userId);

    if (students.length === 0) {
        container.innerHTML = '<div style="color:#666;font-size:10pt;">هیچ دانش‌آموزی حاضر نیست</div>';
        return;
    }

    students.forEach(s => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        const checked = selectedIds.includes(s.id);
        label.innerHTML = `<input type="checkbox" data-user-id="${s.id}" data-role="${role}" ${checked ? 'checked' : ''}><span>👨‍🎓 ${escapeHtml(s.name)}</span>`;
        container.appendChild(label);
    });
}

// ═══════════════════════════════════════════
//              Save Permissions
// ═══════════════════════════════════════════
function savePermissions() {
    const viewMode = document.querySelector('input[name="viewMode"]:checked').value;
    const drawMode = document.querySelector('input[name="drawMode"]:checked').value;

    const viewers = [];
    const drawers = [];

    document.querySelectorAll('input[data-role="viewer"]:checked').forEach(cb => viewers.push(cb.dataset.userId));
    document.querySelectorAll('input[data-role="drawer"]:checked').forEach(cb => drawers.push(cb.dataset.userId));

    if (viewMode === 'selected' && viewers.length === 0) {
        alert('⚠️ حداقل یک بیننده انتخاب کنید');
        return;
    }
    if (drawMode === 'selected' && drawers.length === 0) {
        alert('⚠️ حداقل یک نویسنده انتخاب کنید');
        return;
    }

    wbPermissions = { viewMode, viewers, drawMode, drawers };

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'set_whiteboard_permissions',
            viewMode, viewers, drawMode, drawers
        }));
    }

    applyWBPermissions();
    addSystemMessage('⚙️ دسترسی‌ها ذخیره شد');
    closePermissionsModal();
}

// ═══════════════════════════════════════════
//              Close Modals on Outside Click
// ═══════════════════════════════════════════
document.addEventListener('click', (e) => {
    const helpModal = document.getElementById('helpModal');
    if (helpModal && helpModal.classList.contains('show')) {
        if (e.target === helpModal) {
            closeHelpModal();
        }
    }
});

// ═══════════════════════════════════════════
//              Close Modals on Escape
// ═══════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    // ⭐ Modal پایان کلاس — Escape کار نمی‌کند
    const classEndedModal = document.getElementById('classEndedModal');
    if (classEndedModal && classEndedModal.classList.contains('show')) {
        return;
    }
    
    if (e.key === 'Escape') {
        closeHelpModal();
        closePermissionsModal();
        if (typeof closePasswordModal === 'function') closePasswordModal();
    }
});

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ modals.js loaded');