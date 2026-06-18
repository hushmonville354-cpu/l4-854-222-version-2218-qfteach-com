(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var links = document.querySelector('[data-nav-links]');
    if (!toggle || !links) {
      return;
    }
    toggle.addEventListener('click', function () {
      links.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle('is-active', idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === current);
      });
    }

    function play() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide-to') || 0));
        play();
      });
    });

    show(0);
    play();
  }

  function initFilters() {
    var list = document.querySelector('[data-filter-list]');
    if (!list) {
      return;
    }
    var form = document.querySelector('[data-filter-form]');
    var cards = Array.prototype.slice.call(list.children);
    var empty = document.querySelector('[data-empty-state]');
    var params = new URLSearchParams(window.location.search);
    var inputs = {
      q: document.querySelectorAll('[data-filter-input]'),
      region: document.querySelector('[data-filter-region]'),
      type: document.querySelector('[data-filter-type]'),
      year: document.querySelector('[data-filter-year]'),
      genre: document.querySelector('[data-filter-genre]')
    };

    function setInitialValues() {
      inputs.q.forEach(function (input) {
        input.value = params.get('q') || '';
      });
      ['region', 'type', 'year', 'genre'].forEach(function (key) {
        if (inputs[key]) {
          inputs[key].value = params.get(key) || '';
        }
      });
    }

    function valueOf(key) {
      if (key === 'q') {
        var found = '';
        inputs.q.forEach(function (input) {
          if (input.value) {
            found = input.value;
          }
        });
        return normalize(found);
      }
      return normalize(inputs[key] ? inputs[key].value : '');
    }

    function matches(card, values) {
      var text = normalize(card.getAttribute('data-search'));
      var title = normalize(card.getAttribute('data-title'));
      var region = normalize(card.getAttribute('data-region'));
      var type = normalize(card.getAttribute('data-type'));
      var year = normalize(card.getAttribute('data-year'));
      var genre = normalize(card.getAttribute('data-genre'));
      if (values.q && text.indexOf(values.q) === -1 && title.indexOf(values.q) === -1) {
        return false;
      }
      if (values.region && region.indexOf(values.region) === -1) {
        return false;
      }
      if (values.type && type.indexOf(values.type) === -1) {
        return false;
      }
      if (values.year && year.indexOf(values.year) === -1) {
        return false;
      }
      if (values.genre && genre.indexOf(values.genre) === -1 && text.indexOf(values.genre) === -1) {
        return false;
      }
      return true;
    }

    function apply() {
      var values = {
        q: valueOf('q'),
        region: valueOf('region'),
        type: valueOf('type'),
        year: valueOf('year'),
        genre: valueOf('genre')
      };
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matches(card, values);
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    setInitialValues();
    apply();

    inputs.q.forEach(function (input) {
      input.addEventListener('input', apply);
    });
    ['region', 'type', 'year', 'genre'].forEach(function (key) {
      if (inputs[key]) {
        inputs[key].addEventListener('change', apply);
      }
    });
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        apply();
      });
    }
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });
}());
