/**
 * Simphonia — Destinations page
 *
 * Renders destination cards into #dest-grid and wires up
 * the search input + region filter tabs.
 *
 * Loaded as <script type="module"> from pages/destinations.html.
 * Runs after DOMContentLoaded (module scripts are deferred by default).
 */

// ── Data ─────────────────────────────────────────────────────
const DESTINATIONS = [
  { name: 'Japan',          flag: '🇯🇵', region: 'asia',     popular: true,  plans: 6, price: 9,  img: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Portugal',       flag: '🇵🇹', region: 'europe',   popular: true,  plans: 5, price: 6,  img: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&q=80&w=400' },
  { name: 'United States',  flag: '🇺🇸', region: 'americas', popular: true,  plans: 8, price: 10, img: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?auto=format&fit=crop&q=80&w=400' },
  { name: 'United Kingdom', flag: '🇬🇧', region: 'europe',   popular: true,  plans: 5, price: 8,  img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=400' },
  { name: 'Thailand',       flag: '🇹🇭', region: 'asia',     popular: true,  plans: 7, price: 7,  img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&q=80&w=400' },
  { name: 'France',         flag: '🇫🇷', region: 'europe',   popular: true,  plans: 5, price: 7,  img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400' },
  { name: 'Dubai (UAE)',    flag: '🇦🇪', region: 'asia',     popular: true,  plans: 6, price: 8,  img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=400' },
  { name: 'South Korea',   flag: '🇰🇷', region: 'asia',     popular: true,  plans: 6, price: 8,  img: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&q=80&w=400' },
  { name: 'Australia',     flag: '🇦🇺', region: 'oceania',  popular: true,  plans: 5, price: 11, img: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80&w=400' },
  { name: 'Italy',         flag: '🇮🇹', region: 'europe',   plans: 5, price: 7,  img: 'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?auto=format&fit=crop&q=80&w=400' },
  { name: 'Spain',         flag: '🇪🇸', region: 'europe',   plans: 5, price: 7,  img: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=400' },
  { name: 'Germany',       flag: '🇩🇪', region: 'europe',   plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Turkey',        flag: '🇹🇷', region: 'europe',   plans: 4, price: 6,  img: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Greece',        flag: '🇬🇷', region: 'europe',   plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=400' },
  { name: 'Netherlands',   flag: '🇳🇱', region: 'europe',   plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1468838153952-eb6a8d94a321?auto=format&fit=crop&q=80&w=400' },
  { name: 'Switzerland',   flag: '🇨🇭', region: 'europe',   plans: 4, price: 9,  img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=400' },
  { name: 'Poland',        flag: '🇵🇱', region: 'europe',   plans: 3, price: 5,  img: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&q=80&w=400' },
  { name: 'Czech Republic',flag: '🇨🇿', region: 'europe',   plans: 3, price: 6,  img: 'https://images.unsplash.com/photo-1513805959324-96eb66ca8713?auto=format&fit=crop&q=80&w=400' },
  { name: 'Singapore',     flag: '🇸🇬', region: 'asia',     plans: 5, price: 8,  img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=400' },
  { name: 'Indonesia',     flag: '🇮🇩', region: 'asia',     plans: 5, price: 7,  img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400' },
  { name: 'India',         flag: '🇮🇳', region: 'asia',     plans: 6, price: 6,  img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=400' },
  { name: 'Vietnam',       flag: '🇻🇳', region: 'asia',     plans: 5, price: 6,  img: 'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Malaysia',      flag: '🇲🇾', region: 'asia',     plans: 5, price: 6,  img: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=400' },
  { name: 'Philippines',   flag: '🇵🇭', region: 'asia',     plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=400' },
  { name: 'Taiwan',        flag: '🇹🇼', region: 'asia',     plans: 5, price: 8,  img: 'https://images.unsplash.com/photo-1470075801209-17f9ec0cada6?auto=format&fit=crop&q=80&w=400' },
  { name: 'Hong Kong',     flag: '🇭🇰', region: 'asia',     plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&q=80&w=400' },
  { name: 'Brazil',        flag: '🇧🇷', region: 'americas', plans: 5, price: 8,  img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mexico',        flag: '🇲🇽', region: 'americas', plans: 5, price: 7,  img: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&q=80&w=400' },
  { name: 'Canada',        flag: '🇨🇦', region: 'americas', plans: 5, price: 10, img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&q=80&w=400' },
  { name: 'Colombia',      flag: '🇨🇴', region: 'americas', plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1535730037448-9e6b7e932fc8?auto=format&fit=crop&q=80&w=400' },
  { name: 'Argentina',     flag: '🇦🇷', region: 'americas', plans: 4, price: 8,  img: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&q=80&w=400' },
  { name: 'Peru',          flag: '🇵🇪', region: 'americas', plans: 3, price: 7,  img: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&q=80&w=400' },
  { name: 'Egypt',         flag: '🇪🇬', region: 'africa',   plans: 4, price: 7,  img: 'https://images.unsplash.com/photo-1539768942893-daf53e736b68?auto=format&fit=crop&q=80&w=400' },
  { name: 'South Africa',  flag: '🇿🇦', region: 'africa',   plans: 4, price: 8,  img: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=400' },
  { name: 'Morocco',       flag: '🇲🇦', region: 'africa',   plans: 3, price: 7,  img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kenya',         flag: '🇰🇪', region: 'africa',   plans: 3, price: 8,  img: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Tanzania',      flag: '🇹🇿', region: 'africa',   plans: 3, price: 8,  img: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=400' },
  { name: 'New Zealand',   flag: '🇳🇿', region: 'oceania',  plans: 4, price: 11, img: 'https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&q=80&w=400' },
  { name: 'Fiji',          flag: '🇫🇯', region: 'oceania',  plans: 3, price: 12, img: 'https://images.unsplash.com/photo-1559628233-100c798642d5?auto=format&fit=crop&q=80&w=400' },
];

const ARROW_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

// ── Rendering ─────────────────────────────────────────────────
function createCard(d) {
  const card = document.createElement('div');
  card.className = 'dest-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'article');

  const popularBadge = d.popular
    ? '<span class="dest-card__popular-badge">Popular</span>'
    : '';

  card.innerHTML = `
    <img src="${d.img}" alt="${d.name}" class="dest-card__img" loading="lazy">
    <div class="dest-card__body">
      <div class="dest-card__name">${d.flag} ${d.name}${popularBadge}</div>
      <div class="dest-card__plans">${d.plans} plan${d.plans !== 1 ? 's' : ''} available</div>
      <div class="dest-card__footer">
        <span class="dest-card__price">from $${d.price}</span>
        <span class="dest-card__cta">View in app ${ARROW_SVG}</span>
      </div>
    </div>
  `;
  return card;
}

function renderGrid(grid, noResults, items) {
  grid.innerHTML = '';
  noResults.style.display = items.length === 0 ? 'block' : 'none';
  const frag = document.createDocumentFragment();
  items.forEach(d => frag.appendChild(createCard(d)));
  grid.appendChild(frag);
}

// ── Init ──────────────────────────────────────────────────────
(function init() {
  const grid        = document.getElementById('dest-grid');
  const noResults   = document.getElementById('no-results');
  const searchInput = document.getElementById('dest-search');
  const filterTabs  = document.querySelectorAll('.filter-tab');

  if (!grid) return;

  let activeFilter = 'all';

  function getFiltered() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    let items = activeFilter === 'popular'
      ? DESTINATIONS.filter(d => d.popular)
      : activeFilter !== 'all'
        ? DESTINATIONS.filter(d => d.region === activeFilter)
        : DESTINATIONS;
    if (query) items = items.filter(d => d.name.toLowerCase().includes(query));
    return items;
  }

  function refresh() {
    renderGrid(grid, noResults, getFiltered());
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('filter-tab--active'));
      tab.classList.add('filter-tab--active');
      activeFilter = tab.dataset.filter;
      refresh();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', refresh);
  }

  refresh();
}());

