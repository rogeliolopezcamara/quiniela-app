import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
};

i18n
  .use(LanguageDetector) // detecta el idioma del navegador automáticamente
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // idioma por defecto si no detecta
    interpolation: {
      escapeValue: false, // react ya hace el escaping
    },
    detection: {
      order: ['navigator'], // detecta el idioma del sistema
      caches: [], // no guarda en localStorage o cookie (lo puedes cambiar luego si quieres)
    },
  });

export default i18n;