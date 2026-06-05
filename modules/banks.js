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
    return { percent: 1, minDkk: 30, fxMarkup: 1.5, label: "Gebyr 1% - Min 30 DKK" };
  }

  if (bank === "jyske bank") {
    if (type === "visa credit") {
      return { percent: 2, minDkk: 50, fxMarkup: 1.5, label: "Gebyr 2% - Min 50 DKK" };
    }
    return { percent: 0, minDkk: 15, fxMarkup: 1.5, label: "Gebyr 15 DKK pr. hævning" };
  }

  if (bank === "lunar") {
    return { percent: 0, minDkk: 19, fxMarkup: 1, label: "Gebyr 19 DKK pr. hævning" };
  }

  if (bank === "sydbank") {
    if (type === "visa credit") {
      return { percent: 2, minDkk: 50, fxMarkup: 1.5, label: "Gebyr 2% - Min 50 DKK" };
    }
    return { percent: 1.5, minDkk: 40, fxMarkup: 1.5, label: "Gebyr 1,5% - Min 40 DKK" };
  }

  return null;
}

function getVisaBankRuleKey(card) {
  return `${String(card.bank || "").toLowerCase()}|${String(card.type || "").toLowerCase()}`;
}

function hasVisaBankRule(card) {
  return Boolean(getVisaBankRule(card));
}

function getVisaFxMarkupPercent(card) {
  return Number(card.spread || 0);
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
  if (forceMinimum || ruleChanged || data.visa.percent === undefined || data.visa.percent === null) {
    data.visa.percent = rule.percent;
  }
  if (forceMinimum || ruleChanged || data.visa.spread === undefined || data.visa.spread === null) {
    data.visa.spread = rule.fxMarkup || 0;
  }
  if (forceMinimum || ruleChanged || !data.visa.fixedDkk || data.visa.fixedDkk === defaults.visa.fixedDkk) {
    data.visa.fixedDkk = rule.minDkk;
  }
  data.visa.ruleKey = key;
}

function getVisaTypeLabel(card) {
  return card.type;
}

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


const RATE_VERSION = "v2.4";
const RATE_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

// Fallback values are only used if the provider page cannot be read.
const FALLBACK_RATES = {
  revolut: 5.0314,
  wise: 5.07720,
  visa: 5.040756,
  mastercard: 5.040382949333,
  loomis: 4.789071,
  forex: 4.72589,
  tavex: 1 / 0.207
};

const PROVIDER_RATE_SOURCES = {
  revolut: "https://www.revolut.com/da-DK/currency-converter/convert-dkk-to-thb-exchange-rate/?amount=2500",
  wise: "https://wise.com/dk/currency-converter/dkk-to-thb-rate?amount=1",
  forex: "https://www.forexvaluta.dk/valuta/thb/",
  tavex: "https://tavex.dk/valuta-prisliste/",
  loomis: "https://nemvaluta.loomis.dk/"
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hourlyKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const minute = Math.floor(d.getMinutes() / 10) * 10;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(minute)}`;
}

function formatRateUpdateTime(value) {
  if (!value) return "";
  return value.includes("T") ? value.replace("T", " ") : value;
}

function parseRateNumber(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(cleaned.replace(",", ".")) || 0;
}

function rateFromDkkPerThb(dkkPerThb) {
  return dkkPerThb > 0 ? 1 / dkkPerThb : 0;
}

async function fetchProviderText(url) {
  const noCacheUrl = url + (url.includes("?") ? "&" : "?") + "atmCashTs=" + Date.now();
  const sources = [
    noCacheUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(noCacheUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(noCacheUrl)}`
  ];

  let lastError = null;
  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (text && text.length > 200) return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Provider page could not be read");
}

function parseDkkToThbRate(html) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const patterns = [
    { re: /(?:kr\s*)?1\s*DKK\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i, amount: 1 },
    { re: /1\s*(?:kr\.|kr|DKK)\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i, amount: 1 },
    { re: /1\s*Dansk(?:e)?\s*krone\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i, amount: 1 },
    { re: /100\s*DKK\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i, amount: 100 },
    { re: /1000\s*DKK\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i, amount: 1000 },
    { re: /3000\s*(?:kr\.|kr|DKK)[\s\S]{0,250}?([\d.,]+)\s*(?:THB|฿)/i, amount: 3000 }
  ];
  for (const item of patterns) {
    const match = text.match(item.re);
    if (!match) continue;
    const raw = parseRateNumber(match[1]);
    const rate = item.amount === 1 ? raw : raw / item.amount;
    if (rate > 3 && rate < 7) return rate;
  }
  return 0;
}

