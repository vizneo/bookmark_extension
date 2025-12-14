/* eslint-disable no-undef */

import React, { useState } from "react";
import FilePondComponent from "./FilepondComponent"; // Import the child component
import { Button } from "react-bootstrap";
function FileUploadParent() {
  const [files, setFiles] = useState([]); // Manage files in the parent
  const [fileContent, setFileContent] = useState(""); // Manage file content in the parent

  const restoreSessionClick = () => {
    try {
      console.log(fileContent);
      const jsonData = JSON.parse(fileContent);
      console.log("JSON data:", jsonData);
      chrome.runtime
        .sendMessage({ action: "restore_session", data: jsonData })
        .then((response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else if (response && !response.success) {
            console.error(response.error);
          } else {
            console.log("Session Restored Successfully (Legacy Mode).");
            setFiles([]);
            setFileContent("");
          }
        });
      // Additional code to process the JSON data
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  };

  const importToStorageClick = () => {
    try {
      const jsonData = JSON.parse(fileContent);
      chrome.runtime
        .sendMessage({ action: "import_groups", data: jsonData, mergeWithExisting: true })
        .then((response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else if (response && !response.success) {
            console.error(response.error);
          } else {
            console.log("Groups imported successfully.");
            alert("Groups imported! Go to 'My Groups' tab to see them.");
            setFiles([]);
            setFileContent("");
          }
        });
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Invalid JSON file. Please check the file format.");
    }
  };

  // Function to read the file content using FileReader
  const handleFileRead = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result); // Set the content in the parent state
    };
    reader.onerror = () => {
      console.error("Error reading the file");
    };
    reader.readAsText(file); // Read the file as text
  };

  // Function to handle file updates from FilePond
  const handleFileUpdate = (fileItems) => {
    setFiles(fileItems); // Update the files state
    if (fileItems.length > 0) {
      handleFileRead(fileItems[0].file); // Read the content of the first file
    } else {
      setFileContent(""); // Clear content if no files are selected
    }
  };

  return (
    <div>
      <h2>Import from JSON File</h2>
      <FilePondComponent files={files} onFileUpdate={handleFileUpdate} />
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <Button
          onClick={importToStorageClick}
          variant="primary"
          disabled={!fileContent}
        >
          Import to Storage (Recommended)
        </Button>
        <Button
          onClick={restoreSessionClick}
          variant="secondary"
          disabled={!fileContent}
        >
          Open Tabs Directly (Legacy)
        </Button>
      </div>
      <small className="text-muted d-block mt-2">
        Import to storage adds groups to your saved collection. Open directly creates tabs immediately.
      </small>
    </div>
  );
}

export default FileUploadParent;
