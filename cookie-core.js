// 扩展页面共享的核心逻辑：配置读写、Cookie 过滤与结果格式化。
const CookieCore = (function () {
  "use strict";

  const DEFAULTS = {
    keys: [],
    format: "header",
    ignoreCase: true,
    sortByInput: true,
  };

  const FORMATS = ["header", "headerCompact", "lines", "json"];

  function parseKeys(text) {
    const raw = String(text == null ? "" : text).split(/[\n,，;；\s]+/);
    const seen = new Set();
    const keys = [];
    for (const item of raw) {
      const key = item.trim();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
    return keys;
  }

  function normalizeKey(key, ignoreCase) {
    const value = String(key == null ? "" : key).trim();
    return ignoreCase ? value.toLowerCase() : value;
  }

  function loadSettings() {
    return new Promise(function (resolve) {
      if (
        typeof chrome === "undefined" ||
        !chrome.storage ||
        !chrome.storage.sync
      ) {
        resolve(Object.assign({}, DEFAULTS));
        return;
      }
      chrome.storage.sync.get(DEFAULTS, function (stored) {
        resolve(sanitize(stored));
      });
    });
  }

  function saveSettings(settings) {
    const clean = sanitize(settings);
    return new Promise(function (resolve) {
      if (
        typeof chrome === "undefined" ||
        !chrome.storage ||
        !chrome.storage.sync
      ) {
        resolve(clean);
        return;
      }
      chrome.storage.sync.set(clean, function () {
        resolve(clean);
      });
    });
  }

  function sanitize(input) {
    const source = input && typeof input === "object" ? input : {};
    const keys = Array.isArray(source.keys)
      ? source.keys
      : parseKeys(source.keys);
    const format =
      FORMATS.indexOf(source.format) >= 0 ? source.format : DEFAULTS.format;
    return {
      keys: keys
        .map(function (key) {
          return String(key).trim();
        })
        .filter(Boolean),
      format: format,
      ignoreCase: source.ignoreCase === true,
      sortByInput: source.sortByInput !== false,
    };
  }

  // 从当前站点的全部 Cookie 中挑出配置指定的键。
  // keys 为空时返回全部 Cookie。
  function filterCookies(cookies, settings) {
    const list = Array.isArray(cookies) ? cookies : [];
    const conf = sanitize(settings);
    const ignoreCase = conf.ignoreCase;

    if (!conf.keys.length) {
      return list.map(function (cookie) {
        return { name: cookie.name, value: cookie.value };
      });
    }

    const byKey = new Map();
    list.forEach(function (cookie) {
      const normalized = normalizeKey(cookie.name, ignoreCase);
      if (!byKey.has(normalized)) {
        byKey.set(normalized, cookie);
      }
    });

    const matched = [];
    const picked = new Set();
    conf.keys.forEach(function (key) {
      const normalized = normalizeKey(key, ignoreCase);
      const cookie = byKey.get(normalized);
      if (!cookie || picked.has(cookie.name)) return;
      picked.add(cookie.name);
      matched.push({ name: cookie.name, value: cookie.value });
    });

    if (conf.sortByInput) {
      return matched;
    }

    const rank = new Map();
    matched.forEach(function (item, index) {
      rank.set(item.name, index);
    });
    return list
      .filter(function (cookie) {
        return rank.has(cookie.name);
      })
      .map(function (cookie) {
        return { name: cookie.name, value: cookie.value };
      });
  }

  function joinPairs(list, separator) {
    return list
      .map(function (item) {
        return item.name + "=" + item.value;
      })
      .join(separator);
  }

  function formatResult(items, format) {
    const list = Array.isArray(items) ? items : [];
    if (format === "json") {
      const obj = {};
      list.forEach(function (item) {
        obj[item.name] = item.value;
      });
      return JSON.stringify(obj, null, 2);
    }
    if (format === "lines") {
      return joinPairs(list, "\n");
    }
    if (format === "headerCompact") {
      return joinPairs(list, ";");
    }
    return joinPairs(list, "; ");
  }

  async function copyText(text) {
    const value = String(text == null ? "" : text);
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {
      return copyViaTextarea(value);
    }
  }

  function copyViaTextarea(value) {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  return {
    DEFAULTS: DEFAULTS,
    parseKeys: parseKeys,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    sanitize: sanitize,
    filterCookies: filterCookies,
    formatResult: formatResult,
    copyText: copyText,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CookieCore;
}