function parseRevolutRate(html) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  // Revolut må kun bruge Revoluts egen viste kurs.
  // Den generelle DKK→THB SEO/markedsrate på siden kan være højere end den viste Revolut-kurs
  // og må derfor ikke bruges til ATM Cash.
  const currentRatePatterns = [
    /(?:Vores\s+nuværende\s+kurs|Our\s+current\s+rate)[\s\S]{0,160}?1\s*(?:kr\.|kr|DKK)\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)/i,
    /1\s*(?:kr\.|kr|DKK)\s*[=|:]?\s*([\d.,]+)\s*(?:THB|฿)[\s\S]{0,160}?(?:Ingen\s+gebyrer|No\s+fees)/i
  ];

  for (const pattern of currentRatePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const rate = parseRateNumber(match[1]);
    if (rate > 3 && rate < 7) return rate;
  }

  // Fallback kun til Revoluts egen converter-boks: DKK-beløb og THB-beløb.
  // Eksempel: 3.000 kr. → 15.102,13 ฿ = 5,0340.
  const converterPair = text.match(/(?:Beløb|Amount)[\s\S]{0,220}?([\d.,]+)\s*(?:kr\.|kr|DKK)[\s\S]{0,220}?(?:Vekslet\s+til|Converted\s+to)[\s\S]{0,220}?([\d.,]+)\s*(?:THB|฿)/i);
  if (converterPair) {
    const dkk = parseRateNumber(converterPair[1]);
    const thb = parseRateNumber(converterPair[2]);
    const rate = dkk > 0 ? thb / dkk : 0;
    if (rate > 3 && rate < 7) return rate;
  }

  throw new Error("Revolut displayed rate not found");
}

function parseForexRate(html) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const dkkToThb = parseDkkToThbRate(text);
  if (dkkToThb) return dkkToThb;
  const thbToDkk = text.match(/1\s*THB\s*[=|:]?\s*([\d.,]+)\s*DKK/i);
  return thbToDkk ? rateFromDkkPerThb(parseRateNumber(thbToDkk[1])) : 0;
}

function parseTavexRate(html) {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const row = text.match(/THB\s+Thailandske\s+baht\s+([\d.,]+)\s+([\d.,]+)/i);
  if (row) return rateFromDkkPerThb(parseRateNumber(row[2]));
  const dkkPerThb = text.match(/Thailandske\s+baht[\s\S]{0,250}?([\d.,]+)\s*DKK/i);
  return dkkPerThb ? rateFromDkkPerThb(parseRateNumber(dkkPerThb[1])) : 0;
}

async function fetchOneProviderRate(provider) {
  const html = await fetchProviderText(PROVIDER_RATE_SOURCES[provider]);
  let rate = 0;
  if (provider === "revolut") rate = parseRevolutRate(html);
  else if (provider === "forex") rate = parseForexRate(html);
  else if (provider === "tavex") rate = parseTavexRate(html);
  else rate = parseDkkToThbRate(html);
  if (!rate || rate < 3 || rate > 7) throw new Error(`Invalid ${provider} rate`);
  return rate;
}

async function fetchProviderRates() {
  const providers = ["revolut", "wise", "forex", "tavex", "loomis"];
  data.providerRates = data.providerRates || {};
  const results = await Promise.allSettled(providers.map(async (provider) => {
    const rate = await fetchOneProviderRate(provider);
    return { provider, rate };
  }));

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { provider, rate } = result.value;
    data.providerRates[provider] = {
      rate,
      source: PROVIDER_RATE_SOURCES[provider],
      updatedAtHour: hourlyKey(),
      ok: true
    };
  }

  for (const provider of providers) {
    if (!data.providerRates[provider]?.rate || data.providerRates[provider]?.updatedAtHour !== hourlyKey()) {
      const previous = data.providerRates[provider]?.rate;
      data.providerRates[provider] = {
        rate: previous || FALLBACK_RATES[provider],
        source: previous ? "stale" : "fallback",
        updatedAtHour: previous ? (data.providerRates[provider]?.updatedAtHour || "") : hourlyKey(),
        ok: false
      };
    }
  }
}

