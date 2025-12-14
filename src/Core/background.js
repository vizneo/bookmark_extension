/* eslint-disable no-undef */

/**
 * Background service worker for bookmark extension
 * Handles all Chrome API interactions and storage operations
 */

// Storage utility functions (inline to avoid import issues in service worker)
const STORAGE_KEY = 'tabGroups';

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getAllGroups = async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
};

const saveGroups = async (groups) => {
  await chrome.storage.local.set({ [STORAGE_KEY]: groups });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations
  (async () => {
    try {
      // Save tab group to storage
      if (request.action === "save_tab_group") {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const groups = await getAllGroups();
        
        const newGroup = {
          id: generateId(),
          name: request.name || `Session ${new Date().toLocaleString()}`,
          timestamp: Date.now(),
          tabs: tabs.map(tab => ({
            id: generateId(),
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl || null
          }))
        };
        
        groups.unshift(newGroup);
        await saveGroups(groups);
        
        // Close tabs if requested
        if (request.closeTabs) {
          const tabIds = tabs.map(tab => tab.id);
          await chrome.tabs.remove(tabIds);
        }
        
        sendResponse({ success: true, group: newGroup });
      }
      
      // Get all groups
      else if (request.action === "get_all_groups") {
        const groups = await getAllGroups();
        sendResponse({ success: true, groups: groups });
      }
      
      // Restore entire tab group
      else if (request.action === "restore_tab_group") {
        const groups = await getAllGroups();
        const group = groups.find(g => g.id === request.groupId);
        
        if (!group) {
          sendResponse({ success: false, error: "Group not found" });
          return;
        }
        
        const urls = group.tabs.map(tab => tab.url);
        const newWindow = await chrome.windows.create({ url: urls });
        
        // Delete group if requested
        if (request.deleteAfterRestore) {
          const filteredGroups = groups.filter(g => g.id !== request.groupId);
          await saveGroups(filteredGroups);
        }
        
        sendResponse({ success: true, windowId: newWindow.id });
      }
      
      // Restore single tab
      else if (request.action === "restore_single_tab") {
        const groups = await getAllGroups();
        const group = groups.find(g => g.id === request.groupId);
        
        if (!group) {
          sendResponse({ success: false, error: "Group not found" });
          return;
        }
        
        const tab = group.tabs.find(t => t.id === request.tabId);
        if (!tab) {
          sendResponse({ success: false, error: "Tab not found" });
          return;
        }
        
        const newTab = await chrome.tabs.create({ url: tab.url });
        sendResponse({ success: true, tabId: newTab.id });
      }
      
      // Delete tab group
      else if (request.action === "delete_tab_group") {
        const groups = await getAllGroups();
        const filteredGroups = groups.filter(g => g.id !== request.groupId);
        await saveGroups(filteredGroups);
        sendResponse({ success: true });
      }
      
      // Delete single tab from group
      else if (request.action === "delete_single_tab") {
        const groups = await getAllGroups();
        const groupIndex = groups.findIndex(g => g.id === request.groupId);
        
        if (groupIndex === -1) {
          sendResponse({ success: false, error: "Group not found" });
          return;
        }
        
        groups[groupIndex].tabs = groups[groupIndex].tabs.filter(t => t.id !== request.tabId);
        
        // Remove group if empty
        if (groups[groupIndex].tabs.length === 0) {
          groups.splice(groupIndex, 1);
        }
        
        await saveGroups(groups);
        sendResponse({ success: true });
      }
      
      // Update group name
      else if (request.action === "update_group_name") {
        const groups = await getAllGroups();
        const group = groups.find(g => g.id === request.groupId);
        
        if (!group) {
          sendResponse({ success: false, error: "Group not found" });
          return;
        }
        
        group.name = request.newName;
        await saveGroups(groups);
        sendResponse({ success: true, group: group });
      }
      
      // Export group as JSON file
      else if (request.action === "export_group") {
        const groups = await getAllGroups();
        const group = groups.find(g => g.id === request.groupId);
        
        if (!group) {
          sendResponse({ success: false, error: "Group not found" });
          return;
        }
        
        const blob = new Blob([JSON.stringify(group, null, 2)], {
          type: "application/json",
        });
        const reader = new FileReader();
        
        reader.onloadend = function () {
          const fileName = `${group.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
          const base64Data = reader.result.split(",")[1];
          chrome.downloads.download({
            url: `data:application/json;base64,${base64Data}`,
            filename: fileName,
            saveAs: true,
          });
          sendResponse({ success: true });
        };
        
        reader.readAsDataURL(blob);
        return true; // Keep channel open for async FileReader
      }
      
      // Export all groups
      else if (request.action === "export_all_groups") {
        const groups = await getAllGroups();
        
        const blob = new Blob([JSON.stringify(groups, null, 2)], {
          type: "application/json",
        });
        const reader = new FileReader();
        
        reader.onloadend = function () {
          const fileName = `all_groups_${Date.now()}.json`;
          const base64Data = reader.result.split(",")[1];
          chrome.downloads.download({
            url: `data:application/json;base64,${base64Data}`,
            filename: fileName,
            saveAs: true,
          });
          sendResponse({ success: true });
        };
        
        reader.readAsDataURL(blob);
        return true; // Keep channel open for async FileReader
      }
      
      // Import groups from JSON
      else if (request.action === "import_groups") {
        let groups = request.mergeWithExisting ? await getAllGroups() : [];
        const importedData = request.data;
        const importedGroups = Array.isArray(importedData) ? importedData : [importedData];
        
        importedGroups.forEach(item => {
          // Handle old format (array of tabs)
          if (item.url && item.title) {
            const existingImportGroup = groups.find(g => g.name === 'Imported Session');
            if (existingImportGroup) {
              existingImportGroup.tabs.push({
                id: generateId(),
                title: item.title,
                url: item.url,
                favIconUrl: item.favIconUrl || null
              });
            } else {
              groups.push({
                id: generateId(),
                name: 'Imported Session',
                timestamp: Date.now(),
                tabs: [{
                  id: generateId(),
                  title: item.title,
                  url: item.url,
                  favIconUrl: item.favIconUrl || null
                }]
              });
            }
          } else if (item.tabs && Array.isArray(item.tabs)) {
            // Already in group format
            groups.push({
              id: item.id || generateId(),
              name: item.name || `Imported ${new Date().toLocaleString()}`,
              timestamp: item.timestamp || Date.now(),
              tabs: item.tabs.map(tab => ({
                id: tab.id || generateId(),
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl || null
              }))
            });
          }
        });
        
        await saveGroups(groups);
        sendResponse({ success: true, groups: groups });
      }
      
      // Get storage stats
      else if (request.action === "get_storage_stats") {
        const groups = await getAllGroups();
        const totalTabs = groups.reduce((sum, group) => sum + group.tabs.length, 0);
        sendResponse({ 
          success: true, 
          stats: {
            totalGroups: groups.length,
            totalTabs: totalTabs
          }
        });
      }
      
      // Legacy: Save tabs to file (keep for backward compatibility)
      else if (request.action === "save_tabs") {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const tabUrls = tabs.map((tab) => ({ title: tab.title, url: tab.url }));
        
        const blob = new Blob([JSON.stringify(tabUrls, null, 2)], {
          type: "application/json",
        });
        const reader = new FileReader();
        
        reader.onloadend = function () {
          const now = new Date();
          const fileName = `tabs_${now.toISOString().replace(/[:.]/g, "-")}.json`;
          const base64Data = reader.result.split(",")[1];
          chrome.downloads.download({
            url: `data:application/json;base64,${base64Data}`,
            filename: fileName,
            saveAs: true,
          });
          sendResponse({ success: true });
        };
        
        reader.readAsDataURL(blob);
        return true; // Keep channel open for async FileReader
      }
      
      // Legacy: Restore session from file
      else if (request.action === "restore_session") {
        const urlList = request.data.map((item) => item.url);
        await chrome.windows.create({ url: urlList });
        sendResponse({ success: true });
      }
      
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async responses
});
