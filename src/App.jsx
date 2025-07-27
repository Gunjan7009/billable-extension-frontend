import React, { useState, useEffect } from 'react';
import {
  Clock, Mail, DollarSign, Calendar, User, Settings, BarChart3, FileText, Plus
} from 'lucide-react';

function App() {
  const [entries, setEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const response = await fetch('http://localhost:3001/entries');
        const data = await response.json();

        if (data.success && Array.isArray(data.entries)) {
          const mappedEntries = data.entries.map(entry => ({
            id: entry._id,
            client: entry.recipient || '',
            description: entry.summary || entry.subject || '',
            hours: entry.timeSpent ? (entry.timeSpent / 3600000) : 0, // fallback
            rate: 350,
            date: entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : '',
            status: 'logged', // default for now
            source: 'email',
            subject: entry.subject,
            content: entry.content
          }));

          setEntries(mappedEntries);
        }
      } catch (error) {
        console.error('Failed to fetch billable entries:', error);
      }
    }

    fetchEntries();
  }, []);

  const todayDate = new Date().toISOString().split('T')[0];
  const totalHoursToday = entries
    .filter(entry => entry.date === todayDate)
    .reduce((sum, entry) => sum + entry.hours, 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const totalRevenueWeek = entries
    .filter(entry => new Date(entry.date) >= weekStart)
    .reduce((sum, entry) => sum + entry.hours * entry.rate, 0);

  const pendingEntries = entries.filter(entry => entry.status === 'draft').length;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚖️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Legal Billables AI</h1>
                <p className="text-sm text-gray-500">AI-powered time tracking for legal professionals</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Today</p>
                <p className="text-2xl font-bold text-gray-900">{totalHoursToday.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Week Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenueWeek.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Entries</p>
                <p className="text-2xl font-bold text-gray-900">{pendingEntries}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rate</p>
                <p className="text-2xl font-bold text-gray-900">$350</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Entries */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Billable Entries</h2>
                  <button 
                    onClick={() => setShowAddEntry(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Entry
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">{entry.client}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.source === 'email' ? 'bg-green-100 text-green-800' :
                            entry.source === 'call' ? 'bg-blue-100 text-blue-800' :
                            entry.source === 'meeting' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.source === 'email' && <Mail className="w-3 h-3 mr-1" />}
                            {entry.source}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.status === 'logged' ? 'bg-green-100 text-green-800' :
                            entry.status === 'billed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{entry.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {entry.hours} hrs
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${entry.rate}/hr
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${(entry.hours * entry.rate).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Sync Gmail</p>
                      <p className="text-sm text-gray-500">Import recent email entries</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Generate Report</p>
                      <p className="text-sm text-gray-500">Weekly billing summary</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Setup Integration</p>
                      <p className="text-sm text-gray-500">Connect PracticePanther</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Chrome Extension Status */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chrome Extension</h3>
              <p className="text-sm text-gray-600 mb-4">
                Install our Chrome extension to automatically track email time in Gmail.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Active & Tracking</span>
              </div>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View extension settings →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Manual Entry</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client/Case</label>
                <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select client...</option>
                  <option value="johnson">Johnson Corp</option>
                  <option value="williams">Williams Estate</option>
                  <option value="abc">ABC Manufacturing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the work performed..."
            ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="350"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;