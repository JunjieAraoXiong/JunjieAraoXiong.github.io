(() => {
  const checks = [...document.querySelectorAll('[data-practice-check]')];
  const progressText = document.querySelector('[data-progress-text]');
  const progressValue = document.querySelector('[data-progress-value]');
  const clearButton = document.querySelector('[data-progress-clear]');
  const scope = document.body.dataset.progressScope || location.pathname;

  const storageKey = (item) => `recruiting-progress:${scope}:${item.dataset.item}`;

  const updateProgress = () => {
    if (!checks.length) return;
    const complete = checks.filter((item) => item.checked).length;
    const percent = Math.round((complete / checks.length) * 100);
    if (progressText) progressText.textContent = `${complete} of ${checks.length} complete`;
    if (progressValue) {
      progressValue.style.width = `${percent}%`;
      progressValue.parentElement?.setAttribute('aria-valuenow', String(percent));
    }
  };

  checks.forEach((item) => {
    try {
      item.checked = localStorage.getItem(storageKey(item)) === 'true';
    } catch (_) {
      // Progress still works for this visit when storage is unavailable.
    }
    item.addEventListener('change', () => {
      try {
        localStorage.setItem(storageKey(item), String(item.checked));
      } catch (_) {
        // Do not block the checklist if storage is unavailable.
      }
      updateProgress();
    });
  });

  clearButton?.addEventListener('click', () => {
    checks.forEach((item) => {
      item.checked = false;
      try {
        localStorage.removeItem(storageKey(item));
      } catch (_) {
        // The visual reset still succeeds without storage.
      }
    });
    updateProgress();
  });

  updateProgress();
})();
