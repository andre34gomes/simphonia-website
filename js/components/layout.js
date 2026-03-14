/**
 * Shared layout components — Nav & Footer
 * Injected via JS to keep all pages DRY.
 */

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Returns the path prefix depending on whether we're on
 * the root index.html or inside /pages/.
 */
function getBasePath() {
  const path = window.location.pathname;
  return path.includes('/pages/') ? '../' : './';
}

function getPagePath() {
  const path = window.location.pathname;
  return path.includes('/pages/') ? './' : './pages/';
}

/**
 * Returns 'nav__link--active' if href matches the current page.
 */
function activeClass(href) {
  const current = window.location.pathname;
  if (href === 'index.html' || href === '') {
    return (current.endsWith('/') || current.endsWith('index.html')) ? 'nav__link--active' : '';
  }
  return current.includes(href.replace('.html', '')) ? 'nav__link--active' : '';
}

export function injectNav() {
  const base = getBasePath();
  const page = getPagePath();
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'navbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="nav__inner">
      <a href="${base}index.html" class="nav__logo" aria-label="Simphonia Home">
        <div class="nav__logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        Simphonia
      </a>

      <div class="nav__links">
        <a href="${page}destinations.html" class="nav__link ${activeClass('destinations')}">Destinations</a>
        <a href="${page}how-it-works.html" class="nav__link ${activeClass('how-it-works')}">How It Works</a>
        <a href="${page}compatibility.html" class="nav__link ${activeClass('compatibility')}">Compatibility</a>
        <a href="${page}support.html" class="nav__link ${activeClass('support')}">Support</a>
        <a href="${page}about.html" class="nav__link ${activeClass('about')}">About</a>
      </div>

      <div class="nav__actions">
        <a href="${base}index.html#download" class="btn btn--primary btn--sm">Download App</a>
        <button class="nav__hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <div class="nav__mobile" id="mobile-menu" role="dialog" aria-label="Mobile menu">
      <a href="${page}destinations.html">Destinations</a>
      <a href="${page}how-it-works.html">How It Works</a>
      <a href="${page}compatibility.html">Compatibility</a>
      <a href="${page}support.html">Support</a>
      <a href="${page}about.html">About</a>
      <a href="${base}index.html#download" class="btn btn--primary" style="margin-top:1rem;">Download App</a>
    </div>
  `;

  document.body.prepend(nav);
  initNavBehavior();
}

function initNavBehavior() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  // Scroll effect
  const onScroll = () => {
    navbar.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('nav__mobile--open');
      hamburger.classList.toggle('nav__hamburger--open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('nav__mobile--open');
        hamburger.classList.remove('nav__hamburger--open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
}

export function injectFooter() {
  const base = getBasePath();
  const page = getPagePath();
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="${base}index.html" class="nav__logo" style="font-size:1.5rem;">
            <div class="nav__logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            Simphonia
          </a>
          <p>Stay connected, wherever you go. Global eSIM coverage for modern travelers.</p>
        </div>

        <div class="footer__col">
          <h4>Product</h4>
          <ul>
            <li><a href="${page}destinations.html">Destinations</a></li>
            <li><a href="${page}how-it-works.html">How It Works</a></li>
            <li><a href="${page}compatibility.html">Compatibility</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Company</h4>
          <ul>
            <li><a href="${page}about.html">About Us</a></li>
            <li><a href="${page}support.html">Support</a></li>
            <li><a href="${page}support.html#contact">Contact</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Legal</h4>
          <ul>
            <li><a href="${page}privacy.html">Privacy Policy</a></li>
            <li><a href="${page}terms.html">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">&copy; ${CURRENT_YEAR} Simphonia. All rights reserved.</p>
        <div class="footer__socials">
          <a href="#" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
}

