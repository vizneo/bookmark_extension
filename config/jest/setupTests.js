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

/** Stand-in for a chrome.events.Event, with a hook for firing it in tests. */
const createEvent = () => {
  const listeners = new Set();
  return {
    addListener: jest.fn((listener) => listeners.add(listener)),
    removeListener: jest.fn((listener) => listeners.delete(listener)),
    hasListeners: () => listeners.size > 0,
    __emit: (...args) => {
      for (const listener of [...listeners]) listener(...args);
    },
    __reset: () => listeners.clear(),
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
  storage: { local: createStorageArea(), onChanged: createEvent() },
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
  chrome.storage.onChanged.__reset();
  chrome.runtime.lastError = undefined;
  // clearAllMocks, not resetAllMocks: the mock implementations above have to
  // survive between tests.
  jest.clearAllMocks();
});
