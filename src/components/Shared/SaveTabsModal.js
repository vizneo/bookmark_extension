/* eslint-disable no-undef */
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

/**
 * SaveTabsModal - Modal for saving current tabs with custom name and options
 */
const SaveTabsModal = ({ show, onHide, onSave }) => {
  const [groupName, setGroupName] = useState("");
  const [closeTabs, setCloseTabs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(groupName.trim() || `Session ${new Date().toLocaleString()}`, closeTabs);
      setGroupName("");
      setCloseTabs(false);
      onHide();
    } catch (error) {
      console.error("Error saving tabs:", error);
      alert("Failed to save tabs. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isSaving) {
      handleSave();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Save Current Tabs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Group Name (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder={`Session ${new Date().toLocaleString()}`}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <Form.Text className="text-muted">
              Leave empty to use default timestamp name
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Close tabs after saving (OneTab style)"
              checked={closeTabs}
              onChange={(e) => setCloseTabs(e.target.checked)}
            />
            <Form.Text className="text-muted">
              Closes all tabs in current window after saving to storage
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Tabs"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveTabsModal;
