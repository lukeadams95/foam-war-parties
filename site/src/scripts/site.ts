// Small progressive-enhancement layer replacing the prototype's React state.
// Pages render fully without it; it only drives the menu, tabs, accordions and forms.

// ---- Mobile menu ----
const menu = document.querySelector<HTMLElement>('[data-menu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
function setMenu(open: boolean) {
  if (!menu) return;
  menu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  openBtn?.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector<HTMLElement>('[data-menu-close]')?.focus();
  else openBtn?.focus();
}
openBtn?.addEventListener('click', () => setMenu(true));
menu?.querySelector('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) setMenu(false); });
// The menu only exists on the mobile header; close it if the window grows past the breakpoint.
matchMedia('(min-width:1100px)').addEventListener('change', (e) => { if (e.matches && menu && !menu.hidden) setMenu(false); });

// ---- How It Works tabs (homepage) ----
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
  const steps: Record<string, string[]> = JSON.parse(root.dataset.tabs || '{}');
  const btns = root.querySelectorAll<HTMLButtonElement>('[data-tab-btn]');
  const select = (tab: string) => {
    btns.forEach((b) => {
      const on = b.dataset.tabBtn === tab;
      b.style.background = on ? '#0875D1' : '#F3F4F6';
      b.style.color = on ? '#fff' : '#182B49';
      b.setAttribute('aria-pressed', String(on));
    });
    root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => {
      el.textContent = steps[tab]?.[Number(el.dataset.step)] ?? el.textContent;
    });
  };
  btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.tabBtn!)));
});

// ---- FAQ accordions ----
// data-accordion="single" (homepage) keeps one answer open; elsewhere each question toggles on its own.
function setItem(btn: HTMLElement, open: boolean) {
  const item = btn.parentElement!;
  const panel = item.querySelector<HTMLElement>('[data-acc-panel]');
  const icon = btn.querySelector<HTMLElement>('[data-acc-icon]');
  if (panel) panel.style.display = open ? 'block' : 'none';
  if (icon) icon.textContent = open ? '–' : '+';
  btn.setAttribute('aria-expanded', String(open));
}
document.querySelectorAll<HTMLElement>('[data-acc-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    const group = btn.closest<HTMLElement>('[data-accordion="single"]');
    if (group && open) group.querySelectorAll<HTMLElement>('[data-acc-toggle]').forEach((b) => b !== btn && setItem(b, false));
    setItem(btn, open);
  });
});

// ---- Forms ----
// Set PUBLIC_FORM_ENDPOINT (e.g. a Formspree URL) at build time to deliver submissions.
// Until then, required fields are still validated and visitors are pointed to the phone number.
const FORM_ENDPOINT: string = import.meta.env.PUBLIC_FORM_ENDPOINT || '';

// Prefill form fields from the URL (Build Your Party's "Continue to Booking" link),
// e.g. /contact/?party_type=Full-Service%20Party&participants=20&message=...
const prefill = new URLSearchParams(location.search);
if ([...prefill.keys()].length) {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    prefill.forEach((value, key) => {
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[name="${CSS.escape(key)}"]`).forEach((el) => {
        if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) el.checked = el.value === value;
        else el.value = value;
      });
    });
  });
}
document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  submit?.insertAdjacentElement('afterend', status);
  const say = (tone: 'ok' | 'warn', text: string) => { status.dataset.tone = tone; status.textContent = text; status.hidden = false; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!FORM_ENDPOINT) {
      say('warn', 'Online requests are not connected yet. Please call or text (417) 559-2347 and we will get you booked.');
      return;
    }
    if (submit) submit.disabled = true;
    try {
      const data = new FormData(form);
      data.set('page', location.pathname);
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say('ok', 'Thanks! Your request is in. We will get back to you as soon as possible.');
    } catch {
      say('warn', 'Something went wrong sending your request. Please call or text (417) 559-2347.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
});
