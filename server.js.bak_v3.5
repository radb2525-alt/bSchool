// ═══════════════════════════════════════════
//   Smart School — Classroom Server v3.2
//   Express + WebSocket + WebRTC + Permissions
// ═══════════════════════════════════════════

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 8686;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'classroom-v3.2',
        time: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ═══════════════════════════════════════════
//              Storage
// ═══════════════════════════════════════════
const rooms = {};           // room_id → Set of clients
const roomModes = {};       // room_id → { mode, whiteboard: {...} }
const roomWhiteboards = {}; // room_id → [events]

wss.on('connection', (ws, req) => {
    console.log('🔌 New WS connection');
    let clientInfo = null;

    ws.on('message', (raw) => {
        let data;
        try { data = JSON.parse(raw); }
        catch (e) { console.error('❌ Invalid JSON:', e); return; }

        // ═══════════════════════════════════════
        //   Join Room
        // ═══════════════════════════════════════
        if (data.type === 'join') {
            clientInfo = {
                id: data.user_id,
                name: data.user_name,
                role: data.role || 'student',
                room: data.room_id,
                ws: ws,
            };

            if (!rooms[data.room_id]) {
                rooms[data.room_id] = new Set();
                roomModes[data.room_id] = {
                    mode: 'grid',
                    whiteboard: {
                        viewMode: 'all',
                        viewers: [],
                        drawMode: 'teacher',
                        drawers: [],
                    },
                };
                roomWhiteboards[data.room_id] = [];
            }
            rooms[data.room_id].add(clientInfo);

            const members = [...rooms[data.room_id]];
            console.log(`✅ ${clientInfo.name} (${clientInfo.role}) joined ${clientInfo.room} (${members.length} online)`);

            // ارسال room_info به کاربر جدید
            ws.send(JSON.stringify({
                type: 'room_info',
                data: {
                    students: members
                        .filter(m => m.role === 'student' && m.id !== data.user_id)
                        .map(m => ({ id: m.id, name: m.name })),
                    teacher: (() => {
                        const t = members.find(m => m.role === 'teacher' && m.id !== data.user_id);
                        return t ? { id: t.id, name: t.name } : null;
                    })(),
                    members: members.map(m => ({ id: m.id, name: m.name, role: m.role })),
                    chat: [],
                    online_count: members.length,
                    currentMode: roomModes[data.room_id].mode,
                    whiteboard: roomModes[data.room_id].whiteboard,
                }
            }));

            // ارسال تاریخچه تخته سفید
            if (roomWhiteboards[data.room_id] && roomWhiteboards[data.room_id].length > 0) {
                console.log(`📤 Sending ${roomWhiteboards[data.room_id].length} whiteboard events to ${clientInfo.name}`);
                roomWhiteboards[data.room_id].forEach(event => {
                    ws.send(JSON.stringify({ type: 'whiteboard', data: event }));
                });
            }

            members.forEach(m => {
                if (m.id !== data.user_id) {
                    m.ws.send(JSON.stringify({
                        type: 'user_joined',
                        user_id: data.user_id,
                        user_name: data.user_name,
                        role: data.role,
                        online_count: members.length,
                    }));
                }
            });

            broadcastMembers(data.room_id);
            return;
        }

        if (!clientInfo) return;
        const members = [...(rooms[clientInfo.room] || [])];

        // ═══════════════════════════════════════
        //   Message Router
        // ═══════════════════════════════════════
        switch (data.type) {

            case 'chat':
                members.forEach(m => {
                    m.ws.send(JSON.stringify({
                        type: 'chat_message',
                        user: clientInfo.name,
                        message: data.message,
                        time: new Date().toLocaleTimeString('fa-IR'),
                    }));
                });
                break;

            case 'signal':
                const target = members.find(m => m.id === data.target);
                if (target) {
                    target.ws.send(JSON.stringify({
                        type: 'signal',
                        from: clientInfo.id,
                        from_name: clientInfo.name,
                        data: data.data,
                    }));
                }
                break;

            case 'hand_raise':
            case 'hand_lower':
                members.forEach(m => {
                    if (m.id !== clientInfo.id) {
                        m.ws.send(JSON.stringify({
                            type: data.type === 'hand_raise' ? 'hand_raised' : 'hand_lowered',
                            user_name: clientInfo.name,
                        }));
                    }
                });
                break;

            // ═══ تغییر حالت اتاق (فقط معلم) ═══
            case 'set_mode':
                if (clientInfo.role !== 'teacher') {
                    console.warn(`⚠️ ${clientInfo.name} tried to change mode but is not teacher`);
                    break;
                }
                if (!['grid', 'camera', 'whiteboard', 'screen'].includes(data.mode)) break;
                roomModes[clientInfo.room].mode = data.mode;
                console.log(`🎬 Mode → "${data.mode}" by ${clientInfo.name}`);
                members.forEach(m => {
                    m.ws.send(JSON.stringify({
                        type: 'mode_changed',
                        mode: data.mode,
                        by: clientInfo.name,
                    }));
                });
                break;

            // ═══ تنظیم مجوزهای تخته سفید (فقط معلم) ═══
            case 'set_whiteboard_permissions':
                if (clientInfo.role !== 'teacher') {
                    console.warn(`⚠️ ${clientInfo.name} tried to set WB permissions`);
                    break;
                }
                
                roomModes[clientInfo.room].whiteboard = {
                    viewMode: data.viewMode || 'all',
                    viewers: data.viewers || [],
                    drawMode: data.drawMode || 'teacher',
                    drawers: data.drawers || [],
                };
                
                console.log(`🎨 WB permissions updated by ${clientInfo.name}:`,
                    roomModes[clientInfo.room].whiteboard);
                
                members.forEach(m => {
                    m.ws.send(JSON.stringify({
                        type: 'whiteboard_permissions_changed',
                        whiteboard: roomModes[clientInfo.room].whiteboard,
                        by: clientInfo.name,
                    }));
                });
                break;

            // ═══ تخته سفید: چک اجازه + ذخیره + forward ═══
            case 'whiteboard':
                const wbPerm = roomModes[clientInfo.room].whiteboard;
                let canDrawNow = false;
                
                if (clientInfo.role === 'teacher') {
                    canDrawNow = true;
                } else if (wbPerm.drawMode === 'all') {
                    canDrawNow = true;
                } else if (wbPerm.drawMode === 'selected') {
                    canDrawNow = wbPerm.drawers.includes(clientInfo.id);
                }
                
                if (!canDrawNow) {
                    console.warn(`⚠️ ${clientInfo.name} tried to draw without permission`);
                    break;
                }
                
                // ذخیره در تاریخچه
                if (data.data.type === 'clear') {
                    roomWhiteboards[clientInfo.room] = [];
                } else {
                    roomWhiteboards[clientInfo.room].push(data.data);
                    if (roomWhiteboards[clientInfo.room].length > 5000) {
                        roomWhiteboards[clientInfo.room].shift();
                    }
                }
                
                members.forEach(m => {
                    if (m.id !== clientInfo.id) {
                        m.ws.send(JSON.stringify({
                            type: 'whiteboard',
                            data: data.data,
                        }));
                    }
                });
                break;

            case 'screen_share_start':
            case 'screen_share_stop':
                const isStart = data.type === 'screen_share_start';
                console.log(`🖥️ ${clientInfo.name} ${isStart ? 'started' : 'stopped'} screen share`);
                members.forEach(m => {
                    if (m.id !== clientInfo.id) {
                        m.ws.send(JSON.stringify({
                            type: isStart ? 'screen_share_started' : 'screen_share_stopped',
                            user_name: clientInfo.name,
                            hasAudio: data.hasAudio || false,
                        }));
                    }
                });
                break;

            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;

            default:
                console.warn('⚠️ Unknown message type:', data.type);
        }
    });

    ws.on('close', () => {
        if (clientInfo && rooms[clientInfo.room]) {
            rooms[clientInfo.room].delete(clientInfo);
            console.log(`🔴 ${clientInfo.name} left ${clientInfo.room}`);

            rooms[clientInfo.room].forEach(m => {
                m.ws.send(JSON.stringify({
                    type: 'user_left',
                    user_id: clientInfo.id,
                    user_name: clientInfo.name,
                }));
            });

            broadcastMembers(clientInfo.room);

            if (rooms[clientInfo.room].size === 0) {
                console.log(`🗑️ Room ${clientInfo.room} is empty, cleaning`);
                delete rooms[clientInfo.room];
                delete roomModes[clientInfo.room];
                delete roomWhiteboards[clientInfo.room];
            }
        }
    });

    ws.on('error', (e) => console.error('❌ WS error:', e));
});

function broadcastMembers(roomId) {
    if (!rooms[roomId]) return;
    const members = [...rooms[roomId]].map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
    }));
    rooms[roomId].forEach(m => {
        m.ws.send(JSON.stringify({
            type: 'members_update',
            members: members,
            online_count: members.length,
        }));
    });
}

server.listen(PORT, () => {
    console.log(`🚀 Classroom Server v3.2 on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
});