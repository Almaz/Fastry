import { describe, it, expect } from 'vitest';
import {
  t,
  localizedPath,
  resolveLocale,
  isValidLocale,
  getLocaleName,
  getLocaleFromPath,
  stripLocaleFromPath,
  swapLocaleInPath,
} from '../i18n';

describe('i18n t() helper', () => {
  it('returns a translation for a valid dotted key', () => {
    expect(t('common.readMore', 'en')).toBe('Read more');
  });

  it('returns the Dutch translation when locale is nl', () => {
    expect(t('common.readMore', 'nl')).toBe('Lees meer');
  });

  it('falls back to the default-locale string when the locale has no entry', () => {
    // 'de' has no dictionary loaded yet — should fall back to English
    expect(t('common.readMore', 'de')).toBe('Read more');
  });

  it('returns the key itself when no translation exists in any dictionary', () => {
    expect(t('some.missing.key', 'en')).toBe('some.missing.key');
  });

  it('interpolates {placeholder} variables', () => {
    expect(t('blog.readingTime', 'en', { minutes: 5 })).toBe('5 min read');
    expect(t('blog.readingTime', 'nl', { minutes: 5 })).toBe('5 min leestijd');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(t('blog.readingTime', 'en', {})).toBe('{minutes} min read');
  });
});

describe('i18n localizedPath()', () => {
  it('returns the path unchanged when i18n is disabled (single locale)', () => {
    // With default config (locales: ['en']), i18n is effectively off
    expect(localizedPath('/about')).toBe('/about');
    expect(localizedPath('/')).toBe('/');
    expect(localizedPath('blog/hello')).toBe('/blog/hello');
  });
});

describe('i18n locale helpers', () => {
  it('resolves an unknown locale to the default (now ru)', () => {
    expect(resolveLocale('xx')).toBe('ru');
    expect(resolveLocale(undefined)).toBe('ru');
  });

  it('validates a configured locale', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('ru')).toBe(true);
    expect(isValidLocale('xx')).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
  });

  it('returns the display name when configured, otherwise the code', () => {
    expect(getLocaleName('en')).toBe('English');
    expect(getLocaleName('ru')).toBe('Русский');
    // 'nl' is in localeNames even though it's not in the active locales list
    expect(getLocaleName('nl')).toBe('Nederlands');
    expect(getLocaleName('xx')).toBe('xx');
  });
});

describe('i18n getLocaleFromPath()', () => {
  it('returns the default locale (ru) for the root path', () => {
    expect(getLocaleFromPath('/')).toBe('ru');
  });

  it('returns the default locale (ru) when no recognized prefix is present', () => {
    expect(getLocaleFromPath('/about')).toBe('ru');
    expect(getLocaleFromPath('/blog/hello-world')).toBe('ru');
  });

  it('returns the detected locale when the first segment is a configured locale', () => {
    expect(getLocaleFromPath('/en/about')).toBe('en');
    expect(getLocaleFromPath('/ru/about')).toBe('ru');
  });

  it('returns the default locale (ru) when the first segment is not a configured locale', () => {
    // 'nl' is not in the active locales list
    expect(getLocaleFromPath('/nl/about')).toBe('ru');
    expect(getLocaleFromPath('/zh-cn/blog')).toBe('ru');
  });

  it('normalizes paths without a leading slash', () => {
    expect(getLocaleFromPath('about')).toBe('ru');
  });
});

describe('i18n stripLocaleFromPath()', () => {
  it('leaves a path unchanged when the first segment is not a configured locale', () => {
    expect(stripLocaleFromPath('/about')).toBe('/about');
    expect(stripLocaleFromPath('/nl/about')).toBe('/nl/about');
  });

  it('strips a recognized locale prefix', () => {
    expect(stripLocaleFromPath('/en/about')).toBe('/about');
    expect(stripLocaleFromPath('/ru/about')).toBe('/about');
  });

  it('returns "/" for the root path', () => {
    expect(stripLocaleFromPath('/')).toBe('/');
  });

  it('returns "/" when stripping a locale-only path', () => {
    expect(stripLocaleFromPath('/en')).toBe('/');
    expect(stripLocaleFromPath('/ru')).toBe('/');
  });
});

describe('i18n swapLocaleInPath()', () => {
  it('returns the path unchanged when targeting the default locale (ru, no prefix added)', () => {
    expect(swapLocaleInPath('/about', 'ru')).toBe('/about');
  });

  it('adds the locale prefix when targeting a non-default locale', () => {
    expect(swapLocaleInPath('/about', 'en')).toBe('/en/about');
  });

  it('swaps an existing locale prefix to a different one', () => {
    expect(swapLocaleInPath('/en/about', 'ru')).toBe('/about');
    expect(swapLocaleInPath('/ru/about', 'en')).toBe('/en/about');
  });

  it('returns the same path when i18n is disabled, regardless of target', () => {
    // With default config (single locale), localizedPath is a no-op
    expect(swapLocaleInPath('/about', 'nl')).toBe('/about');
  });
});
