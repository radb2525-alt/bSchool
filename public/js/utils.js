// ═══════════════════════════════════════════
//              Utility Functions
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Escape HTML
// ═══════════════════════════════════════════
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ═══════════════════════════════════════════
//              System Messages (Chat)
// ═══════════════════════════════════════════
function addSystemMessage(message) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-msg system';
    div.textContent = message;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

// ═══════════════════════════════════════════
//              DOM Helpers
// ═══════════════════════════════════════════
function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function $one(selector) {
    return document.querySelector(selector);
}

function show(el) {
    if (typeof el === 'string') el = $(el);
    if (el) el.classList.remove('hidden');
}

function hide(el) {
    if (typeof el === 'string') el = $(el);
    if (el) el.classList.add('hidden');
}

function toggleClass(el, className, force) {
    if (typeof el === 'string') el = $(el);
    if (el) el.classList.toggle(className, force);
}

// ═══════════════════════════════════════════
//              String Helpers
// ═══════════════════════════════════════════
function truncate(str, length = 50) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ═══════════════════════════════════════════
//              Time Helpers
// ═══════════════════════════════════════════
function getCurrentTime() {
    return new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentDateTime() {
    return new Date().toLocaleString('fa-IR');
}

// ═══════════════════════════════════════════
//              Debounce & Throttle
// ═══════════════════════════════════════════
function debounce(fn, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

function throttle(fn, limit = 200) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ═══════════════════════════════════════════
//              Confirm Dialog Helper
// ═══════════════════════════════════════════
function confirmAction(message) {
    return confirm(message);
}

// ═══════════════════════════════════════════
//              Alert Helper
// ═══════════════════════════════════════════
function showAlert(message) {
    alert(message);
}

// ═══════════════════════════════════════════
//              Copy to Clipboard
// ═══════════════════════════════════════════
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error('Copy failed:', e);
        return false;
    }
}

// ═══════════════════════════════════════════
//              URL Helpers
// ═══════════════════════════════════════════
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim().replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }
    return url;
}

// ═══════════════════════════════════════════
//              Device Detection
// ═══════════════════════════════════════════
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isSecureContext() {
    return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ utils.js loaded');