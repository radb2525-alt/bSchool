// ═══════════════════════════════════════════
//              Whiteboard
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Whiteboard State
// ═══════════════════════════════════════════
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let currentBrushSize = 3;
let currentTool = 'pen';
let whiteboardHistory = [];
let pendingTextInput = null;

// ═══════════════════════════════════════════
//              Init Whiteboard
// ═══════════════════════════════════════════
function initWhiteboard() {
    canvas = document.getElementById('whiteboardCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('dblclick', handleDoubleClick);

    window.addEventListener('resize', resizeCanvas);
}

// ═══════════════════════════════════════════
//              Resize Canvas
// ═══════════════════════════════════════════
function resizeCanvas() {
    if (!canvas) return;

    const cont = canvas.parentElement;
    if (!cont) return;

    // ⭐ استفاده از getBoundingClientRect برای دقت بیشتر
    const rect = cont.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (w <= 0 || h <= 0) return;

    // ⭐ فقط اگر تغییر کرده، بازسازی کن
    if (canvas.width === w && canvas.height === h) return;

    // ذخیره محتوای قبلی
    const oldCanvas = document.createElement('canvas');
    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;
    if (canvas.width > 0 && canvas.height > 0 && ctx) {
        oldCanvas.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = w;
    canvas.height = h;

    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ⭐ بازیابی محتوای قبلی (اگر mode تغییر نکرده)
        if (oldCanvas.width > 0 && oldCanvas.height > 0) {
            try {
                ctx.drawImage(oldCanvas, 0, 0, w, h);
            } catch (e) {}
        }

        // ⭐ رسم مجدد تاریخچه
        replayHistory();
    }

    console.log(`📐 Canvas resized: ${w}x${h}`);
}

// ═══════════════════════════════════════════
//              Mouse Drawing
// ═══════════════════════════════════════════
function startDrawing(e) {
    if (currentTool === 'text') return;
    if (!canDrawWhiteboard()) return;
    isDrawing = true;
    const r = canvas.getBoundingClientRect();
    lastX = (e.clientX - r.left) / r.width;
    lastY = (e.clientY - r.top) / r.height;
}

function draw(e) {
    if (!isDrawing || !canDrawWhiteboard()) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    drawLine(lastX * canvas.width, lastY * canvas.height, x * canvas.width, y * canvas.height, currentColor, currentBrushSize, currentTool);

    sendWhiteboard({
        type: 'draw', fromX: lastX, fromY: lastY, toX: x, toY: y,
        color: currentColor, size: currentBrushSize, tool: currentTool,
        author: userName
    });

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

// ═══════════════════════════════════════════
//              Touch Drawing
// ═══════════════════════════════════════════
function handleTouchStart(e) {
    if (currentTool === 'text' || !canDrawWhiteboard()) return;
    e.preventDefault();
    if (e.touches.length > 0) {
        isDrawing = true;
        const r = canvas.getBoundingClientRect();
        lastX = (e.touches[0].clientX - r.left) / r.width;
        lastY = (e.touches[0].clientY - r.top) / r.height;
    }
}

function handleTouchMove(e) {
    if (currentTool === 'text' || !canDrawWhiteboard()) return;
    e.preventDefault();
    if (!isDrawing || e.touches.length === 0) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.touches[0].clientX - r.left) / r.width;
    const y = (e.touches[0].clientY - r.top) / r.height;
    drawLine(lastX * canvas.width, lastY * canvas.height, x * canvas.width, y * canvas.height, currentColor, currentBrushSize, currentTool);
    sendWhiteboard({
        type: 'draw', fromX: lastX, fromY: lastY, toX: x, toY: y,
        color: currentColor, size: currentBrushSize, tool: currentTool,
        author: userName
    });
    lastX = x;
    lastY = y;
}

// ═══════════════════════════════════════════
//              Double Click (Text)
// ═══════════════════════════════════════════
function handleDoubleClick(e) {
    if (!canDrawWhiteboard()) return;
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    showTextInput((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
}

// ═══════════════════════════════════════════
//              Draw Line
// ═══════════════════════════════════════════
function drawLine(x1, y1, x2, y2, color, size, tool) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (tool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size * 5;
    } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

// ═══════════════════════════════════════════
//              Draw Text
// ═══════════════════════════════════════════
function drawText(x, y, text, color, size) {
    if (!ctx || !text) return;
    ctx.fillStyle = color;
    ctx.font = `${size}px Tahoma`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
}

// ═══════════════════════════════════════════
//              Show Text Input
// ═══════════════════════════════════════════
function showTextInput(nx, ny) {
    if (!canDrawWhiteboard()) return;
    if (pendingTextInput) {
        pendingTextInput.remove();
        pendingTextInput = null;
    }

    const r = canvas.getBoundingClientRect();
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'متن...';
    input.style.cssText = `position:absolute;left:${nx * r.width}px;top:${ny * r.height}px;background:rgba(255,255,255,0.95);border:2px solid #e94560;padding:5px 10px;font-size:16pt;font-family:Tahoma;z-index:100;min-width:200px;border-radius:4px;outline:none;`;
    canvas.parentElement.appendChild(input);
    input.focus();
    pendingTextInput = input;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (text) {
                drawText(nx * canvas.width, ny * canvas.height, text, currentColor, currentBrushSize * 8);
                sendWhiteboard({
                    type: 'text', x: nx, y: ny, text, color: currentColor,
                    size: currentBrushSize, author: userName
                });
            }
            input.remove();
            pendingTextInput = null;
        } else if (e.key === 'Escape') {
            input.remove();
            pendingTextInput = null;
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (pendingTextInput === input) {
                input.remove();
                pendingTextInput = null;
            }
        }, 200);
    });
}

