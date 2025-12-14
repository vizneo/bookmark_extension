/* eslint-disable no-undef */
import React, { useState } from "react";
import { Button, Badge, Form } from "react-bootstrap";
import TabItem from "./TabItem";
import "./TabGroupItem.css";

/**
 * TabGroupItem component - displays a tab group with expand/collapse and actions
 */
const TabGroupItem = ({ group, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleRestoreAll = () => {
    chrome.runtime.sendMessage(
      { action: "restore_tab_group", groupId: group.id, deleteAfterRestore: false },
      (response) => {
        if (response?.success) {
          console.log("Group restored successfully");
        } else {
          console.error("Failed to restore group:", response?.error);
        }
      }
    );
  };

  const handleRestoreAndDelete = () => {
    if (window.confirm(`Restore all tabs and delete "${group.name}"?`)) {
      chrome.runtime.sendMessage(
        { action: "restore_tab_group", groupId: group.id, deleteAfterRestore: true },
        (response) => {
          if (response?.success) {
            console.log("Group restored and deleted");
            onUpdate();
          } else {
            console.error("Failed to restore group:", response?.error);
          }
        }
      );
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${group.name}" and all its tabs?`)) {
      chrome.runtime.sendMessage(
        { action: "delete_tab_group", groupId: group.id },
        (response) => {
          if (response?.success) {
            console.log("Group deleted successfully");
            onUpdate();
          } else {
            console.error("Failed to delete group:", response?.error);
          }
        }
      );
    }
  };

  const handleExport = () => {
    chrome.runtime.sendMessage(
      { action: "export_group", groupId: group.id },
      (response) => {
        if (response?.success) {
          console.log("Group exported successfully");
        } else {
          console.error("Failed to export group:", response?.error);
        }
      }
    );
  };

  const handleRename = () => {
    if (editedName.trim() && editedName !== group.name) {
      chrome.runtime.sendMessage(
        { action: "update_group_name", groupId: group.id, newName: editedName.trim() },
        (response) => {
          if (response?.success) {
            console.log("Group renamed successfully");
            setIsEditing(false);
            onUpdate();
          } else {
            console.error("Failed to rename group:", response?.error);
          }
        }
      );
    } else {
      setIsEditing(false);
      setEditedName(group.name);
    }
  };

  const handleDeleteTab = (tabId) => {
    chrome.runtime.sendMessage(
      { action: "delete_single_tab", groupId: group.id, tabId },
      (response) => {
        if (response?.success) {
          console.log("Tab deleted successfully");
          onUpdate();
        } else {
          console.error("Failed to delete tab:", response?.error);
        }
      }
    );
  };

  const handleOpenGroupView = () => {
    if (isEditing) return;
    const url = chrome.runtime.getURL(`group-view.html?id=${group.id}`);
    chrome.tabs.create({ url });
  };

  return (
    <div className="tab-group-item">
      <div className="group-header" onClick={handleOpenGroupView}>
        <div className="group-info">
          {isEditing ? (
            <Form.Control
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleRename()}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="group-name-input"
            />
          ) : (
            <h5 className="group-name">{group.name}</h5>
          )}
          <Badge bg="primary" className="tab-count">
            {group.tabs.length} tab{group.tabs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="group-meta">
          <small className="text-muted">{formatDate(group.timestamp)}</small>
        </div>
      </div>

      <div className="group-actions-compact">
        <Button size="sm" variant="primary" onClick={handleOpenGroupView}>
          View Tabs
        </Button>
        <Button 
          size="sm" 
          variant="success" 
          onClick={(e) => {
            e.stopPropagation();
            handleRestoreAll();
          }}
        >
          Open All
        </Button>
        <Button 
          size="sm" 
          variant="outline-secondary" 
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          Rename
        </Button>
        <Button 
          size="sm" 
          variant="outline-info" 
          onClick={(e) => {
            e.stopPropagation();
            handleExport();
          }}
        >
          Export
        </Button>
        <Button 
          size="sm" 
          variant="outline-danger" 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TabGroupItem;
