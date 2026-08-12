import "@testing-library/jest-dom";

/** Minimal in-memory stand-in for the Chrome extension APIs we call. */
const createStorageArea = () => {
  let data = {};
  return {
    get: jest.fn(async (key) => (key in data ? { [key]: data[key] } : {})),
    set: jest.fn(async (items) => {
      data = { ...data, ...items };
    }),
    remove: jest.fn(async (key) => {
      delete data[key];
    }),
    __reset: () => {
      data = {};
    },
  };
};

global.chrome = {
  runtime: {
    id: "vtabs-test",
    lastError: undefined,
    sendMessage: jest.fn(),
    getManifest: () => ({ version: "1.0.0" }),
    getURL: (path) =>
      `chrome-extension://vtabs-test/${path.replace(/^\//, "")}`,
  },
  storage: { local: createStorageArea() },
  tabs: {
    query: jest.fn(async () => []),
    create: jest.fn(async () => ({ id: 1 })),
    remove: jest.fn(async () => {}),
  },
  windows: { create: jest.fn(async () => ({ id: 1 })) },
  downloads: { download: jest.fn(async () => 1) },
};

beforeEach(() => {
  chrome.storage.local.__reset();
  chrome.runtime.lastError = undefined;
  jest.clearAllMocks();
});
