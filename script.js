// Tidewater Cycles — fleet loading and booking widget.
const $ = id => document.getElementById(id);
const money = n => `$${Number(n).toLocaleString('en-US')}`;
const STORE = 'tidewater.bookings';
const DAY = 864e5;

const store = {
  get() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } },
  set(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* private mode */ } },
};

// --- Mobile nav ---
const menuToggle = $('menuToggle');
const nav = $('nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

// --- Toast ---
const toast = $('toast');
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

// --- Fleet ---
let bikes = [];
const fleetGrid = $('fleetGrid');
const bikeSelect = $('bikeSelect');

async function loadFleet() {
  $('fleetError').hidden = true;
  fleetGrid.setAttribute('aria-busy', 'true');
  fleetGrid.innerHTML = Array(6).fill('<article class="bike-card skeleton"></article>').join('');
  try {
    const r = await fetch('/api/bikes');
    if (!r.ok) throw new Error(r.status);
    ({ bikes } = await r.json());
    renderFleet();
    fillSelect();
  } catch {
    fleetGrid.innerHTML = '';
    bikeSelect.innerHTML = '<option value="">Fleet unavailable</option>';
    $('fleetError').hidden = false;
  } finally {
    fleetGrid.setAttribute('aria-busy', 'false');
  }
}

function renderFleet() {
  fleetGrid.innerHTML = bikes.map(b => `
    <article class="bike-card">
      <img src="${b.image}" alt="${b.name}" loading="lazy">
      <div class="bike-body">
        <span class="bike-type">${b.type}</span>
        <h3>${b.name}</h3>
        <p class="bike-desc">${b.description}</p>
        <p class="bike-specs">${b.specs}</p>
        <div class="bike-foot">
          <span class="price">${money(b.pricePerDay)}<small>/day</small></span>
          <button class="btn btn-ghost btn-sm" data-book="${b.id}">Book this</button>
        </div>
      </div>
    </article>`).join('');
  fleetGrid.querySelectorAll('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    bikeSelect.value = btn.dataset.book;
    document.querySelector('#book').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => ($('fromDate').value ? $('toDate') : $('fromDate')).focus(), 400);
    requestQuote();
  }));
}

function fillSelect() {
  const current = bikeSelect.value;
  bikeSelect.innerHTML = '<option value="">Choose a bike</option>' +
    bikes.map(b => `<option value="${b.id}">${b.name} — ${money(b.pricePerDay)}/day</option>`).join('');
  if (current) bikeSelect.value = current;
}
$('fleetRetry').addEventListener('click', loadFleet);

// --- Dates ---
const fromDate = $('fromDate');
const toDate = $('toDate');
const todayISO = new Date().toISOString().slice(0, 10);
fromDate.min = todayISO;
toDate.min = new Date(Date.now() + DAY).toISOString().slice(0, 10);
fromDate.addEventListener('change', () => {
  const t = Date.parse(fromDate.value);
  if (Number.isNaN(t)) return;
  toDate.min = new Date(t + DAY).toISOString().slice(0, 10);
  if (toDate.value && toDate.value <= fromDate.value) toDate.value = toDate.min;
});

// --- Field errors ---
function setErrors(fields = {}) {
  document.querySelectorAll('#bookingForm .field-error').forEach(p => {
    const msg = fields[p.dataset.for] || '';
    p.textContent = msg;
    const input = p.parentElement.querySelector('input, select');
    if (input) input.classList.toggle('is-invalid', Boolean(msg));
  });
}

// --- Quote ---
let quoteTimer;
let lastQuote = null;
let quoteSeq = 0;
const quote = $('quote');
const customerFields = $('customerFields');
const submitBtn = $('submitBtn');

function resetQuote() {
  lastQuote = null;
  customerFields.hidden = true;
  submitBtn.textContent = 'Check availability';
}

function requestQuote() {
  clearTimeout(quoteTimer);
  quoteTimer = setTimeout(fetchQuote, 250);
}

