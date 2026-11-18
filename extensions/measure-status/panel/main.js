"use strict";
(() => {
  // node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;

  // node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 40%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 65%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root2 = doc.documentElement;
    if (root2.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root2.setAttribute("data-oc-scrollbar-activity", "");
    const timers = /* @__PURE__ */ new WeakMap();
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root2 : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== void 0)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1e3));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;

  // node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;

  // node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;

  // node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = /* @__PURE__ */ new Set();
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== void 0 && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = /* @__PURE__ */ new Set();
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0; index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16e3;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request) => {
    try {
      if (String(request.id) !== request.id || !GUEST_POPOVER_ID.test(request.id) || !Number.isFinite(request.anchor.x) || Math.abs(request.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.y) || Math.abs(request.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.width) || !Number.isFinite(request.anchor.height) || request.anchor.width <= 0 || request.anchor.height <= 0 || request.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request.width) || request.width < GUEST_POPOVER_WIDTH_MIN || request.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request.height) || request.height < GUEST_POPOVER_HEIGHT_MIN || request.height > GUEST_POPOVER_HEIGHT_MAX || request.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request.side) || request.focus !== void 0 && request.focus !== true && request.focus !== false || !hasBoundedJsonTree(request.data) || !isFiniteJson(request.data))
        return false;
      return JSON.stringify(request.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32e3;
  var GUEST_COMPOSE_TEXT_MAX = 16e3;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2e3;
  var GUEST_ATTACH_TEXT_MAX = 16e3;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16e3;
  var GUEST_REQUEST_PATH_MAX = 2e3;
  var GUEST_REQUEST_TIMEOUT_MS = 2e4;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2e6;
  var GUEST_GENERATE_PROMPT_MAX = 64e3;
  var GUEST_GENERATE_SYSTEM_MAX = 8e3;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
  var GUEST_GENERATE_TIMEOUT_MS = 9e4;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === void 0)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request) => {
    const id = request.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request.branches?.head);
      const base = clampBranch(request.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request.data)) {
      next.data = request.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request) => {
    const next = clampAttachRequest(request);
    if (request.projectId)
      next.projectId = request.projectId;
    if (request.navigation)
      next.navigation = request.navigation;
    if (request.worktree) {
      next.worktree = request.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request) => {
    const next = {
      text: request.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire) => {
    if (!isNonEmptyString(wire.id))
      return null;
    if (wire.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: true
      };
      if (Object(wire.payload) === wire.payload) {
        message.payload = wire.payload;
      }
      return message;
    }
    if (wire.ok === false && isNonEmptyString(wire.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: false,
        error: wire.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : void 0)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire = asWireRecord(data);
    if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire.type === "result")
      return readResultMessage(wire);
    if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
      return null;
    return wire;
  };

  // node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
  var HostRequestError = class extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.name = "HostRequestError";
      this.code = code;
    }
  };
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === void 0)
      return void 0;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : void 0;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = /* @__PURE__ */ new Set();
    const directoryListeners = /* @__PURE__ */ new Set();
    const sessionListeners = /* @__PURE__ */ new Set();
    const lifecycleListeners = /* @__PURE__ */ new Set();
    const connectionListeners = /* @__PURE__ */ new Set();
    const settingsListeners = /* @__PURE__ */ new Set();
    const itemListeners = /* @__PURE__ */ new Set();
    const statusControlListeners = /* @__PURE__ */ new Set();
    const popoverClosedListeners = /* @__PURE__ */ new Set();
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = /* @__PURE__ */ new Set();
    const fileSavedListeners = /* @__PURE__ */ new Set();
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = /* @__PURE__ */ new Map();
    const workspaceListeners = /* @__PURE__ */ new Map();
    const shellsListeners = /* @__PURE__ */ new Map();
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer2 = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer: timer2 });
        post(message);
      });
    };
    const request = (message) => send(message).then(() => void 0);
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      void closePopover(lastReady.popover.id, "escape").catch(() => void 0);
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : void 0;
      if (!popover)
        return;
      const active2 = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active2)
        return;
      popoverActivityReported = active2;
      void setPopoverAnchorActive(popover.id, active2).catch(() => void 0);
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active2) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active: active2 } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== void 0 && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== void 0 && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : void 0;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      openSurface: (surfaceId) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== void 0)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== void 0)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== void 0)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 18e4);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input) => {
        const prompt = input.prompt.trim();
        const system = input.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== void 0 && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input.maxOutputTokens === void 0 ? void 0 : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input.maxOutputTokens)));
        if (maxOutputTokens !== void 0 && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== void 0)
          payload.system = system;
        if (maxOutputTokens !== void 0)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      setBadge: (count) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);

  // node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);

  // node_modules/@openchamber/sdk/dist/ui/theme.js
  var TOKEN_VARS = [
    ["--oc-bg", "background"],
    ["--oc-elevated", "elevated"],
    ["--oc-fg", "foreground"],
    ["--oc-muted", "muted"],
    ["--oc-subtle", "subtle"],
    ["--oc-border", "border"],
    ["--oc-hover", "hover"],
    ["--oc-selection", "selection"],
    ["--oc-focus", "focus"],
    ["--oc-primary", "primary"],
    ["--oc-muted-surface", "mutedSurface"],
    ["--oc-elevated-fg", "elevatedForeground"],
    ["--oc-active", "active"],
    ["--oc-selection-fg", "selectionForeground"],
    ["--oc-primary-fg", "primaryForeground"],
    ["--oc-primary-text", "primaryText"],
    ["--oc-success-text", "successText"],
    ["--oc-warning-text", "warningText"],
    ["--oc-error-text", "errorText"],
    ["--oc-info-text", "infoText"],
    ["--oc-success", "success"],
    ["--oc-warning", "warning"],
    ["--oc-error", "error"],
    ["--oc-info", "info"],
    ["--oc-font", "font"],
    ["--oc-mono", "mono"],
    ["--oc-radius", "radius"],
    ["--surface-background", "background"],
    ["--surface-elevated", "elevated"],
    ["--surface-foreground", "foreground"],
    ["--surface-muted-foreground", "muted"],
    ["--surface-subtle", "subtle"],
    ["--interactive-border", "border"],
    ["--interactive-hover", "hover"],
    ["--interactive-selection", "selection"],
    ["--interactive-focus-ring", "focus"],
    ["--primary", "primary"],
    ["--surface-muted", "mutedSurface"],
    ["--surface-elevated-foreground", "elevatedForeground"],
    ["--interactive-active", "active"],
    ["--interactive-selection-foreground", "selectionForeground"],
    ["--primary-foreground", "primaryForeground"],
    ["--primary-text", "primaryText"],
    ["--success-text", "successText"],
    ["--warning-text", "warningText"],
    ["--error-text", "errorText"],
    ["--info-text", "infoText"],
    ["--status-success", "success"],
    ["--status-warning", "warning"],
    ["--status-error", "error"],
    ["--status-info", "info"],
    ["--font-sans", "font"],
    ["--font-mono", "mono"],
    ["--radius", "radius"]
  ];
  var SYNTAX_TOKEN_VARS = [
    ["--oc-syntax-keyword", "--syntax-keyword", "syntaxKeyword"],
    ["--oc-syntax-string", "--syntax-string", "syntaxString"],
    ["--oc-syntax-number", "--syntax-number", "syntaxNumber"],
    ["--oc-syntax-function", "--syntax-function", "syntaxFunction"],
    ["--oc-syntax-type", "--syntax-type", "syntaxType"],
    ["--oc-syntax-comment", "--syntax-comment", "syntaxComment"],
    ["--oc-syntax-variable", "--syntax-variable", "syntaxVariable"],
    ["--oc-syntax-operator", "--syntax-operator", "syntaxOperator"]
  ];
  var applyHostTheme = (theme, root2) => {
    root2.style.colorScheme = theme.mode;
    for (const [name, key] of TOKEN_VARS) {
      root2.style.setProperty(name, theme.tokens[key]);
    }
    for (const [alias, hostName, key] of SYNTAX_TOKEN_VARS) {
      const value = theme.tokens[key] ?? "";
      root2.style.setProperty(alias, value);
      root2.style.setProperty(hostName, value);
    }
    root2.style.setProperty("font-family", theme.tokens.font);
    root2.style.setProperty("font-size", "0.875rem");
    root2.style.setProperty("line-height", "1.45");
    root2.style.setProperty("color", theme.tokens.foreground);
  };
  var applyHostReady = (ctx, root2) => {
    applyHostTheme(ctx.theme, root2);
    if (root2.dataset) {
      root2.dataset.ocSurface = ctx.surface;
      root2.dataset.ocTheme = ctx.theme.mode;
    }
  };

  // node_modules/@openchamber/sdk/dist/ui/style.js
  var OC_ALIAS = {
    "surface-background": "bg",
    "surface-elevated": "elevated",
    "surface-elevated-foreground": "elevated-fg",
    "surface-foreground": "fg",
    "surface-muted-foreground": "muted",
    "surface-muted": "muted-surface",
    "surface-subtle": "subtle",
    "interactive-border": "border",
    "interactive-hover": "hover",
    "interactive-active": "active",
    "interactive-selection": "selection",
    "interactive-selection-foreground": "selection-fg",
    "interactive-focus-ring": "focus",
    "primary": "primary",
    "primary-foreground": "primary-fg",
    "primary-text": "primary-text",
    "success-text": "success-text",
    "warning-text": "warning-text",
    "error-text": "error-text",
    "info-text": "info-text",
    "status-success": "success",
    "status-warning": "warning",
    "status-error": "error",
    "status-info": "info",
    "font-sans": "font",
    "font-mono": "mono",
    "radius": "radius"
  };
  var v = (name, fallback) => `var(--${name}, var(--oc-${OC_ALIAS[name]}, ${fallback}))`;
  var bg = v("surface-background", "transparent");
  var elevated = v("surface-elevated", "transparent");
  var elevatedFg = v("surface-elevated-foreground", "inherit");
  var fg = v("surface-foreground", "inherit");
  var muted = v("surface-muted-foreground", "gray");
  var secondary = v("surface-muted", "transparent");
  var border = v("interactive-border", "currentColor");
  var hover = v("interactive-hover", "transparent");
  var active = v("interactive-active", "transparent");
  var selection = v("interactive-selection", "transparent");
  var selectionFg = v("interactive-selection-foreground", "inherit");
  var focus = v("interactive-focus-ring", "currentColor");
  var primary = v("primary", "currentColor");
  var primaryText = v("primary-text", "inherit");
  var errorText = v("error-text", "inherit");
  var font = v("font-sans", "inherit");
  var mono = v("font-mono", "monospace");
  var radius = v("radius", "9px");
  var mix = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  var focusRing = `box-shadow: 0 0 0 2px ${focus};`;
  var tone = (name) => {
    const color = v(`status-${name}`, "currentColor");
    return `
.oc-sdk[data-tone="${name}"], .oc-sdk [data-tone="${name}"] { --oc-sdk-tone: ${color}; --oc-sdk-tone-text: ${v(`${name}-text`, "inherit")}; }`;
  };
  var UI_CSS = `
${GUEST_SCROLLBAR_CSS}
.oc-sdk { box-sizing: border-box; color: ${fg}; font-family: ${font}; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }
.oc-sdk :focus-visible { outline: none; ${focusRing} }
.oc-sdk-mono { font-family: ${mono}; }
.oc-sdk-muted { color: ${muted}; }
${tone("success")}${tone("warning")}${tone("error")}${tone("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${primary}; --oc-sdk-tone-text: ${primaryText}; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 36px; padding: 0 14px; border: 1px solid transparent; border-radius: ${radius}; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="sm"] { height: 32px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { height: 24px; padding: 0 8px; font-size: 0.75rem; border-radius: 6px; }
.oc-sdk-btn[data-variant="default"] { color: ${primaryText}; background: ${mix(primary, 10, bg)}; border-color: ${mix(primary, 12)}; }
.oc-sdk-btn[data-variant="default"]:hover { background: ${mix(primary, 16, bg)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${mix(primary, 22, bg)}; }
.oc-sdk-btn[data-variant="secondary"] { background: ${secondary}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="outline"] { background: ${elevated}; color: ${elevatedFg}; border-color: ${border}; }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${hover}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${active}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${v("status-error", "red")}; color: ${errorText}; background: ${mix("var(--oc-sdk-tone)", 7, bg)}; border-color: ${mix("var(--oc-sdk-tone)", 12)}; }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${mix("var(--oc-sdk-tone)", 9, bg)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${mix("var(--oc-sdk-tone)", 11, bg)}; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; color: ${muted}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${errorText}; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 36px; padding: 0 12px; border: 0; border-radius: ${radius}; background: ${elevated}; color: ${elevatedFg}; font-size: 0.875rem; line-height: 1.45; appearance: none; box-shadow: inset 0 0 0 1px ${mix(border, 60)}; transition: background 150ms ease-out, box-shadow 150ms ease-out; }
textarea.oc-sdk-input { height: auto; padding: 8px 12px; resize: vertical; }
.oc-sdk-input::placeholder { color: ${muted}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { box-shadow: inset 0 0 0 2px ${focus}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input { box-shadow: inset 0 0 0 1px ${v("status-error", "red")}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { box-shadow: inset 0 0 0 2px ${v("status-error", "red")}; }
.oc-sdk-input[data-mono="true"] { font-family: ${mono}; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: ${muted}; pointer-events: none; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${primary}; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; color: ${muted}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }
.oc-sdk-search-clear:hover { background: ${hover}; color: ${fg}; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; width: 100%; min-width: 0; height: 32px; padding: 0 8px 0 10px; border: 1px solid ${border}; border-radius: 6px; background: ${elevated}; color: ${elevatedFg}; font-size: 0.8125rem; text-align: left; transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-value[data-empty="true"] { color: ${muted}; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; color: ${muted}; }
.oc-sdk-popup { --surface-foreground: ${elevatedFg}; position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid ${mix(border, 60)}; border-radius: 12px; background: ${elevated}; color: ${elevatedFg}; box-shadow: 0 8px 24px ${mix(fg, 12)}; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 32px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border-radius: 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option[data-active="true"] { background: ${hover}; }
.oc-sdk-option[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-option[data-destructive="true"] { color: ${errorText}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${mix(v("status-error", "red"), 10)}; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; color: ${muted}; }
.oc-sdk-option-check { flex: 0 0 auto; width: 12px; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; color: ${muted}; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid ${border}; border-radius: 4px; color: ${primary}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${mix(primary, 65, border)}; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; border-radius: 9999px; background: ${border}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 9999px; background: ${bg}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${primary}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${focusRing} }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; color: ${muted}; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; border-radius: 10px; max-width: 100%; overflow: auto; }
.oc-sdk-tabs[data-track="true"] { background: ${mix(fg, 4)}; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; color: ${muted}; white-space: nowrap; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${fg}; }
.oc-sdk-tab[aria-selected="true"] { color: ${selectionFg}; background: ${selection}; border-color: ${border}; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; color: ${muted}; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 9999px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; background: ${hover}; color: ${muted}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${mix("var(--oc-sdk-tone)", 15)}; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border-radius: 6px; text-align: left; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${hover}; }
.oc-sdk-row[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ${mono}; font-size: 0.75rem; color: ${muted}; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; color: ${muted}; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; color: ${muted}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; color: ${muted}; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; color: ${muted}; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: ${muted}; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid ${border}; border-top-color: ${primary}; border-radius: 9999px; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid ${mix("var(--oc-sdk-tone)", 40)}; border-radius: 8px; background: ${mix("var(--oc-sdk-tone)", 10)}; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { font-size: 0.8125rem; color: ${muted}; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; color: ${muted}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; background: ${mix(border, 40)}; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; color: ${muted}; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; border-radius: 9999px; background: ${border}; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; border-radius: 9999px; background: var(--oc-sdk-tone, ${primary}); transform-origin: left; transition: transform 200ms ease-out; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text a { color: ${primaryText}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; border-radius: 8px; border: 1px solid ${mix(border, 60)}; }
`;

  // src/parse.ts
  var TRACK_BOLD = /^- \[([ ~xb])\] \*\*Track: (.+?)\*\*/;
  var TRACK_LINKED = /^- \[([ ~xb])\] \[([^\]]+)\]\(([^)\s]+)\)/;
  var LINK_LINE = /\*Link: \[[^\]]*\]\(([^)\s]+)\)\*/;
  var ENTRY = /^- \[[ ~xb]\] /;
  var MD_LINK = /\]\(([^)\s]+)\)/;
  var PHASE = /^## Phase\b/;
  var SECTION = /^#{1,2} /;
  var TASK = /^- \[([ ~xb])\] (.*)$/;
  var SHA = /(?:^|\s)`?([0-9a-f]{7})`?\s*$/;
  var CHECKPOINT = /\s*\[checkpoint: ([0-9a-f]{7,40})\]/;
  var OWNER = /\bdeferred:([A-Za-z0-9._-]*)/;
  var LABEL_SHA = /\s`?[0-9a-f]{7}`?\s*$/;
  var BODY_PREFIX = /^\s*(?:\*\*)?\s*(?:Task\s+)?([A-Za-z0-9.-]*\d[A-Za-z0-9.-]*)\s*:?\s*/;
  var ownerToken = (text) => {
    const match = OWNER.exec(text);
    if (match === null) return null;
    const token = (match[1] ?? "").replace(/[._-]+$/, "");
    return token === "" ? null : token;
  };
  var taskLabel = (text) => {
    const withoutCheckpoint = text.replace(CHECKPOINT, " ");
    const withoutSha = withoutCheckpoint.replace(LABEL_SHA, "");
    const collapsed = withoutSha.replace(/\s+/g, " ").trim();
    return collapsed.length > 140 ? `${collapsed.slice(0, 140)}\u2026` : collapsed;
  };
  var taskBody = (text) => {
    const match = BODY_PREFIX.exec(text);
    if (match === null) return text;
    return text.slice(match[0].length).replace(/\s*\*\*$/, "").trim();
  };
  var isGateText = (text) => /^GATE\b/.test(taskBody(text)) || text.includes("User Manual Verification");
  var joinPath = (...parts) => {
    const out = [];
    for (const segment of parts.join("/").split("/")) {
      if (segment === "" || segment === ".") continue;
      if (segment === "..") out.pop();
      else out.push(segment);
    }
    return (parts[0]?.startsWith("/") ? "/" : "") + out.join("/");
  };
  var dirname = (path) => joinPath(path, "..");
  var findLink = (md, label) => {
    for (const line of md.split("\n")) {
      if (!label.test(line)) continue;
      const link = MD_LINK.exec(line);
      if (link) return link[1] ?? null;
    }
    return null;
  };
  var folderOf = (target) => joinPath(target.replace(/\/index\.md$/, ""));
  var entryOf = (line, marker, name, target) => {
    const folder = folderOf(target);
    return { line, marker, name: name.trim(), id: folder.split("/").pop() ?? folder, folder };
  };
  var parseTracks = (md) => {
    const lines = md.split("\n");
    const tracks = [];
    lines.forEach((line, i) => {
      const bold = TRACK_BOLD.exec(line);
      if (bold) {
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j] ?? "";
          if (ENTRY.test(next)) break;
          if (/^#{1,6} /.test(next)) break;
          const link = LINK_LINE.exec(next);
          if (link) {
            tracks.push(entryOf(i, bold[1] ?? " ", bold[2] ?? "", link[1] ?? ""));
            break;
          }
        }
        return;
      }
      const linked = TRACK_LINKED.exec(line);
      if (linked) tracks.push(entryOf(i, linked[1] ?? " ", linked[2] ?? "", linked[3] ?? ""));
    });
    return tracks;
  };
  var parsePlan = (md) => {
    const plan = { phases: [] };
    let phase = null;
    md.split("\n").forEach((line, i) => {
      if (SECTION.test(line)) {
        phase = null;
        if (PHASE.test(line)) {
          phase = {
            line: i,
            title: line.slice(3).replace(CHECKPOINT, "").trim(),
            checkpoint: CHECKPOINT.exec(line)?.[1] ?? null,
            tasks: []
          };
          plan.phases.push(phase);
        }
        return;
      }
      const task = phase === null ? null : TASK.exec(line);
      if (phase === null || task === null) return;
      const text = (task[2] ?? "").trim();
      phase.tasks.push({
        line: i,
        marker: task[1] ?? " ",
        text,
        sha: SHA.exec(text)?.[1] ?? null,
        deferredOwner: ownerToken(text)
      });
    });
    return plan;
  };
  var isOpen = (task) => task.marker === " " || task.marker === "~" || task.marker === "b" && task.deferredOwner === null;
  var tasksOf = (plan) => plan.phases.flatMap((phase) => phase.tasks);
  var currentTask = (plan) => tasksOf(plan).find((task) => task.marker === "~") ?? null;
  var selectActive = (tracks, plans) => {
    const inProgress = tracks.filter((track) => track.marker === "~");
    const working = inProgress.find((track) => {
      const plan = plans.get(track.id);
      return plan !== void 0 && currentTask(plan) !== null;
    });
    return working ?? inProgress[0] ?? null;
  };
  var blockedCount = (plan) => tasksOf(plan).filter((task) => task.marker === "b").length;
  var position = (plan) => {
    const all = plan.phases.flatMap((phase, p) => phase.tasks.map((task, t) => ({ task, p, t })));
    const at = all.find((one) => one.task.marker === "~") ?? all.find((one) => isOpen(one.task));
    const phases = plan.phases.length;
    if (at === void 0) return { phase: phases, phases, task: 0, tasks: 0, current: null };
    return { phase: at.p + 1, phases, task: at.t + 1, tasks: plan.phases[at.p]?.tasks.length ?? 0, current: at.task };
  };

  // src/band.ts
  var bandLine = (snapshot) => {
    if (!snapshot.hasMeasure) return null;
    if (snapshot.parseError !== null) {
      return "Measure \xB7 cannot read the Measure files";
    }
    const parts = ["Measure"];
    const { active: active2 } = snapshot;
    if (active2 === null) {
      parts.push("no track in progress");
    } else {
      parts.push(active2.entry.name);
      const at = position(active2.plan);
      if (at.current === null) {
        parts.push("all tasks closed");
      } else {
        parts.push(`Phase ${at.phase}/${at.phases}`, `Task ${at.task}/${at.tasks} [${at.current.marker}] ${at.current.text}`);
        if (at.current.marker !== "~") parts.push("no task in progress");
      }
      const blocked = blockedCount(active2.plan);
      if (blocked > 0) parts.push(`[b] ${blocked}`);
    }
    if (snapshot.inProgressCount >= 2) parts.push(`${snapshot.inProgressCount} tracks in progress`);
    return parts.join(" \xB7 ");
  };
  var markerTone = (marker) => {
    if (marker === "~") return "primary";
    if (marker === "x") return "success";
    if (marker === "b") return "warning";
    return "neutral";
  };
  var markerClassName = (marker) => `marker-${markerTone(marker)}`;

  // src/board.ts
  var COLUMNS = ["planned", "in-progress", "blocked", "waiting", "done"];
  var COLUMN_LABELS = {
    planned: "Planned",
    "in-progress": "In progress",
    blocked: "Blocked",
    waiting: "Waiting on Daniel",
    done: "Done"
  };
  var COLUMN_CAP = 8;
  var DONE_SHOWN = 5;
  var DONE_WINDOW_DAYS = 14;
  var DAY_MS = 864e5;
  var STALE_DAYS = 30;
  var DANIEL_TOKENS = /* @__PURE__ */ new Set([
    "daniel",
    "user",
    "owner",
    "po",
    "product-owner",
    "human",
    "human-gated",
    "both-owners"
  ]);
  var isDanielToken = (token) => {
    if (token === null) return false;
    const lower = token.toLowerCase();
    return DANIEL_TOKENS.has(lower) || lower.startsWith("owner-") || lower.startsWith("daniel-");
  };
  var lastDoneIndex = (tasks) => {
    let out = -1;
    tasks.forEach((task, index) => {
      if (task.marker === "x") out = index;
    });
    return out;
  };
  var currentIndex = (tasks) => {
    const tilde = tasks.findIndex((task) => task.marker === "~");
    if (tilde >= 0) return tilde;
    const lastDone = lastDoneIndex(tasks);
    for (let index = lastDone + 1; index < tasks.length; index += 1) {
      if ((tasks[index]?.marker ?? "x") === " ") return index;
    }
    return null;
  };
  var positionOf = (plan, index) => {
    let seen = 0;
    for (let phase = 0; phase < plan.phases.length; phase += 1) {
      const count = plan.phases[phase]?.tasks.length ?? 0;
      if (index < seen + count) {
        return { phase: phase + 1, phases: plan.phases.length, task: index - seen + 1, tasks: count };
      }
      seen += count;
    }
    return { phase: 1, phases: plan.phases.length, task: 1, tasks: 1 };
  };
  var noteOf = (tasks) => {
    const open = tasks.filter(isOpen).length;
    if (open === 0) return "All tasks closed.";
    return open === 1 ? "1 open task, no current task." : `${open} open tasks, no current task.`;
  };
  var gateAgeOk = (lastChange, now) => lastChange !== null && now - lastChange <= DONE_WINDOW_DAYS * DAY_MS;
  var trackIdOf = (folder) => folder === null ? "" : folder.split("/").pop() ?? "";
  var r2Card = (base, marker, plan) => {
    const note = plan.kind === "unreadable" ? "Plan unreadable" : "No plan.";
    const column = marker === "b" ? "blocked" : marker === "~" ? "in-progress" : "planned";
    return {
      ...base,
      column,
      position: null,
      marker: null,
      taskText: null,
      note,
      line: column === "blocked" ? "Registry marker [b]." : null,
      doneDate: null,
      doneSource: null,
      archived: false
    };
  };
  var classifyTrack = (input) => {
    const folder = input.folder;
    const base = {
      repo: input.repo,
      title: input.title,
      trackId: trackIdOf(folder),
      registered: input.registryMarker !== null,
      lastChange: input.lastChange
    };
    const done = input.registryMarker === "x" || folder !== null && folder.startsWith("archive/");
    if (done) {
      return {
        ...base,
        column: "done",
        position: null,
        marker: null,
        taskText: null,
        note: null,
        line: null,
        doneDate: input.doneDate,
        doneSource: input.doneSource,
        archived: folder !== null && folder.startsWith("archive/")
      };
    }
    if (input.plan.kind !== "plan") return r2Card(base, input.registryMarker, input.plan);
    const plan = input.plan.plan;
    const tasks = tasksOf(plan);
    if (tasks.length === 0) return r2Card(base, input.registryMarker, input.plan);
    const index = currentIndex(tasks);
    const current2 = index === null ? null : tasks[index] ?? null;
    const position2 = index === null ? null : positionOf(plan, index);
    const marker = current2?.marker ?? null;
    const taskText = current2 === null ? null : taskLabel(current2.text);
    const note = position2 === null ? noteOf(tasks) : null;
    const empty2 = { doneDate: null, doneSource: null, archived: false };
    if (current2 !== null && isGateText(current2.text) && gateAgeOk(input.lastChange, input.now)) {
      return {
        ...base,
        ...empty2,
        column: "waiting",
        position: position2,
        marker,
        taskText,
        note: null,
        line: current2.text
      };
    }
    const openBlocker = tasks.find((task) => task.marker === "b" && isOpen(task));
    if (openBlocker !== void 0) {
      return {
        ...base,
        ...empty2,
        column: "blocked",
        position: position2,
        marker,
        taskText,
        note,
        line: openBlocker.text
      };
    }
    if (current2 !== null && current2.marker === "~") {
      return {
        ...base,
        ...empty2,
        column: "in-progress",
        position: position2,
        marker,
        taskText,
        note: null,
        line: null
      };
    }
    if (current2 !== null) {
      const blocked = input.registryMarker === "b";
      const progressed = input.registryMarker === "~" || tasks.some((task) => task.marker === "x");
      const column = blocked ? "blocked" : progressed ? "in-progress" : "planned";
      return {
        ...base,
        ...empty2,
        column,
        position: position2,
        marker,
        taskText,
        note: null,
        line: blocked ? "Registry marker [b]." : null
      };
    }
    const danielBlocker = tasks.find(
      (task) => task.marker === "b" && isDanielToken(ownerToken(task.text))
    );
    if (danielBlocker !== void 0) {
      return {
        ...base,
        ...empty2,
        column: "waiting",
        position: null,
        marker: null,
        taskText: null,
        note,
        line: danielBlocker.text
      };
    }
    const otherBlocker = tasks.find((task) => task.marker === "b");
    if (otherBlocker !== void 0) {
      return {
        ...base,
        ...empty2,
        column: "blocked",
        position: null,
        marker: null,
        taskText: null,
        note,
        line: otherBlocker.text
      };
    }
    return {
      ...base,
      ...empty2,
      column: "in-progress",
      position: null,
      marker: null,
      taskText: null,
      note,
      line: null
    };
  };
  var buildBoard = (repo, inputs) => ({
    repo,
    cards: inputs.map(classifyTrack)
  });
  var cardLabel = (card) => {
    if (card.column === "blocked") return "BLOCKER";
    if (card.column !== "waiting") return null;
    return card.line !== null && card.line.includes("User Manual Verification") ? "MANUAL CHECK" : "GATE";
  };
  var sortCards = (cards) => [...cards].sort((one, two) => {
    if (one.lastChange === null && two.lastChange === null) return 0;
    if (one.lastChange === null) return 1;
    if (two.lastChange === null) return -1;
    return two.lastChange - one.lastChange;
  });
  var columnView = (board, column, expanded, staleOpen, now) => {
    const cards = board.cards.filter((card) => card.column === column);
    const label = COLUMN_LABELS[column];
    const total = cards.length;
    const sorted = sortCards(cards);
    if (column === "done") {
      return { column, label, total, shown: sorted, hidden: 0, stale: [], staleOpen: false };
    }
    const staleCards = column === "planned" || column === "in-progress" ? sorted.filter(
      (card) => card.lastChange !== null && now - card.lastChange > STALE_DAYS * DAY_MS
    ) : [];
    const fresh = sorted.filter((card) => !staleCards.includes(card));
    const shown = expanded ? fresh : fresh.slice(0, COLUMN_CAP);
    return {
      column,
      label,
      total,
      shown,
      hidden: fresh.length - shown.length,
      stale: staleCards,
      staleOpen: staleCards.length > 0 ? staleOpen : false
    };
  };
  var closedTime = (card) => {
    if (card.lastChange !== null) return card.lastChange;
    if (card.doneDate === null) return null;
    const time = Date.parse(`${card.doneDate}T00:00:00Z`);
    return Number.isNaN(time) ? null : time;
  };
  var doneSummary = (board, now) => {
    const done = board.cards.filter((card) => card.column === "done");
    const closed = done.map((card) => ({ card, time: closedTime(card) })).filter(
      (one) => one.time !== null && now - one.time <= DONE_WINDOW_DAYS * DAY_MS
    );
    closed.sort((one, two) => two.time - one.time);
    const shown = closed.slice(0, DONE_SHOWN).map((one) => one.card);
    return {
      shown,
      more: done.length - shown.length,
      archived: done.filter((card) => card.archived).length,
      notArchived: done.filter((card) => !card.archived).length
    };
  };
  var blockedTracks = (boards) => boards.reduce(
    (sum, board) => sum + board.cards.filter((card) => card.column === "blocked").length,
    0
  );

  // src/measure.ts
  var planPathOf = async (host2, folder) => {
    const index = joinPath(folder, "index.md");
    if ((await host2.stat(index)).kind === "file") {
      const link = findLink((await host2.readFile(index)).content, /\bplan\b/i);
      if (link !== null && (await host2.stat(joinPath(folder, link))).kind === "file") return joinPath(folder, link);
    }
    const plan = joinPath(folder, "plan.md");
    return (await host2.stat(plan)).kind === "file" ? plan : null;
  };
  var empty = (directory) => ({
    directory,
    hasMeasure: false,
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null
  });
  var isNoDirectory = (error) => error instanceof HostRequestError && error.code === "NO_DIRECTORY";
  var loadSnapshot = async (host2, directory) => {
    if (directory === null) return empty(null);
    let measureKind;
    try {
      measureKind = (await host2.stat("measure")).kind;
    } catch (error) {
      if (isNoDirectory(error)) return empty(null);
      return { ...empty(directory), parseError: errorMessage(error) };
    }
    if (measureKind !== "directory") return empty(directory);
    let indexText;
    try {
      if ((await host2.stat("measure/index.md")).kind !== "file") return { ...empty(directory), hasMeasure: true };
      indexText = (await host2.readFile("measure/index.md")).content;
    } catch (error) {
      if (isNoDirectory(error)) return empty(null);
      return { ...empty(directory), hasMeasure: true, parseError: errorMessage(error) };
    }
    const registryLink = indexText === null ? null : findLink(indexText, /Tracks Registry/i);
    const tracksPath = joinPath("measure", registryLink ?? "tracks.md");
    let tracksText;
    try {
      const tracksStat = await host2.stat(tracksPath);
      if (tracksStat.kind !== "file") {
        return {
          ...empty(directory),
          hasMeasure: true,
          tracksPath,
          parseError: `${tracksPath} is not a file`
        };
      }
      tracksText = (await host2.readFile(tracksPath)).content;
    } catch (error) {
      if (isNoDirectory(error)) return empty(null);
      return { ...empty(directory), hasMeasure: true, tracksPath, parseError: errorMessage(error) };
    }
    const tracks = parseTracks(tracksText);
    if (tracks.length === 0 && /^- \[[ ~xb]\] /m.test(tracksText)) {
      return {
        ...empty(directory),
        hasMeasure: true,
        tracksPath,
        parseError: `${tracksPath} has track lines in no known format`
      };
    }
    const plans = /* @__PURE__ */ new Map();
    const planPaths = /* @__PURE__ */ new Map();
    for (const track of tracks.filter((t) => t.marker === "~")) {
      try {
        const path = await planPathOf(host2, joinPath(dirname(tracksPath), track.folder));
        if (path === null) continue;
        plans.set(track.id, parsePlan((await host2.readFile(path)).content));
        planPaths.set(track.id, path);
      } catch (error) {
        if (isNoDirectory(error)) return empty(null);
        continue;
      }
    }
    const inProgressCount = tracks.filter((t) => t.marker === "~").length;
    const base = {
      directory,
      hasMeasure: true,
      tracksPath,
      tracks,
      inProgressCount,
      parseError: null,
      active: null
    };
    const entry = selectActive(tracks, plans);
    if (entry === null) return base;
    const plan = plans.get(entry.id);
    const planPath = planPaths.get(entry.id);
    if (plan === void 0 || planPath === void 0) {
      return { ...base, parseError: `no plan.md for the active track ${entry.id}` };
    }
    if (plan.phases.length === 0) {
      return { ...base, parseError: `${planPath} has no "## Phase" heading` };
    }
    return { ...base, active: { entry, planPath, plan } };
  };
  var errorMessage = (error) => error instanceof Error ? error.message : String(error);

  // src/age.ts
  var MINUTE = 6e4;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;
  var MONTH_DAYS = 30;
  var latestChange = (times) => {
    let out = null;
    for (const time of times) {
      if (time === null) continue;
      if (out === null || time > out) out = time;
    }
    return out;
  };
  var formatAge = (now, then) => {
    const age = now - then;
    if (age < MINUTE) return "<1m";
    if (age < HOUR) return `${Math.floor(age / MINUTE)}m`;
    if (age < DAY) return `${Math.floor(age / HOUR)}h`;
    const days = Math.floor(age / DAY);
    if (days < 60) return `${days}d`;
    return `${Math.floor(days / MONTH_DAYS)}mo`;
  };

  // src/registry.ts
  var ENTRY2 = /^- \[([ ~xb])\] (.*)$/;
  var HEADING = /^#{1,6} /;
  var BOLD = /\*\*(.+?)\*\*/;
  var TITLE_LINK = /^\[([^\]]+)\]\(([^)\s]+)\)/;
  var LINK_STAR = /\*Link: \[[^\]]*\]\(([^)\s]+)\)\*/;
  var LINK_PLAIN = /Link: \[[^\]]*\]\(([^)\s]+)\)/;
  var TITLE_PREFIX = /^(?:Track|Program):\s+/;
  var TITLE_TRACK = /^Track [A-Za-z0-9.]+:\s+/;
  var DONE_WORD = /(?:completed|complete|archived|done)\b[^0-9]{0,24}(\d{4}-\d{2}-\d{2})/i;
  var SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
  var stripPrefix = (title) => title.replace(TITLE_PREFIX, "").replace(TITLE_TRACK, "").trim();
  var titleOf = (rest) => {
    const bold = BOLD.exec(rest);
    if (bold !== null) return stripPrefix(bold[1] ?? rest.trim());
    const link = TITLE_LINK.exec(rest.trim());
    if (link !== null) return stripPrefix(link[1] ?? "");
    return stripPrefix(rest.trim());
  };
  var folderOfTarget = (target) => {
    if (SCHEME.test(target)) return null;
    if (target.startsWith("/") || target.startsWith("~")) return null;
    const trimmed = target.replace(/\/index\.md$/, "").replace(/\/plan\.md$/, "").replace(/\/+$/, "");
    const parts = [];
    for (const segment of trimmed.split("/")) {
      if (segment === "" || segment === ".") continue;
      if (segment === "..") {
        if (parts.length === 0) return null;
        parts.pop();
        continue;
      }
      parts.push(segment);
    }
    if (parts[0] === "measure") parts.shift();
    if (parts.length !== 2) return null;
    const [top, id] = parts;
    if (top !== "tracks" && top !== "archive" || id === void 0 || id === "") return null;
    return `${top}/${id}`;
  };
  var folderDate = (folder) => {
    const name = folder.split("/").pop() ?? folder;
    let out = null;
    for (const match of name.matchAll(/_(\d{4})(\d{2})(\d{2})(?=$|[_-])/g)) {
      const [, year, month, day] = match;
      if (year !== void 0 && month !== void 0 && day !== void 0) out = `${year}-${month}-${day}`;
    }
    return out;
  };
  var targetOf = (lines, start, end, rest) => {
    const range = lines.slice(start, end);
    for (const line of range) {
      const match = LINK_STAR.exec(line);
      if (match !== null) return match[1] ?? null;
    }
    for (const line of range) {
      const match = LINK_PLAIN.exec(line);
      if (match !== null) return match[1] ?? null;
    }
    const link = TITLE_LINK.exec(rest.trim());
    return link === null ? null : link[2] ?? null;
  };
  var parseRegistry = (md) => {
    const lines = md.split("\n");
    const entries = [];
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const entry = ENTRY2.exec(line);
      if (entry === null) continue;
      let end = lines.length;
      for (let next = index + 1; next < lines.length; next += 1) {
        const text = lines[next] ?? "";
        if (ENTRY2.test(text) || HEADING.test(text)) {
          end = next;
          break;
        }
      }
      const rest = entry[2] ?? "";
      const marker = entry[1] ?? " ";
      const target = targetOf(lines, index, end, rest);
      const folder = target === null ? null : folderOfTarget(target);
      let doneDate = null;
      let doneSource = null;
      if (marker === "x") {
        const registry = DONE_WORD.exec(line);
        if (registry !== null) {
          doneDate = registry[1] ?? null;
          doneSource = doneDate === null ? null : "registry";
        }
        if (doneDate === null && folder !== null) {
          const date = folderDate(folder);
          if (date !== null) {
            doneDate = date;
            doneSource = "folder";
          }
        }
      }
      entries.push({ marker, title: titleOf(rest), folder, doneDate, doneSource });
    }
    return entries;
  };

  // src/roster.ts
  var rosterRepo = (id) => ({ id, path: `~/Desktop/${id}` });
  var ROSTER = [
    rosterRepo("reading-advantage-monorepo"),
    rosterRepo("Workbooks"),
    rosterRepo("advantage-pr"),
    rosterRepo("advantage-forge"),
    rosterRepo("mastery-advantage"),
    rosterRepo("ra-math-advantage"),
    rosterRepo("lending-desk-bench"),
    rosterRepo("measure")
  ];
  var measureFile = (repo, relative) => `${repo.path}/measure/${relative}`;

  // src/load.ts
  var MAX_IN_FLIGHT = 8;
  var RELOAD_MS = 6e4;
  var limiter = (max) => {
    let active2 = 0;
    const waiting = [];
    const release = () => {
      const next = waiting.shift();
      if (next !== void 0) next();
    };
    return async (job) => {
      if (active2 >= max) await new Promise((resolve) => waiting.push(resolve));
      active2 += 1;
      try {
        return await job();
      } finally {
        active2 -= 1;
        release();
      }
    };
  };
  var errorCode = (error) => {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = error.code;
      if (typeof code === "string") return code;
    }
    return "UNKNOWN";
  };
  var errorLine = (repo, code) => code === "NOT_FOUND" ? `No Measure tracks file at ${measureFile(repo, "tracks.md")}.` : `Cannot read ${repo.id}: ${code}.`;
  var statTime = async (host2, path, run) => {
    try {
      const result = await run(() => host2.stat(path));
      return result.kind === "missing" ? null : result.mtime;
    } catch {
      return null;
    }
  };
  var lastChangeOf = async (host2, repo, folder, run) => {
    const [plan, metadata] = await Promise.all([
      statTime(host2, measureFile(repo, `${folder}/plan.md`), run),
      statTime(host2, measureFile(repo, `${folder}/metadata.json`), run)
    ]);
    return latestChange([plan, metadata]);
  };
  var directoryNames = (entries) => entries.filter((entry) => entry.kind === "directory").map((entry) => entry.name).sort((one, two) => one < two ? -1 : one > two ? 1 : 0);
  var doneByEntry = (marker, folder) => marker === "x" || folder !== null && folder.startsWith("archive/");
  var loadRepo = async (host2, repo, run) => {
    const now = Date.now();
    const readText = async (path) => (await run(() => host2.readFile(path))).content;
    const list = async (path) => {
      try {
        return (await run(() => host2.listDir(path))).entries;
      } catch (error) {
        if (errorCode(error) === "NOT_FOUND") return [];
        throw error;
      }
    };
    let registryText;
    try {
      registryText = await readText(measureFile(repo, "tracks.md"));
    } catch (error) {
      const code = errorCode(error);
      return { status: "error", repo, code, line: errorLine(repo, code) };
    }
    let tracks;
    let archive;
    try {
      ;
      [tracks, archive] = await Promise.all([
        list(measureFile(repo, "tracks")),
        list(measureFile(repo, "archive"))
      ]);
    } catch (error) {
      const code = errorCode(error);
      return { status: "error", repo, code, line: errorLine(repo, code) };
    }
    const inputs = [];
    const namedTracks = /* @__PURE__ */ new Set();
    const namedArchive = /* @__PURE__ */ new Set();
    for (const entry of parseRegistry(registryText)) {
      const folder = entry.folder;
      if (folder !== null) {
        if (folder.startsWith("tracks/")) namedTracks.add(folder.slice("tracks/".length));
        if (folder.startsWith("archive/")) namedArchive.add(folder.slice("archive/".length));
      }
      let plan = { kind: "missing" };
      let lastChange = null;
      if (folder !== null) {
        if (!doneByEntry(entry.marker, folder)) {
          try {
            const text = await readText(measureFile(repo, `${folder}/plan.md`));
            plan = { kind: "plan", plan: parsePlan(text) };
          } catch (error) {
            plan = { kind: errorCode(error) === "NOT_FOUND" ? "missing" : "unreadable" };
          }
        }
        lastChange = await lastChangeOf(host2, repo, folder, run);
      }
      inputs.push({
        repo: repo.id,
        title: entry.title,
        registryMarker: entry.marker,
        folder,
        plan,
        lastChange,
        doneDate: entry.doneDate,
        doneSource: entry.doneSource,
        now
      });
    }
    for (const name of directoryNames(tracks)) {
      if (namedTracks.has(name)) continue;
      const folder = `tracks/${name}`;
      let plan;
      try {
        const text = await readText(measureFile(repo, `${folder}/plan.md`));
        plan = { kind: "plan", plan: parsePlan(text) };
      } catch (error) {
        if (errorCode(error) === "NOT_FOUND") continue;
        plan = { kind: "unreadable" };
      }
      inputs.push({
        repo: repo.id,
        title: name,
        registryMarker: null,
        folder,
        plan,
        lastChange: await lastChangeOf(host2, repo, folder, run),
        doneDate: null,
        doneSource: null,
        now
      });
    }
    for (const name of directoryNames(archive)) {
      if (namedArchive.has(name)) continue;
      const folder = `archive/${name}`;
      const date = folderDate(folder);
      const doneSource = date === null ? null : "folder";
      inputs.push({
        repo: repo.id,
        title: name,
        registryMarker: null,
        folder,
        plan: { kind: "missing" },
        lastChange: await lastChangeOf(host2, repo, folder, run),
        doneDate: date,
        doneSource,
        now
      });
    }
    return { status: "ready", repo, board: buildBoard(repo.id, inputs) };
  };
  var loadRoster = async (host2, roster, onState) => {
    const run = limiter(MAX_IN_FLIGHT);
    for (const repo of roster) {
      onState(await loadRepo(host2, repo, run));
    }
  };
  var shouldReload = (visible, loading) => visible && !loading;

  // src/render.ts
  var GRANT_BANNER = "Allow file access outside the project in Settings \u2192 Extensions.";
  var ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
  var AGE_TIP = "Time of the last change to plan.md or metadata.json (file time, not a commit time).";
  var clockOf = (time) => {
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toISOString().slice(11, 16);
  };
  var CHEV = '<span class="chev" aria-hidden="true">\u25B8</span>';
  var sectionOpen = (state, ui) => {
    const choice = ui.open[state.repo.id];
    if (choice !== void 0) return choice;
    if (state.status !== "ready") return false;
    return state.board.cards.some(
      (card) => card.column === "blocked" || card.column === "waiting"
    );
  };
  var renderCard = (card, now, comment) => {
    const parts = [];
    const title = escapeHtml(card.title);
    parts.push(`<div class="card-title" title="${title}">${title}</div>`);
    if (card.column !== "done") {
      if (card.position !== null) {
        const position2 = card.position;
        parts.push(
          `<div class="card-pos">Phase ${position2.phase}/${position2.phases} \xB7 Task ${position2.task}/${position2.tasks}</div>`
        );
        const task = escapeHtml(card.taskText ?? "");
        parts.push(
          `<div class="card-task" title="${task}"><span class="marker">[${card.marker ?? " "}]</span> ${task}</div>`
        );
      } else if (card.note !== null) {
        parts.push(`<div class="card-note">${escapeHtml(card.note)}</div>`);
      }
      if (card.line !== null) {
        const label = cardLabel(card) ?? "";
        parts.push(
          `<div class="card-line"><span class="line-label">${label}</span>${escapeHtml(card.line)}</div>`
        );
      }
    }
    if (!card.registered) parts.push('<div class="card-flag">Not in the registry</div>');
    if (card.column === "done" && card.archived === false) {
      parts.push('<div class="card-warn">Not archived</div>');
    }
    if (card.column === "done") {
      const foot = card.doneDate === null ? "No date" : `${card.doneSource === "folder" ? "From" : "Done"} ${card.doneDate}`;
      parts.push(`<div class="card-foot">${foot}</div>`);
    } else {
      const age = card.lastChange === null ? "Updated unknown" : `Updated ${formatAge(now, card.lastChange)}`;
      parts.push(`<div class="card-foot" title="${AGE_TIP}">${age}</div>`);
    }
    if (comment !== void 0) {
      if (comment.status === "sent" && comment.sentAt !== null) {
        parts.push(
          `<div class="comment-state" data-tone="sent">sent ${clockOf(comment.sentAt)}</div>`
        );
      } else if (comment.status === "error" && comment.error !== null) {
        parts.push(
          `<div class="comment-state" data-tone="error">${escapeHtml(comment.error)}</div>`
        );
      }
    }
    const tone2 = card.column === "blocked" || card.column === "waiting" ? card.column : "none";
    return `<li class="card" data-card data-tone="${tone2}">${parts.join("")}</li>`;
  };
  var chipsOf = (board) => {
    const counts = {};
    for (const column of COLUMNS) counts[column] = 0;
    for (const card of board.cards) {
      counts[card.column] = (counts[card.column] ?? 0) + 1;
    }
    const notArchived = board.cards.filter(
      (card) => card.column === "done" && card.archived === false
    ).length;
    const parts = [];
    for (const column of COLUMNS) {
      const count = counts[column] ?? 0;
      const label = COLUMN_LABELS[column];
      if ((column === "blocked" || column === "waiting") && count > 0) {
        parts.push(`<span class="badge" data-tone="${column}">${count} ${label}</span>`);
      } else {
        parts.push(
          `<span class="count" data-zero="${count === 0}"><b>${count}</b> ${label}</span>`
        );
      }
      if (column === "blocked" && notArchived > 0) {
        parts.push(
          `<span class="badge" data-tone="not-archived">${notArchived} Not archived</span>`
        );
      }
    }
    return parts.join("");
  };
  var headerOf = (repoId, open, chips) => `<h2 class="repo-head"><button type="button" class="repo-toggle" data-action="toggle-section" data-repo="${escapeHtml(repoId)}" aria-expanded="${open}"><span class="repo-id">${CHEV}<span class="repo-name">${escapeHtml(repoId)}</span></span><span class="counts">${chips}</span></button></h2>`;
  var columnOf = (board, repoId, column, ui, now) => {
    const key = `${repoId}/${column}`;
    const expanded = ui.expanded[key] === true;
    const staleOpen = (ui.staleOpen ?? {})[key] === true;
    const view = columnView(board, column, expanded, staleOpen, now);
    const parts = [];
    if (column === "done") {
      const summary = doneSummary(board, now);
      const open = ui.doneOpen[repoId] === true;
      parts.push(
        `<button type="button" class="col-toggle" data-action="toggle-done" data-repo="${escapeHtml(repoId)}" aria-expanded="${open}"><span class="col-name">${CHEV}${view.label}</span><span class="col-count">${view.total}</span></button>`
      );
      if (open) {
        if (view.total === 0) {
          parts.push('<p class="empty">None</p>');
        } else if (summary.shown.length === 0) {
          parts.push('<p class="empty">No track closed in the last 14 days</p>');
        } else {
          const groupOpen = (ui.doneGroupOpen ?? {})[repoId] === true;
          parts.push(
            `<button type="button" class="col-toggle" data-action="toggle-done-group" data-repo="${escapeHtml(repoId)}" aria-expanded="${groupOpen}"><span class="col-name">${CHEV}Closed in the last 14 days</span><span class="col-count">${summary.shown.length}</span></button>`
          );
          if (groupOpen) {
            const cards = summary.shown.map((card) => renderCard(card, now)).join("");
            parts.push(`<ul class="cards">${cards}</ul>`);
          }
        }
        parts.push(
          `<p class="col-note">${summary.more} more done, ${summary.archived} archived</p>`
        );
      }
      return `<div class="column" data-column="${column}">${parts.join("")}</div>`;
    }
    parts.push(
      `<div class="col-head"><span class="col-name">${view.label}</span><span class="col-count">${view.total}</span></div>`
    );
    if (view.total === 0) {
      parts.push('<p class="empty">None</p>');
    } else if (view.shown.length > 0) {
      const cards = view.shown.map((card) => renderCard(card, now)).join("");
      parts.push(`<ul class="cards">${cards}</ul>`);
    }
    if (view.hidden > 0) {
      parts.push(
        `<button type="button" class="more" data-action="show-more" data-repo="${escapeHtml(repoId)}" data-column="${column}">Show ${view.hidden} more</button>`
      );
    }
    if (view.stale.length > 0) {
      parts.push(
        `<button type="button" class="more stale-toggle" data-action="toggle-stale" data-repo="${escapeHtml(repoId)}" data-column="${column}" aria-expanded="${staleOpen}" title="No change to plan.md or metadata.json in 30 days">${CHEV} Stale (${view.stale.length})</button>`
      );
      if (staleOpen) {
        const cards = view.stale.map((card) => renderCard(card, now)).join("");
        parts.push(`<ul class="cards stale-cards">${cards}</ul>`);
      }
    }
    return `<div class="column" data-column="${column}">${parts.join("")}</div>`;
  };
  var renderSection = (state, ui, now) => {
    const repoId = state.repo.id;
    if (state.status === "loading") {
      const chips = '<span class="count" data-zero="true"><b>0</b> Loading</span>';
      return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, false, chips)}</section>`;
    }
    if (state.status === "error") {
      const line = `<p class="empty">${escapeHtml(state.line)}</p>`;
      return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, false, "")}${line}</section>`;
    }
    const open = sectionOpen(state, ui);
    const columns = COLUMNS.map((column) => columnOf(state.board, repoId, column, ui, now)).join("");
    const board = `<div class="board"${open ? "" : " hidden"}>${columns}</div>`;
    return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, open, chipsOf(state.board))}${board}</section>`;
  };
  var blockedOf = (view) => blockedTracks(view.states.flatMap((state) => state.status === "ready" ? [state.board] : []));
  var waitingOf = (view) => view.states.flatMap((state) => state.status === "ready" ? [state.board] : []).reduce(
    (sum, board) => sum + board.cards.filter((card) => card.column === "waiting").length,
    0
  );
  var renderPage = (view) => {
    const blocked = blockedOf(view);
    const waiting = waitingOf(view);
    const summary = [];
    if (blocked > 0) {
      summary.push(`<span class="badge" data-tone="blocked">${blocked} Blocked</span>`);
    }
    if (waiting > 0) {
      summary.push(
        `<span class="badge" data-tone="waiting">${waiting} Waiting on Daniel</span>`
      );
    }
    const needsGrant = view.states.some(
      (state) => state.status === "error" && state.code === "NOT_GRANTED"
    );
    const banner = needsGrant ? `<div class="grant-banner" role="status">${escapeHtml(GRANT_BANNER)}</div>` : "";
    const label = view.busy ? "Refreshing" : "Refresh";
    const busy2 = view.busy ? ' disabled="disabled"' : "";
    const head = `<header class="page-head"><h1 class="page-title">Measure board</h1><div class="page-summary">${summary.join("")}</div><button type="button" class="btn" data-action="refresh"${busy2}>${label}</button></header>`;
    const sections = view.states.map((state) => renderSection(state, view.ui, view.now)).join("");
    return `<div class="mb"><div class="page">${banner}${head}<main>${sections}</main></div></div>`;
  };

  // src/styles.ts
  var BOARD_CSS = `
