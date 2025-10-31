(function () {
  // State management
  let isAudioOnlyMode = localStorage.getItem('ytmusic-audio-only') !== 'false';
  let toggleButton = null;
  let isInitialized = false;
  let lastUrl = window.location.href;
  let showInfoYouTube = true;   // Default: enabled for YouTube
  let showInfoYTMusic = true;   // Default: enabled for YouTube Music
  
  // Load settings from storage
  chrome.storage.sync.get({
    'youtube-show-info': true,
    'ytmusic-show-info': true
  }, (items) => {
    showInfoYouTube = items['youtube-show-info'];
    showInfoYTMusic = items['ytmusic-show-info'];
  });
  
  // Add CSS to prevent initial flickering
  const style = document.createElement('style');
  style.textContent = `
    #song-video, #movie_player, #player, .html5-video-player {
      transition: opacity 0.3s ease !important;
    }
    .ytmusic-audio-extension-loading {
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
  
  function hasActualVideo() {
    // Check if there's an actual video element (not just thumbnail)
    const video = document.querySelector('video');
    if (!video) return false;
    
    // For regular YouTube, always return true if video element exists
    if (window.location.hostname.includes('youtube.com') && !window.location.hostname.includes('music')) {
      return true; // YouTube always has video
    }
    
    // For YouTube Music, check if it's a music video (has video dimensions)
    if (window.location.hostname.includes('music.youtube.com')) {
      const songVideo = document.getElementById('song-video');
      
      // If song-video container exists, check if it has actual video
      if (songVideo) {
        const videoInContainer = songVideo.querySelector('video');
        if (videoInContainer) {
          // Check if video has dimensions (music video) or is just audio (thumbnail-only)
          // Give it a moment to load dimensions
          if (videoInContainer.videoWidth > 0 && videoInContainer.videoHeight > 0) {
            return true; // Has video dimensions
          }
          // If dimensions not loaded yet, check if video element has src
          if (videoInContainer.src || videoInContainer.currentSrc) {
            return true; // Assume it's a video if it has source
          }
        }
      }
      
      // Fallback: if video element exists but no dimensions yet, return false for YTM
      return false;
    }
    
    return false;
  }
  
  function createToggleButton() {
    if (toggleButton) return;
    
    // Don't create button if no actual video
    if (!hasActualVideo()) {
      console.log('No video detected, skipping toggle button creation');
      return;
    }
    
    // Support both YouTube Music and regular YouTube
    let videoContainer;
    
    // YouTube Music selectors
    if (window.location.hostname.includes('music.youtube.com')) {
      videoContainer = document.getElementById('song-video') || 
                      document.querySelector('.ytmusic-player-page #player');
    } 
    // Regular YouTube selectors  
    else if (window.location.hostname.includes('youtube.com')) {
      // Try different container approaches for YouTube
      videoContainer = document.getElementById('movie_player') ||
                      document.querySelector('#player') ||
                      document.querySelector('.html5-video-player') ||
                      document.querySelector('#ytd-player .video-stream')?.parentElement;
    }
    
    if (!videoContainer) return;
    
    toggleButton = document.createElement('div');
    toggleButton.id = 'ytmusic-audio-toggle';
    toggleButton.title = 'YT Audio Only Extension - Works on YouTube & YouTube Music - Saves bandwidth';
    toggleButton.innerHTML = `🎵 ${isAudioOnlyMode ? 'Audio Only' : 'Video Mode'}`;
    
    // Check if in theater/miniplayer mode and adjust position
    const isTheaterMode = videoContainer.classList.contains('ytp-player-minimized') || 
                         document.querySelector('.ytp-player-minimized') ||
                         videoContainer.classList.contains('ytp-miniplayer-active');
    const leftPosition = isTheaterMode ? '80px' : '10px';
    
    toggleButton.style.cssText = `
      position: absolute; top: 10px; left: ${leftPosition}; z-index: 99999;
      background: rgba(0, 0, 0, 0.8); color: white;
      border: 2px solid ${isAudioOnlyMode ? '#ff6b6b' : '#4ecdc4'};
      border-radius: 20px; padding: 6px 12px; cursor: pointer;
      font-size: 11px; font-weight: 500; transition: all 0.3s ease;
      backdrop-filter: blur(10px); user-select: none;
      pointer-events: auto;
    `;
    
    toggleButton.addEventListener('mouseenter', () => {
      toggleButton.style.transform = 'scale(1.05)';
    });
    
    toggleButton.addEventListener('mouseleave', () => {
      toggleButton.style.transform = 'scale(1)';
    });
    
    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Toggle button clicked!', isAudioOnlyMode);
      isAudioOnlyMode = !isAudioOnlyMode;
      localStorage.setItem('ytmusic-audio-only', isAudioOnlyMode);
      updateToggleButton();
      applyVideoSettings();
    });
    
    // Ensure container has proper positioning
    const containerStyle = getComputedStyle(videoContainer);
    if (containerStyle.position === 'static') {
      videoContainer.style.position = 'relative';
    }
    
    console.log('Button added to container:', videoContainer, 'Position:', containerStyle.position);
    
    videoContainer.appendChild(toggleButton);
  }
  
  function updateToggleButton() {
    if (!toggleButton) return;
    toggleButton.innerHTML = `🎵 ${isAudioOnlyMode ? 'Audio Only' : 'Video Mode'}`;
    toggleButton.style.borderColor = isAudioOnlyMode ? '#ff6b6b' : '#4ecdc4';
  }
  
  function getVideoId() {
    // Extract video ID from current URL
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }
  
  function getThumbnailUrl(videoId, quality = 'maxresdefault') {
    // YouTube thumbnail URL format - using maxres for best quality
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }
  
  function getSongInfo() {
    let title, artist;
    
    // Platform-specific selectors
    if (window.location.hostname.includes('youtube.com') && !window.location.hostname.includes('music')) {
      // YouTube - Most accurate selector first
      title = document.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata')?.textContent ||
              document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
              document.querySelector('#title h1 yt-formatted-string')?.textContent ||
              document.querySelector('ytd-watch-metadata h1 yt-formatted-string')?.textContent ||
              'Initializing Extension, Loading titles please wait...';
      
      artist = document.querySelector('#owner #channel-name #container #text-container yt-formatted-string a')?.textContent ||
              document.querySelector('#owner-text a')?.textContent ||
              document.querySelector('.ytd-channel-name a')?.textContent ||
              document.querySelector('#upload-info #owner-name a')?.textContent || '';
    } else {
      // YouTube Music - Most accurate selectors first
      title = document.querySelector('yt-formatted-string.title.style-scope.ytmusic-player-bar')?.textContent ||
              document.querySelector('.content-info-wrapper yt-formatted-string.title')?.textContent ||
              document.querySelector('.title.style-scope.ytmusic-player-bar')?.textContent || 
              document.querySelector('ytmusic-player-bar .title')?.textContent ||
              'Initializing Extension, Loading titles please wait...';
      
      artist = document.querySelector('yt-formatted-string.byline.style-scope.ytmusic-player-bar a')?.textContent ||
              document.querySelector('.byline.style-scope.ytmusic-player-bar a')?.textContent ||
              document.querySelector('.content-info-wrapper .byline a')?.textContent ||
              document.querySelector('ytmusic-player-bar .byline a')?.textContent || '';
    }
    
    if (!artist) {
      artist = document.querySelector('#owner #channel-name #container #text-container yt-formatted-string a')?.textContent ||
              document.querySelector('#owner-text a')?.textContent ||
              document.querySelector('.ytd-channel-name a')?.textContent ||
              document.querySelector('#upload-info #owner-name a')?.textContent || '';
    }
    
    console.log('Detected title:', title, 'artist:', artist);
    return { title, artist };
  }
  
  function refreshThumbnailDisplay() {
    const thumbnailDisplay = document.getElementById('thumbnail-display');
    if (thumbnailDisplay && isAudioOnlyMode) {
      // Only refresh if title actually changed
      const currentTitle = getSongInfo().title;
      const displayedTitle = thumbnailDisplay.querySelector('div[style*="font-size: 22px"]')?.textContent;
      
      if (currentTitle !== displayedTitle && 
          !currentTitle.includes('Now Playing') &&
          currentTitle.trim() !== '') {
        // Fast fade out
        thumbnailDisplay.style.opacity = '0';
        thumbnailDisplay.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
          thumbnailDisplay.remove();
          // Re-create with updated info immediately
          applyVideoSettings();
        }, 200);
      }
    }
  }

  function applyVideoSettings() {
    // Support both YouTube Music and regular YouTube
    let videoElement;
    
    // YouTube Music selectors
    if (window.location.hostname.includes('music.youtube.com')) {
      videoElement = document.getElementById('song-video');
    } 
    // Regular YouTube selectors
    else if (window.location.hostname.includes('youtube.com')) {
      videoElement = document.getElementById('movie_player') ||
                    document.querySelector('#player') ||
                    document.querySelector('.html5-video-player');
    }
    
    if (!videoElement) return;
    
    // Skip if no actual video (thumbnail-only content)
    if (!hasActualVideo()) {
      console.log('No actual video detected, skipping audio-only mode');
      return;
    }
    
    if (isAudioOnlyMode) {
      // Simple approach: just hide video, don't mess with too much CSS
      const video = videoElement.querySelector('video') || 
                   videoElement.querySelector('.video-stream') || 
                   videoElement.querySelector('.html5-main-video');
      
      // Only hide video display - that's it!
      if (video) {
        video.style.display = 'none';
      }
      
      // Hide overlay for YouTube Music only
      if (window.location.hostname.includes('music.youtube.com')) {
        const overlay = videoElement.querySelector('.ytp-chrome-bottom');
        if (overlay) overlay.style.display = 'none';
      }
      
      // Minimal container styling
      videoElement.style.background = '#000';
      
      // Create thumbnail display if not exists
      if (!videoElement.querySelector('#thumbnail-display')) {
        const videoId = getVideoId();
        const { title, artist } = getSongInfo();
        
        const thumbnailDisplay = document.createElement('div');
        thumbnailDisplay.id = 'thumbnail-display';
        thumbnailDisplay.style.cssText = `
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          width: 100%; height: 100%; border-radius: 0;
          opacity: 0; transition: opacity 0.3s ease;
          z-index: 10;
        `;
        
        if (videoId) {
          const thumbnailUrl = getThumbnailUrl(videoId);
          const isYouTube = window.location.hostname.includes('youtube.com') && !window.location.hostname.includes('music');
          const isYTMusic = window.location.hostname.includes('music.youtube.com');
          const shouldShowInfo = (isYouTube && showInfoYouTube) || (isYTMusic && showInfoYTMusic);
          
          const infoOverlay = shouldShowInfo ? `
            <div style="position: absolute; bottom: 0; left: 0; right: 0; 
              background: linear-gradient(transparent, rgba(0,0,0,0.8)); 
              padding: 30px 20px 20px; border-radius: 0 0 15px 15px;">
              <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px; line-height: 1.4; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.8); color: white;">${title}</div>
              <div style="font-size: 16px; opacity: 0.9; margin-bottom: 15px; 
                text-shadow: 0 1px 2px rgba(0,0,0,0.8); color: white;">${artist}</div>
              <div style="font-size: 13px; opacity: 0.9; background: rgba(255,255,255,0.2); 
                padding: 6px 12px; border-radius: 20px; display: inline-block; border: 1px solid rgba(255,255,255,0.3);">
                💾 Data Saver Mode Active
              </div>
            </div>
          ` : '';
          
          thumbnailDisplay.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%; cursor: pointer;" id="thumbnail-clickable">
              <img src="${thumbnailUrl}" style="
                width: 100%; height: 100%; object-fit: cover; border-radius: 15px;
                box-shadow: 0 12px 35px rgba(0,0,0,0.7); transition: all 0.3s ease;
              " alt="Thumbnail" onerror="this.style.display='none'">
              <div style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.8);
                color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                🎵 Audio Only Mode Enabled
              </div>
              ${infoOverlay}
            </div>
          `;
          
          // Add click handler for pause/play (YouTube only)
          const clickableArea = thumbnailDisplay.querySelector('#thumbnail-clickable');
          
          if (clickableArea && window.location.hostname.includes('youtube.com')) {
            clickableArea.addEventListener('click', () => {
              const video = document.querySelector('video');
              if (video) {
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }
            });
          }
        }
        
        videoElement.appendChild(thumbnailDisplay);
        
        // Smooth fade-in after append
        setTimeout(() => {
          thumbnailDisplay.style.opacity = '1';
        }, 50);
      }
    } else {
      // Show video - simple restore
      const video = videoElement.querySelector('video') || 
                   videoElement.querySelector('.video-stream') || 
                   videoElement.querySelector('.html5-main-video');
      const thumbnailDisplay = videoElement.querySelector('#thumbnail-display');
      
      // Remove thumbnail
      if (thumbnailDisplay) thumbnailDisplay.remove();
      
      // Restore video - just reset display
      if (video) {
        video.style.display = '';
      }
      
      // Restore overlay for YouTube Music
      if (window.location.hostname.includes('music.youtube.com')) {
        const overlay = videoElement.querySelector('.ytp-chrome-bottom');
        if (overlay) overlay.style.display = '';
      }
      
      // Reset container background
      videoElement.style.background = '';
    }
  }
  
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
  
  async function initialize() {
    if (isInitialized) return;
    
    console.log('YT Audio Only Extension: Initializing on', window.location.hostname);
    
    // Wait for video container to be ready
    let containerSelector;
    if (window.location.hostname.includes('music.youtube.com')) {
      containerSelector = '#song-video';
    } else if (window.location.hostname.includes('youtube.com')) {
      containerSelector = '#movie_player, #player, .html5-video-player';
    }
    
    if (containerSelector) {
      console.log('Waiting for container:', containerSelector);
      const container = await waitForElement(containerSelector);
      
      if (container) {
        // Add loading class to prevent flickering
        container.classList.add('ytmusic-audio-extension-loading');
        
        // Additional wait for video element to be ready
        await waitForElement('video');
        
        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove loading class and apply settings
        container.classList.remove('ytmusic-audio-extension-loading');
      }
    }
    
    createToggleButton();
    applyVideoSettings();
    isInitialized = true;
  }
  
  // Run immediately
  initialize();
  
  // Debounced refresh to prevent excessive calls
  let refreshTimeout;
  function debouncedRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      refreshThumbnailDisplay();
    }, 800); // Faster response while still preventing spam
  }
  
  // Check for URL changes
  function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;
      
      // URL changed, force immediate thumbnail update
      if (isAudioOnlyMode) {
        const thumbnailDisplay = document.getElementById('thumbnail-display');
        if (thumbnailDisplay) {
          // Remove old thumbnail immediately
          thumbnailDisplay.style.opacity = '0';
          thumbnailDisplay.style.transition = 'opacity 0.1s ease';
          
          setTimeout(() => {
            thumbnailDisplay.remove();
            // Wait a bit for new page content to load
            setTimeout(() => {
              applyVideoSettings();
            }, 300);
          }, 100);
        }
      }
    }
  }
  
  // Enhanced observer for page changes and title updates
  const observer = new MutationObserver((mutations) => {
    let shouldRefresh = false;
    let shouldReinitialize = false;
    
    // Check for URL changes
    checkUrlChange();
    
    mutations.forEach((mutation) => {
      // Check if toggle button disappeared (page navigation)
      if (!document.getElementById('ytmusic-audio-toggle')) {
        shouldReinitialize = true;
        return;
      }
      
      // Check for title changes (YouTube Music + YouTube)
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // YouTube Music title changes
        if (mutation.target.matches && (
            mutation.target.matches('.title.style-scope.ytmusic-player-bar') ||
            mutation.target.matches('ytmusic-player-bar') ||
            mutation.target.closest('ytmusic-player-bar')
        )) {
          shouldRefresh = true;
        }
        // Regular YouTube title changes
        else if (mutation.target.id === 'title') {
          shouldRefresh = true;
        }
      }
    });
    
    if (shouldReinitialize) {
      toggleButton = null;
      isInitialized = false;
      setTimeout(() => initialize(), 1000); // Delay to prevent rapid re-initialization
    } else if (shouldRefresh) {
      debouncedRefresh();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for navigation events (YouTube uses pushState for navigation)
  window.addEventListener('popstate', () => {
    console.log('popstate event detected');
    checkUrlChange();
  });
  
  // Override pushState to detect YouTube navigation
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    console.log('pushState detected');
    checkUrlChange();
  };
  
  // Override replaceState as well
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    console.log('replaceState detected');
    checkUrlChange();
  };
  
  // Single delayed initialization only
  setTimeout(initialize, 1000);
  
  // Minimal refresh for title detection
  setTimeout(() => {
    if (isAudioOnlyMode) {
      const currentTitle = getSongInfo().title;
      if (currentTitle.includes('Initializing Extension')) {
        refreshThumbnailDisplay();
      }
    }
  }, 2000);
  
  // Listen for settings updates from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
      if (request.platform === 'youtube') {
        showInfoYouTube = request.showInfo;
      } else if (request.platform === 'ytmusic') {
        showInfoYTMusic = request.showInfo;
      }
      
      // Force instant refresh if in audio-only mode
      if (isAudioOnlyMode) {
        const thumbnailDisplay = document.getElementById('thumbnail-display');
        if (thumbnailDisplay) {
          // Remove old display
          thumbnailDisplay.remove();
          // Immediately recreate with new settings
          applyVideoSettings();
        }
      }
      
      sendResponse({success: true});
    }
    return true; // Keep message channel open for async response
  });
})();