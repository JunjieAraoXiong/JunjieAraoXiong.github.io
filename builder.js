/**
 * Entry Builder - Client-side section generator for GitHub Pages
 * Stores entries in localStorage and renders them in Jon Barron template style
 */

const STORAGE_KEY = 'siteBuilderEntries';

// ============ Storage Functions ============

function getEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function generateId() {
  return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============ Entry HTML Generation ============

function generateEntryHTML(entry, includeControls = false) {
  const safeId = entry.id.replace(/[^a-zA-Z0-9]/g, '_');
  const bgColor = entry.highlighted ? ' bgcolor="#ffffd0"' : '';

  // Build links HTML
  let linksHTML = '';
  if (entry.links && entry.links.length > 0) {
    linksHTML = entry.links
      .filter(l => l.label && l.url)
      .map(l => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
      .join('\n        /\n        ');
    if (linksHTML) {
      linksHTML = '<br>\n        ' + linksHTML;
    }
  }

  // Build bullets HTML
  let bulletsHTML = '';
  if (entry.bullets && entry.bullets.length > 0) {
    const validBullets = entry.bullets.filter(b => b.trim());
    if (validBullets.length > 0) {
      bulletsHTML = '<ul style="margin: 8px 0; padding-left: 20px;">' +
        validBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('') +
        '</ul>';
    }
  }

  // Build description HTML
  let descriptionHTML = '';
  if (entry.description) {
    descriptionHTML = `<p>${escapeHtml(entry.description).replace(/\n/g, '<br>')}</p>`;
  }

  // Build venue HTML
  let venueHTML = '';
  if (entry.venue) {
    venueHTML = `<br>\n        <em>${escapeHtml(entry.venue)}</em>`;
  }

  // Build type badge
  const typeBadge = `<span style="font-size:11px;background:#eee;padding:2px 6px;border-radius:8px;margin-left:8px;">${entry.type}</span>`;

  // Build image HTML
  let imageHTML = '';
  if (entry.imageUrl) {
    imageHTML = `
        <div class="one">
          <img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.imageAlt || '')}" width="100%" style="max-width:160px;">
        </div>`;
  } else {
    // Placeholder when no image
    imageHTML = `
        <div class="one" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">
          No image
        </div>`;
  }

  // Build controls HTML (for builder page)
  let controlsHTML = '';
  if (includeControls) {
    controlsHTML = `
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #ddd;">
          <button onclick="editEntry('${entry.id}')" class="btn btn-secondary btn-small">Edit</button>
          <button onclick="deleteEntry('${entry.id}')" class="btn btn-danger btn-small">Delete</button>
          <button onclick="copyEntryHTML('${entry.id}')" class="btn btn-secondary btn-small">Copy HTML</button>
          <button onclick="copyEntryJSON('${entry.id}')" class="btn btn-secondary btn-small">Copy JSON</button>
        </div>`;
  }

  return `
    <tr data-entry-id="${entry.id}"${bgColor}>
      <td style="padding:16px;width:20%;vertical-align:middle">
${imageHTML}
      </td>
      <td style="padding:8px;width:80%;vertical-align:middle">
        <span class="papertitle">${escapeHtml(entry.title)}</span>${typeBadge}
        ${venueHTML}
        ${linksHTML}
        <p></p>
        ${descriptionHTML}
        ${bulletsHTML}
        ${controlsHTML}
      </td>
    </tr>`;
}

function generateCleanEntryHTML(entry) {
  // Generate HTML without controls for export/copying
  const safeId = entry.id.replace(/[^a-zA-Z0-9]/g, '_');
  const bgColor = entry.highlighted ? ' bgcolor="#ffffd0"' : '';

  let linksHTML = '';
  if (entry.links && entry.links.length > 0) {
    linksHTML = entry.links
      .filter(l => l.label && l.url)
      .map(l => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
      .join('\n        /\n        ');
    if (linksHTML) {
      linksHTML = '<br>\n        ' + linksHTML;
    }
  }

  let bulletsHTML = '';
  if (entry.bullets && entry.bullets.length > 0) {
    const validBullets = entry.bullets.filter(b => b.trim());
    if (validBullets.length > 0) {
      bulletsHTML = '<ul style="margin: 8px 0; padding-left: 20px;">' +
        validBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('') +
        '</ul>';
    }
  }

  let descriptionHTML = '';
  if (entry.description) {
    descriptionHTML = `<p>${escapeHtml(entry.description).replace(/\n/g, '<br>')}</p>`;
  }

  let venueHTML = '';
  if (entry.venue) {
    venueHTML = `<br>\n        <em>${escapeHtml(entry.venue)}</em>`;
  }

  let imageHTML = '';
  if (entry.imageUrl) {
    imageHTML = `
        <div class="one">
          <img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.imageAlt || '')}" width="100%" style="max-width:160px;">
        </div>`;
  }

  return `
    <tr${bgColor}>
      <td style="padding:16px;width:20%;vertical-align:middle">
${imageHTML}
      </td>
      <td style="padding:8px;width:80%;vertical-align:middle">
        <span class="papertitle">${escapeHtml(entry.title)}</span>
        ${venueHTML}
        ${linksHTML}
        <p></p>
        ${descriptionHTML}
        ${bulletsHTML}
      </td>
    </tr>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ Form Handling ============

function getFormData() {
  const bullets = [];
  document.querySelectorAll('#bulletsList input').forEach(input => {
    if (input.value.trim()) {
      bullets.push(input.value.trim());
    }
  });

  const links = [];
  document.querySelectorAll('#linksList .dynamic-item').forEach(item => {
    const label = item.querySelector('.link-label')?.value?.trim();
    const url = item.querySelector('.link-url')?.value?.trim();
    if (label && url) {
      links.push({ label, url });
    }
  });

  return {
    type: document.getElementById('entryType').value,
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    venue: document.getElementById('venue').value.trim(),
    highlighted: document.getElementById('highlighted').checked,
    bullets: bullets,
    links: links,
    imageUrl: document.getElementById('imageUrl').value.trim(),
    imageAlt: document.getElementById('imageAlt').value.trim()
  };
}

function setFormData(entry) {
  document.getElementById('entryType').value = entry.type || 'project';
  document.getElementById('title').value = entry.title || '';
  document.getElementById('description').value = entry.description || '';
  document.getElementById('venue').value = entry.venue || '';
  document.getElementById('highlighted').checked = entry.highlighted || false;
  document.getElementById('imageUrl').value = entry.imageUrl || '';
  document.getElementById('imageAlt').value = entry.imageAlt || '';

  // Clear and populate bullets
  document.getElementById('bulletsList').innerHTML = '';
  if (entry.bullets && entry.bullets.length > 0) {
    entry.bullets.forEach(b => addBullet(b));
  }

  // Clear and populate links
  document.getElementById('linksList').innerHTML = '';
  if (entry.links && entry.links.length > 0) {
    entry.links.forEach(l => addLink(l.label, l.url));
  }

  updateImagePreview();
}

function clearForm() {
  document.getElementById('entryForm').reset();
  document.getElementById('editingId').value = '';
  document.getElementById('bulletsList').innerHTML = '';
  document.getElementById('linksList').innerHTML = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('submitBtn').textContent = 'Add Entry';
  updatePreview();
}

// ============ Dynamic List Handlers ============

function addBullet(value = '') {
  const container = document.getElementById('bulletsList');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <input type="text" placeholder="Bullet point..." value="${escapeHtml(value)}" oninput="updatePreview()">
    <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove(); updatePreview();">x</button>
  `;
  container.appendChild(div);
}

function addLink(label = '', url = '') {
  const container = document.getElementById('linksList');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <input type="text" class="link-label" placeholder="Label" value="${escapeHtml(label)}" oninput="updatePreview()">
    <input type="url" class="link-url" placeholder="https://..." value="${escapeHtml(url)}" oninput="updatePreview()">
    <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove(); updatePreview();">x</button>
  `;
  container.appendChild(div);
}

// ============ Preview ============

function updatePreview() {
  const data = getFormData();
  const container = document.getElementById('previewContainer');

  if (!data.title) {
    container.innerHTML = `
      <tr>
        <td colspan="2" style="padding:16px;color:#999;text-align:center;">
          Fill out the form to see a preview...
        </td>
      </tr>`;
    return;
  }

  const entry = {
    id: 'preview',
    ...data
  };

  container.innerHTML = generateEntryHTML(entry, false);
}

function updateImagePreview() {
  const url = document.getElementById('imageUrl').value.trim();
  const preview = document.getElementById('imagePreview');

  if (url) {
    preview.src = url;
    preview.style.display = 'block';
    preview.onerror = () => {
      preview.style.display = 'none';
    };
  } else {
    preview.style.display = 'none';
  }
}

// ============ Entry Management ============

function addEntry(entryData) {
  const entries = getEntries();
  const entry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...entryData
  };
  entries.unshift(entry); // Add to beginning
  saveEntries(entries);
  return entry;
}

function updateEntry(id, entryData) {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index !== -1) {
    entries[index] = {
      ...entries[index],
      ...entryData,
      updatedAt: new Date().toISOString()
    };
    saveEntries(entries);
    return entries[index];
  }
  return null;
}

function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;

  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveEntries(filtered);
  renderEntryList();

  // Also clear form if editing this entry
  if (document.getElementById('editingId').value === id) {
    clearForm();
  }
}

function editEntry(id) {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (entry) {
    document.getElementById('editingId').value = id;
    setFormData(entry);
    document.getElementById('submitBtn').textContent = 'Update Entry';
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function copyEntryHTML(id) {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (entry) {
    const html = generateCleanEntryHTML(entry);
    copyToClipboard(html);
  }
}

function copyEntryJSON(id) {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (entry) {
    copyToClipboard(JSON.stringify(entry, null, 2));
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const feedback = document.getElementById('copyFeedback');
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Failed to copy to clipboard');
  });
}

// ============ Render Entry List (Builder Page) ============

function renderEntryList() {
  const container = document.getElementById('entriesContainer');
  if (!container) return;

  const entries = getEntries();

  if (entries.length === 0) {
    container.innerHTML = '<p style="color: #999;">No entries yet. Create one above!</p>';
    return;
  }

  let html = '<table style="width:100%;border:0px;border-spacing:0px 10px;border-collapse:separate;"><tbody>';
  entries.forEach(entry => {
    html += generateEntryHTML(entry, true);
  });
  html += '</tbody></table>';

  container.innerHTML = html;
}

// ============ Render Generated Section (Homepage) ============

function renderGeneratedSection() {
  const container = document.getElementById('generatedEntriesContainer');
  if (!container) return;

  const entries = getEntries();

  if (entries.length === 0) {
    container.innerHTML = '';
    // Hide the section header if no entries
    const header = document.getElementById('generatedSectionHeader');
    if (header) header.style.display = 'none';
    return;
  }

  // Show the section header
  const header = document.getElementById('generatedSectionHeader');
  if (header) header.style.display = '';

  let html = '';
  entries.forEach(entry => {
    html += generateCleanEntryHTML(entry);
  });

  container.innerHTML = html;
}

// ============ Initialize ============

function init() {
  // Check if we're on the builder page
  const form = document.getElementById('entryForm');
  if (form) {
    // Builder page initialization
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const data = getFormData();
      if (!data.title) {
        alert('Title is required');
        return;
      }

      const editingId = document.getElementById('editingId').value;

      if (editingId) {
        updateEntry(editingId, data);
      } else {
        addEntry(data);
      }

      clearForm();
      renderEntryList();
    });

    // Add input listeners for live preview
    ['entryType', 'title', 'description', 'venue', 'highlighted', 'imageUrl', 'imageAlt'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    // Image preview handler
    document.getElementById('imageUrl').addEventListener('input', updateImagePreview);

    // Initial render
    renderEntryList();
  }

  // Always try to render the generated section (for homepage)
  renderGeneratedSection();
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
