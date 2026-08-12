import { render, screen } from "@testing-library/react";
import TabGroupList from "./TabGroupList";

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
    respondWith({ get_all_groups: { success: false, error: "worker is asleep" } });

    render(<TabGroupList />);

    expect(await screen.findByText(/worker is asleep/)).toBeInTheDocument();
  });
});
