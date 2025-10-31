# YT Audio Only - Bandwidth Saver Extension

A Chrome extension that hides video playback on YouTube and YouTube Music while keeping audio playing, significantly reducing bandwidth usage and data consumption.

## What is this?

This extension replaces video playback with a static thumbnail image while maintaining full audio functionality. Perfect for users who want to listen to music or podcasts without wasting bandwidth on video streams.

## How it works

The extension detects when you're on YouTube or YouTube Music and provides a toggle button to switch between video and audio-only modes. In audio-only mode:

- Video element is hidden from the page
- A high-quality thumbnail is displayed instead
- Audio continues playing normally
- All playback controls remain functional (play, pause, seek, volume, etc.)
- Significantly reduces data usage

## Installation

### From Source

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension directory
6. The extension is now installed and ready to use

## Usage

### Basic Controls

- Visit YouTube or YouTube Music
- Look for the "Audio Only" or "Video Mode" button in the top-left corner of the video player
- Click the button to toggle between audio-only and video modes
- The extension remembers your preference using localStorage

### Settings

Click the extension icon in your Chrome toolbar to access settings:

- **YouTube Settings**: Toggle title and song information display on the thumbnail
- **YouTube Music Settings**: Toggle title and song information display on the thumbnail

Settings are automatically saved and synced across your Chrome browsers.

## Default Behavior

- **Audio-only mode**: Enabled by default on both platforms
- **YouTube info display**: Enabled by default (shows title, artist, and "Data Saver Mode Active" badge)
- **YouTube Music info display**: Enabled by default (shows title, artist, and "Data Saver Mode Active" badge)
- **Settings persistence**: All preferences are saved automatically

## Features

- Works on both YouTube and YouTube Music
- Instant switching between audio and video modes
- Displays high-quality thumbnails (maxresdefault)
- Shows song title and artist information (configurable)
- Maintains full playback controls
- Automatic title detection and updates
- Smooth transitions and animations
- Persistent settings across sessions
- Minimal performance impact

## Known Issues

- **YouTube Miniplayer**: Thumbnail does not display when video is minimized (fixable but not implemented)

## Technical Details

- Uses Chrome Extension Manifest V3
- Leverages chrome.storage.sync for settings persistence
- Implements MutationObserver for dynamic content detection
- Supports YouTube's SPA navigation via history API hooks

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers supporting Manifest V3

## Privacy

This extension:
- Does not collect any user data
- Does not make external network requests (except for YouTube thumbnails)
- Stores settings locally using Chrome's storage API
- Does not track or monitor browsing activity

## License

This project is open source and available for personal and educational use.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the issues page or submit a pull request.

## Author

Created by [risuncode](https://github.com/risuncode)

## Repository

[https://github.com/risuncode/yt-ytm-audio-only-switcher](https://github.com/risuncode/yt-ytm-audio-only-switcher)
