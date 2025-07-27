class LegalBillablesTracker {
  constructor() {
    this.isTracking = false;
    this.startTime = null;
    this.totalTime = 0;
    this.emailContent = '';
    this.recipient = '';
    this.subject = '';
    this.lastActivity = Date.now();
    this.activityThreshold = 30000; // 30 seconds of inactivity pauses timer
    
    this.init();
  }

  init() {
    this.injectUI();
    this.attachEventListeners();
    this.startActivityMonitor();
  }

  injectUI() {
    // Create floating timer UI
    const timerWidget = document.createElement('div');
    timerWidget.id = 'legal-billables-timer';
    timerWidget.innerHTML = `
      <div class="timer-container">
        <div class="timer-display">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text">00:00:00</span>
        </div>
        <div class="timer-controls">
          <button id="start-timer" class="timer-btn start">Start</button>
          <button id="pause-timer" class="timer-btn pause" style="display:none;">Pause</button>
          <button id="reset-timer" class="timer-btn reset">Reset</button>
        </div>
      </div>
    `;
    document.body.appendChild(timerWidget);

    // Add event listeners for timer controls
    document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
    document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
    document.getElementById('reset-timer').addEventListener('click', () => this.resetTimer());
  }

  attachEventListeners() {
    // Monitor compose window
    this.observeComposeWindow();
    
    // Monitor send button
    this.observeSendButton();
  }

  observeComposeWindow() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const composeWindows = document.querySelectorAll('[role="dialog"]');
          composeWindows.forEach(window => {
            if (!window.hasAttribute('data-billables-tracked')) {
              this.setupComposeTracking(window);
              window.setAttribute('data-billables-tracked', 'true');
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupComposeTracking(composeWindow) {
    const textArea = composeWindow.querySelector('[contenteditable="true"]');
    const subjectField = composeWindow.querySelector('input[name="subjectbox"]');
  
    // Gmail "To" field emails are often in span[email] or div[role="presentation"]
    const getToEmail = () => {
      const emailSpans = composeWindow.querySelectorAll('span[email]');
      if (emailSpans.length > 0) {
        return Array.from(emailSpans).map(span => span.getAttribute('email')).join(', ');
      }
      return '';
    };
  
    if (textArea) {
      textArea.addEventListener('focus', () => {
        if (!this.isTracking) {
          this.startTimer();
        }
      });
  
      textArea.addEventListener('input', () => {
        this.lastActivity = Date.now();
        this.emailContent = textArea.innerText || textArea.textContent;
      });
  
      textArea.addEventListener('blur', () => {
        setTimeout(() => {
          if (!document.activeElement || !composeWindow.contains(document.activeElement)) {
            this.pauseTimer();
          }
        }, 100);
      });
    }
  
    // Update subject
    if (subjectField) {
      subjectField.addEventListener('input', () => {
        this.subject = subjectField.value;
        this.lastActivity = Date.now();
      });
    }
  
    // Regularly poll and update recipient
    setInterval(() => {
      const currentEmail = getToEmail();
      if (currentEmail && currentEmail !== this.recipient) {
        this.recipient = currentEmail;
      }
    }, 1000);
  }
  

  observeSendButton() {
    const observer = new MutationObserver(() => {
      const sendButtons = document.querySelectorAll('[data-tooltip="Send ‪(Ctrl+Enter)‬"], [aria-label*="Send"]');
      sendButtons.forEach(button => {
        if (!button.hasAttribute('data-billables-listener')) {
          button.addEventListener('click', () => this.handleEmailSend());
          button.setAttribute('data-billables-listener', 'true');
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  startTimer() {
    if (!this.isTracking) {
      this.isTracking = true;
      this.startTime = Date.now();
      this.updateTimerDisplay();
      
      document.getElementById('start-timer').style.display = 'none';
      document.getElementById('pause-timer').style.display = 'inline-block';
      
      this.timerInterval = setInterval(() => {
        this.updateTimerDisplay();
      }, 1000);
    }
  }

  pauseTimer() {
    if (this.isTracking) {
      this.isTracking = false;
      this.totalTime += Date.now() - this.startTime;
      clearInterval(this.timerInterval);
      
      document.getElementById('pause-timer').style.display = 'none';
      document.getElementById('start-timer').style.display = 'inline-block';
    }
  }

  resetTimer() {
    this.isTracking = false;
    this.totalTime = 0;
    this.startTime = null;
    clearInterval(this.timerInterval);
    
    document.getElementById('pause-timer').style.display = 'none';
    document.getElementById('start-timer').style.display = 'inline-block';
    
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    let currentTime = this.totalTime;
    if (this.isTracking && this.startTime) {
      currentTime += Date.now() - this.startTime;
    }
    
    const hours = Math.floor(currentTime / 3600000);
    const minutes = Math.floor((currentTime % 3600000) / 60000);
    const seconds = Math.floor((currentTime % 60000) / 1000);
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.querySelector('.timer-text').textContent = display;
  }

  startActivityMonitor() {
    setInterval(() => {
      if (this.isTracking && Date.now() - this.lastActivity > this.activityThreshold) {
        this.pauseTimer();
      }
    }, 5000);
  }

  async handleEmailSend() {
    if (this.totalTime > 0 || this.isTracking) {
      this.pauseTimer();
      
      const billableData = {
        duration: this.totalTime + (this.isTracking ? Date.now() - this.startTime : 0),
        content: this.emailContent,
        recipient: this.recipient,
        subject: this.subject,
        timestamp: new Date().toISOString()
      };

      await this.generateBillableEntry(billableData);
    }
  }

  async generateBillableEntry(data) {
    try {
      // Show processing indicator
      this.showNotification('Generating billable entry...', 'info');

      // Generate AI summary (mock for now - would use OpenAI API)
      const summary = await this.generateAISummary(data);

      // Determine hours: parse from email content or fall back to timer duration
      const parsedHours = this.parseHoursFromContent(data.content);
      const hours = parsedHours !== null ? parsedHours : (data.duration / 3600000);

      // Show billable entry dialog
      this.showBillableDialog({
        ...data,
        summary,
        hours: hours.toFixed(2)
      });

    } catch (error) {
      this.showNotification('Error generating billable entry', 'error');
      console.error('Billable generation error:', error);
    }
  }

  async generateAISummary(data) {
    // Mock AI summary - in production would call OpenAI API
    const mockSummaries = [
      `Email correspondence with ${data.recipient} regarding ${data.subject || 'client matter'}`,
      `Client communication via email discussing case details and next steps`,
      `Legal correspondence addressing client questions and providing guidance`,
      `Email exchange with client regarding case strategy and documentation`
    ];
    
    return mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
  }
  
  // Extract hours mentioned in email content, e.g., "2.5 hours" or "3 hrs"
  parseHoursFromContent(content) {
    const match = content.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    return match ? parseFloat(match[1]) : null;
  }

  showBillableDialog(entryData) {
    const dialog = document.createElement('div');
    dialog.id = 'billable-entry-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <h3>Create Billable Entry</h3>
          <div class="entry-details">
            <div class="field">
             <label>Client/Case:</label>
<input type="text" id="client-input" value="${entryData.recipient || ''}" />

            </div>
            <div class="field">
              <label>Hours:</label>
              <input type="number" id="hours-input" value="${entryData.hours}" step="0.1" min="0">
            </div>
            <div class="field">
              <label>Description:</label>
              <textarea id="description-input" rows="3">${entryData.summary}</textarea>
            </div>
            <div class="field">
              <label>Rate:</label>
              <input type="number" id="rate-input" value="350" step="50" min="0">
            </div>
            <div class="total">
              Total: $<span id="total-amount">${(entryData.hours * 350).toFixed(2)}</span>
            </div>
          </div>
          <div class="dialog-actions">
            <button id="save-entry" class="btn-primary">Log to PracticePanther</button>
            <button id="save-local" class="btn-secondary">Save Locally</button>
            <button id="cancel-entry" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    document.getElementById('save-entry').addEventListener('click', () => this.saveToPracticePanther(entryData));
    document.getElementById('save-local').addEventListener('click', () => this.saveLocally(entryData));
    document.getElementById('cancel-entry').addEventListener('click', () => this.closeBillableDialog());
    
    // Update total when rate or hours change
    const hoursInput = document.getElementById('hours-input');
    const rateInput = document.getElementById('rate-input');
    const updateTotal = () => {
      const total = (parseFloat(hoursInput.value) || 0) * (parseFloat(rateInput.value) || 0);
      document.getElementById('total-amount').textContent = total.toFixed(2);
    };
    
    hoursInput.addEventListener('input', updateTotal);
    rateInput.addEventListener('input', updateTotal);
  }

  async saveToPracticePanther(entryData) {
  try {
    console.log('▶️ saveToPracticePanther clicked', entryData);
    this.showNotification('Saving to backend...', 'info');

    const response = await fetch('http://localhost:3001/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: entryData.recipient,
        subject: entryData.subject,
        content: entryData.content,
        summary: entryData.summary,
        timeSpent: parseFloat(entryData.hours) * 3600000, // Convert hours to ms
        rate: parseFloat(document.getElementById('rate-input').value),
        status: "logged",
        source: "email"
      })
    });

    const result = await response.json();

    if (result.success) {
      this.showNotification('Successfully saved to MongoDB!', 'success');
      this.closeBillableDialog();
      this.resetTimer();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
  this.showNotification('Failed to save to MongoDB', 'error');
  console.error('❌ Backend Error:', error);

  const errorText = await error?.response?.text?.() || error.message;
  console.error('❗ Server Response:', errorText);
}
}


  async saveLocally(entryData) {
    try {
      // Save to Chrome storage
      const entries = await this.getStoredEntries();
      entries.push({
        ...entryData,
        id: Date.now(),
        saved: false
      });
      
      await chrome.storage.local.set({ billableEntries: entries });
      
      this.showNotification('Saved locally! Sync later from dashboard.', 'success');
      this.closeBillableDialog();
      this.resetTimer();
      
    } catch (error) {
      this.showNotification('Error saving locally', 'error');
    }
  }

  async getStoredEntries() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['billableEntries'], (result) => {
        resolve(result.billableEntries || []);
      });
    });
  }

  closeBillableDialog() {
    const dialog = document.getElementById('billable-entry-dialog');
    if (dialog) {
      dialog.remove();
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `billables-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LegalBillablesTracker();
  });
} else {
  new LegalBillablesTracker();
}