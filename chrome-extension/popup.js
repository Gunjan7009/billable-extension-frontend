document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadStats();
  loadRecentEntries();
  setupEventListeners();
});

function setupEventListeners() {
  // Manual entry button
  document.getElementById('manual-entry').addEventListener('click', () => {
    // Open manual entry form (could be in a new tab or modal)
    chrome.tabs.create({ url: chrome.runtime.getURL('manual-entry.html') });
  });

  // Dashboard button
  document.getElementById('view-dashboard').addEventListener('click', () => {
    // Open web dashboard
    chrome.tabs.create({ url: 'http://localhost:5173' }); // Will be your web app URL
  });

  // Settings checkboxes
  document.getElementById('auto-tracking').addEventListener('change', (e) => {
    chrome.storage.sync.set({ autoTracking: e.target.checked });
  });

  document.getElementById('ai-summaries').addEventListener('change', (e) => {
    chrome.storage.sync.set({ aiSummaries: e.target.checked });
  });
}

async function loadStats() {
  try {
    // Get stored entries
    const result = await chrome.storage.local.get(['billableEntries']);
    const entries = result.billableEntries || [];
    
    // Calculate today's hours
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
    
    const todayHours = todayEntries.reduce((total, entry) => 
      total + (entry.duration / 3600000), 0
    );

    // Calculate week revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEntries = entries.filter(entry => 
      new Date(entry.timestamp) >= weekStart
    );
    
    const weekRevenue = weekEntries.reduce((total, entry) => 
      total + ((entry.duration / 3600000) * (entry.rate || 350)), 0
    );

    // Update UI
    document.getElementById('today-hours').textContent = todayHours.toFixed(1);
    document.getElementById('week-revenue').textContent = `$${weekRevenue.toLocaleString()}`;
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecentEntries() {
  try {
    const result = await chrome.storage.local.get(['billableEntries']);
    const entries = result.billableEntries || [];
    
    // Get last 5 entries
    const recentEntries = entries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    const entryList = document.getElementById('entry-list');
    
    if (recentEntries.length === 0) {
      entryList.innerHTML = '<div class="no-entries">No entries yet. Start tracking!</div>';
      return;
    }

    entryList.innerHTML = recentEntries.map(entry => `
      <div class="entry-item">
        <div class="entry-time">${(entry.duration / 3600000).toFixed(1)} hrs</div>
        <div class="entry-desc">${entry.summary || entry.subject || 'Email correspondence'}</div>
        <div class="entry-status ${entry.synced ? 'synced' : 'pending'}">
          ${entry.synced ? '✓' : '⏳'}
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading recent entries:', error);
  }
}

// Refresh data when popup opens
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.billableEntries) {
    loadStats();
    loadRecentEntries();
  }
});