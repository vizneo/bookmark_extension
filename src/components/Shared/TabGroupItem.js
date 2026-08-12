import { useState } from "react";
import { Badge, Button, Form } from "react-bootstrap";
import { sendMessage } from "../../utils/messaging";
import "./TabGroupItem.css";

/**
 * One saved group: name, counts, and the actions that operate on it.
 *
 * Nothing here tells the list to refresh — the list watches storage, so a
 * successful mutation re-renders it on its own.
 */
const TabGroupItem = ({ group, onError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);

  const run = async (message) => {
    try {
      return await sendMessage(message);
    } catch (error) {
      onError(error.message);
      return null;
    }
  };

  const openGroupView = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL(
        `group-view.html?id=${encodeURIComponent(group.id)}`,
      ),
    });
  };

  const handleRestoreAll = (deleteAfterRestore) => {
    if (
      deleteAfterRestore &&
      !window.confirm(`Open all tabs and delete “${group.name}”?`)
    ) {
      return;
    }
    run({ action: "restore_tab_group", groupId: group.id, deleteAfterRestore });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete “${group.name}” and all ${group.tabs.length} tabs?`,
      )
    ) {
      return;
    }
    run({ action: "delete_tab_group", groupId: group.id });
  };

  const handleRename = () => {
    const name = editedName.trim();
    setIsEditing(false);

    if (!name || name === group.name) {
      setEditedName(group.name);
      return;
    }
    run({ action: "update_group_name", groupId: group.id, newName: name });
  };

  return (
    <div className="tab-group-item">
      <div className="group-header">
        <div className="group-info">
          {isEditing ? (
            <Form.Control
              type="text"
              value={editedName}
              aria-label="Group name"
              onChange={(event) => setEditedName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleRename();
                if (event.key === "Escape") {
                  setEditedName(group.name);
                  setIsEditing(false);
                }
              }}
              onBlur={handleRename}
              autoFocus
              className="group-name-input"
            />
          ) : (
            <h5 className="group-name">{group.name}</h5>
          )}
          <Badge bg="secondary" className="tab-count">
            {group.tabs.length} tab{group.tabs.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <small className="text-muted">
          {new Date(group.timestamp).toLocaleString()}
        </small>
      </div>

      <div className="group-actions-compact">
        <Button size="sm" variant="outline-primary" onClick={openGroupView}>
          View tabs
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleRestoreAll(false)}
        >
          Open all
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => handleRestoreAll(true)}
        >
          Open &amp; remove
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => setIsEditing(true)}
        >
          Rename
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => run({ action: "export_group", groupId: group.id })}
        >
          Export
        </Button>
        <Button size="sm" variant="outline-danger" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TabGroupItem;
