
chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        if (request.name === "start_game") {
            chrome.tabs.sendMessage(request.tab_id, { name: "start_engine", tab_id: request.tab_id, level: 0 });
            chrome.action.setIcon({ tabId: request.tab_id, path: { '16': '/icons/icon-active-16.png', '32': '/icons/icon-active-32.png', '48': '/icons/icon-active-48.png', '128': '/icons/icon-active-128.png' } });
        } else if (request.name === "change_level") {
            function on_update(tab_id, change_info, tab) {
                if (tab_id === sender.tab.id && change_info.status === "complete" && change_info.url !== "") {
                    chrome.tabs.sendMessage(tab_id, { name: "start_engine", tab_id: tab_id, level: 0 });
                    // Won't restart engine if user refreshes webpage. This is on purpose.
                    chrome.tabs.onUpdated.removeListener(on_update);
                    chrome.action.setIcon({ tabId: tab_id, path: { '16': '/icons/icon-active-16.png', '32': '/icons/icon-active-32.png', '48': '/icons/icon-active-48.png', '128': '/icons/icon-active-128.png' } });
                }
            };
            chrome.tabs.onUpdated.addListener(on_update);
        }
    }
);
