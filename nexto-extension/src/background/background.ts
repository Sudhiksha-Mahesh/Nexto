const LOG_PREFIX = '[Nexto]';

function log(...args: unknown[]): void {
  console.log(LOG_PREFIX, ...args);
}

log('Service worker initialized');

chrome.runtime.onInstalled.addListener((details) => {
  log('onInstalled', details.reason, details.previousVersion ?? '');
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  log('tabs.onActivated', { tabId: activeInfo.tabId, windowId: activeInfo.windowId });
});

chrome.idle.onStateChanged.addListener((newState) => {
  log('idle.onStateChanged', newState);
});

chrome.commands.onCommand.addListener((command) => {
  log('commands.onCommand', command);
  if (command === 'add_task') {
    // Future: open action popup, side panel, or inject quick-add UI.
    log('add_task shortcut — hook quick-add flow here');
  }
});
