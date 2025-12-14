/* eslint-disable no-undef */

/**
 * Storage utility module for Chrome Storage API operations
 * Manages tab groups and tabs in chrome.storage.local
 */

const STORAGE_KEY = 'tabGroups';

/**
 * Generate a unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all tab groups from storage
 */
export const getAllGroups = async () => {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('Error getting groups from storage:', error);
    throw error;
  }
};

/**
 * Save a new tab group to storage
 */
export const saveTabGroup = async (groupName, tabs, closeTabs = false) => {
  try {
    const groups = await getAllGroups();
    const newGroup = {
      id: generateId(),
      name: groupName || `Session ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      tabs: tabs.map(tab => ({
        id: generateId(),
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || null
      }))
    };
    
    groups.unshift(newGroup); // Add to beginning of array
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    
    return newGroup;
  } catch (error) {
    console.error('Error saving tab group:', error);
    throw error;
  }
};

/**
 * Get a specific group by ID
 */
export const getGroupById = async (groupId) => {
  try {
    const groups = await getAllGroups();
    return groups.find(group => group.id === groupId);
  } catch (error) {
    console.error('Error getting group by ID:', error);
    throw error;
  }
};

/**
 * Update a group's name
 */
export const updateGroupName = async (groupId, newName) => {
  try {
    const groups = await getAllGroups();
    const groupIndex = groups.findIndex(group => group.id === groupId);
    
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }
    
    groups[groupIndex].name = newName;
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    
    return groups[groupIndex];
  } catch (error) {
    console.error('Error updating group name:', error);
    throw error;
  }
};

/**
 * Delete a tab group
 */
export const deleteTabGroup = async (groupId) => {
  try {
    const groups = await getAllGroups();
    const filteredGroups = groups.filter(group => group.id !== groupId);
    await chrome.storage.local.set({ [STORAGE_KEY]: filteredGroups });
    
    return true;
  } catch (error) {
    console.error('Error deleting tab group:', error);
    throw error;
  }
};

/**
 * Delete a single tab from a group
 */
export const deleteTabFromGroup = async (groupId, tabId) => {
  try {
    const groups = await getAllGroups();
    const groupIndex = groups.findIndex(group => group.id === groupId);
    
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }
    
    groups[groupIndex].tabs = groups[groupIndex].tabs.filter(tab => tab.id !== tabId);
    
    // If group is now empty, remove it
    if (groups[groupIndex].tabs.length === 0) {
      groups.splice(groupIndex, 1);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    
    return true;
  } catch (error) {
    console.error('Error deleting tab from group:', error);
    throw error;
  }
};

/**
 * Import groups from JSON data
 */
export const importGroups = async (jsonData, mergeWithExisting = true) => {
  try {
    let groups = mergeWithExisting ? await getAllGroups() : [];
    
    // Process imported data
    const importedGroups = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    importedGroups.forEach(item => {
      // Handle old format (array of tabs without group structure)
      if (item.url && item.title) {
        // This is a single tab in old format, create a group for it
        const existingOldFormatGroup = groups.find(g => g.name === 'Imported Session');
        if (existingOldFormatGroup) {
          existingOldFormatGroup.tabs.push({
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
        // This is already in group format
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
    
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    return groups;
  } catch (error) {
    console.error('Error importing groups:', error);
    throw error;
  }
};

/**
 * Export a specific group to JSON
 */
export const exportGroup = async (groupId) => {
  try {
    const group = await getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  } catch (error) {
    console.error('Error exporting group:', error);
    throw error;
  }
};

/**
 * Export all groups to JSON
 */
export const exportAllGroups = async () => {
  try {
    return await getAllGroups();
  } catch (error) {
    console.error('Error exporting all groups:', error);
    throw error;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = async () => {
  try {
    const groups = await getAllGroups();
    const totalTabs = groups.reduce((sum, group) => sum + group.tabs.length, 0);
    
    return {
      totalGroups: groups.length,
      totalTabs: totalTabs
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
};

/**
 * Clear all data (use with caution)
 */
export const clearAllData = async () => {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};
