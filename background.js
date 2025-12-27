chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "blur-now",
        title: "Activate Blur Shield",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "blur-now") {
        chrome.tabs.sendMessage(tab.id, { action: "SELECT_ZONE" });
    }
});
