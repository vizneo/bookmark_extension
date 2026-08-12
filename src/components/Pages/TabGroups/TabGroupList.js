import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import TabGroupItem from "../../Shared/TabGroupItem";
import SaveTabsModal from "../../Shared/SaveTabsModal";
import { sendMessage } from "../../../utils/messaging";
import { assertImportSize } from "../../../utils/validation";
import "./TabGroupList.css";

const matchesQuery = (group, query) => {
  if (group.name.toLowerCase().includes(query)) return true;
  // Imported data may be missing a title, so never assume the field is there.
  return group.tabs.some(
    (tab) =>
      (tab.title ?? "").toLowerCase().includes(query) ||
      (tab.url ?? "").toLowerCase().includes(query)
  );
};

const TabGroupList = () => {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const fileInputRef = useRef(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { groups: loaded } = await sendMessage({ action: "get_all_groups" });
      setGroups(loaded);
    } catch (error) {
      setNotice({ tone: "danger", text: `Could not load groups: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Derived, not stored: keeping a second copy of the list in state meant the
  // two could drift apart whenever a mutation landed mid-search.
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => matchesQuery(group, query));
  }, [groups, searchQuery]);

  const stats = useMemo(
    () => ({
      totalGroups: groups.length,
      totalTabs: groups.reduce((sum, group) => sum + group.tabs.length, 0),
    }),
    [groups]
  );

  const handleSaveTabs = async (groupName, closeTabs) => {
    const response = await sendMessage({
      action: "save_tab_group",
      name: groupName,
      closeTabs,
    });
    const skipped = response.skipped
      ? ` ${response.skipped} tab${response.skipped === 1 ? "" : "s"} skipped (pinned or non-web).`
      : "";
    setNotice({
      tone: "success",
      text: `Saved ${response.group.tabs.length} tabs.${skipped}`,
    });
    await loadGroups();
  };

  const handleExportAll = async () => {
    try {
      const { cancelled } = await sendMessage({ action: "export_all_groups" });
      if (!cancelled) setNotice({ tone: "success", text: "Export started." });
    } catch (error) {
      setNotice({ tone: "danger", text: `Export failed: ${error.message}` });
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file still fires a change.
    event.target.value = "";
    if (!file) return;

    try {
      assertImportSize(file.size);
      const data = JSON.parse(await file.text());
      const { imported, skipped } = await sendMessage({
        action: "import_groups",
        data,
        mergeWithExisting: true,
      });
      const dropped = skipped.groups + skipped.tabs;
      setNotice({
        tone: "success",
        text: `Imported ${imported} group${imported === 1 ? "" : "s"}.${
          dropped ? ` ${dropped} invalid entr${dropped === 1 ? "y" : "ies"} skipped.` : ""
        }`,
      });
      await loadGroups();
    } catch (error) {
      const text =
        error instanceof SyntaxError
          ? "That file is not valid JSON."
          : `Import failed: ${error.message}`;
      setNotice({ tone: "danger", text });
    }
  };

  return (
    <div className="tab-group-list">
      <div className="list-header">
        <div className="header-top">
          <h3>Saved tab groups</h3>
          <div className="stats">
            <span>{stats.totalGroups} group{stats.totalGroups === 1 ? "" : "s"}</span>
            <span className="stat-divider">•</span>
            <span>{stats.totalTabs} tab{stats.totalTabs === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="header-actions">
          <Button
            variant="primary"
            className="save-btn"
            onClick={() => setShowSaveModal(true)}
          >
            Save current tabs
          </Button>
          <Button variant="outline-secondary" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleExportAll}
            disabled={groups.length === 0}
          >
            Export all
          </Button>
          <Button variant="outline-secondary" onClick={loadGroups}>
            Refresh
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            hidden
          />
        </div>

        <InputGroup className="search-box">
          <Form.Control
            type="search"
            placeholder="Search groups and tabs…"
            aria-label="Search groups and tabs"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <Button variant="outline-secondary" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          )}
        </InputGroup>
      </div>

      {notice && (
        <Alert
          variant={notice.tone}
          dismissible
          onClose={() => setNotice(null)}
          className="notice"
        >
          {notice.text}
        </Alert>
      )}

      <div className="groups-container">
        {isLoading ? (
          <div className="loading-state">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading…</span>
            </Spinner>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Alert variant="light" className="empty-state">
            {searchQuery ? (
              <>
                <strong>No results</strong>
                <p>Nothing matches “{searchQuery}”.</p>
              </>
            ) : (
              <>
                <strong>No saved groups yet</strong>
                <p>
                  Use “Save current tabs” to store this window. Everything stays
                  on this device.
                </p>
              </>
            )}
          </Alert>
        ) : (
          filteredGroups.map((group) => (
            <TabGroupItem
              key={group.id}
              group={group}
              onChanged={loadGroups}
              onError={(message) => setNotice({ tone: "danger", text: message })}
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
