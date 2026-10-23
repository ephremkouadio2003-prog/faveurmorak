const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = document.getElementById('nav');
const intro = document.getElementById('intro');

// Badge : retournement auto + au clic, inclinaison à la souris
const badgeCard = document.getElementById('badgeCard');
let flipTimer = null;
const flip = () => badgeCard.classList.toggle('is-flipped');
const startFlipLoop = () => {
  clearInterval(flipTimer);
  if (!reduceMotion) flipTimer = setInterval(flip, 4200);
};
badgeCard.addEventListener('click', () => { flip(); startFlipLoop(); });
startFlipLoop();

intro.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const r = intro.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  badgeCard.style.setProperty('--ry', `${x * 16}deg`);
  badgeCard.style.setProperty('--rx', `${-y * 10}deg`);
});
intro.addEventListener('pointerleave', () => {
  badgeCard.style.setProperty('--ry', '0deg');
  badgeCard.style.setProperty('--rx', '0deg');
});

// Machine à écrire
const typeText = (el, text, speed = 45) => new Promise((resolve) => {
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, speed);
    else resolve();
  };
  tick();
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Phrases tournantes en bas de l'intro
const introType = document.getElementById('introType');
const phrases = [
  'Des contenus qui font vendre',
  'Des communautés qui s\'engagent',
  'Des marques qu\'on a envie de suivre',
];
(async () => {
  if (reduceMotion) { introType.textContent = phrases[0]; return; }
  await wait(1200);
  for (let n = 0; ; n = (n + 1) % phrases.length) {
    await typeText(introType, phrases[n], 55);
    await wait(1800);
    introType.textContent = '';
    await wait(300);
  }
})();

// Titre du hero tapé quand il devient visible
const heroTitle = document.getElementById('heroTitle');
const heroText = heroTitle.dataset.text;
if (!reduceMotion) {
  heroTitle.textContent = '';
  const span = document.createElement('span');
  const caret = document.createElement('span');
  caret.className = 'caret';
  heroTitle.append(span, caret);
  const heroIO = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    heroIO.disconnect();
    typeText(span, heroText, 42);
  }, { threshold: 0.4 });
  heroIO.observe(heroTitle);
}

// Scroll : intro qui recule, nav, réalisations horizontales
const work = document.getElementById('work');
const workTrack = document.getElementById('workTrack');
const workBar = document.getElementById('workBar');
const darkSections = [...document.querySelectorAll('[data-theme="dark"]')];
const isDesktop = () => window.innerWidth > 760;

const sizeWork = () => {
  if (!isDesktop()) { work.style.removeProperty('--work-h'); return; }
  const distance = workTrack.scrollWidth - window.innerWidth;
  work.style.setProperty('--work-h', `${window.innerHeight + Math.max(distance, 0)}px`);
};

let ticking = false;
const onScroll = () => {
  ticking = false;
  const vh = window.innerHeight;
  const y = window.scrollY;

  const p = Math.min(y / vh, 1);
  intro.style.setProperty('--p', p.toFixed(3));
  intro.style.visibility = y > vh * 1.5 ? 'hidden' : '';

  nav.classList.toggle('is-visible', y > vh * 0.6);
  const navMid = 40;
  nav.classList.toggle('is-dark', darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= navMid && r.bottom >= navMid;
  }));

  if (isDesktop()) {
    const r = work.getBoundingClientRect();
    const distance = workTrack.scrollWidth - window.innerWidth;
    const progress = Math.min(Math.max(-r.top / (work.offsetHeight - vh), 0), 1);
    workTrack.style.transform = `translate3d(${-progress * distance}px,0,0)`;
    workBar.style.setProperty('--wp', progress.toFixed(3));
  }
};
const requestTick = () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
};
window.addEventListener('scroll', requestTick, { passive: true });
window.addEventListener('resize', () => { sizeWork(); requestTick(); });
window.addEventListener('load', () => { sizeWork(); requestTick(); });
sizeWork();
onScroll();

// Apparitions + compteurs
const animateCount = (el) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1600, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.transitionDelay = `${Math.max(siblings.indexOf(el), 0) * 90}ms`;
    el.classList.add('is-visible');
    el.querySelectorAll('[data-count]').forEach(animateCount);
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Rangée de preuves : glisser à la souris
document.querySelectorAll('[data-drag]').forEach((row) => {
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    startX = e.clientX;
    startScroll = row.scrollLeft;
    moved = false;
    row.classList.add('is-dragging');
    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      row.scrollLeft = startScroll - dx;
    };
    const up = () => {
      row.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  // Un glissement ne doit pas ouvrir la lightbox
  row.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
});

// Aperçu vidéo au survol
document.querySelectorAll('.playable').forEach((btn) => {
  let preview = null;
  btn.addEventListener('mouseenter', () => {
    if (reduceMotion) return;
    preview = document.createElement('video');
    Object.assign(preview, { src: btn.dataset.video, muted: true, loop: true, playsInline: true });
    btn.prepend(preview);
    preview.play().catch(() => {});
    btn.querySelector('.play').classList.add('is-hidden');
  });
  btn.addEventListener('mouseleave', () => {
    preview?.remove();
    preview = null;
    btn.querySelector('.play').classList.remove('is-hidden');
  });
});

// Lightbox (images & vidéos)
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbVideo = document.getElementById('lbVideo');
const lbCaption = document.getElementById('lbCaption');
let lastFocus = null;

const openLightbox = (trigger) => {
  lastFocus = trigger;
  const { full, video, title } = trigger.dataset;
  lbImg.hidden = !full;
  lbVideo.hidden = !video;
  if (full) { lbImg.src = full; lbImg.alt = title; }
  if (video) { lbVideo.src = video; lbVideo.play().catch(() => {}); }
  lbCaption.textContent = title || '';
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lbClose').focus();
};
const closeLightbox = () => {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  lbVideo.pause();
  lbVideo.removeAttribute('src');
  lbImg.removeAttribute('src');
  lastFocus?.focus();
};

document.querySelectorAll('.zoomable, .playable').forEach((el) => {
  el.addEventListener('click', () => openLightbox(el));
});
document.getElementById('lbClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });
