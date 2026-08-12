import { onGroupsChanged } from "./storageEvents";

const groups = [{ id: "g1", name: "Work", timestamp: 1, tabs: [] }];

describe("onGroupsChanged", () => {
  it("reports the new group list", () => {
    const listener = jest.fn();
    onGroupsChanged(listener);

    chrome.storage.onChanged.__emit(
      { tabGroups: { newValue: groups } },
      "local",
    );

    expect(listener).toHaveBeenCalledWith(groups);
  });

  it("reports an empty list when the key is removed", () => {
    const listener = jest.fn();
    onGroupsChanged(listener);

    // A removed key arrives as a change with no newValue.
    chrome.storage.onChanged.__emit(
      { tabGroups: { oldValue: groups } },
      "local",
    );

    expect(listener).toHaveBeenCalledWith([]);
  });

  it("ignores other storage areas and other keys", () => {
    const listener = jest.fn();
    onGroupsChanged(listener);

    chrome.storage.onChanged.__emit(
      { tabGroups: { newValue: groups } },
      "sync",
    );
    chrome.storage.onChanged.__emit(
      { somethingElse: { newValue: 1 } },
      "local",
    );

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops listening once unsubscribed", () => {
    const listener = jest.fn();
    const unsubscribe = onGroupsChanged(listener);

    unsubscribe();
    chrome.storage.onChanged.__emit(
      { tabGroups: { newValue: groups } },
      "local",
    );

    expect(listener).not.toHaveBeenCalled();
    expect(chrome.storage.onChanged.hasListeners()).toBe(false);
  });
});
