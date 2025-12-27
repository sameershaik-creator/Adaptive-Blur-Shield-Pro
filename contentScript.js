(function () {
    let blurOverlay = null, focusBox = null, mode = "idle";
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    let startX, startY, startRect, resizeDir;
    let currentBlurIntensity = 18;

    const style = document.createElement('style');
    style.id = "shield-stealth-styles";
    style.textContent = `
        .glass-header { background: rgba(30, 30, 30, 0.9) !important; color: white !important; border-radius: 8px 8px 0 0 !important; }
        .shield-handle { position: absolute; width: 10px; height: 10px; background: white; border: 2px solid #6366f1; border-radius: 50%; pointer-events: auto; }
        [data-testid="last-msg-status"], [data-testid="chat-subtitle"], .msg-container span, ._ak8l, .copyable-text span { 
            filter: blur(18px) !important; 
            transition: filter 0.2s ease !important;
        }
        [data-testid="cell-frame-container"]:hover [data-testid="last-msg-status"], [data-testid="cell-frame-container"]:hover [data-testid="chat-subtitle"], .message-in:hover span, .message-out:hover span, ._ak8l:hover {
            filter: blur(0px) !important;
        }
        [data-testid="conversation-info-header"], ._ak8j { filter: none !important; }
    `;
    document.head.appendChild(style);

    function cleanup() {
        if (blurOverlay) blurOverlay.remove();
        if (focusBox) focusBox.remove();
        const cap = document.getElementById("blur-capture-layer");
        if (cap) cap.remove();
        blurOverlay = null; focusBox = null; mode = "idle";
    }

    function updateBlurUI() {
        if (!blurOverlay) return;
        blurOverlay.style.backdropFilter = `blur(${currentBlurIntensity}px)`;
        if (focusBox) {
            Object.assign(focusBox.style, {
                left: rect.left + "px", top: rect.top + "px",
                width: rect.width + "px", height: rect.height + "px"
            });
            const L = rect.left, T = rect.top, R = L + rect.width, B = T + rect.height;
            blurOverlay.style.clipPath = `polygon(0% 0%, 0% 100%, ${L}px 100%, ${L}px ${T}px, ${R}px ${T}px, ${R}px ${B}px, ${L}px ${B}px, ${L}px 100%, 100% 100%, 100% 0%)`;
        }
    }

    function createFocusBox(x, y) {
        focusBox = document.createElement("div");
        focusBox.style.cssText = "position:fixed; border:2px solid #6366f1; z-index:2147483645; border-radius:8px; pointer-events:none;";
        const header = document.createElement("div");
        header.className = "glass-header";
        Object.assign(header.style, {
            position: "absolute", top: "-34px", left: "-2px", right: "-2px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", cursor: "grab", pointerEvents: "auto"
        });
        header.innerHTML = `<span style="font-size:10px; font-family:sans-serif; font-weight:bold;"> ↔ DRAG TO MOVE</span>`;
        const closeBtn = document.createElement("div");
        closeBtn.innerText = "✕";
        Object.assign(closeBtn.style, { cursor: "pointer", background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" });
        closeBtn.onclick = cleanup;
        header.onmousedown = (e) => { if (e.target === closeBtn) return; mode = "moving"; startX = e.clientX; startY = e.clientY; startRect = { ...rect }; };
        ["nw", "ne", "sw", "se"].forEach(dir => {
            const h = document.createElement("div");
            h.className = "shield-handle";
            h.style.cursor = `${dir}-resize`;
            if (dir.includes("n")) h.style.top = "-6px"; else h.style.bottom = "-6px";
            if (dir.includes("w")) h.style.left = "-6px"; else h.style.right = "-6px";
            h.onmousedown = (e) => { e.stopPropagation(); e.preventDefault(); mode = "resizing"; resizeDir = dir; startX = e.clientX; startY = e.clientY; startRect = { ...rect }; };
            focusBox.appendChild(h);
        });
        header.appendChild(closeBtn);
        focusBox.appendChild(header);
        document.body.appendChild(focusBox);
    }

    window.onmousemove = (e) => {
        if (mode === "idle") return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (mode === "selecting") {
            rect.left = Math.min(e.clientX, startX); rect.top = Math.min(e.clientY, startY);
            rect.width = Math.abs(e.clientX - startX); rect.height = Math.abs(e.clientY - startY);
        } else if (mode === "moving") {
            rect.left = startRect.left + dx; rect.top = startRect.top + dy;
        } else if (mode === "resizing") {
            if (resizeDir.includes("e")) rect.width = Math.max(50, startRect.width + dx);
            if (resizeDir.includes("s")) rect.height = Math.max(50, startRect.height + dy);
            if (resizeDir.includes("w")) { rect.left = startRect.left + dx; rect.width = Math.max(50, startRect.width - dx); }
            if (resizeDir.includes("n")) { rect.top = startRect.top + dy; rect.height = Math.max(50, startRect.height - dy); }
        }
        updateBlurUI();
    };

    window.onmouseup = () => mode = "idle";

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === "SELECT_ZONE") {
            cleanup();
            blurOverlay = document.createElement("div");
            Object.assign(blurOverlay.style, { position: "fixed", inset: 0, zIndex: "2147483640", pointerEvents: "none", background: "rgba(0,0,0,0.15)" });
            document.body.appendChild(blurOverlay);
            const cap = document.createElement("div");
            cap.id = "blur-capture-layer";
            Object.assign(cap.style, { position: "fixed", inset: 0, zIndex: "2147483641", cursor: "crosshair", background: "rgba(0,0,0,0.2)" });
            document.body.appendChild(cap);
            cap.onmousedown = (e) => { startX = e.clientX; startY = e.clientY; mode = "selecting"; createFocusBox(startX, startY); cap.remove(); };
        }
        if (msg.action === "BLUR_FULL") {
            cleanup();
            blurOverlay = document.createElement("div");
            Object.assign(blurOverlay.style, { position: "fixed", inset: 0, zIndex: "2147483640", pointerEvents: "none" });
            document.body.appendChild(blurOverlay);
            updateBlurUI();
        }
        if (msg.action === "REMOVE_BLUR") cleanup();
        if (msg.action === "SET_INTENSITY") { currentBlurIntensity = msg.value; updateBlurUI(); }
        if (msg.action === "UPDATE_AUTO_CHAT") toggleAutoBlur(msg.value);
    });

    function toggleAutoBlur(isEnabled) {
        const existingStyle = document.getElementById("shield-stealth-styles");
        if (!isEnabled) { if (existingStyle) existingStyle.remove(); return; }
        if (!existingStyle) document.head.appendChild(style);
    }

    chrome.storage.local.get(["autoChatEnabled"], (data) => {
        toggleAutoBlur(data.autoChatEnabled);
    });
})();