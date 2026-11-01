/**
 * Creates a DOM element.
 * Props starting with "on" become event listeners, `class` / `className` set the class,
 * `dataset` is merged into data attributes, `html` sets innerHTML, form state props
 * (value, checked, disabled, selected) are set as properties, everything else as attributes.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class' || key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (['value', 'checked', 'disabled', 'selected'].includes(key)) {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  }
  appendChildren(el, children);
  return el;
}

export function appendChildren(el, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) appendChildren(el, child);
    else el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const ICON_PATHS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4V4h11v1"/>',
};

export function icon(name) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
  return span;
}

export function iconButton(name, label, onClick, extraClass = '') {
  return h('button', { type: 'button', class: `icon-btn ${extraClass}`.trim(), 'aria-label': label, title: label, onClick }, icon(name));
}

/**
 * Title bar with optional left element, app logo, title and right-side elements.
 */
export function titleBar({ title, left = null, right = [] }) {
  return h('header', { class: 'title-bar' },
    h('div', { class: 'title-bar-inner' },
      h('div', { class: 'title-bar-left' },
        left,
        h('img', { class: 'title-bar-logo', src: 'assets/logo.svg', alt: '', width: 36, height: 36 }),
      ),
      h('h1', { class: 'title-bar-title' }, title),
      h('div', { class: 'title-bar-right' }, right),
    ),
  );
}

/**
 * Shows the confirmation dialog. Resolves to true if the user confirmed.
 */
export function confirmDialog({ title, message, okLabel = 'OK', cancelLabel = 'Cancel', danger = true }) {
  const dialog = document.getElementById('confirm-dialog');
  dialog.querySelector('.dialog-title').textContent = title;
  dialog.querySelector('.dialog-message').textContent = message;
  const ok = dialog.querySelector('.dialog-ok');
  ok.textContent = okLabel;
  ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'} dialog-ok`;
  dialog.querySelector('.dialog-cancel').textContent = cancelLabel;
  dialog.returnValue = '';

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.showModal();
  });
}

export function navigate(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f6fa' : '#0b1626');
}

export const FORMAT_LABELS = {
  classic: 'Classic Americano',
  team: 'Team Americano',
};
