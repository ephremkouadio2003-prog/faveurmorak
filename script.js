// Nav: fond au scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu mobile
const burger = document.getElementById('burger');
const links = document.getElementById('navLinks');
const setMenu = (open) => {
  links.classList.toggle('is-open', open);
  nav.classList.toggle('is-menu', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
};
if (burger && links) {
  burger.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
}

// Fermeture menu au redimensionnement
window.addEventListener('resize', () => {
  if (window.innerWidth > 760 && links && links.classList.contains('is-open')) {
    setMenu(false);
  }
});

// Apparition au scroll + compteurs
const animateCount = (el) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(animateCount);
    io.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
document.querySelectorAll('.section__head').forEach((el) => io.observe(el));

// Lightbox unifiée (Photos & Vidéos)
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbVideo = document.getElementById('lbVideo');
const lbCaption = document.getElementById('lbCaption');
let lastFocus = null;

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.style.overflow = '';
  if (lbVideo) {
    lbVideo.pause();
    lbVideo.src = '';
    lbVideo.style.display = 'none';
  }
  if (lbImg) {
    lbImg.src = '';
    lbImg.style.display = 'none';
  }
  if (lbCaption) lbCaption.textContent = '';
  lastFocus?.focus();
};

// Clics Galerie Photos
document.querySelectorAll('.gallery__item').forEach((btn) => {
  btn.addEventListener('click', () => {
    lastFocus = btn;
    if (lbVideo) {
      lbVideo.pause();
      lbVideo.src = '';
      lbVideo.style.display = 'none';
    }
    if (lbImg) {
      lbImg.src = btn.dataset.full;
      lbImg.alt = btn.dataset.title || (btn.querySelector('img') ? btn.querySelector('img').alt : 'Aperçu photo');
      lbImg.style.display = 'block';
    }
    if (lbCaption) lbCaption.textContent = btn.dataset.title || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = lightbox.querySelector('.lightbox__close');
    if (closeBtn) closeBtn.focus();
  });
});

// Clics & Clavier Galerie Vidéos
document.querySelectorAll('.video-card').forEach((card) => {
  const openVideo = () => {
    lastFocus = card;
    if (lbImg) {
      lbImg.src = '';
      lbImg.style.display = 'none';
    }
    if (lbVideo) {
      lbVideo.src = card.dataset.video;
      lbVideo.style.display = 'block';
      lbVideo.play().catch(() => {});
    }
    if (lbCaption) lbCaption.textContent = card.dataset.title || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = lightbox.querySelector('.lightbox__close');
    if (closeBtn) closeBtn.focus();
  };

  card.addEventListener('click', openVideo);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideo();
    }
  });
});

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target !== lbImg && e.target !== lbVideo) {
      closeLightbox();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (lightbox && !lightbox.hidden) closeLightbox();
    else if (links && links.classList.contains('is-open')) setMenu(false);
  }
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nom découpé en lettres
const title = document.querySelector('.hero__title');
if (!reduceMotion && title) {
  let i = 0;
  title.querySelectorAll('.line').forEach((line) => {
    const text = line.textContent;
    line.setAttribute('aria-label', text);
    line.innerHTML = [...text].map((ch) => `<span class="char" aria-hidden="true" style="--i:${i++}">${ch}</span>`).join('');
  });
  title.classList.add('is-split');
}

// Cascade : index pour chaque enfant
document.querySelectorAll('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty('--i', i));
});

// Barre de progression, parallaxe du hero, ligne du parcours
const progress = document.querySelector('.progress');
const heroImg = document.querySelector('.hero__photo img');
const timeline = document.querySelector('.timeline');
const sections = document.querySelectorAll('section[id], header[id]');
const navAnchors = links ? links.querySelectorAll('a[href^="#"]') : [];

let ticking = false;
const update = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.setProperty('--p', max > 0 ? scrollY / max : 0);
  if (!reduceMotion && scrollY < innerHeight && heroImg) {
    heroImg.style.setProperty('--py', `${scrollY * 0.12}px`);
  }
  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const t = (innerHeight * 0.7 - r.top) / r.height;
    timeline.style.setProperty('--tl', Math.max(0, Math.min(1, t)));
  }

  // Active navigation link
  const scrollPos = window.scrollY + 140;
  let currentId = '';
  sections.forEach((sec) => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      currentId = sec.getAttribute('id');
    }
  });
  navAnchors.forEach((link) => {
    const href = link.getAttribute('href').replace('#', '');
    link.classList.toggle('is-active', href === currentId);
  });

  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(update);
    ticking = true;
  }
}, { passive: true });
update();

// Année dynamique
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
