/* eslint-disable no-undef */

/**
 * Group View Page - Full page view for a single tab group
 */

// Get group ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');

let currentGroup = null;

// Load and display the group
async function loadGroup() {
  if (!groupId) {
    showError();
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'get_all_groups'
    });

    if (response?.success) {
      currentGroup = response.groups.find(g => g.id === groupId);
      
      if (currentGroup) {
        displayGroup(currentGroup);
      } else {
        showError();
      }
    } else {
      showError();
    }
  } catch (error) {
    console.error('Error loading group:', error);
    showError();
  }
}

// Display the group information and tabs
function displayGroup(group) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';

  // Set group info
  document.getElementById('groupName').textContent = group.name;
  document.getElementById('tabCount').textContent = 
    `${group.tabs.length} tab${group.tabs.length !== 1 ? 's' : ''}`;
  document.getElementById('timestamp').textContent = 
    new Date(group.timestamp).toLocaleString();

  // Display tabs
  const tabsList = document.getElementById('tabsList');
  tabsList.innerHTML = '';

  group.tabs.forEach(tab => {
    const tabItem = createTabItem(tab);
    tabsList.appendChild(tabItem);
  });

  // Set up action buttons
  document.getElementById('restoreAllBtn').addEventListener('click', restoreAllTabs);
  document.getElementById('restoreAndDeleteBtn').addEventListener('click', restoreAndDelete);
  document.getElementById('backBtn').addEventListener('click', () => window.close());
}

// Create a tab item element
function createTabItem(tab) {
  const div = document.createElement('div');
  div.className = 'tab-item';
  
  // Get favicon
  const faviconUrl = tab.favIconUrl || getFaviconUrl(tab.url);
  
  div.innerHTML = `
    ${faviconUrl ? `<img src="${faviconUrl}" class="tab-favicon" onerror="this.style.display='none'" alt="">` : ''}
    <div class="tab-content">
      <div class="tab-title">${escapeHtml(tab.title)}</div>
      <div class="tab-url">${escapeHtml(tab.url)}</div>
    </div>
  `;
  
  // Click to open individual tab
  div.addEventListener('click', () => {
    chrome.tabs.create({ url: tab.url });
  });
  
  return div;
}

// Get favicon URL using Google's service
function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return null;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Restore all tabs from the group
async function restoreAllTabs() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'restore_tab_group',
      groupId: groupId,
      deleteAfterRestore: false
    });

    if (response?.success) {
      alert('All tabs opened successfully!');
    } else {
      alert('Failed to open tabs: ' + (response?.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error restoring tabs:', error);
    alert('Failed to open tabs');
  }
}

// Restore all tabs and delete the group
async function restoreAndDelete() {
  if (!confirm(`Open all tabs and delete "${currentGroup.name}"?`)) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'restore_tab_group',
      groupId: groupId,
      deleteAfterRestore: true
    });

    if (response?.success) {
      alert('Tabs opened and group deleted!');
      window.close();
    } else {
      alert('Failed: ' + (response?.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to complete operation');
  }
}

// Show error state
function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadGroup);
