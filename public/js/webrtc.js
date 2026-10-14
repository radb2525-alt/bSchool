// ═══════════════════════════════════════════
//              WebRTC Management
//              v3.5
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//              Create Peer Connection
// ═══════════════════════════════════════════
async function createPeerConnection(peerId, peerName) {
    if (peerConnections[peerId]) return peerConnections[peerId];

    console.log(`🔄 Creating peer connection with ${peerName}`);

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections[peerId] = pc;
    pendingCandidates[peerId] = [];

    // ═══ اضافه کردن tracks خودمون ═══
    if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // ═══ دریافت tracks طرف مقابل ═══
    pc.ontrack = (event) => {
        if (!remoteStreams[peerId]) remoteStreams[peerId] = new MediaStream();
        event.streams[0].getTracks().forEach(t => remoteStreams[peerId].addTrack(t));
        showRemoteVideo(peerId, remoteNames[peerId] || peerName, remoteStreams[peerId]);
    };

    // ═══ ارسال ICE Candidate ═══
    pc.onicecandidate = (e) => {
        if (e.candidate) {
            sendSignal(peerId, { type: 'ice-candidate', candidate: e.candidate });
        }
    };

    // ═══ وضعیت اتصال ═══
    pc.onconnectionstatechange = () => {
        console.log(`Connection ${peerName}: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            removePeerConnection(peerId);
        }
    };

    // ═══ تعیین نقش — کی Offer بده؟ ═══
    const myNum = parseFloat(userId.split('_').pop()) || 0;
    const peerNum = parseFloat(String(peerId).split('_').pop()) || 0;

    if (myNum > peerNum) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(peerId, { type: 'offer', sdp: pc.localDescription });
        } catch (e) {
            console.error('Offer error:', e);
        }
    }

    return pc;
}

// ═══════════════════════════════════════════
//              Remove Peer Connection
// ═══════════════════════════════════════════
function removePeerConnection(peerId) {
    if (peerConnections[peerId]) {
        peerConnections[peerId].close();
        delete peerConnections[peerId];
    }
    if (remoteStreams[peerId]) {
        remoteStreams[peerId].getTracks().forEach(t => t.stop());
        delete remoteStreams[peerId];
    }
    delete pendingCandidates[peerId];

    const c = document.getElementById(`video_${peerId}`);
    if (c) c.remove();
}

// ═══════════════════════════════════════════
//              Send Signal
// ═══════════════════════════════════════════
function sendSignal(targetId, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'signal', target: targetId, data }));
    }
}

// ═══════════════════════════════════════════
//              Handle Signal
// ═══════════════════════════════════════════
async function handleSignal(data) {
    const fromId = data.from;
    let pc = peerConnections[fromId];
    if (!pc) pc = await createPeerConnection(fromId, data.from_name);

    try {
        if (data.data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.data.sdp));

            // افزودن ICEهای معلق
            if (pendingCandidates[fromId]) {
                for (const c of pendingCandidates[fromId]) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e){}
                }
                pendingCandidates[fromId] = [];
            }

            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            sendSignal(fromId, { type: 'answer', sdp: pc.localDescription });

        } else if (data.data.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.data.sdp));

            if (pendingCandidates[fromId]) {
                for (const c of pendingCandidates[fromId]) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e){}
                }
                pendingCandidates[fromId] = [];
            }

        } else if (data.data.type === 'ice-candidate') {
            if (data.data.candidate) {
                if (!pc.remoteDescription || !pc.remoteDescription.type) {
                    pendingCandidates[fromId].push(data.data.candidate);
                } else {
                    try { await pc.addIceCandidate(new RTCIceCandidate(data.data.candidate)); } catch(e){}
                }
            }
        }
    } catch (e) {
        console.error('Signal error:', e);
    }
}

// ═══════════════════════════════════════════
//              Show Remote Video
// ═══════════════════════════════════════════
function showRemoteVideo(peerId, peerName, stream) {
    let container = document.getElementById(`video_${peerId}`);
    if (container) {
        const v = container.querySelector('video');
        if (v) v.srcObject = stream;
    } else {
        container = document.createElement('div');
        container.className = 'video-container';
        container.id = `video_${peerId}`;
        const role = remoteRoles[peerId] === 'teacher' ? '👨‍🏫' : '👤';
        const labelClass = remoteRoles[peerId] === 'teacher' ? 'user-label teacher' : 'user-label';
        container.innerHTML = `<video autoplay playsinline></video><div class="${labelClass}">${role} ${escapeHtml(peerName)}</div>`;
        container.querySelector('video').srcObject = stream;
        document.getElementById('videosGrid').appendChild(container);
    }

    // برای camera view (اگر معلم است و mode = camera)
    if (remoteRoles[peerId] === 'teacher') {
        const cv = document.getElementById('cameraViewVideo');
        if (cv) cv.srcObject = stream;
    }
}

// ═══════════════════════════════════════════
//              Highlight Hand Raised
// ═══════════════════════════════════════════
function highlightHandRaised(name) {
    document.querySelectorAll('.user-label').forEach(lbl => {
        if (lbl.textContent.includes(name)) {
            lbl.classList.add('hand-raised');
            const p = lbl.parentElement;
            if (!p.querySelector('.hand-indicator')) {
                const h = document.createElement('div');
                h.className = 'hand-indicator';
                h.textContent = '✋';
                p.appendChild(h);
            }
        }
    });
}

// ═══════════════════════════════════════════
//              Remove Hand Highlights
// ═══════════════════════════════════════════
function removeHandHighlights() {
    document.querySelectorAll('.user-label.hand-raised').forEach(l => l.classList.remove('hand-raised'));
    document.querySelectorAll('.hand-indicator').forEach(h => h.remove());
}

// ═══════════════════════════════════════════
//              Init Check
// ═══════════════════════════════════════════
console.log('✅ webrtc.js loaded');