document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dynamic footer year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Navbar: shadow on scroll
    const navbar = document.querySelector('.navbar');
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-links');
    const setMenu = (open) => {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) setMenu(false);
    });

    // Active link tracking (whichever target crosses the middle of the viewport)
    const links = [...document.querySelectorAll('.nav-links a')].filter(a => a.getAttribute('href').startsWith('#'));
    const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        targets.forEach(t => spy.observe(t));
    }

    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const reveal = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => reveal.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('active'));
    }

    // Stat counters (start when scrolled into view)
    const counters = document.querySelectorAll('[data-count]');
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const run = (el) => {
            const end = parseInt(el.dataset.count, 10), start = performance.now(), duration = 1400;
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } }), { threshold: .6 });
        counters.forEach(el => { el.textContent = '0'; io.observe(el); });
    }


    // Dropdown toggles: tap, keyboard and mobile accordion
    const subs = [...document.querySelectorAll('.has-sub')];
    const closeSubs = (except) => subs.forEach(li => {
        if (li === except) return;
        li.classList.remove('open');
        li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
    });
    subs.forEach(li => {
        const btn = li.querySelector('.sub-toggle');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSubs(li);
            const open = li.classList.toggle('open');
            btn.setAttribute('aria-expanded', String(open));
        });
        li.querySelectorAll('.sub-menu a').forEach(a => a.addEventListener('click', () => { closeSubs(); a.blur(); }));
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.has-sub')) closeSubs(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSubs(); });

    // Landing images: tilt, parallax and spotlight follow the cursor
    if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
        document.querySelectorAll('.stage-imgs .ph').forEach(el => {
            el.addEventListener('pointermove', (e) => {
                const b = el.getBoundingClientRect();
                const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
                el.style.setProperty('--ry', ((x - .5) * 2.5).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((.5 - y) * 2.5).toFixed(2) + 'deg');
                el.style.setProperty('--px', ((.5 - x) * 8).toFixed(1) + 'px');
                el.style.setProperty('--py', ((.5 - y) * 8).toFixed(1) + 'px');
            });
            el.addEventListener('pointerleave', () => ['--rx', '--ry', '--px', '--py'].forEach(v => el.style.removeProperty(v)));
        });
    }
});