/* Home gallery carousel: smooth endless auto-scroll (transform based, sub-pixel),
   plus drag / swipe / trackpad / buttons, and a pause control.
   Auto-scroll keeps running while hovered. */
(() => {
    const view = document.querySelector('.car-viewport');
    if (!view) return;
    const track = view.querySelector('.car-track');
    const slides = [...track.children];
    const nav = document.querySelectorAll('.car-btn[data-dir]');
    const pauseBtn = document.querySelector('.car-pause');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SPEED = 38;   // px per second (auto-scroll)
    const FRICTION = 3; // how fast a flick slows down

    // One clone set after the originals gives an endless loop
    const clones = slides.map(s => {
        const c = s.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        const img = c.querySelector('img'); if (img) img.alt = '';
        return c;
    });
    track.append(...clones);

    let loopW = 0, pos = 0, vel = 0, last = 0;
    let dragging = false, offscreen = false, userPaused = reduce, anim = null;

    const measure = () => { loopW = clones[0].offsetLeft - slides[0].offsetLeft; };
    const wrap = () => { if (loopW) pos = ((pos % loopW) + loopW) % loopW; };
    const render = () => { track.style.transform = `translate3d(${-pos}px,0,0)`; };
    measure();
    new ResizeObserver(() => { measure(); wrap(); render(); }).observe(track);

    // Pause / play (starts paused for people who prefer reduced motion)
    const syncPause = () => {
        pauseBtn.setAttribute('aria-pressed', String(userPaused));
        pauseBtn.setAttribute('aria-label', userPaused ? 'Play auto-scroll' : 'Pause auto-scroll');
    };
    pauseBtn.addEventListener('click', () => { userPaused = !userPaused; syncPause(); });
    syncPause();

    // Previous / next buttons: eased glide of two slides
    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : slides[0].offsetWidth) * 2;
    nav.forEach(b => b.addEventListener('click', () => {
        vel = 0;
        anim = { from: pos, to: pos + Number(b.dataset.dir) * step(), t0: performance.now(), dur: reduce ? 1 : 650 };
    }));
    const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

    // Drag with mouse, finger or pen (vertical page scroll is left to the browser via touch-action)
    let lastX = 0, lastT = 0;
    view.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true; anim = null; vel = 0;
        lastX = e.clientX; lastT = e.timeStamp;
        view.classList.add('is-drag'); view.setPointerCapture(e.pointerId);
    });
    view.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX, dt = Math.max(e.timeStamp - lastT, 1);
        pos -= dx; wrap(); render();
        const v = -dx / dt * 1000;
        vel = Math.max(-3000, Math.min(3000, vel * .6 + v * .4));
        lastX = e.clientX; lastT = e.timeStamp;
    });
    const endDrag = e => {
        if (!dragging) return;
        dragging = false; view.classList.remove('is-drag');
        if (e.timeStamp - lastT > 80) vel = 0; // held still before release: no flick
    };
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);

    // Trackpad / horizontal wheel
    view.addEventListener('wheel', e => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // let vertical scrolling through
        e.preventDefault();
        anim = null; pos += e.deltaX; wrap(); render();
    }, { passive: false });

    // Only animate while on screen
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { offscreen = !en.isIntersecting; }).observe(view);
    }

    const tick = (t) => {
        const dt = Math.min((t - last) / 1000, .05); last = t;
        if (anim) {
            const p = Math.min((t - anim.t0) / anim.dur, 1);
            pos = anim.from + (anim.to - anim.from) * ease(p);
            if (p >= 1) anim = null;
            wrap(); render();
        } else if (!dragging && !offscreen) {
            const auto = userPaused ? 0 : SPEED;
            pos += (auto + vel) * dt;
            vel *= Math.exp(-FRICTION * dt);
            if (Math.abs(vel) < 1) vel = 0;
            wrap(); render();
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(t => { last = t; tick(t); });
})();