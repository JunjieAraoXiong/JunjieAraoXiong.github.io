(() => {
  const cards = [...document.querySelectorAll('[data-resource-card]')];
  const search = document.querySelector('[data-resource-search]');
  const filters = [...document.querySelectorAll('[data-resource-filter]')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty-state]');
  let activeFilter = 'all';

  const normalize = (value) => (value || '').toLowerCase().trim();

  const updateCatalog = () => {
    if (!cards.length) return;
    const query = normalize(search?.value);
    let visible = 0;

    cards.forEach((card) => {
      const kinds = normalize(card.dataset.kind).split(/\s+/);
      const searchable = normalize(`${card.textContent} ${card.dataset.search || ''}`);
      const matchesFilter = activeFilter === 'all' || kinds.includes(activeFilter);
      const matchesSearch = !query || searchable.includes(query);
      const show = matchesFilter && matchesSearch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (count) count.textContent = `${visible} resource${visible === 1 ? '' : 's'}`;
    if (empty) empty.hidden = visible !== 0;
  };

  search?.addEventListener('input', updateCatalog);
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.resourceFilter || 'all';
      filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      updateCatalog();
    });
  });
  updateCatalog();

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
