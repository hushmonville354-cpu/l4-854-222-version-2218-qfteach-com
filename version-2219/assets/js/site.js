const menuButton = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    mobileNav.classList.toggle('is-open');
  });
}

const hero = document.querySelector('[data-hero]');

if (hero) {
  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  let current = 0;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });

  if (slides.length > 1) {
    window.setInterval(() => showSlide(current + 1), 5000);
  }
}

const searchInput = document.querySelector('[data-search-input]');
const yearFilter = document.querySelector('[data-year-filter]');
const genreFilter = document.querySelector('[data-genre-filter]');
const cards = Array.from(document.querySelectorAll('[data-card]'));

const params = new URLSearchParams(window.location.search);
const initialQuery = params.get('q');

if (searchInput && initialQuery) {
  searchInput.value = initialQuery;
}

const normalizeText = (value) => String(value || '').toLowerCase().trim();

const filterCards = () => {
  const query = normalizeText(searchInput ? searchInput.value : '');
  const year = yearFilter ? yearFilter.value : '';
  const genre = genreFilter ? genreFilter.value : '';

  cards.forEach((card) => {
    const haystack = normalizeText([
      card.dataset.title,
      card.dataset.year,
      card.dataset.region,
      card.dataset.genre,
      card.textContent
    ].join(' '));
    const matchesQuery = !query || haystack.includes(query);
    const matchesYear = !year || card.dataset.year === year;
    const matchesGenre = !genre || (card.dataset.genre || '').includes(genre);
    card.hidden = !(matchesQuery && matchesYear && matchesGenre);
  });
};

[searchInput, yearFilter, genreFilter].forEach((element) => {
  if (element) {
    element.addEventListener('input', filterCards);
    element.addEventListener('change', filterCards);
  }
});

if (searchInput || yearFilter || genreFilter) {
  filterCards();
}
