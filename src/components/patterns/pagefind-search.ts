/**
 * PagefindSearch — initialize Pagefind search on first open
 * Handles Ctrl+K / Cmd+K keyboard shortcut
 * Filters results by current page language using Pagefind's built-in filter.
 *
 * The filter "lang" is set on <html> via data-pagefind-filter="lang:en" or "lang:ru"
 * in BaseLayout.astro, so Pagefind indexes each page's language automatically.
 *
 * Pagefind is loaded via dynamic import(). pagefind.js is an ES module (uses
 * `export { ... }`), so dynamic import() works correctly both in dev mode
 * (Vite processes it) and in production (native browser import()).
 *
 * In dev mode, we copy pagefind.js from dist/pagefind/ to public/pagefind/ so
 * the import path /pagefind/pagefind.js works both locally and in production.
 */
(function () {
  let pagefindInstance: { destroy: () => void } | null = null;
  let pagefindLoaded = false;
  let pagefindLoading = false;
  let pagefindQueue: Array<() => void> = [];

  const btn = document.getElementById('pagefind-search-btn');
  if (!btn) return;

  const searchLabel = btn.dataset.searchLabel || 'Search';
  const searchModalTitle = btn.dataset.searchModalTitle || 'Search the site';
  const searchPlaceholder = btn.dataset.searchPlaceholder || 'Type a keyword...';

  const overlay = document.createElement('div');
  overlay.className = 'pagefind-modal-overlay';
  overlay.innerHTML =
    '<div class="pagefind-modal">' +
    '<div class="pagefind-modal-header">' +
    '<h2 class="pagefind-modal-title">' + searchModalTitle + '</h2>' +
    '<button class="pagefind-modal-close" aria-label="' + searchLabel + '">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '<div id="pagefind-search-ui"></div>' +
    '<div id="pagefind-search-progress" class="pagefind-search-progress">' +
    '  <div class="pagefind-search-progress__track">' +
    '    <div class="pagefind-search-progress__bar pagefind-search-progress__bar--indeterminate"></div>' +
    '  </div>' +
    '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.pagefind-modal-close');
  const searchUiContainer = overlay.querySelector('#pagefind-search-ui');
  const progressEl = overlay.querySelector('#pagefind-search-progress');

  function showProgress(): void {
    if (progressEl) progressEl.classList.add('pagefind-search-progress--active');
  }

  function hideProgress(): void {
    if (progressEl) progressEl.classList.remove('pagefind-search-progress--active');
  }

  /**
   * Load pagefind.js via dynamic import().
   * pagefind.js is an ES module (uses `export { ... }`), so dynamic import()
   * works correctly both in dev mode and in production.
   *
   * We use window.location.origin to construct an absolute URL to bypass
   * Vite's restriction on importing files from /public via relative import().
   * In production (GitHub Pages), the absolute URL also works correctly.
   *
   * Returns a promise that resolves with the pagefind API module.
   */
  function loadPagefind(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Already loaded and initialized
      if (pagefindLoaded) {
        resolve(pagefindInstance);
        return;
      }

      // Already loading — queue callback
      if (pagefindLoading) {
        pagefindQueue.push(() => {
          if (pagefindInstance) {
            resolve(pagefindInstance);
          } else {
            reject(new Error('Pagefind failed to load'));
          }
        });
        return;
      }

      pagefindLoading = true;

      // Use absolute URL to bypass Vite's restriction on importing from /public
      const baseUrl = window.location.origin;
      const pagefindUrl = baseUrl + '/pagefind/pagefind.js';

      import(/* @vite-ignore */ pagefindUrl)
        .then((pf) => {
          pagefindLoaded = true;
          pagefindLoading = false;
          const queue = pagefindQueue;
          pagefindQueue = [];
          resolve(pf);
          queue.forEach((cb) => cb());
        })
        .catch((err) => {
          pagefindLoading = false;
          const error = new Error('Failed to load /pagefind/pagefind.js: ' + err.message);
          reject(error);
          pagefindQueue.forEach((cb) => cb());
          pagefindQueue = [];
        });
    });
  }

  function openSearch(): void {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const currentLang = document.documentElement.lang || 'en';

    // Show progress while Pagefind loads
    showProgress();

    setTimeout(async () => {
      try {
        if (!pagefindInstance) {
          // Load pagefind via <script> tag (not dynamic import)
          const pf = await loadPagefind();

          // Hide progress once Pagefind is loaded
          hideProgress();

          // Initialize
          await pf.init();

          // Create input and results container manually
          if (searchUiContainer) {
            searchUiContainer.innerHTML = `
              <div class="pagefind-ui">
                <div class="pagefind-ui__search-bar">
                  <div class="pagefind-ui__search-input-wrapper">
                    <svg class="pagefind-ui__search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input class="pagefind-ui__search-input" type="text" placeholder="${searchPlaceholder}" autofocus />
                    <kbd class="pagefind-ui__search-kbd">Ctrl+K</kbd>
                  </div>
                </div>
                <div class="pagefind-ui__results"></div>
              </div>
            `;
          }

          const input = searchUiContainer?.querySelector('.pagefind-ui__search-input') as HTMLInputElement | null;
          const resultsContainer = searchUiContainer?.querySelector('.pagefind-ui__results') as HTMLElement | null;

          let debounceTimer: ReturnType<typeof setTimeout> | undefined;
          input?.addEventListener('input', async () => {
            clearTimeout(debounceTimer);
            const term = input.value.trim();
            if (term.length < 2) {
              if (resultsContainer) resultsContainer.innerHTML = '';
              return;
            }

            debounceTimer = setTimeout(async () => {
              showProgress();
              try {
                // Use Pagefind's built-in language filter.
                // The "lang" filter is indexed from data-pagefind-filter="lang:xx" on <html>.
                const search = await pf.search(term, {
                  filters: { lang: [currentLang] }
                });

                hideProgress();

                if (!search.results || search.results.length === 0) {
                  if (resultsContainer) {
                    resultsContainer.innerHTML = '<p class="pagefind-ui__message">' + (currentLang === 'ru' ? 'Ничего не найдено' : 'No results found') + '</p>';
                  }
                  return;
                }

                // Show up to 5 results
                let html = '';
                let count = 0;
                for (const result of search.results) {
                  if (count >= 5) break;
                  const data = await result.data();
                  const url = data.url || '';
                  count++;
                  html += `
                    <div class="pagefind-ui__result">
                      <a href="${url}" class="pagefind-ui__result-title">${data.title || data.meta?.title || ''}</a>
                      <p class="pagefind-ui__result-excerpt">${data.excerpt || ''}</p>
                    </div>
                  `;
                }
                html += '<p class="pagefind-ui__message">' + count + ' ' + (currentLang === 'ru' ? 'результатов' : 'results') + '</p>';
                if (resultsContainer) resultsContainer.innerHTML = html;
              } catch (e) {
                hideProgress();
                console.warn('Pagefind search failed:', e);
              }
            }, 300);
          });

          pagefindInstance = { destroy: () => {} };
        }
      } catch (e) {
        console.warn('Pagefind init failed:', e);
      }

      setTimeout(() => {
        const input = overlay.querySelector('.pagefind-ui__search-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 100);
    }, 50);
  }

  function closeSearch(): void {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openSearch);
  closeBtn?.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSearch();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
  });
})();