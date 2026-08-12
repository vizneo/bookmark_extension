import {
  assertImportSize,
  isRestorableUrl,
  LIMITS,
  normalizeImport,
} from "./validation";

let counter = 0;
const generateId = () => `id-${(counter += 1)}`;

beforeEach(() => {
  counter = 0;
});

describe("isRestorableUrl", () => {
  it("accepts web URLs", () => {
    expect(isRestorableUrl("https://example.com/path?q=1")).toBe(true);
    expect(isRestorableUrl("http://example.com")).toBe(true);
  });

  it("rejects schemes an extension cannot open or that are injection vectors", () => {
    expect(isRestorableUrl("javascript:alert(1)")).toBe(false);
    expect(isRestorableUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
    expect(isRestorableUrl("chrome://settings")).toBe(false);
    expect(isRestorableUrl("chrome-extension://abc/page.html")).toBe(false);
    expect(isRestorableUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects non-strings, malformed URLs and oversized URLs", () => {
    expect(isRestorableUrl(undefined)).toBe(false);
    expect(isRestorableUrl(42)).toBe(false);
    expect(isRestorableUrl("not a url")).toBe(false);
    expect(
      isRestorableUrl(`https://e.com/${"a".repeat(LIMITS.MAX_URL_LENGTH)}`),
    ).toBe(false);
  });
});

describe("normalizeImport", () => {
  it("keeps valid groups and drops unusable tabs", () => {
    const { groups, skipped } = normalizeImport(
      [
        {
          name: "Work",
          timestamp: 1700000000000,
          tabs: [
            { title: "Good", url: "https://example.com" },
            { title: "Bad", url: "javascript:alert(1)" },
          ],
        },
      ],
      generateId,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].tabs).toHaveLength(1);
    expect(groups[0].tabs[0].url).toBe("https://example.com");
    expect(skipped.tabs).toBe(1);
  });

  it("collects the legacy flat tab format into a single group", () => {
    const { groups } = normalizeImport(
      [
        { title: "One", url: "https://one.example" },
        { title: "Two", url: "https://two.example" },
      ],
      generateId,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].tabs.map((tab) => tab.title)).toEqual(["One", "Two"]);
  });

  it("drops a group whose tabs are all invalid", () => {
    const { groups, skipped } = normalizeImport(
      [{ name: "Junk", tabs: [{ title: "x", url: "chrome://version" }] }],
      generateId,
    );

    expect(groups).toHaveLength(0);
    expect(skipped.groups).toBe(1);
  });

  it("falls back to the URL when a title is missing", () => {
    const { groups } = normalizeImport(
      [{ name: "G", tabs: [{ url: "https://example.com" }] }],
      generateId,
    );

    expect(groups[0].tabs[0].title).toBe("https://example.com");
  });

  it("clamps overlong names and titles", () => {
    const { groups } = normalizeImport(
      [
        {
          name: "n".repeat(LIMITS.MAX_NAME_LENGTH + 50),
          tabs: [
            {
              title: "t".repeat(LIMITS.MAX_TITLE_LENGTH + 50),
              url: "https://e.com",
            },
          ],
        },
      ],
      generateId,
    );

    expect(groups[0].name).toHaveLength(LIMITS.MAX_NAME_LENGTH);
    expect(groups[0].tabs[0].title).toHaveLength(LIMITS.MAX_TITLE_LENGTH);
  });

  it("ignores junk entries instead of throwing", () => {
    const { groups, skipped } = normalizeImport(
      [null, 5, "nope", {}],
      generateId,
    );
    expect(groups).toHaveLength(0);
    expect(skipped.groups + skipped.tabs).toBeGreaterThan(0);
  });
});

describe("assertImportSize", () => {
  it("rejects files over the limit", () => {
    expect(() => assertImportSize(LIMITS.MAX_IMPORT_BYTES + 1)).toThrow(
      /too large/i,
    );
    expect(() => assertImportSize(1024)).not.toThrow();
  });
});
