// Clicking the email icon copies the address and says so quietly.
// Falls back to the normal mailto link if the clipboard is unavailable.
(() => {
  const link = document.querySelector('.social a[href^="mailto:"]');
  if (!link || !navigator.clipboard) return;
  const address = link.getAttribute('href').slice('mailto:'.length);
  const live = document.createElement('span');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  link.setAttribute('title', 'Copy email address');
  link.setAttribute('aria-label', 'Copy email address');
  let timer = 0;
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(address);
    } catch (_) {
      window.location.href = link.href;
      return;
    }
    link.classList.add('is-copied');
    live.textContent = 'Email address copied';
    clearTimeout(timer);
    timer = setTimeout(() => { link.classList.remove('is-copied'); live.textContent = ''; }, 1800);
  });
})();
