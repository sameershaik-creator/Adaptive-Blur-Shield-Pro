document.addEventListener("DOMContentLoaded", () => {
    console.log("Popup UI Loaded");

    // Helper function to send messages
    const sendToContent = (action, value = null) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                console.log("Sending action to tab:", action);
                chrome.tabs.sendMessage(tabs[0].id, { action, value });
            } else {
                console.error("No active tab found");
            }
        });
    };

    // UI Elements
    const autoChatToggle = document.getElementById("autoChatToggle");
    const intensitySlider = document.getElementById("opacity");

    // Load initial states
    chrome.storage.local.get(["autoChatEnabled", "blurIntensity"], (data) => {
        if (autoChatToggle) autoChatToggle.checked = data.autoChatEnabled || false;
        if (intensitySlider && data.blurIntensity) intensitySlider.value = data.blurIntensity;
    });

    // Button Listeners
    document.getElementById("selectZone").onclick = () => sendToContent("SELECT_ZONE");
    document.getElementById("blurPage").onclick = () => sendToContent("BLUR_FULL");
    document.getElementById("removeBlur").onclick = () => sendToContent("REMOVE_BLUR");

    if (autoChatToggle) {
        autoChatToggle.onchange = (e) => {
            const val = e.target.checked;
            chrome.storage.local.set({ autoChatEnabled: val });
            sendToContent("UPDATE_AUTO_CHAT", val);
        };
    }

    if (intensitySlider) {
        intensitySlider.oninput = (e) => {
            const val = parseInt(e.target.value);
            chrome.storage.local.set({ blurIntensity: val });
            sendToContent("SET_INTENSITY", val);
        };
    }
});