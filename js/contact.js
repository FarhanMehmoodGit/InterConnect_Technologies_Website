(() => {
    const cfg = window.SITE_CONFIG || {};
    const form = document.getElementById('rfq-form');
    const status = document.getElementById('form-status');
    const btn = document.getElementById('submit-btn');
    const success = document.getElementById('form-success');
    const area = document.getElementById('area');
    const detailWrap = document.getElementById('detail-wrap');
    const detail = document.getElementById('detail');
    const detailLabel = document.getElementById('detail-label');

    // Label shown for the extra field, depending on the chosen area
    const DETAIL = {
        'Engine Test Cells': 'Engine type(s) and test requirements',
        'Aerospace Test Equipment': 'Equipment / system and line or MRO context',
        'Spares & Support': 'Equipment concerned and support needed',
        'Project Consultancy & Management': 'Programme stage (requirements, offer evaluation, negotiation)',
        'Unmanned Systems & Life Cycle': 'Platform (UAS / USV) and operating environment'
    };

    const setActive = (el, on) => {
        el.hidden = !on;
        el.querySelectorAll('input, select, textarea').forEach(c => { c.disabled = !on; });
    };

    const updateType = () => {
        const type = form.request_type.value;
        form.querySelectorAll('[data-only]').forEach(el => setActive(el, el.dataset.only === type));
        clearErrors();
    };

    const updateArea = () => {
        const label = DETAIL[area.value];
        setActive(detailWrap, !!label);
        if (label) detailLabel.textContent = label;
    };

    const clearErrors = () => {
        form.querySelectorAll('.err').forEach(e => e.remove());
        form.querySelectorAll('.invalid').forEach(f => f.classList.remove('invalid'));
    };

    const validate = () => {
        clearErrors();
        let first = null;
        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.disabled || el.validity.valid) return;
            const field = el.closest('.field');
            field.classList.add('invalid');
            const msg = document.createElement('span');
            msg.className = 'err';
            msg.textContent = el.type === 'email' && el.value ? 'Enter a valid email address.' : 'This field is required.';
            field.appendChild(msg);
            first = first || el;
        });
        if (first) first.focus();
        return !first;
    };

    // Collect visible fields using their on-screen labels as keys
    const collect = () => {
        const data = {};
        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.disabled || el.type === 'radio' || el.id === 'consent' || !el.value.trim()) return;
            const lab = form.querySelector(`label[for="${el.id}"]`);
            const key = el.name === 'email' || el.name === '_honey' ? el.name : (lab ? lab.textContent.replace(/\s*\*$/, '') : el.name);
            data[key] = el.value.trim();
        });
        data['Request type'] = form.request_type.value === 'rfq' ? 'RFQ' : 'Discuss a requirement';
        return data;
    };

    const mailtoLink = (data, to) => {
        const body = Object.entries(data).filter(([k]) => k !== '_honey').map(([k, v]) => `${k}: ${v}`).join('\n');
        return `mailto:${to}?subject=${encodeURIComponent(data['Request type'] + ' - ' + (data.name || ''))}&body=${encodeURIComponent(body)}`;
    };

    const send = async (data) => {
        const to = cfg.recipientEmail || '';
        if (!cfg.endpoint && (!to || to.includes('example.com'))) throw new Error('not-configured');
        const url = cfg.endpoint || 'https://formsubmit.co/ajax/' + encodeURIComponent(to);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ ...data, _subject: `[Website] ${data['Request type']} from ${data.name}`, _template: 'table', _captcha: 'false' })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'send-failed');
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = ''; status.className = 'form-status';
        if (!validate()) return;
        const data = collect();
        if (data._honey) return; // bot
        btn.disabled = true; btn.textContent = 'Sending...';
        try {
            await send(data);
            form.hidden = true; success.hidden = false;
            success.querySelector('h2').focus?.();
        } catch (err) {
            const to = cfg.recipientEmail || '';
            status.className = 'form-status error';
            status.innerHTML = 'Sorry, we could not send your enquiry automatically. ' +
                (to && !to.includes('example.com') ? `<a href="${mailtoLink(data, to)}">Send it from your email app instead</a>.` : 'The recipient email has not been configured yet.');
        } finally {
            btn.disabled = false; btn.textContent = 'Send enquiry';
        }
    });

    form.addEventListener('input', (e) => {
        const f = e.target.closest('.field');
        if (f && f.classList.contains('invalid') && e.target.validity.valid) { f.classList.remove('invalid'); f.querySelector('.err')?.remove(); }
    });
    form.querySelectorAll('input[name="request_type"]').forEach(r => r.addEventListener('change', updateType));
    area.addEventListener('change', updateArea);
    document.getElementById('again-btn').addEventListener('click', () => {
        form.reset(); form.hidden = false; success.hidden = true; updateType(); updateArea();
    });

    // Preselect from ?type=rfq or ?type=requirement
    const q = new URLSearchParams(location.search);
    const t = q.get('type');
    if (t === 'rfq' || t === 'requirement') form.request_type.value = t;
    if ([...area.options].some(o => o.value === q.get('area'))) area.value = q.get('area');
    updateType(); updateArea();
})();
