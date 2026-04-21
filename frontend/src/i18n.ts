import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from '@/locales/ko/translation.json';
import en from '@/locales/en/translation.json';
import ja from '@/locales/ja/translation.json';
import vi from '@/locales/vi/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      vi: { translation: vi },
    },
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_locale',
      caches: ['localStorage'],
    },
  });

export default i18n;
