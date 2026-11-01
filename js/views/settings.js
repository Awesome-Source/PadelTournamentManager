import { loadTheme, saveTheme, saveLanguage } from '../storage.js';
import { LANGUAGES, applyLanguage, currentLanguage, tr } from '../i18n.js';
import { h, iconButton, titleBar, navigate, applyTheme, radioGroup } from '../ui.js';

export function renderSettings(root) {
  root.replaceChildren(
    titleBar({
      title: tr('settings.title'),
      left: iconButton('back', tr('common.backToTournaments'), () => navigate('#/')),
    }),
    h('main', { class: 'content' },
      radioGroup({
        name: 'theme',
        legend: tr('settings.theme'),
        options: [
          { value: 'dark', label: tr('settings.themeDark') },
          { value: 'light', label: tr('settings.themeLight') },
        ],
        value: loadTheme(),
        onChange: (theme) => {
          saveTheme(theme);
          applyTheme(theme);
        },
      }),
      radioGroup({
        name: 'language',
        legend: tr('settings.language'),
        options: LANGUAGES.map(({ code, name }) => ({ value: code, label: name })),
        value: currentLanguage(),
        onChange: (language) => {
          saveLanguage(language);
          applyLanguage(language);
          renderSettings(root);
          root.querySelector('input[name="language"]:checked').focus();
        },
      }),
    ),
  );
}
