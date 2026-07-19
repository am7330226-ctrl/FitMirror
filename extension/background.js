chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SELECT_PRODUCT") {
    console.log("Product selected:", message.imageUrl);
    chrome.storage.local.set({ selectedGarmentUrl: message.imageUrl }, () => {
      chrome.runtime.sendMessage({ action: "UPDATE_GARMENT", imageUrl: message.imageUrl }).catch(() => {});
    });
  }
});
