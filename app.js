'use strict';

/* ─── Helpers ─── */
function fmt(n) {
  return '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtNum(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function el(id) { return document.getElementById(id); }
function setVal(id, val) { var e = el(id); if (e) e.textContent = val; }

/* ─── Navbar scroll ─── */
window.addEventListener('scroll', function () {
  var navbar = el('navbar');
  if (!navbar) return;
  navbar.classList[window.scrollY > 20 ? 'add' : 'remove']('scrolled');
});

/* ─── Hamburger ─── */
(function () {
  var btn = el('hamburger');
  var nav = el('nav-links');
  if (btn && nav) btn.addEventListener('click', function () { nav.classList.toggle('open'); });
})();

/* ─── Sync slider ↔ number input ─── */
function syncPair(inputId, sliderId, calcFn) {
  var inp = el(inputId);
  var sld = el(sliderId);
  if (!inp || !sld) return;
  function update(src, dest) {
    src.addEventListener('input', function () {
      dest.value = src.value;
      calcFn();
    });
  }
  update(inp, sld);
  update(sld, inp);
}

/* ─── Donut chart ─── */
function drawDonut(canvasId, values, colors) {
  colors = colors || ['#3b82f6', '#10b981'];
  var canvas = el(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var cx = canvas.width / 2, cy = canvas.height / 2;
  var radius = Math.min(cx, cy) - 10;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var total = values.reduce(function (a, b) { return a + b; }, 0);
  if (total <= 0) return;
  var start = -Math.PI / 2;
  values.forEach(function (v, i) {
    var angle = (v / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    start += angle;
  });
  /* hole */
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = '#111827';
  ctx.fill();
  /* center % */
  var pct = ((values[0] / total) * 100).toFixed(1);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct + '%', cx, cy);
}

/* ═══════════════════════════════════
   1. EMI CALCULATOR
═══════════════════════════════════ */
function calcEMI() {
  if (!el('emi-principal')) return;
  var P = parseFloat(el('emi-principal').value) || 0;
  var rate = parseFloat(el('emi-rate').value) || 0;
  var years = parseFloat(el('emi-tenure').value) || 0;
  var r = rate / 12 / 100;
  var n = years * 12;
  var emi = 0, total = 0, interest = 0;
  if (r > 0 && n > 0) {
    var x = Math.pow(1 + r, n);
    emi = P * r * x / (x - 1);
    total = emi * n;
    interest = total - P;
  } else if (n > 0) {
    emi = P / n; total = P; interest = 0;
  }
  setVal('emi-result', fmt(Math.round(emi)));
  setVal('emi-principal-out', fmt(Math.round(P)));
  setVal('emi-interest-out', fmt(Math.round(interest)));
  setVal('emi-total-out', fmt(Math.round(total)));
  /* update slider fill */
  updateSliderFill('emi-principal-r', 10000, 10000000);
  updateSliderFill('emi-rate-r', 1, 30);
  updateSliderFill('emi-tenure-r', 1, 30);
  drawDonut('emi-chart', [P, Math.max(0, interest)]);
}

/* ═══════════════════════════════════
   2. SIP CALCULATOR
═══════════════════════════════════ */
function calcSIP() {
  if (!el('sip-amount')) return;
  var P = parseFloat(el('sip-amount').value) || 0;
  var rate = parseFloat(el('sip-rate').value) || 0;
  var years = parseFloat(el('sip-tenure').value) || 0;
  var r = rate / 12 / 100;
  var n = years * 12;
  var invested = P * n;
  var fv = r > 0 && n > 0 ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : invested;
  var gain = fv - invested;
  setVal('sip-result', fmt(Math.round(fv)));
  setVal('sip-invested', fmt(Math.round(invested)));
  setVal('sip-gain', fmt(Math.round(gain)));
  setVal('sip-total', fmt(Math.round(fv)));
  updateSliderFill('sip-amount-r', 500, 100000);
  updateSliderFill('sip-rate-r', 1, 30);
  updateSliderFill('sip-tenure-r', 1, 40);
  drawDonut('sip-chart', [invested, Math.max(0, gain)]);
}

/* ═══════════════════════════════════
   3. FD CALCULATOR
═══════════════════════════════════ */
function calcFD() {
  if (!el('fd-principal')) return;
  var P = parseFloat(el('fd-principal').value) || 0;
  var rate = parseFloat(el('fd-rate').value) || 0;
  var years = parseFloat(el('fd-tenure').value) || 0;
  var freq = parseInt((el('fd-freq') || {value: '4'}).value) || 4;
  var maturity = P * Math.pow(1 + (rate / 100) / freq, freq * years);
  var interest = maturity - P;
  setVal('fd-result', fmt(Math.round(maturity)));
  setVal('fd-principal-out', fmt(Math.round(P)));
  setVal('fd-interest-out', fmt(Math.round(interest)));
  setVal('fd-total-out', fmt(Math.round(maturity)));
  updateSliderFill('fd-principal-r', 1000, 5000000);
  updateSliderFill('fd-rate-r', 1, 15);
  updateSliderFill('fd-tenure-r', 1, 10);
  drawDonut('fd-chart', [P, Math.max(0, interest)]);
}

/* ═══════════════════════════════════
   4. PPF CALCULATOR
═══════════════════════════════════ */
function calcPPF() {
  if (!el('ppf-annual')) return;
  var annual = parseFloat(el('ppf-annual').value) || 0;
  var tenure = parseInt(el('ppf-tenure').value) || 0;
  var rate = 0.071;
  var balance = 0;
  for (var y = 0; y < tenure; y++) { balance = (balance + annual) * (1 + rate); }
  var invested = annual * tenure;
  var interest = balance - invested;
  setVal('ppf-result', fmt(Math.round(balance)));
  setVal('ppf-invested-out', fmt(Math.round(invested)));
  setVal('ppf-interest-out', fmt(Math.round(interest)));
  setVal('ppf-total-out', fmt(Math.round(balance)));
  updateSliderFill('ppf-annual-r', 500, 150000);
  updateSliderFill('ppf-tenure-r', 15, 50);
  drawDonut('ppf-chart', [invested, Math.max(0, interest)]);
}

/* ═══════════════════════════════════
   5. COMPOUND INTEREST CALCULATOR
═══════════════════════════════════ */
function calcCI() {
  if (!el('ci-principal')) return;
  var P = parseFloat(el('ci-principal').value) || 0;
  var rate = parseFloat(el('ci-rate').value) || 0;
  var years = parseFloat(el('ci-tenure').value) || 0;
  var freq = parseInt((el('ci-freq') || {value: '4'}).value) || 4;
  var maturity = P * Math.pow(1 + (rate / 100) / freq, freq * years);
  var interest = maturity - P;
  setVal('ci-result', fmt(Math.round(maturity)));
  setVal('ci-principal-out', fmt(Math.round(P)));
  setVal('ci-interest-out', fmt(Math.round(interest)));
  setVal('ci-total-out', fmt(Math.round(maturity)));
  updateSliderFill('ci-principal-r', 1000, 5000000);
  updateSliderFill('ci-rate-r', 1, 30);
  updateSliderFill('ci-tenure-r', 1, 40);
  drawDonut('ci-chart', [P, Math.max(0, interest)]);
}

/* ═══════════════════════════════════
   6. GST CALCULATOR
═══════════════════════════════════ */
function calcGST() {
  if (!el('gst-amount')) return;
  var amount = parseFloat(el('gst-amount').value) || 0;
  var rate = parseFloat((el('gst-rate') || {value:'18'}).value) || 18;
  var radios = document.querySelectorAll('input[name="gst-type"]');
  var type = 'exclusive';
  radios.forEach(function (r) { if (r.checked) type = r.value; });
  var original, gstAmt, total;
  if (type === 'exclusive') {
    original = amount; gstAmt = amount * rate / 100; total = amount + gstAmt;
  } else {
    total = amount; original = amount * 100 / (100 + rate); gstAmt = total - original;
  }
  setVal('gst-original', fmt(Math.round(original)));
  var lbl = el('gst-type-label');
  if (lbl) lbl.textContent = 'GST @ ' + rate + '%';
  setVal('gst-amount-out', fmt(Math.round(gstAmt * 100) / 100));
  setVal('gst-cgst', fmt(Math.round(gstAmt / 2 * 100) / 100));
  setVal('gst-sgst', fmt(Math.round(gstAmt / 2 * 100) / 100));
  setVal('gst-total', fmt(Math.round(total * 100) / 100));
}

/* ═══════════════════════════════════
   7. INCOME TAX CALCULATOR
═══════════════════════════════════ */
function calcTax() {
  if (!el('tax-income')) return;
  var income = parseFloat(el('tax-income').value) || 0;
  var deductions = parseFloat(el('tax-deductions').value) || 0;

  /* New Regime */
  var newTaxable = Math.max(0, income - 75000);
  var newTax = 0;
  var newSlabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  var rem = newTaxable, prev = 0;
  newSlabs.forEach(function(s) {
    var w = s[0] - prev, t = Math.min(rem, w);
    if (t > 0) { newTax += t * s[1]; rem -= t; }
    prev = s[0];
  });
  if (newTaxable <= 1200000) newTax = 0;
  var newCess = newTax * 0.04;
  var newTotal = newTax + newCess;

  /* Old Regime */
  var oldTaxable = Math.max(0, income - 50000 - deductions);
  var oldTax = 0;
  var oldSlabs = [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]];
  rem = oldTaxable; prev = 0;
  oldSlabs.forEach(function(s) {
    var w = s[0] - prev, t = Math.min(rem, w);
    if (t > 0) { oldTax += t * s[1]; rem -= t; }
    prev = s[0];
  });
  if (oldTaxable <= 500000) oldTax = 0;
  var oldCess = oldTax * 0.04;
  var oldTotal = oldTax + oldCess;

  setVal('tax-new-gross', fmt(income));
  setVal('tax-new-taxable', fmt(Math.round(newTaxable)));
  setVal('tax-new-tax', fmt(Math.round(newTax)));
  setVal('tax-new-cess', fmt(Math.round(newCess)));
  setVal('tax-new-total', fmt(Math.round(newTotal)));
  setVal('tax-old-gross', fmt(income));
  setVal('tax-old-deductions', fmt(deductions));
  setVal('tax-old-taxable', fmt(Math.round(oldTaxable)));
  setVal('tax-old-tax', fmt(Math.round(oldTax)));
  setVal('tax-old-cess', fmt(Math.round(oldCess)));
  setVal('tax-old-total', fmt(Math.round(oldTotal)));

  updateSliderFill('tax-income-r', 100000, 10000000);

  var savingsEl = el('tax-savings-text');
  if (savingsEl) {
    var diff = Math.abs(newTotal - oldTotal);
    if (newTotal < oldTotal) savingsEl.textContent = '\u2728 New Regime saves you ' + fmt(Math.round(diff));
    else if (oldTotal < newTotal) savingsEl.textContent = '\uD83D\uDCCB Old Regime saves you ' + fmt(Math.round(diff));
    else savingsEl.textContent = 'Both regimes result in the same tax';
  }
}

/* ═══════════════════════════════════
   8. CURRENCY CONVERTER
   Live rates from Frankfurter (ECB)
   Fallback to static rates if offline
═══════════════════════════════════ */

/* Static fallback rates (INR base) */
var forexRatesFallback = {
  INR:1, USD:85.5, EUR:93.2, GBP:108.4, JPY:0.56,
  AUD:55.8, CAD:62.5, SGD:63.7, AED:23.3, SAR:22.8, CHF:98.1, CNY:11.8
};

/* Live rates object — populated by fetchLiveRates(), INR as base */
var forexRates = Object.assign({}, forexRatesFallback);
var forexRatesDate = null;

var currencySymbols = {
  INR:'\u20B9', USD:'$', EUR:'\u20AC', GBP:'\u00A3', JPY:'\u00A5',
  AUD:'A$', CAD:'C$', SGD:'S$', AED:'AED\u00A0', SAR:'SAR\u00A0', CHF:'CHF\u00A0', CNY:'\u00A5'
};

function setForexStatus(state, msg) {
  var dot = el('forex-status-dot');
  var txt = el('forex-status-text');
  if (!dot || !txt) return;
  dot.className = 'forex-status-dot ' + state;
  txt.textContent = msg;
}

function fetchLiveRates() {
  if (!el('forex-amount')) return; /* only run on forex page */

  setForexStatus('', 'Fetching live rates…');

  /* Frankfurter v1 API — get all rates based on USD, then convert to INR base */
  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      /* data.rates is { EUR: 0.92, GBP: 0.79, INR: 85.5, ... } all vs 1 USD */
      var ratesVsUSD = data.rates;
      ratesVsUSD['USD'] = 1; /* add USD itself */

      /* Convert everything to INR base: rateINR = rateVsUSD[INR] / rateVsUSD[X] */
      var inrPerUSD = ratesVsUSD['INR'] || 85.5;
      var currencies = ['USD','EUR','GBP','JPY','AUD','CAD','SGD','AED','SAR','CHF','CNY','INR'];
      currencies.forEach(function (c) {
        if (ratesVsUSD[c]) {
          forexRates[c] = inrPerUSD / ratesVsUSD[c];
        }
      });
      forexRates['INR'] = 1;
      forexRatesDate = data.date;

      setForexStatus('live', 'Live ECB rates · ' + data.date);
      calcForex();
    })
    .catch(function (err) {
      console.warn('Forex live fetch failed, using fallback rates:', err);
      forexRates = Object.assign({}, forexRatesFallback);
      setForexStatus('error', 'Offline — showing indicative rates');
      calcForex();
    });
}

