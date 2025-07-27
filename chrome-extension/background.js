chrome.runtime.onInstalled.addListener(() => {
  console.log('Legal Billables AI extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    autoTracking: true,
    aiSummaries: true,
    defaultRate: 350
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSummary') {
    generateAISummary(request.data)
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'saveToPracticePanther') {
    saveToPracticePanther(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function generateAISummary(emailData) {
  const response = await fetch("http://localhost:3001/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipient: emailData.recipient,
      subject: emailData.subject,
      content: emailData.content
    })
  });

  if (!response.ok) {
    throw new Error("Failed to get summary");
  }

  const data = await response.json();
  const rawSummary = data.summary;

  // === Clean up the summary ===
  const cleanedSummary = cleanSummary(rawSummary);

  return cleanedSummary;
}

function cleanSummary(summary) {
  // Remove generic prefixes if present
  return summary
    .replace(/^\[.*?\]\s*\|\s*/g, "")                    // Remove [Client] | or similar
    .replace(/Professional Legal Billable Summary for.*?:?/gi, "") // Remove title lines
    .replace(/^Email Date\s*[:|-]?\s*/gi, "")             // Remove "Email Date"
    .replace(/^\s+|\s+$/g, "")                            // Trim leading/trailing whitespace
    .replace(/\n+/g, " ")                                 // Collapse multiple newlines
    .trim();
}

async function saveToPracticePanther(billableData) {
  try {
    const response = await fetch('http://localhost:3001/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: billableData.recipient,
        subject: billableData.subject,
        content: billableData.content,
        summary: billableData.summary,
        timeSpent: billableData.duration, // duration expected in ms
        source: 'email',
        status: 'logged',
        rate: billableData.rate || 350
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server responded with ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (err) {
    console.error('❌ Failed to save entry:', err);
    throw err;
  }
}


// Badge to show number of unsaved entries
chrome.storage.local.get(['billableEntries'], (result) => {
  const entries = result.billableEntries || [];
  const unsavedCount = entries.filter(entry => !entry.synced).length;
  
  if (unsavedCount > 0) {
    chrome.action.setBadgeText({ text: unsavedCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  }
});