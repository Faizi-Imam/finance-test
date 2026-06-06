/* ═══════════════════════════════════
   FAIDENCE FINANCE – app.js
   Calculator Logic + Chart Engine
═══════════════════════════════════ */

'use strict';

/* ── HELPERS ── */
const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const el  = (id) => document.getElementById(id);

/* ── NAVBAR SCROLL EFFECT ── */
window.addEventListener('scroll', () => {
  el('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

/* ── HAMBURGER MENU ── */
el('hamburger').addEventListener('click', () => {
  el('nav-links').classList.toggle('open');
});

/* ════════════════════════════
   TAB SWITCHING
════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
    b.setAttribute('aria-selected', b.dataset.tab === name);
  });
  document.querySelectorAll('.calc-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'calc-' + name);
  });
  // trigger recalc for the active panel
  recalcAll();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ════════════════════════════
   DONUT CHART ENGINE
════════════════════════════ */
function drawDonut(canvasId, values, colors) {
  const canvas = el(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = cx - 18, ir = r * 0.58;
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let start = -Math.PI / 2;

  values.forEach((val, i) => {
    const angle = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += angle;
  });

  // donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim() || '#0d1220';
  ctx.fill();

  // centre text
  const pct = Math.round((values[0] / total) * 100);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = `800 ${Math.floor(r * 0.32)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct + '%', cx, cy - 6);
  ctx.font = `500 ${Math.floor(r * 0.18)}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('principal', cx, cy + 14);
}

/* ════════════════════════════
   SYNC SLIDERS ↔ INPUTS
════════════════════════════ */
function syncPair(inputId, sliderId, calcFn) {
  const inp = el(inputId), rng = el(sliderId);
  if (!inp || !rng) return;
  inp.addEventListener('input', () => { rng.value = inp.value; calcFn(); });
  rng.addEventListener('input', () => { inp.value = rng.value; calcFn(); });
}

/* ════════════════════════════
   1. EMI CALCULATOR
════════════════════════════ */
function calcEMI() {
  const P = parseFloat(el('emi-principal').value) || 0;
  const r = (parseFloat(el('emi-rate').value) || 0) / 12 / 100;
  const n = (parseFloat(el('emi-tenure').value) || 0) * 12;
  if (P <= 0 || r <= 0 || n <= 0) return;

  const emi  = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;

  el('emi-result').textContent        = fmt(emi);
  el('emi-principal-out').textContent = fmt(P);
  el('emi-interest-out').textContent  = fmt(interest);
  el('emi-total-out').textContent     = fmt(total);

  drawDonut('emi-chart', [P, interest], ['#3b82f6', '#10b981']);
}

syncPair('emi-principal', 'emi-principal-r', calcEMI);
syncPair('emi-rate',      'emi-rate-r',      calcEMI);
syncPair('emi-tenure',    'emi-tenure-r',    calcEMI);

/* ════════════════════════════
   2. SIP CALCULATOR
════════════════════════════ */
function calcSIP() {
  const P = parseFloat(el('sip-amount').value) || 0;
  const r = (parseFloat(el('sip-rate').value) || 0) / 12 / 100;
  const n = (parseFloat(el('sip-tenure').value) || 0) * 12;
  if (P <= 0 || r <= 0 || n <= 0) return;

  const fv       = P * (Math.pow(1 + r, n) - 1) / r * (1 + r);
  const invested = P * n;
  const gain     = fv - invested;

  el('sip-result').textContent  = fmt(gain);
  el('sip-invested').textContent = fmt(invested);
  el('sip-gain').textContent    = fmt(gain);
  el('sip-total').textContent   = fmt(fv);

  drawDonut('sip-chart', [invested, gain], ['#3b82f6', '#10b981']);
}

syncPair('sip-amount',  'sip-amount-r',  calcSIP);
syncPair('sip-rate',    'sip-rate-r',    calcSIP);
syncPair('sip-tenure',  'sip-tenure-r',  calcSIP);

/* ════════════════════════════
   3. FD CALCULATOR
════════════════════════════ */
function calcFD() {
  const P = parseFloat(el('fd-principal').value) || 0;
  const r = (parseFloat(el('fd-rate').value) || 0) / 100;
  const t = parseFloat(el('fd-tenure').value) || 0;
  const n = parseFloat(el('fd-freq').value) || 4;
  if (P <= 0 || r <= 0 || t <= 0) return;

  const A        = P * Math.pow(1 + r / n, n * t);
  const interest = A - P;

  el('fd-result').textContent        = fmt(A);
  el('fd-principal-out').textContent = fmt(P);
  el('fd-interest-out').textContent  = fmt(interest);
  el('fd-total-out').textContent     = fmt(A);

  drawDonut('fd-chart', [P, interest], ['#3b82f6', '#10b981']);
}

syncPair('fd-principal', 'fd-principal-r', calcFD);
syncPair('fd-rate',      'fd-rate-r',      calcFD);
syncPair('fd-tenure',    'fd-tenure-r',    calcFD);
el('fd-freq').addEventListener('change', calcFD);

/* ════════════════════════════
   4. GST CALCULATOR
════════════════════════════ */
function calcGST() {
  const amt     = parseFloat(el('gst-amount').value) || 0;
  const rate    = parseFloat(el('gst-rate').value) || 18;
  const type    = document.querySelector('input[name="gst-type"]:checked').value;
  const half    = rate / 2;

  let original, gstAmt, total;

  if (type === 'exclusive') {
    original = amt;
    gstAmt   = amt * rate / 100;
    total    = amt + gstAmt;
    el('gst-total-label').textContent = 'Total Amount (with GST)';
  } else {
    total    = amt;
    original = amt * 100 / (100 + rate);
    gstAmt   = total - original;
    el('gst-total-label').textContent = 'Pre-GST Amount';
  }

  el('gst-original').textContent     = fmt(original);
  el('gst-type-label').textContent   = `GST Amount (${rate}%)`;
  el('gst-amount-out').textContent   = fmt(gstAmt);
  el('gst-cgst').textContent         = fmt(gstAmt / 2);
  el('gst-sgst').textContent         = fmt(gstAmt / 2);
  el('gst-total').textContent        = type === 'exclusive' ? fmt(total) : fmt(original);
}

el('gst-amount').addEventListener('input', calcGST);
el('gst-rate').addEventListener('change', calcGST);
document.querySelectorAll('input[name="gst-type"]').forEach(r => r.addEventListener('change', calcGST));

/* ════════════════════════════
   5. COMPOUND INTEREST
════════════════════════════ */
function calcCI() {
  const P = parseFloat(el('ci-principal').value) || 0;
  const r = (parseFloat(el('ci-rate').value) || 0) / 100;
  const t = parseFloat(el('ci-tenure').value) || 0;
  const n = parseFloat(el('ci-freq').value) || 4;
  if (P <= 0 || r <= 0 || t <= 0) return;

  const A        = P * Math.pow(1 + r / n, n * t);
  const interest = A - P;

  el('ci-result').textContent        = fmt(A);
  el('ci-principal-out').textContent = fmt(P);
  el('ci-interest-out').textContent  = fmt(interest);
  el('ci-total-out').textContent     = fmt(A);

  drawDonut('ci-chart', [P, interest], ['#3b82f6', '#10b981']);
}

syncPair('ci-principal', 'ci-principal-r', calcCI);
syncPair('ci-rate',      'ci-rate-r',      calcCI);
syncPair('ci-tenure',    'ci-tenure-r',    calcCI);
el('ci-freq').addEventListener('change', calcCI);

/* ════════════════════════════
   INIT – run all calculators
════════════════════════════ */
function recalcAll() {
  calcEMI(); calcSIP(); calcFD(); calcGST(); calcCI();
}

document.addEventListener('DOMContentLoaded', () => {
  recalcAll();
});
