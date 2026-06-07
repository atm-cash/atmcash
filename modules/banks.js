// ATM Cash v3.2 - bank presets and manual rate engine only
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
  if (bank === "nordea" || bank === "danske bank") return { percent: 1, minDkk: 30, fxMarkup: 1.5, label: "Gebyr 1% - Min 30 DKK" };
  if (bank === "jyske bank") return type === "visa credit"
    ? { percent: 2, minDkk: 50, fxMarkup: 1.5, label: "Gebyr 2% - Min 50 DKK" }
    : { percent: 0, minDkk: 15, fxMarkup: 1.5, label: "Gebyr 15 DKK pr. hævning" };
  if (bank === "lunar") return { percent: 0, minDkk: 19, fxMarkup: 1, label: "Gebyr 19 DKK pr. hævning" };
  if (bank === "sydbank") return type === "visa credit"
    ? { percent: 2, minDkk: 50, fxMarkup: 1.5, label: "Gebyr 2% - Min 50 DKK" }
    : { percent: 1.5, minDkk: 40, fxMarkup: 1.5, label: "Gebyr 1,5% - Min 40 DKK" };
  return null;
}

function getVisaBankRuleKey(card) { return `${String(card.bank || "").toLowerCase()}|${String(card.type || "").toLowerCase()}`; }
function hasVisaBankRule(card) { return Boolean(getVisaBankRule(card)); }
function getVisaFxMarkupPercent(card) { return Number(card.spread || 0); }
function getVisaMinimumFeeDkk(card) { return hasVisaBankRule(card) ? (card.fixedDkk || 0) : 0; }
function getVisaFixedExtraDkk(card) { return hasVisaBankRule(card) ? 0 : (card.fixedDkk || 0); }

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
  return beforeByPercent * percent >= minimumFee ? beforeByPercent : Math.max(0, afterFixed - minimumFee);
}

function applyVisaBankPresetToData(forceMinimum = false) {
  const rule = getVisaBankRule(data.visa);
  if (!rule) return;
  const key = getVisaBankRuleKey(data.visa);
  const ruleChanged = data.visa.ruleKey !== key;
  if (forceMinimum || ruleChanged || data.visa.percent === undefined || data.visa.percent === null) data.visa.percent = rule.percent;
  if (forceMinimum || ruleChanged || data.visa.spread === undefined || data.visa.spread === null) data.visa.spread = rule.fxMarkup || 0;
  if (forceMinimum || ruleChanged || !data.visa.fixedDkk || data.visa.fixedDkk === defaults.visa.fixedDkk) data.visa.fixedDkk = rule.minDkk;
  data.visa.ruleKey = key;
}

function getVisaTypeLabel(card) { return card.type; }

function applyVisaNordeaPresetToInputs(eventOrForce = false) {
  const forcePreset = eventOrForce === true || (eventOrForce && eventOrForce.type === "change");
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
    if (forcePreset) {
      percent.value = formatDecimal(rule.percent);
      if (spread) spread.value = formatDecimal(rule.fxMarkup || 0);
      fixed.value = formatDecimal(rule.minDkk);
    }
    fixed.dataset.ruleKey = key;
    if (fixedLabel) fixedLabel.textContent = "Min. hævegebyr · DKK";
  } else if (fixedLabel) {
    if (forcePreset) fixed.value = fixed.value || "0";
    fixed.dataset.ruleKey = key;
    if (spread && !spread.value) spread.value = "0";
    fixedLabel.textContent = "Min. hævegebyr · DKK";
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
  if (pageName === "eurcashCalc") calculateEurcashDetails();
  if (pageName === "converter") { updateConverterStatus(); setTimeout(() => updateConverterFrom("DKK"), 0); }
  window.scrollTo(0, 0);
  setTimeout(translatePage, 0);
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = formatDecimal(value);
}

const RATE_VERSION = "v3.2";

function validThbRate(rate) { return Number(rate) > 3 && Number(rate) < 7; }
function manualRateStatus(rate) { return validThbRate(rate) ? "manual" : "unavailable"; }

function updateRateStatus() {
  const el = document.getElementById("rateStatus");
  if (!el) return;
  const en = currentLanguage() === "en";
  el.textContent = en ? "Manual rates · no live fetching" : "Manuelle kurser · ingen live-hentning";
  updateConverterStatus();
}

function isWeekendToday() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function revolutEffectiveRate(baseRate) { return baseRate; }

function applyMarketRates() {
  applyVisaBankPresetToData();
  if (data.eurcash) {
    data.eurcash.dkkPerEur = data.eurcash.dkkPerEur || dkkPerEurRate();
    data.eurcash.eurToThb = data.eurcash.eurToThb || 37.95;
    data.eurcash.maxDkkPerWithdrawal = data.eurcash.maxDkkPerWithdrawal || 15000;
  }

  data.revolut.manualRate = Number(data.revolut.manualRate || data.revolut.rate || 0);
  data.revolut.rate = validThbRate(data.revolut.manualRate) ? data.revolut.manualRate : 0;
  data.revolut.rateSource = manualRateStatus(data.revolut.rate);
  data.revolut.rateUnavailable = !validThbRate(data.revolut.rate);

  data.wise.rate = Number(data.wise.rate || 0);

  const visaRaw = Number(data.visa.rawRate || data.visa.rate || 0);
  data.visa.rawRate = visaRaw;
  data.visa.rate = validThbRate(visaRaw) ? visaRaw * (1 - (getVisaFxMarkupPercent(data.visa) / 100)) : 0;

  data.mastercard.rate = Number(data.mastercard.rate || 0);

  data.loomis.rate = Number(data.loomis.rate || 0);
  data.forex.rate = Number(data.forex.rate || 0);
  data.tavex.rate = Number(data.tavex.rate || 0);

  data.market = data.market || {};
  data.market.source = "manual";
  data.market.rateVersion = RATE_VERSION;
  data.market.rates = data.market.rates || { DKK: 1, THB: data.market.rate || 5.057, EUR: 0.134, USD: 0.146, GBP: 0.114 };
  data.market.rates.DKK = 1;
  data.market.rates.THB = Number(data.market.rate || data.market.rates.THB || 5.057);
}

async function updateMarketRateIfNeeded() {
  ensureVisibleMethods();
  applyMarketRates();
  persist();
  syncInputs();
  syncHomeCurrencyUi();
  updateRateStatus();
  calculate();
}
