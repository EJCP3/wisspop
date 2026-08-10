import es from '../locales/es.json';
import en from '../locales/en.json';

export const languages = {
  en: 'English',
  es: 'Español',
};

export const defaultLang = 'en';

export type Lang = keyof typeof languages;

const translations: Record<Lang, Record<string, string>> = {
  en,
  es,
};

export function useTranslations(lang: Lang = defaultLang) {
  return function t(key: string): string {
    return translations[lang]?.[key] || translations[defaultLang]?.[key] || key;
  };
}
