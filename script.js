/* =========================================================
   Ace Chen — Portfolio interactions
   i18n · nav · reveal · hero canvas · parallax · narrative
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================
     i18n — EN / 中文
     ===================================================== */
  const I18N_KEY = 'ace_lang';
  const SUPPORTED = ['en', 'zh'];
  const DEFAULT_LANG = 'en';

  const getLang = () => {
    let stored = null;
    try { stored = localStorage.getItem(I18N_KEY); } catch (_) {}
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  };

  const tr = (key, lang) => {
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    const fb = (window.TRANSLATIONS && window.TRANSLATIONS.en) || {};
    if (key in dict) return dict[key];
    if (key in fb) return fb[key];
    return '';
  };

  const applyLang = (lang) => {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    document.documentElement.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = tr(key, lang);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = tr(key, lang);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(pair => {
        const idx = pair.indexOf(':');
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        if (attr && key) el.setAttribute(attr, tr(key, lang));
      });
    });

    const page = document.body.getAttribute('data-page');
    if (page) {
      const tKey = `page.${page}.title`;
      const dKey = `page.${page}.desc`;
      const tVal = tr(tKey, lang);
      if (tVal) document.title = tVal;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', tr(dKey, lang));
    }

    const year = new Date().getFullYear();
    document.querySelectorAll('[data-i18n-template]').forEach(el => {
      const key = el.getAttribute('data-i18n-template');
      const raw = tr(key, lang);
      el.textContent = raw.replace('{year}', year);
    });

    document.querySelectorAll('[data-lang-toggle] [data-lang]').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('data-lang') === lang);
    });
  };

  const setLang = (lang) => {
    try { localStorage.setItem(I18N_KEY, lang); } catch (_) {}
    applyLang(lang);
  };

  applyLang(getLang());

  document.querySelectorAll('[data-lang-toggle]').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const clicked = e.target.closest('[data-lang]');
      const current = getLang();
      let next;
      if (clicked) {
        next = clicked.getAttribute('data-lang');
        if (next === current) return;
      } else {
        next = current === 'en' ? 'zh' : 'en';
      }
      setLang(next);
    });
  });

  /* =====================================================
     Navigation: scroll state + mobile toggle
     ===================================================== */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const setScrolled = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });

    const toggle = nav.querySelector('[data-nav-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => {
        nav.classList.toggle('is-open');
      });
      nav.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', () => nav.classList.remove('is-open'));
      });
    }
  }

  /* =====================================================
     Reveal on scroll
     ===================================================== */
  const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* =====================================================
     Hero canvas: drifting particle grid
     ===================================================== */
  const canvas = document.querySelector('[data-hero-canvas]');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let animId;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const count = Math.max(30, Math.min(90, Math.floor((w * h) / 22000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.6 + 0.2,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist2 = dx*dx + dy*dy;
        if (dist2 < 20000) {
          const f = 0.0005;
          p.vx += dx * f;
          p.vy += dy * f;
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 255, 190, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x, ddy = p.y - q.y;
          const d2 = ddx*ddx + ddy*ddy;
          if (d2 < 14000) {
            const o = 1 - d2 / 14000;
            ctx.strokeStyle = `rgba(124, 255, 107, ${o * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(step);
    };

    resize();
    step();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(animId);
      resize();
      step();
    });

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999;
    });
  }

  /* =====================================================
     Hero glow parallax
     ===================================================== */
  const hero = document.querySelector('[data-hero]');
  if (hero && !prefersReduced) {
    const glows = hero.querySelectorAll('.hero__glow');
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      glows.forEach((g, i) => {
        const k = i === 0 ? 30 : -22;
        g.style.transform = `translate(${x * k}px, ${y * k}px)`;
      });
    });
  }

  /* =====================================================
     Narrative progress bar (fixed)
     ===================================================== */
  const narrative = document.querySelector('[data-narrative]');
  if (narrative) {
    const progress = narrative.querySelector('.narrative__progress');
    const bar = narrative.querySelector('[data-narrative-bar]');
    const onScroll = () => {
      const rect = narrative.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), total);
      const pct = total > 0 ? (passed / total) * 100 : 0;
      if (bar) bar.style.height = pct + '%';
      if (progress) {
        const inView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
        progress.classList.toggle('is-active', inView);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* =====================================================
     Pillar / project hover light
     ===================================================== */
  document.querySelectorAll('.pillar, .project').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
  });

  /* =====================================================
     Smooth anchor scroll with nav offset
     ===================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* =====================================================
     Year injection
     ===================================================== */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* =====================================================
     Home-only: gentle parallax for stage glows
     ===================================================== */
  const stage = document.querySelector('[data-page-stage]');
  if (stage && !prefersReduced) {
    const layers = stage.querySelectorAll('[data-parallax]');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-parallax')) || 0.1;
          layer.style.transform = `translate3d(0, ${y * speed}px, 0)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
