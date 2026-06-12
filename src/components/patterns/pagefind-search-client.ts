type PagefindSearchController = {
  openSearch: () => void;
  closeSearch: () => void;
};

let controller: PagefindSearchController | null = null;

export function initPagefindSearch(btn: HTMLButtonElement): PagefindSearchController {
  if (controller) return controller;

  const searchLabel = btn.dataset.searchLabel || 'Search';
  const searchModalTitle = btn.dataset.searchModalTitle || 'Search the site';
  const searchPlaceholder = btn.dataset.searchPlaceholder || 'Type a keyword...';

  let pagefindInstance: unknown = null;
  let pagefindLoaded = false;
  let pagefindLoading = false;
  const pagefindQueue: Array<() => void> = [];

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
  const searchUiContainer = overlay.querySelector<HTMLElement>('#pagefind-search-ui');
  const progressEl = overlay.querySelector<HTMLElement>('#pagefind-search-progress');

  function showProgress() {
    progressEl?.classList.add('pagefind-search-progress--active');
  }

  function hideProgress() {
    progressEl?.classList.remove('pagefind-search-progress--active');
  }

  function loadPagefind(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (pagefindLoaded) {
        resolve(pagefindInstance);
        return;
      }

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

      const pagefindUrl = window.location.origin + '/pagefind/pagefind.js';

      import(/* @vite-ignore */ pagefindUrl)
        .then((pf) => {
          pagefindLoaded = true;
          pagefindLoading = false;
          const queue = pagefindQueue.splice(0, pagefindQueue.length);
          pagefindInstance = pf;
          resolve(pf);
          queue.forEach((cb) => cb());
        })
        .catch((err) => {
          pagefindLoading = false;
          reject(new Error('Failed to load /pagefind/pagefind.js: ' + err.message));
          pagefindQueue.splice(0, pagefindQueue.length).forEach((cb) => cb());
        });
    });
  }

  function closeSearch() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openSearch() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const currentLang = document.documentElement.lang || 'en';

    showProgress();

    setTimeout(() => {
      (async () => {
        try {
          if (!pagefindInstance) {
            const pf = await loadPagefind();

            hideProgress();

            if (searchUiContainer) {
              searchUiContainer.innerHTML =
                '<div class="pagefind-ui">' +
                '<div class="pagefind-ui__search-bar">' +
                '<div class="pagefind-ui__search-input-wrapper">' +
                '<svg class="pagefind-ui__search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<circle cx="11" cy="11" r="8"/>' +
                '<path d="m21 21-4.3-4.3"/>' +
                '</svg>' +
                '<input class="pagefind-ui__search-input" type="text" placeholder="' + searchPlaceholder + '" />' +
                '<kbd class="pagefind-ui__search-kbd">Ctrl+K</kbd>' +
                '</div>' +
                '</div>' +
                '<div class="pagefind-ui__results"></div>' +
                '</div>';
            }

            const input = searchUiContainer ? searchUiContainer.querySelector<HTMLInputElement>('.pagefind-ui__search-input') : null;
            const resultsContainer = searchUiContainer ? searchUiContainer.querySelector<HTMLElement>('.pagefind-ui__results') : null;

            let debounceTimer: ReturnType<typeof setTimeout> | undefined;
            if (input) {
              input.addEventListener('input', () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                const term = input.value.trim();
                if (term.length < 2) {
                  if (resultsContainer) resultsContainer.innerHTML = '';
                  return;
                }

                debounceTimer = setTimeout(() => {
                  (async () => {
                    showProgress();
                    try {
                      const search = await pf.search(term, {
                        filters: { lang: [currentLang] },
                      });

                      hideProgress();

                      if (!search.results || search.results.length === 0) {
                        if (resultsContainer) {
                          resultsContainer.innerHTML = '<p class="pagefind-ui__message">' + (currentLang === 'ru' ? 'Ничего не найдено' : 'No results found') + '</p>';
                        }
                        return;
                      }

                      let html = '';
                      let count = 0;
                      for (let i = 0; i < search.results.length; i++) {
                        if (count >= 5) break;
                        const result = search.results[i];
                        const data = await result.data();
                        const url = data.url || '';
                        count++;
                        html +=
                          '<div class="pagefind-ui__result">' +
                          '<a href="' + url + '" class="pagefind-ui__result-title">' + (data.title || data.meta?.title || '') + '</a>' +
                          '<p class="pagefind-ui__result-excerpt">' + (data.excerpt || '') + '</p>' +
                          '</div>';
                      }
                      html += '<p class="pagefind-ui__message">' + count + ' ' + (currentLang === 'ru' ? 'результатов' : 'results') + '</p>';
                      if (resultsContainer) resultsContainer.innerHTML = html;
                    } catch (error) {
                      hideProgress();
                      console.warn('Pagefind search failed:', error);
                    }
                  })();
                }, 300);
              });
            }
          }
        } catch (error) {
          console.warn('Pagefind init failed:', error);
        }

        setTimeout(() => {
          const input = overlay.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
          input?.focus();
        }, 100);
      })();
    }, 50);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSearch();
    }
  });

  controller = {
    openSearch,
    closeSearch,
  };

  return controller;
}