function calcForex() {
  if (!el('forex-amount')) return;
  var amount = parseFloat(el('forex-amount').value) || 0;
  var fromEl = el('forex-from'), toEl = el('forex-to');
  if (!fromEl || !toEl) return;
  var from = fromEl.value, to = toEl.value;

  var fromRate = forexRates[from] || 1;
  var toRate = forexRates[to] || 1;
  var result = amount * (fromRate / toRate);
  var sym = currencySymbols[to] || (to + '\u00A0');
  var fromSym = currencySymbols[from] || (from + '\u00A0');

  var resultEl = el('forex-result');
  if (resultEl) resultEl.textContent = sym + result.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});

  setVal('forex-from-label', fmtNum(amount) + ' ' + from);

  var rateDisplay = el('forex-rate-display');
  if (rateDisplay) {
    var oneUnit = fromRate / toRate;
    rateDisplay.textContent = '1 ' + from + ' = ' + sym +
      oneUnit.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:4}) +
      ' ' + to;
  }
}

/* ─── Slider fill (progress track) ─── */
function updateSliderFill(sliderId, min, max) {
  var s = el(sliderId);
  if (!s) return;
  var pct = ((parseFloat(s.value) - min) / (max - min)) * 100;
  pct = Math.max(0, Math.min(100, pct));
  s.style.background = 'linear-gradient(to right, #3b82f6 ' + pct + '%, #1a2236 ' + pct + '%)';
}

