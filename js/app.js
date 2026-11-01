import { loadLanguage, loadTheme } from './storage.js';
import { applyLanguage } from './i18n.js';
import { applyTheme } from './ui.js';
import { renderList } from './views/list.js';
import { renderWizard } from './views/wizard.js';
import { renderDetails } from './views/details.js';
import { renderSettings } from './views/settings.js';

const app = document.getElementById('app');

function render() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  app.replaceChildren();
  window.scrollTo(0, 0);

  if (parts[0] === 'new') {
    renderWizard(app);
  } else if (parts[0] === 'settings') {
    renderSettings(app);
  } else if (parts[0] === 't' && parts[1]) {
    renderDetails(app, decodeURIComponent(parts[1]), parts[2] || 'lb');
  } else {
    renderList(app);
  }
}

applyTheme(loadTheme());
applyLanguage(loadLanguage());
window.addEventListener('hashchange', render);
render();
