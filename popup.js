const siteEl = document.getElementById('site');
const resultEl = document.getElementById('result');
const listEl = document.getElementById('list');
const countEl = document.getElementById('countLabel');
const emptyTipEl = document.getElementById('emptyTip');
const messageEl = document.getElementById('message');
const copyBtn = document.getElementById('copyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const optionsBtn = document.getElementById('openOptions');

function setMessage(text) {
  messageEl.textContent = text || '';
}

async function getActiveTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];
  if (!tab || !tab.url) return null;
  return tab.url;
}

function canReadCookies(url) {
  if (!url) return false;
  return /^https?:/i.test(url);
}

function renderList(items) {
  listEl.textContent = '';
  items.forEach(function (item) {
    const li = document.createElement('li');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = item.value;
    value.title = item.value;

    const copy = document.createElement('button');
    copy.className = 'copy';
    copy.type = 'button';
    copy.textContent = '复制';
    copy.addEventListener('click', async function () {
      const ok = await CookieCore.copyText(item.value);
      setMessage(ok ? '已复制 ' + item.name + ' 的值' : '复制失败，请手动选中复制');
    });

    li.appendChild(name);
    li.appendChild(value);
    li.appendChild(copy);
    listEl.appendChild(li);
  });
}

async function extract() {
  setMessage('');
  copyBtn.disabled = true;

  const url = await getActiveTabUrl();
  if (!canReadCookies(url)) {
    siteEl.textContent = '无法读取当前页面';
    countEl.textContent = '0 项';
    resultEl.value = '';
    renderList([]);
    emptyTipEl.classList.remove('hidden');
    emptyTipEl.textContent = '请在普通的 http/https 页面上使用本扩展。';
    setMessage('当前页面不是 http/https 站点，无法读取 Cookie。');
    return;
  }

  let host = url;
  try {
    host = new URL(url).host;
  } catch (err) {
    host = url;
  }
  siteEl.textContent = host;

  const settings = await CookieCore.loadSettings();

  let cookies = [];
  try {
    cookies = await chrome.cookies.getAll({ url: url });
  } catch (err) {
    setMessage('读取 Cookie 失败：' + (err && err.message ? err.message : err));
    return;
  }

  const items = CookieCore.filterCookies(cookies, settings);
  resultEl.value = CookieCore.formatResult(items, settings.format);
  countEl.textContent = items.length + ' / ' + cookies.length + ' 项';
  copyBtn.disabled = items.length === 0;
  renderList(items);

  if (!items.length) {
    emptyTipEl.classList.remove('hidden');
    emptyTipEl.textContent = settings.keys.length
      ? '当前站点没有匹配到已配置的键。'
      : '当前站点没有 Cookie。';
  } else {
    emptyTipEl.classList.add('hidden');
  }
}

copyBtn.addEventListener('click', async function () {
  const text = resultEl.value;
  if (!text) return;
  const ok = await CookieCore.copyText(text);
  setMessage(ok ? '结果已复制到剪贴板' : '复制失败，请手动选中复制');
});

refreshBtn.addEventListener('click', function () {
  extract();
});

optionsBtn.addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

document.addEventListener('DOMContentLoaded', function () {
  extract();
});
