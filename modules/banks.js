// ATM Cash v1.1 - bank presets, card rules and live rate handling
function goNav(page) {
  if (page === "home") showPage("home");
  if (page === "converter") {
    showPage("converter");
    updateConverterStatus();
    updateConverterFrom("DKK");
  }
  if (page === "tips") showPage("tips");
}


function getVisaBankRule(card) {
  const bank = String(card.bank || "").toLowerCase();
  const type = String(card.type || "").toLowerCase();

  if (bank === "nordea" || bank === "danske bank") {
    return { percent: 1, minDkk: 30, spread: 1.5, label: "Gebyr 1% - Min 30 DKK" };
  }

  if (bank === "jyske bank") {
    if (type === "visa credit") {
      return { percent: 2, minDkk: 50, spread: 1.5, label: "Gebyr 2% - Min 50 DKK" };
    }
    return { percent: 0, minDkk: 15, spread: 1.5, label: "Gebyr 15 DKK pr. hævning" };
  }

  if (bank === "lunar") {
    return { percent: 0, minDkk: 19, spread: 1, label: "Gebyr 19 DKK pr. hævning" };
  }

  if (bank === "sydbank") {
    if (type === "visa credit") {
      return { percent: 2, minDkk: 50, spread: 2, label: "Gebyr 2% - Min 50 DKK" };
    }
    return { percent: 1.5, minDkk: 40, spread: 1.5, label: "Gebyr 1,5% - Min 40 DKK" };
  }

  return null;
}

function getVisaBankRuleKey(card) {
  return `${String(card.bank || "").toLowerCase()}|${String(card.type || "").toLowerCase()}`;
}

function hasVisaBankRule(card) {
  return Boolean(getVisaBankRule(card));
}

function getVisaMinimumFeeDkk(card) {
  return hasVisaBankRule(card) ? (card.fixedDkk || 0) : 0;
}

function getVisaFixedExtraDkk(card) {
  return hasVisaBankRule(card) ? 0 : (card.fixedDkk || 0);
}

function getCardFeeDkk(beforeFeeDkk, card, withdrawalCount = 1) {
  const percentFee = beforeFeeDkk * ((card.percent || 0) / 100);
  const minimumFee = getVisaMinimumFeeDkk(card) * Math.max(1, withdrawalCount || 1);
  return minimumFee ? Math.max(percentFee, minimumFee) : percentFee;
}

function getBeforeCardFeeDkkFromTotal(totalDkk, card, withdrawalCount = 1) {
  const afterFixed = Math.max(0, totalDkk - getVisaFixedExtraDkk(card));
  const percent = (card.percent || 0) / 100;
  const minimumFee = getVisaMinimumFeeDkk(card) * Math.max(1, withdrawalCount || 1);

  if (minimumFee && afterFixed <= minimumFee) return 0;
  if (percent <= 0) return Math.max(0, afterFixed - minimumFee);

  const beforeByPercent = afterFixed / (1 + percent);
  return beforeByPercent * percent >= minimumFee
    ? beforeByPercent
    : Math.max(0, afterFixed - minimumFee);
}

function applyVisaBankPresetToData(forceMinimum = false) {
  const rule = getVisaBankRule(data.visa);
  if (!rule) return;
  const key = getVisaBankRuleKey(data.visa);
  const ruleChanged = data.visa.ruleKey !== key;
  data.visa.percent = rule.percent;
  data.visa.spread = rule.spread;
  if (forceMinimum || ruleChanged || !data.visa.fixedDkk || data.visa.fixedDkk === defaults.visa.fixedDkk) {
    data.visa.fixedDkk = rule.minDkk;
  }
  data.visa.ruleKey = key;
}

function getVisaTypeLabel(card) {
  return card.type;
}

