/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { Button, Form, InputGroup, Alert, Spinner } from "react-bootstrap";
import TabGroupItem from "../../Shared/TabGroupItem";
import SaveTabsModal from "../../Shared/SaveTabsModal";
import "./TabGroupList.css";

/**
 * TabGroupList - Main component for managing saved tab groups
 */
const TabGroupList = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalGroups: 0, totalTabs: 0 });

  // Load groups on mount and set up refresh
  useEffect(() => {
    loadGroups();
  }, []);

  // Filter groups based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter((group) => {
        // Search in group name
        if (group.name.toLowerCase().includes(query)) return true;
        // Search in tab titles and URLs
        return group.tabs.some(
          (tab) =>
            tab.title.toLowerCase().includes(query) ||
            tab.url.toLowerCase().includes(query)
        );
      });
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const loadGroups = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ action: "get_all_groups" }, (response) => {
      if (response?.success) {
        setGroups(response.groups);
        setFilteredGroups(response.groups);
      } else {
        console.error("Failed to load groups:", response?.error);
      }
      setIsLoading(false);
    });

    chrome.runtime.sendMessage({ action: "get_storage_stats" }, (response) => {
      if (response?.success) {
        setStats(response.stats);
      }
    });
  };

  const handleSaveTabs = (groupName, closeTabs) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "save_tab_group", name: groupName, closeTabs },
        (response) => {
          if (response?.success) {
            console.log("Tabs saved successfully");
            loadGroups();
            resolve();
          } else {
            console.error("Failed to save tabs:", response?.error);
            reject(new Error(response?.error || "Failed to save tabs"));
          }
        }
      );
    });
  };

  const handleExportAll = () => {
    chrome.runtime.sendMessage({ action: "export_all_groups" }, (response) => {
      if (response?.success) {
        console.log("All groups exported successfully");
      } else {
        console.error("Failed to export groups:", response?.error);
      }
    });
  };

  const handleImportClick = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          chrome.runtime.sendMessage(
            { action: "import_groups", data: jsonData, mergeWithExisting: true },
            (response) => {
              if (response?.success) {
                alert(`Successfully imported! ${response.groups.length} total groups.`);
                loadGroups();
              } else {
                alert("Failed to import: " + (response?.error || "Unknown error"));
              }
            }
          );
        } catch (error) {
          alert("Invalid JSON file. Please check the file format.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="tab-group-list">
      <div className="list-header">
        <div className="header-top">
          <h3>Saved Tab Groups</h3>
          <div className="stats">
            <span className="stat-item">
              {stats.totalGroups} group{stats.totalGroups !== 1 ? "s" : ""}
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">
              {stats.totalTabs} tab{stats.totalTabs !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => setShowSaveModal(true)}
            className="save-btn"
          >
            💾 Save Current Tabs
          </Button>
          <Button
            variant="success"
            onClick={handleImportClick}
          >
            📥 Import
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleExportAll}
            disabled={groups.length === 0}
          >
            📤 Export All
          </Button>
          <Button variant="outline-info" onClick={loadGroups}>
            🔄 Refresh
          </Button>
        </div>

        <InputGroup className="search-box">
          <Form.Control
            type="text"
            placeholder="Search groups and tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="outline-secondary"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          )}
        </InputGroup>
      </div>

      <div className="groups-container">
        {isLoading ? (
          <div className="loading-state">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p>Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Alert variant="info" className="empty-state">
            {searchQuery ? (
              <>
                <strong>No results found</strong>
                <p>No groups or tabs match "{searchQuery}"</p>
              </>
            ) : (
              <>
                <strong>No saved groups yet</strong>
                <p>
                  Click "Save Current Tabs" to save your first tab group! Your
                  tabs will be stored locally and can be restored anytime.
                </p>
              </>
            )}
          </Alert>
        ) : (
          filteredGroups.map((group) => (
            <TabGroupItem
              key={group.id}
              group={group}
              onUpdate={loadGroups}
              onDelete={loadGroups}
            />
          ))
        )}
      </div>

      <SaveTabsModal
        show={showSaveModal}
        onHide={() => setShowSaveModal(false)}
        onSave={handleSaveTabs}
      />
    </div>
  );
};

export default TabGroupList;
