/* eslint-disable no-undef */
import React from "react";
import { Button } from "react-bootstrap";
import "./TabItem.css";

/**
 * TabItem component - displays a single tab with actions
 */
const TabItem = ({ tab, groupId, onRestore, onDelete }) => {
  const handleRestore = () => {
    chrome.runtime.sendMessage(
      { action: "restore_single_tab", groupId, tabId: tab.id },
      (response) => {
        if (response?.success) {
          console.log("Tab restored successfully");
        } else {
          console.error("Failed to restore tab:", response?.error);
        }
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${tab.title}"?`)) {
      onDelete(tab.id);
    }
  };

  // Get favicon URL or use default
  const getFavicon = () => {
    if (tab.favIconUrl) {
      return tab.favIconUrl;
    }
    // Use Google's favicon service as fallback
    try {
      const url = new URL(tab.url);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}`;
    } catch {
      return null;
    }
  };

  return (
    <div className="tab-item">
      <div className="tab-info">
        {getFavicon() && (
          <img
            src={getFavicon()}
            alt=""
            className="tab-favicon"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <div className="tab-details">
          <div className="tab-title">{tab.title}</div>
          <div className="tab-url">{tab.url}</div>
        </div>
      </div>
      <div className="tab-actions">
        <Button
          size="sm"
          variant="outline-primary"
          onClick={handleRestore}
          title="Open this tab"
        >
          Open
        </Button>
        <Button
          size="sm"
          variant="outline-danger"
          onClick={handleDelete}
          title="Delete this tab"
        >
          ×
        </Button>
      </div>
    </div>
  );
};

export default TabItem;
