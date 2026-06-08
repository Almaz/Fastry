# Plan: Refactor 404.astro Page

## Overview
Refactor `/src/pages/404.astro` to improve maintainability, consistency, and proper i18n support.

## Current Issues
1. Hardcoded Russian/English strings instead of using i18n
2. Manual locale prefix logic instead of `localizedPath()`
3. Missing `data-reveal` attributes for animations
4. Inconsistent with other pages (about.astro, contact.astro)

## Tasks

### 1. Add i18n keys to translation files
**File: `/src/i18n/en.json`**
- Add `errors.404` section with keys:
  - `badge`
  - `titlePart`
  - `titleHighlight`
  - `description`
  - `recoveryTitle`
  - `links.projects.title`
  - `links.projects.description`
  - `links.blog.title`
  - `links.blog.description`
  - `links.contact.title`
  - `links.contact.description`
  - `buttons.home`
  - `buttons.blog`

**File: `/src/i18n/ru.json`**
- Add corresponding Russian translations

### 2. Update 404.astro imports and logic
- Import `t` from `@/i18n`
- Use `t()` for all text strings
- Use `localizedPath()` for URL generation
- Add `data-reveal` attributes to Hero and recovery section
- Remove hardcoded locale strings

### 3. Update recovery links
- Use `localizedPath('/projects')`, `localizedPath('/blog')`, `localizedPath('/contact')`
- Remove manual prefix logic

### 4. Verify functionality
- Test both English and Russian versions
- Ensure animations work correctly
- Verify all links are properly localized

## Expected Outcome
- Single source of truth for all text content
- Consistent i18n implementation with rest of site
- Proper URL generation via `localizedPath()`
- Proper animation support with `data-reveal`
- Easier to maintain and extend
