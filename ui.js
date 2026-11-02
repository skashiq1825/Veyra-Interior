(function (V) {
  'use strict';
  const U = V.utils;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  V.createUI = function createUI({ views, onView, onToggle }) {
    const loader = $('#loader'), pct = $('#loader-pct'), bar = $('#loader-bar');
    const errorBox = $('#loader-error'), errorMsg = $('#loader-error-msg'), retryBtn = $('#loader-retry');
    const live = $('#live'), caption = $('#view-caption'), hint = $('#hint');
    const viewBtns = $$('[data-view]'), switches = $$('[data-toggle]');
    let shown = 0;

    viewBtns.forEach((b) => b.addEventListener('click', () => onView(b.dataset.view)));
    switches.forEach((b) => b.addEventListener('click', () => onToggle(b.dataset.toggle, b.getAttribute('aria-checked') !== 'true')));

    // keyboard shortcuts: 1 / 2 / 3 = views, L = lights, D = daylight
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      const order = Object.keys(views);
      if (k >= '1' && k <= String(order.length)) onView(order[Number(k) - 1]);
      else if (k === 'l') $('[data-toggle="lights"]').click();
      else if (k === 'd') $('[data-toggle="daylight"]').click();
    });

    // hide the hint after the first drag
    const stageEl = $('#scene');
    const dismissHint = () => { hint.classList.add('is-hidden'); stageEl.removeEventListener('pointerdown', dismissHint); };
    stageEl.addEventListener('pointerdown', dismissHint);

    return {
      setProgress(p) {
        shown = Math.max(shown, p);
        const v = Math.round(shown * 100);
        pct.textContent = String(v).padStart(2, '0');
        bar.style.transform = 'scaleX(' + shown + ')';
        loader.setAttribute('aria-valuenow', String(v));
      },
      showError(message, retry) {
        errorMsg.textContent = message;
        errorBox.hidden = false;
        loader.classList.add('has-error');
        retryBtn.onclick = () => { errorBox.hidden = true; loader.classList.remove('has-error'); shown = 0; retry(); };
      },
      setView(name) {
        viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
        const v = views[name];
        if (v) { caption.textContent = v.caption; live.textContent = v.label + ' — ' + v.caption; }
      },
      setToggle(name, on) {
        const b = $('[data-toggle="' + name + '"]'); if (!b) return;
        b.setAttribute('aria-checked', String(on));
        $('.switch__state', b).textContent = on ? 'On' : 'Off';
        if (name === 'daylight') document.documentElement.dataset.day = on ? 'on' : 'off';
        live.textContent = (name === 'lights' ? 'Lights ' : 'Daylight ') + (on ? 'on' : 'off');
      },
      /** Slides the loader away and staggers the hero copy in. Resolves when the scene is visible. */
      reveal() {
        document.documentElement.classList.add('is-ready');
        const done = () => { loader.hidden = true; };
        if (!window.gsap || U.prefersReducedMotion()) { done(); return Promise.resolve(); }
        return new Promise((resolve) => {
          const tl = gsap.timeline({ onComplete: done });
          tl.to(loader, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 0.15)
            .fromTo('[data-reveal]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, 0.75)
            .call(resolve, null, 0.6);
        });
      },
      fallback(message) { $('#fallback').hidden = false; $('#fallback-msg').textContent = message; loader.hidden = true; }
    };
  };
})((window.VEYRA = window.VEYRA || {}));