.mb { font-size: 14px; line-height: 1.45; -webkit-text-size-adjust: 100%; margin: 0; font-family: var(--oc-font); background: var(--oc-bg); color: var(--oc-fg); }
.mb, .mb *, .mb *::before, .mb *::after { box-sizing: border-box; }
.mb [hidden] { display: none !important; }
.mb button { font: inherit; color: inherit; }
.mb :focus-visible { outline: 2px solid var(--oc-focus); outline-offset: 2px; }
.mb .page { max-width: 1400px; margin: 0 auto; padding: 16px; }
.mb .page-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 16px; }
.mb .page-title { margin: 0; font-size: 1.35rem; font-weight: 650; flex: 1 1 auto; min-width: 0; }
.mb .page-meta { flex: 1 1 100%; margin: 0; color: var(--oc-muted); font-size: 0.9rem; order: 3; }
.mb .page-summary { display: flex; flex-wrap: wrap; gap: 6px; }
.mb .grant-banner { margin: 0 0 12px; padding: 8px 12px; border: 1px solid var(--oc-warning); border-radius: var(--oc-radius); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); color: var(--oc-warning-text); }
.mb .btn { min-height: 40px; padding: 8px 14px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); cursor: pointer; }
.mb .btn:hover { background: var(--oc-hover); }
.mb .btn:active { background: var(--oc-active); }
.mb .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--oc-border); font-size: 0.85rem; font-weight: 600; }
.mb .badge[data-tone="blocked"] { color: var(--oc-error-text); border-color: var(--oc-error); background: color-mix(in srgb, var(--oc-error) 14%, transparent); }
.mb .badge[data-tone="waiting"] { color: var(--oc-warning-text); border-color: var(--oc-warning); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); }
.mb .repo { margin: 0 0 12px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); }
.mb .repo-head { margin: 0; font-size: 1rem; font-weight: 400; }
.mb .repo-toggle { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; width: 100%; min-height: 44px; padding: 8px 12px; border: 0; border-radius: var(--oc-radius); background: transparent; text-align: left; cursor: pointer; }
.mb .repo-toggle:hover { background: var(--oc-hover); }
.mb .repo-id { display: flex; align-items: center; gap: 8px; flex: 1 1 14rem; min-width: 0; }
.mb .repo-name { font-weight: 650; overflow-wrap: anywhere; }
.mb .chev { display: inline-block; width: 1em; color: var(--oc-muted); transition: transform 120ms; }
.mb .repo-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .counts { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; flex: 0 1 auto; min-width: 0; font-size: 0.9rem; color: var(--oc-muted); }
.mb .count b { font-family: var(--oc-mono); font-weight: 600; color: var(--oc-fg); }
.mb .count[data-zero="true"] b { color: var(--oc-subtle); }
.mb .board { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px; padding: 4px 12px 12px; }
.mb .column { flex: 1 1 220px; min-width: 220px; max-width: 320px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-muted-surface); padding: 8px; }
.mb .col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; padding: 0 2px 6px; }
.mb .col-name { font-size: 0.8rem; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; color: var(--oc-muted); }
.mb .col-count { font-family: var(--oc-mono); font-size: 0.85rem; color: var(--oc-muted); }
.mb .col-toggle { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 40px; padding: 4px 8px; border: 1px dashed var(--oc-border); border-radius: var(--oc-radius); background: transparent; cursor: pointer; text-align: left; }
.mb .col-toggle:hover { background: var(--oc-hover); }
.mb .col-toggle .col-name { display: inline-flex; align-items: center; gap: 6px; }
.mb .col-toggle[aria-expanded="true"] { margin-bottom: 8px; }
.mb .col-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mb .empty { margin: 4px 2px 6px; color: var(--oc-subtle); font-size: 0.9rem; }
.mb .col-note { margin: 8px 2px 0; color: var(--oc-muted); font-size: 0.8rem; }
.mb .more { display: block; width: 100%; min-height: 40px; margin-top: 8px; padding: 6px 10px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); cursor: pointer; }
.mb .more:hover { background: var(--oc-hover); }
.mb .stale-toggle { border-style: dashed; background: transparent; color: var(--oc-muted); text-align: left; }
.mb .stale-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .stale-cards { margin-top: 8px; }
.mb .card { padding: 10px; border: 1px solid var(--oc-border); border-left-width: 3px; border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); overflow-wrap: anywhere; min-width: 0; }
.mb .card[data-tone="blocked"] { border-left-color: var(--oc-error); }
.mb .card[data-tone="waiting"] { border-left-color: var(--oc-warning); }
.mb .card-title { font-weight: 600; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.mb .card-pos { margin-top: 4px; font-size: 0.85rem; color: var(--oc-muted); }
.mb .card-task { margin-top: 2px; color: var(--oc-fg); overflow-wrap: anywhere; }
.mb .marker { font-family: var(--oc-mono); color: var(--oc-muted); }
.mb .card-note { margin-top: 4px; font-size: 0.85rem; color: var(--oc-muted); font-style: italic; }
.mb .card-line { margin-top: 6px; font-size: 0.85rem; overflow-wrap: anywhere; }
.mb .line-label { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--oc-border); font-size: 0.75rem; font-weight: 650; text-transform: uppercase; letter-spacing: 0.03em; }
.mb .card[data-tone="blocked"] .line-label { color: var(--oc-error-text); border-color: var(--oc-error); }
.mb .card[data-tone="waiting"] .line-label { color: var(--oc-warning-text); border-color: var(--oc-warning); }
.mb .card-flag { margin-top: 6px; font-size: 0.8rem; color: var(--oc-info-text); }
.mb .card-foot { margin-top: 6px; font-size: 0.8rem; color: var(--oc-subtle); }
.mb .card-warn { margin-top: 6px; font-size: 0.8rem; font-weight: 600; color: var(--oc-warning-text); }
.mb .comment { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--oc-border); }
.mb .comment-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.mb .comment-open { min-height: 40px; padding: 4px 12px; font-size: 0.8rem; }
.mb .comment-panel { margin-top: 8px; }
.mb .comment-label { display: block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 600; color: var(--oc-muted); }
.mb .comment-input { display: block; width: 100%; max-width: 100%; min-height: 40px; padding: 6px 8px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-bg); color: var(--oc-fg); font: inherit; font-size: 0.85rem; resize: vertical; }
.mb .comment-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-top: 6px; }
.mb .comment-send { min-height: 40px; padding: 6px 12px; font-size: 0.9rem; }
.mb .comment-send[disabled] { opacity: 0.55; cursor: not-allowed; }
.mb .comment-state { font-size: 0.8rem; color: var(--oc-muted); overflow-wrap: anywhere; }
.mb .comment-state[data-tone="sent"] { color: var(--oc-success-text); }
.mb .comment-state[data-tone="error"] { color: var(--oc-error-text); }
.mb .badge[data-tone="not-archived"] { color: var(--oc-warning-text); border-color: var(--oc-warning); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); }
.mb #debug { margin-top: 12px; font-family: var(--oc-mono); font-size: 12px; color: var(--oc-muted); overflow-wrap: anywhere; }
@media (max-width: 639.98px) {
.mb .page { padding: 12px; }
.mb .board { flex-direction: column; flex-wrap: nowrap; align-items: stretch; padding: 4px 8px 8px; }
.mb .column { flex: 0 0 auto; width: 100%; min-width: 0; max-width: none; }
.mb .repo-id, .mb .counts { flex-basis: 100%; }
}`;

  // panel/main.ts
  var host = connectHost();
  var root = document.querySelector("#root");
  var style = document.createElement("style");
  style.textContent = BOARD_CSS;
  document.head.appendChild(style);
  var states = [];
  var userOpen = {};
  var userDoneOpen = {};
  var userDoneGroupOpen = {};
  var userExpanded = {};
  var userStaleOpen = {};
  var busy = false;
  var current = null;
  var surface = "panel";
  var timer = null;
  var openDefaults = () => {
    const out = {};
    if (window.innerWidth >= 640) return out;
    let first = true;
    for (const state of states) {
      if (state.status !== "ready") continue;
      const attention = state.board.cards.some(
        (card) => card.column === "blocked" || card.column === "waiting"
      );
      out[state.repo.id] = attention && first;
      if (attention && first) first = false;
    }
    return out;
  };
  var uiOf = () => ({
    open: { ...openDefaults(), ...userOpen },
    doneOpen: { ...userDoneOpen },
    expanded: { ...userExpanded },
    staleOpen: { ...userStaleOpen },
    doneGroupOpen: { ...userDoneGroupOpen }
  });
  var openOf = (repo) => {
    const state = states.find((one) => one.repo.id === repo);
    if (state === void 0) return false;
    return sectionOpen(state, uiOf());
  };
  var refreshBadge = async () => {
    const boards = states.flatMap(
      (state) => state.status === "ready" ? [state.board] : []
    );
    const count = blockedTracks(boards);
    await host.setBadge(count > 0 ? count : null);
  };
  var paint = () => {
    if (surface === "status") {
      paintStatus();
      return;
    }
    root.innerHTML = renderPage({ states, ui: uiOf(), now: Date.now(), busy });
    bind();
  };
  var paintStatus = () => {
    root.textContent = "";
    if (current === null) {
      root.appendChild(plainLine("Measure: no project open"));
    } else {
      const line = bandLine(current);
      if (line === null) {
        root.appendChild(plainLine("Measure: project has no measure/ folder"));
      } else {
        root.appendChild(bandElement(line, current.parseError !== null));
      }
    }
    void host.setHeight(48);
  };
  var bandElement = (line, error) => {
    const element = document.createElement("div");
    element.className = error ? "band band-error" : "band";
    const marker = /\[([ ~xb])\]/.exec(line);
    if (marker === null) {
      element.textContent = line;
      return element;
    }
    const value = marker[1] ?? " ";
    const before = line.slice(0, marker.index);
    const after = line.slice(marker.index + 3);
    const span = document.createElement("span");
    span.className = markerClassName(value);
    span.textContent = `[${value}]`;
    element.append(before, span, after);
    return element;
  };
  var plainLine = (text) => {
    const element = document.createElement("div");
    element.className = "band";
    element.textContent = text;
    return element;
  };
  var loadBoard = async () => {
    if (busy) return;
    busy = true;
    states = ROSTER.map((repo) => ({ status: "loading", repo }));
    paint();
    await loadRoster(host, ROSTER, (state) => {
      states = states.map((one) => one.repo.id === state.repo.id ? state : one);
      paint();
      void refreshBadge();
    });
    busy = false;
    paint();
    await refreshBadge();
  };
  var loadBand = async (directory) => {
    current = await loadSnapshot(host, directory);
    paint();
  };
  var startTimer = () => {
    if (timer !== null) return;
    timer = window.setInterval(() => {
      if (!shouldReload(document.visibilityState === "visible", busy)) return;
      void loadBoard();
    }, RELOAD_MS);
  };
  var bind = () => {
    for (const button2 of root.querySelectorAll("[data-action]")) {
      button2.addEventListener("click", onAction);
    }
  };
  var onAction = (event) => {
    const button2 = event.currentTarget;
    if (!(button2 instanceof HTMLElement)) return;
    const action = button2.getAttribute("data-action");
    const repo = button2.getAttribute("data-repo");
    const column = button2.getAttribute("data-column");
    if (action === "refresh") {
      void loadBoard();
      return;
    }
    if (repo === null) return;
    if (action === "toggle-section") {
      userOpen[repo] = !openOf(repo);
      paint();
      return;
    }
    if (action === "toggle-done") {
      userDoneOpen[repo] = !(userDoneOpen[repo] ?? false);
      paint();
      return;
    }
    if (action === "toggle-done-group") {
      userDoneGroupOpen[repo] = !(userDoneGroupOpen[repo] ?? false);
      paint();
      return;
    }
    if (column === null) return;
    const key = `${repo}/${column}`;
    if (action === "show-more") {
      userExpanded[key] = true;
      paint();
      return;
    }
    if (action === "toggle-stale") {
      const staleOpen = (uiOf().staleOpen ?? {})[key] ?? false;
      userStaleOpen[key] = !staleOpen;
      paint();
    }
  };
  var mountedOnce = false;
  host.onReady((ctx) => {
    applyHostReady(ctx, document.documentElement);
    surface = ctx.surface;
    if (!mountedOnce) {
      mountedOnce = true;
      host.onDirectory((directory) => {
        void loadBand(directory);
      });
      if (surface === "status") {
        void loadBand(ctx.directory);
      } else {
        startTimer();
        void loadBoard();
      }
    }
    paint();
  });
})();
