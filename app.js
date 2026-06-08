'use strict';

/* ─── Helper Functions ─── */
function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtNum(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function el(id) {
  return document.getElementById(id);
}

/* ─── Navbar ─── */
window.addEventListener('scroll', function () {
  var navbar = el('navbar');
  if (navbar) {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

(function initHamburger() {
  var hamburger = el('hamburger');
  var navLinks = el('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }
})();

/* ─── Tool Navigation ─── */
function switchCalc(name) {
  var cards = document.querySelectorAll('.tool-card');
  var panels = document.querySelectorAll('.calc-panel');

  cards.forEach(function (card) {
    if (card.getAttribute('data-calc') === name) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  panels.forEach(function (panel) {
    if (panel.id === 'calc-' + name) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  var section = el('calculators-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

(function initToolCards() {
  var cards = document.querySelectorAll('.tool-card');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var calcName = card.getAttribute('data-calc');
      if (calcName) switchCalc(calcName);
    });
  });
})();

/* ─── Donut Chart Engine ─── */
function drawDonut(canvasId, values, colors) {
  colors = colors || ['#3b82f6', '#10b981'];
  var canvas = el(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var cx = w / 2;
  var cy = h / 2;
  var radius = Math.min(cx, cy) - 10;
  var innerRadius = radius * 0.6;

  ctx.clearRect(0, 0, w, h);

  var total = 0;
  for (var i = 0; i < values.length; i++) {
    total += values[i];
  }
  if (total <= 0) return;

  var startAngle = -Math.PI / 2;
  for (var j = 0; j < values.length; j++) {
    var sliceAngle = (values[j] / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[j % colors.length];
    ctx.fill();
    startAngle += sliceAngle;
  }

  /* Donut hole */
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#111827';
  ctx.fill();

  /* Percentage of first value in center */
  var pct = ((values[0] / total) * 100).toFixed(1);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct + '%', cx, cy);
}

/* ─── Sync Pair ─── */
function syncPair(inputId, sliderId, calcFn) {
  var input = el(inputId);
  var slider = el(sliderId);
  if (!input || !slider) return;

  input.addEventListener('input', function () {
    slider.value = input.value;
    calcFn();
  });

  slider.addEventListener('input', function () {
    input.value = slider.value;
    calcFn();
  });
}

/* ─── 1. EMI Calculator ─── */
function calcEMI() {
  var P = parseFloat(el('emi-principal').value) || 0;
  var annualRate = parseFloat(el('emi-rate').value) || 0;
  var years = parseFloat(el('emi-tenure').value) || 0;

  var r = annualRate / 12 / 100;
  var n = years * 12;

  var emi = 0;
  var totalAmount = 0;
  var totalInterest = 0;

  if (r > 0 && n > 0) {
    var powRN = Math.pow(1 + r, n);
    emi = P * r * powRN / (powRN - 1);
    totalAmount = emi * n;
    totalInterest = totalAmount - P;
  } else if (n > 0) {
    emi = P / n;
    totalAmount = P;
    totalInterest = 0;
  }

  if (el('emi-result')) el('emi-result').textContent = fmt(Math.round(emi));
  if (el('emi-principal-out')) el('emi-principal-out').textContent = fmt(Math.round(P));
  if (el('emi-interest-out')) el('emi-interest-out').textContent = fmt(Math.round(totalInterest));
  if (el('emi-total-out')) el('emi-total-out').textContent = fmt(Math.round(totalAmount));

  drawDonut('emi-chart', [P, Math.max(0, totalInterest)], ['#3b82f6', '#10b981']);
}

/* ─── 2. SIP Calculator ─── */
function calcSIP() {
  var P = parseFloat(el('sip-amount').value) || 0;
  var annualRate = parseFloat(el('sip-rate').value) || 0;
  var years = parseFloat(el('sip-tenure').value) || 0;

  var r = annualRate / 12 / 100;
  var n = years * 12;
  var invested = P * n;

  var fv = 0;
  if (r > 0 && n > 0) {
    var powRN = Math.pow(1 + r, n);
    fv = P * ((powRN - 1) / r) * (1 + r);
  } else {
    fv = invested;
  }

  var gain = fv - invested;

  if (el('sip-result')) el('sip-result').textContent = fmt(Math.round(gain));
  if (el('sip-invested')) el('sip-invested').textContent = fmt(Math.round(invested));
  if (el('sip-gain')) el('sip-gain').textContent = fmt(Math.round(gain));
  if (el('sip-total')) el('sip-total').textContent = fmt(Math.round(fv));

  drawDonut('sip-chart', [invested, Math.max(0, gain)], ['#3b82f6', '#10b981']);
}

/* ─── 3. FD Calculator ─── */
function calcFD() {
  var P = parseFloat(el('fd-principal').value) || 0;
  var annualRate = parseFloat(el('fd-rate').value) || 0;
  var years = parseFloat(el('fd-tenure').value) || 0;
  var freqEl = el('fd-freq');
  var freq = freqEl ? parseInt(freqEl.value) || 4 : 4;

  var maturity = P * Math.pow(1 + (annualRate / 100) / freq, freq * years);
  var interest = maturity - P;

  if (el('fd-result')) el('fd-result').textContent = fmt(Math.round(maturity));
  if (el('fd-principal-out')) el('fd-principal-out').textContent = fmt(Math.round(P));
  if (el('fd-interest-out')) el('fd-interest-out').textContent = fmt(Math.round(interest));
  if (el('fd-total-out')) el('fd-total-out').textContent = fmt(Math.round(maturity));

  drawDonut('fd-chart', [P, Math.max(0, interest)], ['#3b82f6', '#10b981']);
}

/* ─── 4. PPF Calculator ─── */
function calcPPF() {
  var annual = parseFloat(el('ppf-annual').value) || 0;
  var tenure = parseInt(el('ppf-tenure').value) || 0;
  var rate = 0.071; /* Fixed PPF rate 7.1% */

  var balance = 0;
  for (var y = 0; y < tenure; y++) {
    balance = (balance + annual) * (1 + rate);
  }

  var invested = annual * tenure;
  var interest = balance - invested;

  if (el('ppf-result')) el('ppf-result').textContent = fmt(Math.round(balance));
  if (el('ppf-invested-out')) el('ppf-invested-out').textContent = fmt(Math.round(invested));
  if (el('ppf-interest-out')) el('ppf-interest-out').textContent = fmt(Math.round(interest));
  if (el('ppf-total-out')) el('ppf-total-out').textContent = fmt(Math.round(balance));

  drawDonut('ppf-chart', [invested, Math.max(0, interest)], ['#3b82f6', '#10b981']);
}

/* ─── 5. Compound Interest Calculator ─── */
function calcCI() {
  var P = parseFloat(el('ci-principal').value) || 0;
  var annualRate = parseFloat(el('ci-rate').value) || 0;
  var years = parseFloat(el('ci-tenure').value) || 0;
  var freqEl = el('ci-freq');
  var freq = freqEl ? parseInt(freqEl.value) || 4 : 4;

  var maturity = P * Math.pow(1 + (annualRate / 100) / freq, freq * years);
  var interest = maturity - P;

  if (el('ci-result')) el('ci-result').textContent = fmt(Math.round(maturity));
  if (el('ci-principal-out')) el('ci-principal-out').textContent = fmt(Math.round(P));
  if (el('ci-interest-out')) el('ci-interest-out').textContent = fmt(Math.round(interest));
  if (el('ci-total-out')) el('ci-total-out').textContent = fmt(Math.round(maturity));

  drawDonut('ci-chart', [P, Math.max(0, interest)], ['#3b82f6', '#10b981']);
}

/* ─── 6. GST Calculator ─── */
function calcGST() {
  var amount = parseFloat(el('gst-amount').value) || 0;
  var rateEl = el('gst-rate');
  var rate = rateEl ? parseFloat(rateEl.value) || 18 : 18;

  var typeRadios = document.querySelectorAll('input[name="gst-type"]');
  var gstType = 'exclusive';
  typeRadios.forEach(function (radio) {
    if (radio.checked) gstType = radio.value;
  });

  var original, gstAmount, total;

  if (gstType === 'exclusive') {
    original = amount;
    gstAmount = amount * rate / 100;
    total = amount + gstAmount;
  } else {
    total = amount;
    original = amount * 100 / (100 + rate);
    gstAmount = total - original;
  }

  var cgst = gstAmount / 2;
  var sgst = gstAmount / 2;

  if (el('gst-original')) el('gst-original').textContent = fmt(Math.round(original));
  if (el('gst-type-label')) el('gst-type-label').textContent = 'GST @ ' + rate + '%';
  if (el('gst-amount-out')) el('gst-amount-out').textContent = fmt(Math.round(gstAmount * 100) / 100);
  if (el('gst-cgst')) el('gst-cgst').textContent = fmt(Math.round(cgst * 100) / 100);
  if (el('gst-sgst')) el('gst-sgst').textContent = fmt(Math.round(sgst * 100) / 100);
  if (el('gst-total-label')) el('gst-total-label').textContent = 'Total Amount';
  if (el('gst-total')) el('gst-total').textContent = fmt(Math.round(total * 100) / 100);
}

/* ─── 7. Income Tax Calculator ─── */
function calcTax() {
  var income = parseFloat(el('tax-income').value) || 0;
  var deductions = parseFloat(el('tax-deductions').value) || 0;

  /* ── New Regime FY 2025-26 ── */
  var newStdDeduction = 75000;
  var newTaxableIncome = Math.max(0, income - newStdDeduction);
  var newTax = 0;

  /* New Regime Slabs */
  var newSlabs = [
    { limit: 400000,  rate: 0    },
    { limit: 800000,  rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 }
  ];

  var remaining = newTaxableIncome;
  var prevLimit = 0;
  for (var i = 0; i < newSlabs.length; i++) {
    var slab = newSlabs[i];
    var slabWidth = slab.limit - prevLimit;
    var taxable = Math.min(remaining, slabWidth);
    if (taxable <= 0) break;
    newTax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
  }

  /* Rebate u/s 87A - New Regime: if taxable income <= 12,00,000 */
  if (newTaxableIncome <= 1200000) {
    /* Marginal relief: if tax > (taxableIncome - 1200000) effectively tax = 0 since <= 1200000 */
    newTax = 0;
  }

  var newCess = newTax * 0.04;
  var newTotal = newTax + newCess;

  /* ── Old Regime ── */
  var oldStdDeduction = 50000;
  var oldTaxableIncome = Math.max(0, income - oldStdDeduction - deductions);
  var oldTax = 0;

  var oldSlabs = [
    { limit: 250000,  rate: 0    },
    { limit: 500000,  rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 }
  ];

  remaining = oldTaxableIncome;
  prevLimit = 0;
  for (var j = 0; j < oldSlabs.length; j++) {
    var oSlab = oldSlabs[j];
    var oSlabWidth = oSlab.limit - prevLimit;
    var oTaxable = Math.min(remaining, oSlabWidth);
    if (oTaxable <= 0) break;
    oldTax += oTaxable * oSlab.rate;
    remaining -= oTaxable;
    prevLimit = oSlab.limit;
  }

  /* Rebate u/s 87A - Old Regime: if taxable income <= 5,00,000 */
  if (oldTaxableIncome <= 500000) {
    oldTax = 0;
  }

  var oldCess = oldTax * 0.04;
  var oldTotal = oldTax + oldCess;

  /* ── Outputs ── */
  if (el('tax-new-gross')) el('tax-new-gross').textContent = fmt(Math.round(income));
  if (el('tax-new-taxable')) el('tax-new-taxable').textContent = fmt(Math.round(newTaxableIncome));
  if (el('tax-new-tax')) el('tax-new-tax').textContent = fmt(Math.round(newTax));
  if (el('tax-new-cess')) el('tax-new-cess').textContent = fmt(Math.round(newCess));
  if (el('tax-new-total')) el('tax-new-total').textContent = fmt(Math.round(newTotal));

  if (el('tax-old-gross')) el('tax-old-gross').textContent = fmt(Math.round(income));
  if (el('tax-old-taxable')) el('tax-old-taxable').textContent = fmt(Math.round(oldTaxableIncome));
  if (el('tax-old-deductions')) el('tax-old-deductions').textContent = fmt(Math.round(deductions));
  if (el('tax-old-tax')) el('tax-old-tax').textContent = fmt(Math.round(oldTax));
  if (el('tax-old-cess')) el('tax-old-cess').textContent = fmt(Math.round(oldCess));
  if (el('tax-old-total')) el('tax-old-total').textContent = fmt(Math.round(oldTotal));

  /* Tax savings indicator */
  var savingsEl = el('tax-savings-text');
  if (savingsEl) {
    var diff = Math.abs(newTotal - oldTotal);
    if (newTotal < oldTotal) {
      savingsEl.textContent = '✨ New Regime saves you ' + fmt(Math.round(diff));
      savingsEl.parentElement.style.color = '#10b981';
    } else if (oldTotal < newTotal) {
      savingsEl.textContent = '📋 Old Regime saves you ' + fmt(Math.round(diff));
      savingsEl.parentElement.style.color = '#10b981';
    } else {
      savingsEl.textContent = 'Both regimes result in the same tax';
      savingsEl.parentElement.style.color = '#9ca3af';
    }
  }
}

/* ─── 8. Currency Converter ─── */
var forexRates = {
  INR: 1,
  USD: 85.5,
  EUR: 93,
  GBP: 108,
  JPY: 0.56,
  AUD: 56,
  CAD: 63,
  SGD: 64,
  AED: 23.3,
  SAR: 22.8,
  CHF: 98,
  CNY: 11.8
};

var currencySymbols = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ',
  SAR: '﷼', CHF: 'CHF ', CNY: '¥'
};

function calcForex() {
  var amount = parseFloat(el('forex-amount').value) || 0;
  var fromEl = el('forex-from');
  var toEl = el('forex-to');
  if (!fromEl || !toEl) return;

  var fromCurr = fromEl.value;
  var toCurr = toEl.value;
  var fromRate = forexRates[fromCurr] || 1;
  var toRate = forexRates[toCurr] || 1;

  var result = amount * (fromRate / toRate);

  var toSymbol = currencySymbols[toCurr] || toCurr + ' ';
  var resultFormatted = toSymbol + result.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (el('forex-result')) el('forex-result').textContent = resultFormatted;
  if (el('forex-from-label')) el('forex-from-label').textContent = fmtNum(amount) + ' ' + fromCurr;

  /* Exchange rate display */
  if (el('forex-rate-display')) {
    var oneUnitInTarget = fromRate / toRate;
    var fromSymbol = currencySymbols[fromCurr] || fromCurr + ' ';
    el('forex-rate-display').textContent =
      '1 ' + fromCurr + ' = ' + (currencySymbols[toCurr] || '') +
      oneUnitInTarget.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + (currencySymbols[toCurr] ? '' : ' ' + toCurr);
  }
}

/* ─── Initialization ─── */
document.addEventListener('DOMContentLoaded', function () {

  /* ── Sync Pairs: EMI ── */
  syncPair('emi-principal', 'emi-principal-r', calcEMI);
  syncPair('emi-rate', 'emi-rate-r', calcEMI);
  syncPair('emi-tenure', 'emi-tenure-r', calcEMI);

  /* ── Sync Pairs: SIP ── */
  syncPair('sip-amount', 'sip-amount-r', calcSIP);
  syncPair('sip-rate', 'sip-rate-r', calcSIP);
  syncPair('sip-tenure', 'sip-tenure-r', calcSIP);

  /* ── Sync Pairs: FD ── */
  syncPair('fd-principal', 'fd-principal-r', calcFD);
  syncPair('fd-rate', 'fd-rate-r', calcFD);
  syncPair('fd-tenure', 'fd-tenure-r', calcFD);
  if (el('fd-freq')) el('fd-freq').addEventListener('change', calcFD);

  /* ── Sync Pairs: PPF ── */
  syncPair('ppf-annual', 'ppf-annual-r', calcPPF);
  syncPair('ppf-tenure', 'ppf-tenure-r', calcPPF);

  /* ── Sync Pairs: CI ── */
  syncPair('ci-principal', 'ci-principal-r', calcCI);
  syncPair('ci-rate', 'ci-rate-r', calcCI);
  syncPair('ci-tenure', 'ci-tenure-r', calcCI);
  if (el('ci-freq')) el('ci-freq').addEventListener('change', calcCI);

  /* ── GST Listeners ── */
  if (el('gst-amount')) el('gst-amount').addEventListener('input', calcGST);
  if (el('gst-rate')) el('gst-rate').addEventListener('change', calcGST);
  var gstRadios = document.querySelectorAll('input[name="gst-type"]');
  gstRadios.forEach(function (radio) {
    radio.addEventListener('change', calcGST);
  });

  /* ── Tax Listeners ── */
  syncPair('tax-income', 'tax-income-r', calcTax);
  if (el('tax-deductions')) el('tax-deductions').addEventListener('input', calcTax);

  /* ── Forex Listeners ── */
  if (el('forex-amount')) el('forex-amount').addEventListener('input', calcForex);
  if (el('forex-from')) el('forex-from').addEventListener('change', calcForex);
  if (el('forex-to')) el('forex-to').addEventListener('change', calcForex);

  /* Swap button */
  var swapBtn = el('forex-swap');
  if (swapBtn) {
    swapBtn.addEventListener('click', function () {
      var fromEl = el('forex-from');
      var toEl = el('forex-to');
      if (fromEl && toEl) {
        var temp = fromEl.value;
        fromEl.value = toEl.value;
        toEl.value = temp;
        calcForex();
      }
    });
  }

  /* ── Initial Calculations ── */
  calcEMI();
  calcSIP();
  calcFD();
  calcPPF();
  calcCI();
  calcGST();
  calcTax();
  calcForex();

  /* ── Default Active Calculator: EMI ── */
  switchCalc('emi');
});