function applyVisaNordeaPresetToInputs() {
  const bank = document.getElementById("visaBank");
  const type = document.getElementById("visaType");
  const percent = document.getElementById("visaPercent");
  const spread = document.getElementById("visaSpread");
  const fixed = document.getElementById("visaFixed");
  const fixedLabel = document.getElementById("visaFixedLabel");
  if (!bank || !type || !percent || !fixed) return;

  Array.from(type.options).forEach((option) => {
    if (option.value === "Visa Debit") option.textContent = "Visa Debit";
    if (option.value === "Visa Credit") option.textContent = "Visa Credit";
  });

  const currentCard = { bank: bank.value, type: type.value, fixedDkk: parseNumber(fixed.value) };
  const rule = getVisaBankRule(currentCard);
  const key = getVisaBankRuleKey(currentCard);

  if (rule) {
    percent.value = formatDecimal(rule.percent);
    if (spread) spread.value = formatDecimal(rule.spread);
    if (fixed.dataset.ruleKey !== key || !parseNumber(fixed.value)) fixed.value = formatDecimal(rule.minDkk);
    fixed.dataset.ruleKey = key;
    if (fixedLabel) fixedLabel.textContent = rule.label.replace(formatNumber(rule.minDkk), formatNumber(parseNumber(fixed.value) || rule.minDkk));
  } else if (fixedLabel) {
    fixedLabel.textContent = "Fast bankgebyr · DKK";
  }
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  const target = document.getElementById(`${pageName}Page`);
  if (target) target.classList.add("active");
  if (pageName === "revolutCalc") calculateRevolutDetails();
  if (pageName === "wiseCalc") calculateWiseDetails();
  if (pageName === "visaCalc") calculateVisaDetails();
  if (pageName === "mastercardCalc") calculateMastercardDetails();
  if (pageName === "loomisCalc") calculateLoomisDetails();
  if (pageName === "forexCalc") calculateForexDetails();
  if (pageName === "tavexCalc") calculateTavexDetails();
  if (pageName === "converter") {
    updateConverterStatus();
    setTimeout(() => updateConverterFrom("DKK"), 0);
  }
  window.scrollTo(0, 0);
  setTimeout(translatePage, 0);
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = formatDecimal(value);
}


const RATE_VERSION = "v1.6-unified-calculation";
// Revolut must follow the same DKK/THB rate shown in Revolut's own converter.
// Keep this at 0 unless Revolut changes their public converter logic.
const REVOLUT_REFERENCE_MARGIN = 0;
// Wise is calibrated from the same hourly base rate to match Wise mid-market reference.
// Reference: Wise showed 1 DKK = 5.083 THB while the hourly base source was around 5.0679 THB/DKK.
const WISE_REFERENCE_MARGIN = -0.298;
// Tavex is calculated from Tavex webshop cash price, not from each browser's saved mid-market rate.
// Reference: 10.000 THB = 2.066 DKK before delivery, so 1 DKK = 4.840271055 THB.
const TAVEX_DKK_PER_THB = 0.2066;
const TAVEX_DIRECT_RATE = 1 / TAVEX_DKK_PER_THB;
const RATE_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hourlyKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
}

function formatRateUpdateTime(value) {
  if (!value) return "";
  return value.length === 13 ? value.replace("T", " ") + ":00" : value;
}

function updateRateStatus() {
  const el = document.getElementById("rateStatus");
  if (!el) return;

  const en = currentLanguage() === "en";
  const prefix = en ? "Rates update hourly." : "Kurser opdateres hver time.";
  el.textContent = "";
  el.appendChild(document.createTextNode(prefix));
  if (data.market?.date) {
    const updated = formatRateUpdateTime(data.market.updatedAtHour || data.market.date);
    el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(en ? `Last updated ${updated}.` : `Sidst opdateret ${updated}.`));
  }
  updateConverterStatus();
}


function isWeekendToday() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function revolutEffectiveRate(baseRate) {
  // Revolut's own converter currently shows the direct exchange rate with no extra spread.
  // ATM-limit fees are still calculated separately in calculateRevolutDetails().
  return baseRate;
}

