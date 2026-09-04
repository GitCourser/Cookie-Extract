const keysEl = document.getElementById('keys');
const formatEl = document.getElementById('format');
const ignoreCaseEl = document.getElementById('ignoreCase');
const sortByInputEl = document.getElementById('sortByInput');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text || '';
}

function fill(settings) {
  keysEl.value = settings.keys.join(', ');
  formatEl.value = settings.format;
  ignoreCaseEl.checked = settings.ignoreCase;
  sortByInputEl.checked = settings.sortByInput;
}

function collect() {
  return {
    keys: CookieCore.parseKeys(keysEl.value),
    format: formatEl.value,
    ignoreCase: ignoreCaseEl.checked,
    sortByInput: sortByInputEl.checked
  };
}

saveBtn.addEventListener('click', async function () {
  await CookieCore.saveSettings(collect());
  setStatus('已保存');
  setTimeout(function () {
    setStatus('');
  }, 2000);
});

resetBtn.addEventListener('click', function () {
  fill(CookieCore.DEFAULTS);
  setStatus('已恢复默认设置，记得保存');
});

CookieCore.loadSettings().then(fill);