function providerRate(provider) {
  return data.providerRates?.[provider]?.rate || FALLBACK_RATES[provider];
}

function updateRateStatus() {
  const el = document.getElementById("rateStatus");
  if (!el) return;

  const en = currentLanguage() === "en";
  const prefix = en ? "Rates update every 10 minutes" : "Kurser opdateres hvert 10 minut";
  el.textContent = "";
  el.appendChild(document.createTextNode(prefix));
  if (data.market?.date) {
    const updated = formatRateUpdateTime(data.market.updatedAtHour || data.market.date);
    el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(en ? `Last updated ${updated}` : `Sidst opdateret ${updated}`));
  }

  const revolutInfo = data.providerRates?.revolut;
  if (revolutInfo) {
    el.appendChild(document.createElement("br"));
    if (revolutInfo.ok) {
      el.appendChild(document.createTextNode(en ? "Revolut: live rate" : "Revolut: live kurs"));
    } else {
      el.appendChild(document.createTextNode(en ? "Revolut: source failed, using saved rate" : "Revolut: kilde fejlede, bruger gemt kurs"));
    }
  }
  updateConverterStatus();
}

function isWeekendToday() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function revolutEffectiveRate(baseRate) {
  return baseRate;
}

function applyMarketRates() {
  applyVisaBankPresetToData();
  const marketRate = data.market?.rate || 5.0570;
  if (data.eurcash) {
    data.eurcash.dkkPerEur = data.eurcash.dkkPerEur || dkkPerEurRate();
    data.eurcash.eurToThb = data.eurcash.eurToThb || 37.95;
    data.eurcash.maxDkkPerWithdrawal = data.eurcash.maxDkkPerWithdrawal || 15000;
  }

  data.revolut.referenceMargin = 0;
  data.revolut.rate = providerRate("revolut");

  data.wise.referenceMargin = 0;
  data.wise.rate = providerRate("wise");

  const visaFxMarkup = getVisaFxMarkupPercent(data.visa);
  data.visa.rawRate = FALLBACK_RATES.visa;
  data.visa.rate = FALLBACK_RATES.visa * (1 - visaFxMarkup / 100);
  data.visa.spread = visaFxMarkup;

  data.mastercard.rate = FALLBACK_RATES.mastercard;
  data.mastercard.spread = Math.max(0, (1 - data.mastercard.rate / marketRate) * 100);
  data.mastercard.fixedDkk = 0;

  data.loomis.place = "Loomis online";
  data.loomis.rate = providerRate("loomis");
  data.loomis.margin = Math.max(0, (1 - data.loomis.rate / marketRate) * 100);
  data.loomis.fixedDkk = 49.95;
  data.loomis.delivery = 0;
  data.loomis.other = 0;

  data.forex.place = "FOREX afhentning";
  data.forex.rate = providerRate("forex");
  data.forex.margin = Math.max(0, (1 - data.forex.rate / marketRate) * 100);
  data.forex.fixedDkk = 0;
  data.forex.delivery = 0;
  data.forex.other = 0;

  data.tavex.place = "Tavex webshop";
  data.tavex.rate = providerRate("tavex");
  data.tavex.margin = Math.max(0, (1 - data.tavex.rate / marketRate) * 100);
  data.tavex.delivery = 50;
  data.tavex.fixedDkk = 0;
  data.tavex.other = 0;

  data.market.rateVersion = RATE_VERSION;
}

async function updateMarketRateIfNeeded() {
  ensureVisibleMethods();

  if (data.market?.rateVersion !== RATE_VERSION) {
    data.providerRates = {};
    if (data.market) data.market.updatedAtHour = "";
  }

  if (data.market?.updatedAtHour === hourlyKey() && data.market?.rateVersion === RATE_VERSION && (data.market?.rate || 0) > 5) {
    const providerCacheIsFresh = ["revolut", "wise", "forex", "tavex", "loomis"]
      .every((provider) => data.providerRates?.[provider]?.updatedAtHour === hourlyKey());
    if (!providerCacheIsFresh) await fetchProviderRates();
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
      await fetchProviderRates();
      applyMarketRates();
      persist();
      syncInputs();
      syncHomeCurrencyUi();
      updateRateStatus();
      calculate();
    }
  } catch {
    await fetchProviderRates().catch(() => {});
    applyMarketRates();
    updateRateStatus();
    calculate();
  }
}

