import React from "react";
import { Card, Badge } from "react-bootstrap";
import "./AboutComponent.css";
const AboutComponent = () => {
  return (
    <div className="about-page">
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>
            <h1>Tab Manager Extension</h1>
          </Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Version 1.0.0 - OneTab-Inspired Tab Management
          </Card.Subtitle>
          <Card.Text>
            A powerful Chrome extension for managing your browser tabs with persistent storage,
            groups, and one-click operations.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header><strong>🚀 Key Features</strong></Card.Header>
        <Card.Body>
          <ul>
            <li><strong>Persistent Storage:</strong> Save tab groups locally with Chrome Storage API</li>
            <li><strong>One-Click Save:</strong> Quickly save all current tabs with optional close</li>
            <li><strong>Group Management:</strong> Organize, rename, and manage multiple tab groups</li>
            <li><strong>Individual Tab Control:</strong> Open or delete specific tabs within groups</li>
            <li><strong>Search & Filter:</strong> Find tabs quickly across all saved groups</li>
            <li><strong>Import/Export:</strong> Backup and transfer your tab groups as JSON</li>
            <li><strong>Favicon Display:</strong> Visual recognition with site icons</li>
            <li><strong>Statistics:</strong> Track total groups and saved tabs</li>
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header><strong>📖 How to Use</strong></Card.Header>
        <Card.Body>
          <h6><Badge bg="primary">My Groups Tab</Badge></h6>
          <p>Save and manage your tab groups with persistent storage:</p>
          <ul>
            <li><strong>Save:</strong> Click "💾 Save Current Tabs" to save all open tabs</li>
            <li><strong>Import:</strong> Click "📥 Import" to restore groups from a JSON file</li>
            <li><strong>Export:</strong> Click "📤 Export All" to backup all your groups</li>
            <li><strong>View:</strong> Click "View Tabs" on any group to see the full list</li>
            <li><strong>Search:</strong> Use the search box to find specific tabs</li>
            <li><strong>Customize:</strong> Name groups, close tabs after saving (OneTab style)</li>
          </ul>
          
          <h6 className="mt-3"><Badge bg="secondary">Legacy Tab</Badge></h6>
          <p>File-based operations for backward compatibility:</p>
          <ul>
            <li>Export tabs to JSON files</li>
            <li>Import from JSON files (recommended: use "Import to Storage")</li>
          </ul>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header><strong>ℹ️ About</strong></Card.Header>
        <Card.Body>
          <p>
            This extension is built with React, Bootstrap, and Chrome Manifest V3.
            It uses local storage to keep your data private and secure.
          </p>
          <p className="mb-0">
            <small className="text-muted">
              Licensed under AGPLv3 • No data is sent to external servers
            </small>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AboutComponent;
