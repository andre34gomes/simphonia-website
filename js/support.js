/**
 * Simphonia — Support page
 *
 * Wires up:
 *   • FAQ full-text search (filters <details> by text + data-keywords)
 *   • Contact form client-side validation with inline feedback
 *
 * Loaded as <script type="module"> from pages/support.html.
 * Module scripts are deferred automatically, so the DOM is ready.
 */

// ── FAQ Search ────────────────────────────────────────────────
function initFaqSearch() {
  const input    = document.getElementById('faq-search');
  const faqItems = document.querySelectorAll('.faq-item');
  if (!input || !faqItems.length) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    faqItems.forEach(item => {
      const text     = item.textContent.toLowerCase();
      const keywords = (item.dataset.keywords || '').toLowerCase();
      const match    = !query || text.includes(query) || keywords.includes(query);
      item.style.display = match ? '' : 'none';
    });
  });
}

// ── Contact Form ──────────────────────────────────────────────
const FEEDBACK_STYLES = {
  base: [
    'margin-top:var(--space-md)',
    'padding:var(--space-md) var(--space-lg)',
    'border-radius:var(--radius-md)',
    'font-size:0.9375rem',
    'font-weight:500',
    'display:flex',
    'align-items:center',
    'gap:0.625rem',
    'animation:result-pop 0.4s cubic-bezier(0.16,1,0.3,1)',
  ].join(';'),
  success: {
    background: 'rgba(74,222,128,0.1)',
    border:     '1px solid rgba(74,222,128,0.3)',
    color:      '#4ade80',
  },
  error: {
    background: 'rgba(248,113,113,0.1)',
    border:     '1px solid rgba(248,113,113,0.3)',
    color:      '#f87171',
  },
};

/** Simple email format check — does not rely on the Constraint Validation API. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  function showFeedback(type, message) {
    let el = document.getElementById('form-feedback');
    if (!el) {
      el = document.createElement('div');
      el.id = 'form-feedback';
      el.style.cssText = FEEDBACK_STYLES.base;
      submitBtn.parentNode.insertBefore(el, submitBtn.nextSibling);
    }

    const styles = FEEDBACK_STYLES[type];
    Object.assign(el.style, styles);
    el.textContent = (type === 'success' ? '✓ ' : '⚠ ') + message;
    el.style.display = 'flex';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('contact-name').value.trim();
    const email   = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showFeedback('error', 'Please fill in all required fields.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      showFeedback('error', 'Please enter a valid email address.');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';

    // TODO: replace this stub with a real API call (e.g. Netlify Forms / Formspree).
    setTimeout(() => {
      showFeedback('success', "Message sent! We'll get back to you within 24 hours.");
      form.reset();
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Send Message';
    }, 900);
  });
}

// ── Boot ──────────────────────────────────────────────────────
initFaqSearch();
initContactForm();

