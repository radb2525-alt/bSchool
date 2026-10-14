// ═══════════════════════════════════════════
//              Configuration
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              WebRTC Configuration
// ═══════════════════════════════════════════
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
    ]
};

// ═══════════════════════════════════════════
//              Server Configuration
// ═══════════════════════════════════════════
let SERVER_BASE_URL = `${location.protocol}//${location.host}`;
let WS_URL = '';

let serverSettings = {
    useCustom: false,
    serverAddress: ''
};

const SERVER_SETTINGS_KEY = 'classroom_server_settings';

// ═══════════════════════════════════════════
//              Chat Settings
// ═══════════════════════════════════════════
let chatSettings = {
    sound: true,
    icon: true,
    ticker: true,
    muted: false
};

const CHAT_SETTINGS_KEY = 'classroom_chat_settings';

// ═══════════════════════════════════════════
//              Global State
// ═══════════════════════════════════════════
let ws = null;
let localStream = null;
let roomId = '';
let userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
let userName = '';
let userRole = 'student';
let micOn = true;
let camOn = true;
let handRaised = false;
let reconnectAttempts = 0;
let intentionalClose = false;

// ═══════════════════════════════════════════
//              WebRTC State
// ═══════════════════════════════════════════
let peerConnections = {};
let remoteStreams = {};
let pendingCandidates = {};
let remoteNames = {};
let remoteRoles = {};

// ═══════════════════════════════════════════
//              Screen Share State
// ═══════════════════════════════════════════
let screenStream = null;
let screenSharing = false;

// ═══════════════════════════════════════════
//              Mode State
// ═══════════════════════════════════════════
let currentMode = 'grid';

// ═══════════════════════════════════════════
//              Room Members
// ═══════════════════════════════════════════
let roomMembers = [];

// ═══════════════════════════════════════════
//              Whiteboard Permissions
// ═══════════════════════════════════════════
let wbPermissions = {
    viewMode: 'all',
    viewers: [],
    drawMode: 'teacher',
    drawers: []
};

// ═══════════════════════════════════════════
//              Sidebar State
// ═══════════════════════════════════════════
let sidebarCloseTimers = {};
let activeSidebar = null;

// ═══════════════════════════════════════════
//              Notification State
// ═══════════════════════════════════════════
let notificationAudio = null;
let lastMessages = [];
let unreadCount = 0;
let chatSidebarOpen = false;
let audioContext = null;

// ═══════════════════════════════════════════
//              Constants
// ═══════════════════════════════════════════
const modeNames = {
    grid: 'Grid',
    camera: 'دوربین معلم',
    whiteboard: 'تخته سفید',
    screen: 'اشتراک صفحه'
};

const modeIcons = {
    grid: '🎬',
    camera: '📹',
    whiteboard: '🎨',
    screen: '🖥️'
};

const permissionNames = {
    teacher: 'فقط معلم',
    all: 'همه',
    none: 'هیچ‌کس'
};

// ═══════════════════════════════════════════
//              WebSocket URL Builder
// ═══════════════════════════════════════════
function buildWebSocketUrl(baseUrl) {
    if (!baseUrl) baseUrl = SERVER_BASE_URL;
    baseUrl = baseUrl.replace(/\/$/, '');

    if (baseUrl.startsWith('https://')) {
        return baseUrl.replace('https://', 'wss://') + '/ws';
    } else if (baseUrl.startsWith('http://')) {
        return baseUrl.replace('http://', 'ws://') + '/ws';
    } else {
        const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
        return protocol + baseUrl + '/ws';
    }
}

function updateWebSocketUrl() {
    let baseUrl;

    if (serverSettings.useCustom && serverSettings.serverAddress) {
        baseUrl = serverSettings.serverAddress.trim();
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'http://' + baseUrl;
        }
    } else {
        baseUrl = SERVER_BASE_URL;
    }

    WS_URL = buildWebSocketUrl(baseUrl);
    console.log('🌐 WebSocket URL:', WS_URL);
    return WS_URL;
}

// ═══════════════════════════════════════════
//              Logging Helper
// ═══════════════════════════════════════════
function logInfo(msg, ...args) {
    console.log('ℹ️ ' + msg, ...args);
}

function logSuccess(msg, ...args) {
    console.log('✅ ' + msg, ...args);
}

function logWarning(msg, ...args) {
    console.warn('⚠️ ' + msg, ...args);
}

function logError(msg, ...args) {
    console.error('❌ ' + msg, ...args);
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ config.js loaded');