function applyMarketRates() {
  applyVisaBankPresetToData();
  const marketRate = data.market?.rate || 5.0570;

  // v73: cash suppliers restored to the calibrated values that matched real checks.
  // v70: old cached settings could keep the app around 4,85 even when the market is around 5,05.
  // Migrate only the old defaults so user-edited values are not overwritten.
  if (!data.v70RateMigrationDone) {
    if (Math.abs((data.market?.rate || 0) - 4.85) < 0.03 || !data.market?.rateVersion) {
      data.market = {
        ...(data.market || {}),
        rate: marketRate,
        rateVersion: RATE_VERSION
      };
    }
    if (Math.abs((data.visa.spread || 0) - 1.5) < 0.01) data.visa.spread = 0;
    if (Math.abs((data.mastercard.spread || 0) - 1.5) < 0.01) data.mastercard.spread = 0;
    if (Math.abs((data.loomis.margin || 0) - 1.2) < 0.05) data.loomis.margin = 5.23;
    if (Math.abs((data.forex.margin || 0) - 2.65) < 0.05) data.forex.margin = 6.62;
    if (Math.abs((data.tavex.margin || 0) - 2.5) < 0.05 || Math.abs((data.tavex.margin || 0) - 4.79) < 0.05) data.tavex.margin = Math.max(0, (1 - TAVEX_DIRECT_RATE / marketRate) * 100);
    if (!data.tavex.delivery || Math.abs(data.tavex.delivery - 99) < 0.5 || Math.abs(data.tavex.delivery - 50) < 0.5) data.tavex.delivery = 50;
    data.v70RateMigrationDone = true;
  }

  if (!data.v73CashRestoreDone) {
    data.loomis.place = "Loomis online";
    data.loomis.margin = 5.23;
    data.loomis.fixedDkk = 49.95;

    data.forex.place = "FOREX afhentning";
    data.forex.margin = 6.62;
    data.forex.fixedDkk = 0;
    data.forex.delivery = 0;
    data.forex.other = 0;

    data.tavex.place = "Tavex webshop";
    data.tavex.margin = Math.max(0, (1 - TAVEX_DIRECT_RATE / marketRate) * 100);
    data.tavex.fixedDkk = 0;
    data.tavex.delivery = 50;
    data.tavex.other = 0;

    data.v73CashRestoreDone = true;
  }

  // Force Revolut to match Revolut's own converter.
  // Older saved browser settings may contain a referenceMargin, so reset it every time.
  data.revolut.referenceMargin = REVOLUT_REFERENCE_MARGIN;
  data.revolut.rate = revolutEffectiveRate(marketRate);
  // Force Wise calibration too, so old saved browser settings do not keep an outdated Wise rate.
  data.wise.referenceMargin = WISE_REFERENCE_MARGIN;
  data.wise.rate = marketRate * (1 - WISE_REFERENCE_MARGIN / 100);
  const visaSpread = data.visa.spread == null ? 0 : data.visa.spread;
  data.visa.spread = visaSpread;
  data.visa.rate = marketRate * (1 - (visaSpread / 100));

  const mastercardSpread = data.mastercard.spread == null ? 0 : data.mastercard.spread;
  data.mastercard.spread = mastercardSpread;
  data.mastercard.rate = marketRate * (1 - (mastercardSpread / 100));

  if (!data.tavex.marginMigrated && marketRate && (data.tavex.margin || 0) === 0 && data.tavex.rate && Math.abs(data.tavex.rate - marketRate) > 0.01) {
    data.tavex.margin = Math.max(0, (1 - data.tavex.rate / marketRate) * 100);
    data.tavex.marginMigrated = true;
  }

  data.loomis.rate = marketRate * (1 - (data.loomis.margin || 0) / 100);
  data.forex.rate = marketRate * (1 - (data.forex.margin || 0) / 100);
  data.tavex.rate = TAVEX_DIRECT_RATE;
  data.tavex.margin = Math.max(0, (1 - data.tavex.rate / marketRate) * 100);
  data.tavex.delivery = 50;
  data.tavex.fixedDkk = 0;
  data.tavex.other = 0;
  data.tavex.place = "Tavex webshop";
  data.market.rateVersion = RATE_VERSION;
}

async function updateMarketRateIfNeeded() {
  ensureVisibleMethods();

  if (data.market?.updatedAtHour === hourlyKey() && data.market?.rateVersion === RATE_VERSION && (data.market?.rate || 0) > 5) {
    applyMarketRates();
    syncInputs();
    syncHomeCurrencyUi();
    updateRateStatus();
    calculate();
    return;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/DKK", { cache: "no-store" });
    const json = await response.json();

    if (json?.rates?.THB) {
      data.market = {
        rate: Number(json.rates.THB),
        date: todayKey(),
        updatedAtHour: hourlyKey(),
        source: "open-er-api",
        rateVersion: RATE_VERSION,
        rates: {
          DKK: 1,
          THB: Number(json.rates.THB),
          EUR: Number(json.rates.EUR || getCurrencyRates().EUR),
          USD: Number(json.rates.USD || getCurrencyRates().USD),
          GBP: Number(json.rates.GBP || getCurrencyRates().GBP)
        }
      };
      applyMarketRates();
      persist();
      syncInputs();
      syncHomeCurrencyUi();
      updateRateStatus();
      calculate();
    }
  } catch {
    applyMarketRates();
    updateRateStatus();
    calculate();
  }
}

