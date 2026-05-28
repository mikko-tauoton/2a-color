// ==========================================================
// A-COLOR — script.js
// Vain interaktiivisuus: navi, mobiilivalikko, hero-video,
// hero-stats count-up, hero-parallax, process-line, scroll-reveal, lomake.
// ==========================================================

const MOTION_OK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------- NAV: scroll-class + mobiilitogglet ----------
(function initNav() {
  const nav = $("#nav");
  if (!nav) return;

  const threshold = 80;
  function handleScroll() {
    if (window.scrollY > threshold) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  const toggle = $(".nav-toggle", nav);
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".nav-menu-drawer a", nav).forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  }));
})();

// ---------- HERO: video play + parallax + count-up ----------
(function initHero() {
  const slot = $("#hero");
  if (!slot) return;

  const video = $(".hero-video", slot);
  if (video && MOTION_OK) {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }

  // Parallax media (transform only)
  const media = $(".hero-media", slot);
  if (media && MOTION_OK) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y <= slot.offsetHeight) media.style.transform = `translate3d(0, ${y * 0.16}px, 0)`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Count-up hero-statseille — säilyttää prefixin/suffixin ja desimaalipilkun.
  if (MOTION_OK) {
    setTimeout(() => {
      $$(".hero-stat-value", slot).forEach(el => {
        const html = el.innerHTML;
        const m = html.match(/(\d+(?:[.,]\d+)?)/);
        if (!m) return;
        const numStr = m[1];
        const target = parseFloat(numStr.replace(",", "."));
        const decimals = /[.,]/.test(numStr) ? (numStr.split(/[.,]/)[1] || "").length : 0;
        const before = html.slice(0, m.index);
        const after = html.slice(m.index + numStr.length);
        const fmt = v => v.toFixed(decimals).replace(".", ",");
        const dur = 1500;
        let startT = null;
        const tick = now => {
          if (startT === null) startT = now;
          const t = Math.min(1, (now - startT) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.innerHTML = before + fmt(target * eased) + after;
          if (t < 1) requestAnimationFrame(tick);
          else el.innerHTML = before + fmt(target) + after;
        };
        el.innerHTML = before + fmt(0) + after;
        requestAnimationFrame(tick);
      });
    }, 900);
  }
})();

// ---------- PROCESS: connector draws on reveal ----------
(function initProcess() {
  const grid = $(".process-grid");
  if (!grid) return;
  if (!MOTION_OK) { grid.classList.add("is-drawn"); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { grid.classList.add("is-drawn"); io.disconnect(); }
    });
  }, { threshold: 0.3 });
  io.observe(grid);
})();

// ---------- SCROLL REVEAL ----------
(function initReveal() {
  if (!MOTION_OK) {
    $$(".reveal").forEach(el => el.classList.add("is-visible"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const els = entry.target.classList.contains("reveal-group")
          ? $$(".reveal", entry.target)
          : [entry.target];
        els.forEach((el, i) => setTimeout(() => el.classList.add("is-visible"), i * 70));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal-group").forEach(el => obs.observe(el));
  $$(".reveal").forEach(el => { if (!el.closest(".reveal-group")) obs.observe(el); });
})();

// ---------- BEFORE/AFTER COMPARE ----------
(function initCompare() {
  $$(".gallery-item--compare").forEach(item => {
    const media = $(".compare-media", item);
    const range = $(".compare-range", item);
    if (!media || !range) return;

    const setPos = (pct) => {
      const v = Math.max(0, Math.min(100, pct));
      item.style.setProperty("--compare-pos", v + "%");
      if (Number(range.value) !== v) range.value = String(v);
    };

    range.addEventListener("input", () => setPos(Number(range.value)));

    const updateFromClientX = (clientX) => {
      const rect = media.getBoundingClientRect();
      if (rect.width <= 0) return;
      setPos(((clientX - rect.left) / rect.width) * 100);
    };

    let dragging = false;
    media.addEventListener("pointerdown", (e) => {
      dragging = true;
      media.setPointerCapture?.(e.pointerId);
      updateFromClientX(e.clientX);
    });
    media.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      updateFromClientX(e.clientX);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      media.releasePointerCapture?.(e.pointerId);
    };
    media.addEventListener("pointerup", endDrag);
    media.addEventListener("pointercancel", endDrag);

    setPos(Number(range.value) || 50);
  });
})();

// ---------- LOMAKE ----------
(function initForm() {
  const form = $("#quote-form");
  if (!form) return;
  const success = $(".cta-form-success", form.parentElement);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const service = form.service ? form.service.value : "x";
    if (!name || !phone || !email) return;
    if (form.service && !service) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    success?.classList.add("is-visible");
    form.reset();
    setTimeout(() => success?.classList.remove("is-visible"), 6000);
  });
})();
