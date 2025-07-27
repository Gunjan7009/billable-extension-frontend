# Chrome Extension Development Guide

## Loading Extension in Chrome (Developer Mode)

### Step 1: Enable Developer Mode
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" ON (top-right corner)

### Step 2: Load Unpacked Extension
1. Click "Load unpacked" button
2. Navigate to and select the `chrome-extension` folder
3. Extension will appear in your extensions list

### Step 3: Test in Gmail
1. Go to `https://mail.google.com`
2. Look for the floating timer widget (top-right)
3. Start composing an email to test time tracking

## Development Workflow

### Making Changes
1. Edit files in `chrome-extension/` folder
2. Save changes
3. Go to `chrome://extensions/`
4. Click refresh icon 🔄 next to "Legal Billables AI"
5. Test changes in Gmail

### Debugging

#### Content Script (Gmail Integration)
1. Open Gmail
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for extension-related logs

#### Popup Debugging
1. Right-click extension icon in toolbar
2. Select "Inspect popup"
3. DevTools will open for popup

#### Background Script
1. Go to `chrome://extensions/`
2. Click "Details" on Legal Billables AI
3. Click "Inspect views: background page"

### Common Issues & Solutions

#### Extension Not Loading
- Check manifest.json syntax
- Ensure all referenced files exist
- Look for errors in chrome://extensions/

#### Timer Not Appearing in Gmail
- Refresh Gmail page
- Check console for JavaScript errors
- Verify content script permissions

#### Popup Not Working
- Check popup.html, popup.js, popup.css files
- Inspect popup for console errors
- Verify popup dimensions in manifest

## File Structure Explained

```
chrome-extension/
├── manifest.json       # Extension configuration
├── content.js         # Runs on Gmail pages
├── background.js      # Service worker (background tasks)
├── popup.html        # Extension popup UI
├── popup.js          # Popup functionality
├── popup.css         # Popup styling
├── styles.css        # Injected Gmail styles
└── icons/            # Extension icons (16, 48, 128px)
```

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Timer appears in Gmail
- [ ] Timer starts when composing email
- [ ] Timer pauses on inactivity
- [ ] Billable dialog appears on email send
- [ ] Popup shows recent entries
- [ ] Settings can be toggled
- [ ] Data persists between sessions

## Publishing to Chrome Web Store

1. Build production version
2. Create developer account
3. Upload extension package
4. Complete store listing
5. Submit for review

Note: This is currently in development mode only.