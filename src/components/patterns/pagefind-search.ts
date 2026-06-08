/**
 * PagefindSearch — initialize Pagefind search on first open
 * Handles Ctrl+K / Cmd+K keyboard shortcut
 * Filters results by current page language using Pagefind's built-in filter.
 *
 * The filter "lang" is set on <html> via data-pagefind-filter="lang:en" or "lang:ru"
 * in BaseLayout.astro, so Pagefind indexes each page's language automatically.
 */
(function () {
  let pagefindInstance: { destroy: () => void } | null = null;

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
    '</div>';
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.pagefind-modal-close');
  const searchUiContainer = overlay.querySelector('#pagefind-search-ui');

  function openSearch(): void {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const currentLang = document.documentElement.lang || 'en';

    setTimeout(async () => {
      try {
        if (!pagefindInstance) {
          // Load pagefind directly
          const pagefindUrl = new URL('/pagefind/pagefind.js', window.location.origin).href;
          const pf: any = await import(/* @vite-ignore */ pagefindUrl);
          const pagefind = pf.default || pf;

          // Initialize
          await pagefind.init();

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
              try {
                // Use Pagefind's built-in language filter.
                // The "lang" filter is indexed from data-pagefind-filter="lang:xx" on <html>.
                const search = await pagefind.search(term, {
                  filters: { lang: [currentLang] }
                });

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