// ═══════════════════════════════════════════
//              Tools
// ═══════════════════════════════════════════
function setColor(color, el) {
    currentColor = color;
    if (currentTool !== 'pen') {
        setTool('pen');
    }
    document.querySelectorAll('.wb-color').forEach(e => e.classList.remove('active'));
    if (el) el.classList.add('active');
}

function setBrushSize(size) {
    currentBrushSize = parseInt(size);
    const label = document.getElementById('brushSizeLabel');
    if (label) label.textContent = size;
}

function setTool(tool) {
    currentTool = tool;
    ['pen', 'eraser', 'text'].forEach(t => {
        const btn = document.getElementById('tool' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle('active', t === tool);
    });
    if (canvas) canvas.style.cursor = tool === 'text' ? 'text' : 'crosshair';
}

function clearWhiteboard() {
    if (!canDrawWhiteboard() || !ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sendWhiteboard({ type: 'clear', author: userName });
    whiteboardHistory = [];
    addSystemMessage('🗑️ تخته پاک شد');
}

// ═══════════════════════════════════════════
//              Permissions
// ═══════════════════════════════════════════
function canViewWhiteboard() {
    if (userRole === 'teacher') return true;
    if (wbPermissions.viewMode === 'all') return true;
    if (wbPermissions.viewMode === 'teacher') return false;
    if (wbPermissions.viewMode === 'selected') return wbPermissions.viewers.includes(userId);
    return false;
}

function canDrawWhiteboard() {
    if (userRole === 'teacher') return true;
    if (wbPermissions.drawMode === 'all') return true;
    if (wbPermissions.drawMode === 'teacher') return false;
    if (wbPermissions.drawMode === 'selected') return wbPermissions.drawers.includes(userId);
    return false;
}

function applyWBPermissions() {
    const canView = canViewWhiteboard();
    const canDraw = canDrawWhiteboard();

    if (!canView && currentMode === 'whiteboard') {
        const msg = document.getElementById('noAccessMsg');
        if (msg) msg.style.display = 'block';
        return;
    } else {
        const msg = document.getElementById('noAccessMsg');
        if (msg) msg.style.display = 'none';
    }

    if (canvas) {
        if (canDraw) {
            canvas.style.pointerEvents = 'auto';
            canvas.style.cursor = 'crosshair';
            canvas.style.opacity = '1';
        } else {
            canvas.style.pointerEvents = 'none';
            canvas.style.cursor = 'not-allowed';
            canvas.style.opacity = '0.75';
        }
    }

    const toolsBar = document.getElementById('wbToolsBar');
    if (toolsBar && userRole !== 'teacher') {
        toolsBar.style.opacity = canDraw ? '1' : '0.4';
        toolsBar.style.pointerEvents = canDraw ? 'auto' : 'none';
    }
}

// ═══════════════════════════════════════════
//              Network
// ═══════════════════════════════════════════
function sendWhiteboard(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'whiteboard', data }));
    }
}

function handleWhiteboard(data) {
    if (!data) return;

    if (data.type !== 'clear') {
        whiteboardHistory.push(data);
        if (whiteboardHistory.length > 5000) whiteboardHistory.shift();
    } else {
        whiteboardHistory = [];
    }

    if (currentMode !== 'whiteboard' || !ctx) return;
    if (!canViewWhiteboard()) return;

    if (data.type === 'draw') {
        drawLine(
            data.fromX * canvas.width, data.fromY * canvas.height,
            data.toX * canvas.width, data.toY * canvas.height,
            data.color, data.size, data.tool
        );
    } else if (data.type === 'text') {
        drawText(data.x * canvas.width, data.y * canvas.height, data.text, data.color, data.size * 8);
    } else if (data.type === 'clear') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function replayHistory() {
    if (!ctx || !whiteboardHistory.length) return;
    whiteboardHistory.forEach(data => {
        if (data.type === 'draw') {
            drawLine(
                data.fromX * canvas.width, data.fromY * canvas.height,
                data.toX * canvas.width, data.toY * canvas.height,
                data.color, data.size, data.tool
            );
        } else if (data.type === 'text') {
            drawText(data.x * canvas.width, data.y * canvas.height, data.text, data.color, data.size * 8);
        } else if (data.type === 'clear') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    });
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ whiteboard.js loaded');