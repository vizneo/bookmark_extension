import { Card } from "react-bootstrap";
import "./AboutComponent.css";

// Read from the manifest so this never drifts from the shipped version.
const version = chrome.runtime.getManifest().version;

const AboutComponent = () => (
  <div className="about-page">
    <Card className="mb-3">
      <Card.Body>
        <Card.Title as="h1">vTabs</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Version {version}
        </Card.Subtitle>
        <Card.Text>
          Save the tabs you have open into a named group, close them, and bring
          any group back in one click.
        </Card.Text>
      </Card.Body>
    </Card>

    <Card className="mb-3">
      <Card.Header>How to use it</Card.Header>
      <Card.Body>
        <ul>
          <li>
            <strong>Save current tabs</strong> stores every unpinned web tab in
            the window as one group. Tick “close these tabs” to clear the window
            at the same time.
          </li>
          <li>
            <strong>View tabs</strong> opens a full page listing the group,
            where you can open individual tabs.
          </li>
          <li>
            <strong>Import / Export</strong> moves your groups in and out as
            JSON files, for backups or moving to another browser.
          </li>
          <li>
            <strong>Search</strong> matches group names, tab titles and URLs.
          </li>
        </ul>
      </Card.Body>
    </Card>

    <Card className="mb-3">
      <Card.Header>Privacy</Card.Header>
      <Card.Body>
        <p>
          Your tab groups are stored with the Chrome storage API on this device
          only. vTabs has no server, no account, and no analytics, and it makes
          no network requests of its own — site icons come from Chrome’s local
          favicon cache.
        </p>
        <p className="mb-0">
          Data leaves the extension only when <em>you</em> use Export to write a
          JSON file.
        </p>
      </Card.Body>
    </Card>

    <Card>
      <Card.Header>Permissions</Card.Header>
      <Card.Body>
        <ul className="mb-0">
          <li>
            <strong>tabs</strong> — read the titles and URLs of open tabs so
            they can be saved, and open them again on restore.
          </li>
          <li>
            <strong>storage</strong> — keep your saved groups on this device.
          </li>
          <li>
            <strong>downloads</strong> — write the JSON file when you export.
          </li>
          <li>
            <strong>favicon</strong> — show site icons from Chrome’s local
            cache.
          </li>
        </ul>
      </Card.Body>
    </Card>

    <p className="text-muted mt-3">
      <small>Licensed under AGPLv3.</small>
    </p>
  </div>
);

export default AboutComponent;
