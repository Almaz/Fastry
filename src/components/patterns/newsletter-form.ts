function initNewsletterForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('.newsletter-form');

  forms.forEach((form: HTMLFormElement) => {
    const submitBtn = form.querySelector<HTMLButtonElement>('.newsletter-submit');
    const msgEl = form.querySelector<HTMLParagraphElement>('.newsletter-message');

    if (!submitBtn || !msgEl) return;

    const locale = form.dataset.locale || 'en';

    const labels: Record<string, Record<string, string>> = {
      en: {
        subscribingText: 'Subscribing...',
        successText: 'Thanks for subscribing!',
        errorGeneric: 'Something went wrong',
        errorNetwork: 'Subscription failed. Please try again.',
      },
      ru: {
        subscribingText: 'Подписка…',
        successText: 'Спасибо за подписку!',
        errorGeneric: 'Что-то пошло не так',
        errorNetwork: 'Не удалось подписаться. Пожалуйста, попробуйте снова.',
      },
    };

    const l2 = labels[locale] || labels.en;
    const successMessage = form.dataset.successMessage || l2.successText;
    const originalText = submitBtn.textContent || l2.subscribingText;

    form.addEventListener('submit', async (event: Event) => {
      event.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = l2.subscribingText;
      msgEl.classList.add('hidden');

      try {
        const formData = new FormData(form);
        formData.append('locale', locale);

        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          msgEl.textContent = successMessage;
          msgEl.className = 'newsletter-message mt-3 text-sm text-success';
          form.reset();
        } else {
          msgEl.textContent = data.error || l2.errorGeneric;
          msgEl.className = 'newsletter-message mt-3 text-sm text-destructive';
        }
      } catch {
        msgEl.textContent = l2.errorNetwork;
        msgEl.className = 'newsletter-message mt-3 text-sm text-destructive';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        msgEl.classList.remove('hidden');
      }
    });
  });
}

initNewsletterForms();
document.addEventListener('astro:after-swap', initNewsletterForms);