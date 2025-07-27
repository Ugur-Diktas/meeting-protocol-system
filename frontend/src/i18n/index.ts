import { createI18n } from 'vue-i18n';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

export type MessageSchema = typeof en;

const i18n = createI18n<[MessageSchema], 'de' | 'en' | 'fr' | 'it'>({
  legacy: false,
  locale: localStorage.getItem('locale') || 'de', // Default to German
  fallbackLocale: 'de',
  messages: {
    de,
    en,
    fr,
    it
  }
});

export default i18n;
