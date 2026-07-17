import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import no from '@/locales/no.json';
import en from '@/locales/en.json';

export const STORAGE_KEY = 'nks_lang';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        no: { translation: no },
        en: { translation: en },
      },
      lng: 'no',
      fallbackLng: 'no',
      supportedLngs: ['no', 'en'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
    });
}

export default i18n;
