import { act, render, screen } from "@testing-library/react";
import TabGroupList from "./TabGroupList";

const emitGroups = async (groups) => {
  await act(async () => {
    chrome.storage.onChanged.__emit(
      { tabGroups: { newValue: groups } },
      "local",
    );
  });
};

const respondWith = (responses) => {
  chrome.runtime.sendMessage.mockImplementation((message, callback) => {
    callback(responses[message.action]);
  });
};

describe("TabGroupList", () => {
  it("shows the empty state when nothing is saved", async () => {
    respondWith({ get_all_groups: { success: true, groups: [] } });

    render(<TabGroupList />);

    expect(await screen.findByText("No saved groups yet")).toBeInTheDocument();
  });

  it("lists saved groups with their tab counts", async () => {
    respondWith({
      get_all_groups: {
        success: true,
        groups: [
          {
            id: "g1",
            name: "Research",
            timestamp: 1700000000000,
            tabs: [
              { id: "t1", title: "One", url: "https://one.example" },
              { id: "t2", title: "Two", url: "https://two.example" },
            ],
          },
        ],
      },
    });

    render(<TabGroupList />);

    expect(await screen.findByText("Research")).toBeInTheDocument();
    // Once in the header stats, once in the group's badge.
    expect(screen.getAllByText("2 tabs")).toHaveLength(2);
    expect(screen.getByText("1 group")).toBeInTheDocument();
  });

  it("surfaces a background failure instead of failing silently", async () => {
    respondWith({
      get_all_groups: { success: false, error: "worker is asleep" },
    });

    render(<TabGroupList />);

    expect(await screen.findByText(/worker is asleep/)).toBeInTheDocument();
  });

  it("picks up a change made in another context without being asked", async () => {
    respondWith({ get_all_groups: { success: true, groups: [] } });

    render(<TabGroupList />);
    expect(await screen.findByText("No saved groups yet")).toBeInTheDocument();

    // e.g. the group page deleted a tab, or a save happened in another window.
    await emitGroups([
      {
        id: "g1",
        name: "Arrived later",
        timestamp: 1700000000000,
        tabs: [{ id: "t1", title: "One", url: "https://one.example" }],
      },
    ]);

    expect(screen.getByText("Arrived later")).toBeInTheDocument();
    expect(screen.getByText("1 group")).toBeInTheDocument();
    expect(screen.queryByText("No saved groups yet")).not.toBeInTheDocument();
  });

  it("empties the list when every group is deleted elsewhere", async () => {
    respondWith({
      get_all_groups: {
        success: true,
        groups: [{ id: "g1", name: "Doomed", timestamp: 1, tabs: [] }],
      },
    });

    render(<TabGroupList />);
    expect(await screen.findByText("Doomed")).toBeInTheDocument();

    await emitGroups([]);

    expect(screen.getByText("No saved groups yet")).toBeInTheDocument();
  });

  it("unsubscribes on unmount", async () => {
    respondWith({ get_all_groups: { success: true, groups: [] } });

    const { unmount } = render(<TabGroupList />);
    await screen.findByText("No saved groups yet");
    expect(chrome.storage.onChanged.hasListeners()).toBe(true);

    unmount();

    expect(chrome.storage.onChanged.hasListeners()).toBe(false);
  });
});
