// Load settings
const youtubeToggle = document.getElementById('youtube-info-toggle');
const ytmusicToggle = document.getElementById('ytmusic-info-toggle');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get({
  'youtube-show-info': true,   // Default: enabled for YouTube
  'ytmusic-show-info': true    // Default: enabled for YouTube Music
}, (items) => {
  if (items['youtube-show-info']) {
    youtubeToggle.classList.add('active');
  }
  if (items['ytmusic-show-info']) {
    ytmusicToggle.classList.add('active');
  }
});

// YouTube toggle
youtubeToggle.addEventListener('click', () => {
  const isActive = youtubeToggle.classList.toggle('active');
  
  // Immediate feedback
  showStatus('Saving...');
  
  // Save to storage
  chrome.storage.sync.set({
    'youtube-show-info': isActive
  }, () => {
    showStatus('YouTube settings saved!');
    
    // Immediately notify content script (don't wait)
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          platform: 'youtube',
          showInfo: isActive
        }, (response) => {
          // Response received, update confirmed
          if (response && response.success) {
            console.log('Settings applied successfully');
          }
        });
      }
    });
  });
});

// YouTube Music toggle
ytmusicToggle.addEventListener('click', () => {
  const isActive = ytmusicToggle.classList.toggle('active');
  
  // Immediate feedback
  showStatus('Saving...');
  
  // Save to storage
  chrome.storage.sync.set({
    'ytmusic-show-info': isActive
  }, () => {
    showStatus('YouTube Music settings saved!');
    
    // Immediately notify content script (don't wait)
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          platform: 'ytmusic',
          showInfo: isActive
        }, (response) => {
          // Response received, update confirmed
          if (response && response.success) {
            console.log('Settings applied successfully');
          }
        });
      }
    });
  });
});

function showStatus(message) {
  status.textContent = message;
  status.style.background = 'rgba(78, 205, 196, 0.3)';
  setTimeout(() => {
    status.textContent = 'Settings loaded';
    status.style.background = 'rgba(0, 0, 0, 0.2)';
  }, 2000);
}
