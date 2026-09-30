(() => {
  const form = document.getElementById('message-form');
  const status = document.getElementById('form-status');
  const button = form?.querySelector('button[type="submit"]');
  const widget = document.getElementById('turnstile-widget');
  const note = document.getElementById('verification-note');
  if (!form || !status || !button || !widget || !note) return;

  let sending = false;
  let token = '';
  let widgetId = null;
  const syncButton = () => { button.disabled = sending || !token; };
  const clearVerification = (message = 'Complete the human verification to send your message.') => {
    token = '';
    syncButton();
    note.textContent = message;
  };
  const resetVerification = () => {
    clearVerification();
    if (widgetId !== null) window.turnstile?.reset(widgetId);
  };

  const sitekey = widget.dataset.sitekey;
  if (sitekey) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      try {
        widgetId = window.turnstile.render(widget, {
          sitekey,
          theme: 'dark',
          size: 'flexible',
          action: 'contact_message',
          callback: verifiedToken => {
            token = verifiedToken;
            note.textContent = 'Verification complete.';
            status.textContent = '';
            syncButton();
          },
          'expired-callback': () => clearVerification('Verification expired. Please complete it again.'),
          'error-callback': () => clearVerification('Verification could not complete. Please try again.'),
        });
      } catch {
        clearVerification('Verification is unavailable. Please refresh the page and try again.');
      }
    };
    script.onerror = () => clearVerification('Verification could not load. Please refresh the page and try again.');
    document.head.append(script);
  } else {
    clearVerification('Message verification is being set up. Please try again later.');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (!token) {
      status.textContent = 'Please complete the human verification first.';
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !email || !message) return;

    sending = true;
    syncButton();
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, turnstileToken: token }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== 'sent') {
        throw new Error(result.message || 'Your message could not be sent. Please try again later.');
      }
      form.reset();
      status.textContent = 'Message sent. Thank you for reaching out!';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Your message could not be sent. Please try again later.';
    } finally {
      sending = false;
      resetVerification();
    }
  });
})();
