
(function (V) {
  'use strict';
  const U = V.utils || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  V.createUI = function createUI({ views = {}, onView, onToggle } = {}) {
    const live = $('#live'), caption = $('#view-caption'), hint = $('#hint');
    const viewBtns = $$('[data-view]'), switches = $$('[data-toggle]');

    viewBtns.forEach((b) => b.addEventListener('click', () => onView && onView(b.dataset.view)));
    switches.forEach((b) => b.addEventListener('click', () => onToggle && onToggle(b.dataset.toggle, b.getAttribute('aria-checked') !== 'true')));

    // keyboard shortcuts: 1 / 2 / 3 = views, L = lights, D = daylight
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      const order = Object.keys(views);
      if (k >= '1' && k <= String(order.length)) {
        if (onView) onView(order[Number(k) - 1]);
      } else if (k === 'l') {
        const lightBtn = $('[data-toggle="lights"]');
        if (lightBtn) lightBtn.click();
      } else if (k === 'd') {
        const dayBtn = $('[data-toggle="daylight"]');
        if (dayBtn) dayBtn.click();
      }
    });

    // hide the hint after the first drag
    const stageEl = $('#scene');
    if (stageEl && hint) {
      const dismissHint = () => { 
        hint.classList.add('is-hidden'); 
        stageEl.removeEventListener('pointerdown', dismissHint); 
      };
      stageEl.addEventListener('pointerdown', dismissHint);
    }

    return {
      setView(name) {
        viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
        const v = views[name];
        if (v) {
          if (caption) caption.textContent = v.caption;
          if (live) live.textContent = v.label + ' — ' + v.caption;
        }
      },
      setToggle(name, on) {
        const b = $('[data-toggle="' + name + '"]'); 
        if (!b) return;
        b.setAttribute('aria-checked', String(on));
        const stateSpan = $('.switch__state', b);
        if (stateSpan) stateSpan.textContent = on ? 'On' : 'Off';
        if (name === 'daylight') document.documentElement.dataset.day = on ? 'on' : 'off';
        if (live) live.textContent = (name === 'lights' ? 'Lights ' : 'Daylight ') + (on ? 'on' : 'off');
      },
      reveal() {
        document.documentElement.classList.add('is-ready');
        const loader = $('#loader');
        if (loader) loader.style.display = 'none';

        if (!window.gsap || (U.prefersReducedMotion && U.prefersReducedMotion())) { 
          return Promise.resolve(); 
        }
        return new Promise((resolve) => {
          gsap.fromTo('[data-reveal]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.09, onComplete: resolve });
        });
      },
      fallback(message) { 
        const fb = $('#fallback');
        const fbMsg = $('#fallback-msg');
        if (fb) fb.hidden = false; 
        if (fbMsg) fbMsg.textContent = message; 
      }
    };
  };
})((window.VEYRA = window.VEYRA || {}));