async function fetchQuote() {
  const bike = bikeSelect.value, from = fromDate.value, to = toDate.value;
  resetQuote();
  if (!bike || !from || !to) { quote.innerHTML = ''; setErrors(); return; }
  const seq = ++quoteSeq;
  quote.innerHTML = '<p class="quote-loading">Checking availability…</p>';
  try {
    const r = await fetch(`/api/availability?${new URLSearchParams({ bike, from, to })}`);
    const q = await r.json();
    if (seq !== quoteSeq) return; // stale response
    if (!r.ok) { setErrors(q.fields); quote.innerHTML = ''; return; }
    setErrors();
    if (!q.available) { quote.innerHTML = `<p class="quote-no">${q.reason}</p>`; return; }
    lastQuote = q;
    const dayLabel = `${q.days} day${q.days === 1 ? '' : 's'}`;
    quote.innerHTML = `
      <div class="quote-ok">
        <div><span>${dayLabel} × ${money(q.pricePerDay)}</span><span>${money(q.days * q.pricePerDay)}</span></div>
        ${q.discount ? `<div class="quote-discount"><span>Weekly discount (15%)</span><span>−${money(q.discount)}</span></div>` : ''}
        <div class="quote-total"><span>Total at pickup</span><span>${money(q.total)}</span></div>
      </div>`;
    customerFields.hidden = false;
    submitBtn.textContent = 'Reserve this bike';
  } catch {
    if (seq === quoteSeq) quote.innerHTML = '<p class="quote-no">Could not check availability. Please try again.</p>';
  }
}
[bikeSelect, fromDate, toDate].forEach(el => el.addEventListener('change', requestQuote));

// --- Submit ---
$('bookingForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!lastQuote) { fetchQuote(); return; }
  const body = {
    bike: bikeSelect.value, from: fromDate.value, to: toDate.value,
    name: $('nameInput').value, email: $('emailInput').value, phone: $('phoneInput').value,
  };
  submitBtn.disabled = true;
  submitBtn.textContent = 'Reserving…';
  try {
    const r = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) {
      setErrors(data.fields);
      if (!data.fields) showToast(data.error);
      else document.querySelector('#bookingForm .is-invalid')?.focus();
      return;
    }
    saveBooking(data);
    showConfirmation(data);
    showToast('Bike reserved. See you on Cannery Row.');
  } catch {
    showToast('Network error. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reserve this bike';
  }
});

function showConfirmation(b) {
  const form = $('bookingForm');
  const box = $('confirmation');
  form.hidden = true;
  box.hidden = false;
  box.innerHTML = `
    <p class="eyebrow">Reserved</p>
    <h3>See you on Cannery Row, ${b.name.split(' ')[0]}.</h3>
    <dl>
      <div><dt>Reference</dt><dd class="ref">${b.reference}</dd></div>
      <div><dt>Bike</dt><dd>${b.bike.name}</dd></div>
      <div><dt>Dates</dt><dd>${b.from} to ${b.to} · ${b.days} day${b.days === 1 ? '' : 's'}</dd></div>
      ${b.discount ? `<div><dt>Discount</dt><dd>−${money(b.discount)}</dd></div>` : ''}
      <div><dt>Total at pickup</dt><dd>${money(b.total)}</dd></div>
      <div><dt>Pickup</dt><dd>${b.pickup}</dd></div>
    </dl>
    <button class="btn btn-ghost btn-sm" id="againBtn">Make another booking</button>`;
  $('againBtn').focus();
  $('againBtn').addEventListener('click', () => {
    box.hidden = true;
    form.hidden = false;
    form.reset();
    quote.innerHTML = '';
    setErrors();
    resetQuote();
    bikeSelect.focus();
  });
}

function saveBooking(b) {
  const list = store.get();
  list.unshift(b);
  store.set(list.slice(0, 5));
  renderBookings();
}

function renderBookings() {
  const list = store.get();
  const box = $('myBookings');
  box.hidden = list.length === 0;
  if (!list.length) return;
  box.innerHTML = `<h4>Your bookings on this device</h4><ul>${list.map(b =>
    `<li><strong>${b.reference}</strong><span>${b.bike.name}</span><span>${b.from} to ${b.to}</span></li>`).join('')}</ul>`;
}

loadFleet();
renderBookings();
