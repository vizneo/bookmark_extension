import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

/** Prompts for a group name and the optional "close after saving" behaviour. */
const SaveTabsModal = ({ show, onHide, onSave }) => {
  const [groupName, setGroupName] = useState("");
  const [closeTabs, setCloseTabs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const defaultName = `Session ${new Date().toLocaleString()}`;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(groupName.trim() || defaultName, closeTabs);
      setGroupName("");
      setCloseTabs(false);
      onHide();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Save current tabs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={(event) => event.preventDefault()}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="group-name">Group name</Form.Label>
            <Form.Control
              id="group-name"
              type="text"
              placeholder={defaultName}
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isSaving) handleSave();
              }}
              autoFocus
            />
            <Form.Text className="text-muted">
              Leave empty to use the current date and time.
            </Form.Text>
          </Form.Group>
          <Form.Check
            type="checkbox"
            id="close-tabs"
            label="Close these tabs after saving"
            checked={closeTabs}
            onChange={(event) => setCloseTabs(event.target.checked)}
          />
          <Form.Text className="text-muted">
            Pinned tabs are never saved or closed.
          </Form.Text>
        </Form>
        {error && <p className="text-danger mt-3 mb-0">{error}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save tabs"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveTabsModal;
