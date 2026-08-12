import {
  createGroup,
  deleteGroup,
  deleteTab,
  getAllGroups,
  getStats,
  importGroups,
  renameGroup,
} from "./storage";

const tabs = [
  { title: "One", url: "https://one.example" },
  { title: "Two", url: "https://two.example" },
];

describe("storage", () => {
  it("returns an empty list when nothing is stored", async () => {
    await expect(getAllGroups()).resolves.toEqual([]);
  });

  it("puts the newest group first", async () => {
    await createGroup("First", tabs);
    await createGroup("Second", tabs);

    const groups = await getAllGroups();
    expect(groups.map((group) => group.name)).toEqual(["Second", "First"]);
  });

  it("gives every group and tab an id", async () => {
    const group = await createGroup("Named", tabs);
    expect(group.id).toBeTruthy();
    expect(new Set(group.tabs.map((tab) => tab.id)).size).toBe(2);
  });

  it("renames a group and rejects an unknown id", async () => {
    const group = await createGroup("Old", tabs);
    await renameGroup(group.id, "New");

    expect((await getAllGroups())[0].name).toBe("New");
    await expect(renameGroup("missing", "x")).rejects.toThrow(/not found/i);
  });

  it("removes the group once its last tab is deleted", async () => {
    const group = await createGroup("Small", [tabs[0]]);
    await deleteTab(group.id, group.tabs[0].id);

    await expect(getAllGroups()).resolves.toEqual([]);
  });

  // Without the write queue both deletes read the same two-group array and the
  // second write puts the first group back.
  it("does not lose updates when mutations overlap", async () => {
    const first = await createGroup("A", tabs);
    const second = await createGroup("B", tabs);

    await Promise.all([deleteGroup(first.id), deleteGroup(second.id)]);

    await expect(getAllGroups()).resolves.toEqual([]);
  });

  it("keeps working after a failed mutation", async () => {
    await createGroup("Survivor", tabs);
    await expect(renameGroup("missing", "x")).rejects.toThrow();

    await expect(getStats()).resolves.toEqual({ totalGroups: 1, totalTabs: 2 });
  });

  it("merges imported groups with existing ones", async () => {
    await createGroup("Existing", tabs);
    const result = await importGroups(
      [{ name: "Imported", tabs: [{ title: "T", url: "https://t.example" }] }],
      true
    );

    expect(result.imported).toBe(1);
    expect((await getAllGroups()).map((group) => group.name)).toEqual([
      "Imported",
      "Existing",
    ]);
  });

  it("replaces everything when merge is off", async () => {
    await createGroup("Existing", tabs);
    await importGroups(
      [{ name: "Imported", tabs: [{ title: "T", url: "https://t.example" }] }],
      false
    );

    expect((await getAllGroups()).map((group) => group.name)).toEqual(["Imported"]);
  });

  it("refuses an import with nothing usable in it", async () => {
    await expect(importGroups([{ name: "Junk", tabs: [] }], true)).rejects.toThrow(
      /no valid tab groups/i
    );
  });
});
