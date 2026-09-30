(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Rotating capability line
    const r = document.querySelector('.rot');
    if (r) {
        const words = r.dataset.words.split('|');
        let i = 0;
        setInterval(() => {
            r.classList.add('out');
            setTimeout(() => { i = (i + 1) % words.length; r.textContent = words[i]; r.classList.remove('out'); }, 350);
        }, 2600);
    }
    // Pointer tilt on image cards
    document.querySelectorAll('.img-card').forEach(c => {
        c.addEventListener('pointermove', (e) => {
            const b = c.getBoundingClientRect();
            c.style.setProperty('--ry', ((e.clientX - b.left) / b.width - .5) * 8 + 'deg');
            c.style.setProperty('--rx', -((e.clientY - b.top) / b.height - .5) * 8 + 'deg');
        });
        c.addEventListener('pointerleave', () => { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
    });
})();
