(() => {
  'use strict';

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceMotionQuery.matches;

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navDrawer = document.querySelector('.nav-drawer');
  const navDrawerClose = document.querySelector('.nav-drawer__close');
  const navDrawerLinks = document.querySelectorAll('.nav-drawer__link, .nav-drawer__cta');
  const scrollProgress = document.querySelector('.scroll-progress');
  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero__media img');

  /* -----------------------------------------------------
     Header: transparente -> sólido, hide on scroll down
     ----------------------------------------------------- */
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const y = window.scrollY;
    const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
    const solidThreshold = Math.max(heroHeight - 140, 80);

    header.classList.toggle('is-scrolled', y > 12);
    header.classList.toggle('is-solid', y > solidThreshold);

    const drawerOpen = navDrawer && navDrawer.classList.contains('is-open');
    if (!drawerOpen) {
      if (y > lastScrollY && y > heroHeight * 0.6) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    }
    lastScrollY = y;

    if (scrollProgress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (y / max) * 100 : 0;
      scrollProgress.style.width = pct + '%';
    }

    if (heroImg && !prefersReducedMotion() && y < heroHeight) {
      const parallax = y * 0.16;
      heroImg.style.transform = `translate3d(0, ${parallax}px, 0) scale(1.06)`;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  updateHeader();

  /* -----------------------------------------------------
     Menú móvil (drawer) — overlay siempre sólido
     ----------------------------------------------------- */
  function openDrawer() {
    navDrawer.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    header.classList.remove('is-hidden');
    const firstLink = navDrawer.querySelector('.nav-drawer__link');
    if (firstLink) firstLink.focus({ preventScroll: true });
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    navDrawer.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    if (restoreFocus) navToggle.focus({ preventScroll: true });
  }

  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', () => {
      const isOpen = navDrawer.classList.contains('is-open');
      if (isOpen) closeDrawer(); else openDrawer();
    });

    navDrawerClose.addEventListener('click', () => closeDrawer());

    navDrawerLinks.forEach((link) => {
      link.addEventListener('click', () => closeDrawer({ restoreFocus: false }));
    });

    // Tap en el overlay (fuera de los links) cierra el menú
    navDrawer.addEventListener('click', (e) => {
      if (e.target === navDrawer || e.target.classList.contains('nav-drawer__body') || e.target.classList.contains('nav-drawer__top')) {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDrawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  /* -----------------------------------------------------
     Acordeón del Menú — una sola categoría abierta a la vez
     ----------------------------------------------------- */
  const categoryTriggers = document.querySelectorAll('.menu-category__trigger');

  function getPanel(trigger) {
    // El trigger vive dentro de un <h3> semántico; el panel es el hermano de ese <h3>.
    return trigger.closest('.menu-category__h').nextElementSibling;
  }

  function staggerItems(panel, open) {
    if (!panel) return;
    panel.classList.toggle('is-open', open);
    const items = panel.querySelectorAll('.menu-item');
    items.forEach((item, i) => {
      if (open) {
        const delay = prefersReducedMotion() ? 0 : Math.min(i * 45, 480);
        item.style.transitionDelay = `${delay}ms`;
        requestAnimationFrame(() => item.classList.add('is-visible'));
      } else {
        item.classList.remove('is-visible');
        item.style.transitionDelay = '0ms';
      }
    });
  }

  function toggleCategory(trigger, { scrollIntoView = true } = {}) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const panel = getPanel(trigger);

    // Cierra todas las demás categorías (nunca dos abiertas a la vez)
    categoryTriggers.forEach((other) => {
      if (other !== trigger && other.getAttribute('aria-expanded') === 'true') {
        other.setAttribute('aria-expanded', 'false');
        staggerItems(getPanel(other), false);
      }
    });

    trigger.setAttribute('aria-expanded', String(!isOpen));
    staggerItems(panel, !isOpen);

    if (!isOpen && scrollIntoView) {
      requestAnimationFrame(() => {
        const headerH = header.offsetHeight;
        const top = trigger.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }
  }

  categoryTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => toggleCategory(trigger));
  });

  // Abre la primera categoría por defecto, sin desplazar la página al cargar
  if (categoryTriggers.length) {
    toggleCategory(categoryTriggers[0], { scrollIntoView: false });
  }

  /* -----------------------------------------------------
     Reveal al hacer scroll (Intersection Observer)
     ----------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const group = el.closest('[data-reveal-group]');
          if (group) {
            const siblings = Array.from(group.querySelectorAll('[data-reveal]'));
            const idx = siblings.indexOf(el);
            el.style.transitionDelay = prefersReducedMotion() ? '0ms' : `${Math.min(idx * 70, 560)}ms`;
          }
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -----------------------------------------------------
     Galería — lightbox ligero
     ----------------------------------------------------- */
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  let lastFocusedGalleryItem = null;

  function openLightbox(fullSrc, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = fullSrc;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    lightboxClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    if (lastFocusedGalleryItem) lastFocusedGalleryItem.focus({ preventScroll: true });
  }

  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      lastFocusedGalleryItem = item;
      const fullSrc = item.getAttribute('data-full');
      const img = item.querySelector('img');
      openLightbox(fullSrc, img ? img.alt : '');
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

  /* -----------------------------------------------------
     Foco visible al navegar por anclas (a11y)
     ----------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        window.setTimeout(() => target.setAttribute('tabindex', '-1'), 0);
      }
    });
  });
})();
