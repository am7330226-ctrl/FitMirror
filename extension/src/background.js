// Listen for extension icon click to open the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

// Listen for runtime messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SELECT_PRODUCT") {
    // Forward the message to the side panel if it's open
    chrome.runtime.sendMessage({
      action: "UPDATE_PRODUCT_IMAGE",
      imageUrl: request.imageUrl,
      productTitle: request.productTitle
    }).catch(() => {
      // Side panel might not be open yet, store it in local storage so it can read on load
      chrome.storage.local.set({ pendingProductImage: request.imageUrl, pendingProductTitle: request.productTitle });
      // Then open the panel
      if (sender.tab) {
        chrome.sidePanel.open({ tabId: sender.tab.id });
      }
    });
  }
});