/* ═══════════════════════════════════
   INIT
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* EMI */
  syncPair('emi-principal', 'emi-principal-r', calcEMI);
  syncPair('emi-rate', 'emi-rate-r', calcEMI);
  syncPair('emi-tenure', 'emi-tenure-r', calcEMI);

  /* SIP */
  syncPair('sip-amount', 'sip-amount-r', calcSIP);
  syncPair('sip-rate', 'sip-rate-r', calcSIP);
  syncPair('sip-tenure', 'sip-tenure-r', calcSIP);

  /* FD */
  syncPair('fd-principal', 'fd-principal-r', calcFD);
  syncPair('fd-rate', 'fd-rate-r', calcFD);
  syncPair('fd-tenure', 'fd-tenure-r', calcFD);
  var fdFreq = el('fd-freq');
  if (fdFreq) fdFreq.addEventListener('change', calcFD);

  /* PPF */
  syncPair('ppf-annual', 'ppf-annual-r', calcPPF);
  syncPair('ppf-tenure', 'ppf-tenure-r', calcPPF);

  /* CI */
  syncPair('ci-principal', 'ci-principal-r', calcCI);
  syncPair('ci-rate', 'ci-rate-r', calcCI);
  syncPair('ci-tenure', 'ci-tenure-r', calcCI);
  var ciFreq = el('ci-freq');
  if (ciFreq) ciFreq.addEventListener('change', calcCI);

  /* GST */
  var gstAmt = el('gst-amount');
  if (gstAmt) gstAmt.addEventListener('input', calcGST);
  var gstRate = el('gst-rate');
  if (gstRate) gstRate.addEventListener('change', calcGST);
  document.querySelectorAll('input[name="gst-type"]').forEach(function (r) {
    r.addEventListener('change', calcGST);
  });

  /* Tax */
  syncPair('tax-income', 'tax-income-r', calcTax);
  var taxDed = el('tax-deductions');
  if (taxDed) taxDed.addEventListener('input', calcTax);

  /* Forex */
  var forexAmt = el('forex-amount');
  if (forexAmt) forexAmt.addEventListener('input', calcForex);
  var forexFrom = el('forex-from');
  if (forexFrom) forexFrom.addEventListener('change', calcForex);
  var forexTo = el('forex-to');
  if (forexTo) forexTo.addEventListener('change', calcForex);
  var swapBtn = el('forex-swap');
  if (swapBtn) swapBtn.addEventListener('click', function () {
    var f = el('forex-from'), t = el('forex-to');
    if (f && t) { var tmp = f.value; f.value = t.value; t.value = tmp; calcForex(); }
  });

  /* ── Run all calcs on load ── */
  calcEMI();
  calcSIP();
  calcFD();
  calcPPF();
  calcCI();
  calcGST();
  calcTax();

  /* Forex: fetch live rates first, calcForex fires inside fetchLiveRates() */
  fetchLiveRates();
});
