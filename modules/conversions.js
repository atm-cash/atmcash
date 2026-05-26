// ATM Cash v1.5 - conversions, defaults, config, language and currency helpers
let defaults = {
  market: { rate: 5.05441, date: "", source: "standard", rateVersion: "v73", rates: { DKK: 1, THB: 5.05441, EUR: 0.134, USD: 0.146, GBP: 0.114 } },
  homeCurrency: "DKK",
  language: "da",
  revolut: { plan: "Premium", limit: 3000, rate: 5.05441, atm: 220, over: 2 },
  wise: { limit: 1800, rate: 5.05441, atm: 220, over: 2.69 },
  visa: { bank: "Danske Bank", type: "Visa Debit", rate: 5.05441, spread: 0, percent: 1.75, fixedDkk: 0, atm: 220 },
  mastercard: { bank: "Danske Bank", type: "Mastercard Debit", rate: 5.05441, spread: 0, percent: 1.75, fixedDkk: 0, atm: 220 },
  loomis: { place: "Loomis online", rate: 4.79, margin: 5.23, fixedDkk: 49.95 },
  forex: { place: "FOREX afhentning", rate: 4.72, margin: 6.62, fixedDkk: 0, delivery: 0, other: 0 },
  tavex: { place: "Tavex webshop", rate: 4.84027, margin: 4.492, fixedDkk: 0, delivery: 50, other: 0 }
};

let data;

async function loadConfig() {
  try {
    const response = await fetch("config.json", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      defaults = mergeDefaults(defaults, config);
    }
  } catch (error) {
    console.warn("config.json could not be loaded. Using built-in defaults.", error);
  }
  data = loadData();
}


const originalTextNodes = new WeakMap();
const translations = {
  "Find den billigste måde at hæve kontanter i udlandet.": "Find the cheapest way to withdraw cash abroad.",
  "Beløb": "Amount",
  "↗ Resultat": "↗ Result",
  "☰ Vælg metoder": "☰ Choose methods",
  "Vælg metoder": "Choose methods",
  "Kurser opdateres hver time.": "Rates update hourly.",
  "Kurser og gebyrer er vejledende og kan ændres.": "Rates and fees are indicative and may change.",
  "Valuta": "Currency",
  "Tips": "Tips",
  "Valutaomregner": "Currency converter",
  "Skriv i ét felt – alle valutaer opdateres automatisk.": "Type in one field – all currencies update automatically.",
  "Danske kroner": "Danish kroner",
  "Thailandsk baht": "Thai baht",
  "Amerikansk dollar": "US dollar",
  "Britisk pund": "British pound",
  "Kurserne er vejledende.": "Rates are indicative.",
  "ATM tips": "ATM tips",
  "Kort guide til hævning i Thailand.": "Short guide to withdrawing cash in Thailand.",
  "Brug de gule Krungsri ATM’er": "Use the yellow Krungsri ATMs",
  "De gule Krungsri automater er ofte et godt valg i Thailand. De er nemme at finde, stabile og kan normalt hæve op til 30.000 THB pr. gang, hvis dit kort tillader det.": "The yellow Krungsri ATMs are often a good choice in Thailand. They are easy to find, reliable, and usually allow withdrawals up to 30,000 THB per transaction if your card allows it.",
  "Hæv så meget som muligt pr. gang": "Withdraw as much as possible each time",
  "Thai ATM’er tager typisk et fast gebyr pr. hævning. Derfor bliver det billigere at hæve ét stort beløb end flere små beløb.": "Thai ATMs typically charge a fixed fee per withdrawal. One larger withdrawal is therefore cheaper than several small ones.",
  "Sig nej til Conversion": "Say no to Conversion",
  "Hvis automaten spørger om Conversion eller Dynamic Currency Conversion, så vælg nej. Lad altid dit eget kort/bank lave omregningen til THB.": "If the ATM asks about Conversion or Dynamic Currency Conversion, choose no. Always let your own card/bank do the conversion to THB.",
  "Pas på dyre Visa/Mastercard hævninger": "Watch out for expensive Visa/Mastercard withdrawals",
  "Almindelige bankkort kan være dyre i udlandet, fordi der både kan komme bankgebyr og dårligere valutakurs. Sammenlign med Wise/Revolut før du hæver.": "Regular bank cards can be expensive abroad because you may pay both bank fees and a worse exchange rate. Compare with Wise/Revolut before withdrawing.",
  "Revolut i weekenden": "Revolut at weekends",
  "Revolut kan lægge ekstra vekselgebyr på i weekenden, især på Standard og Plus. Hvis du kan, så hæv eller veksl på hverdage.": "Revolut may add an extra exchange fee at weekends, especially on Standard and Plus. If possible, withdraw or exchange on weekdays.",
  "Vælg sikre automater": "Choose safe ATMs",
  "Brug helst automater ved banker, shoppingcentre eller steder med god belysning. Undgå tomme gadeautomater sent om aftenen.": "Prefer ATMs at banks, shopping centres, or well-lit places. Avoid isolated street ATMs late at night.",
  "Metoder på forsiden": "Methods on front page",
  "Vis kun de metoder du bruger": "Show only the methods you use",
  "Gem valg": "Save selection",
  "Beregning af ATM-hævning": "ATM withdrawal calculation",
  "Beregning af kontant valuta": "Cash currency calculation",
  "Beregning ud fra forsiden": "Calculation based on the front page",
  "Total pris": "Total price",
  "Hævning": "Withdrawal",
  "Udregning": "Calculation",
  "Sådan er det beregnet": "How it is calculated",
  "Indstillinger": "Settings",
  "Revolut-indstillinger": "Revolut settings",
  "Wise-indstillinger": "Wise settings",
  "Visa-indstillinger": "Visa settings",
  "Mastercard-indstillinger": "Mastercard settings",
  "Loomis-indstillinger": "Loomis settings",
  "FOREX-indstillinger": "FOREX settings",
  "Tavex-indstillinger": "Tavex settings",
  "Gem Revolut-indstillinger": "Save Revolut settings",
  "Gem Wise-indstillinger": "Save Wise settings",
  "Gem Visa-indstillinger": "Save Visa settings",
  "Gem Mastercard-indstillinger": "Save Mastercard settings",
  "Gem Loomis-indstillinger": "Save Loomis settings",
  "Gem FOREX-indstillinger": "Save FOREX settings",
  "Gem Tavex-indstillinger": "Save Tavex settings",
  "Kontanter · THB": "Cash · THB",
  "Maks pr. hævning · THB": "Max per withdrawal · THB",
  "Maks pr. hævning · DKK": "Max per withdrawal · DKK",
  "Antal hævninger": "Number of withdrawals",
  "ATM-gebyr": "ATM fee",
  "ATM-gebyr total · THB": "Total ATM fee · THB",
  "Bankgebyr": "Bank fee",
  "Bankgebyr · %": "Bank fee · %",
  "Fast bankgebyr": "Fixed bank fee",
  "Fast bankgebyr · DKK": "Fixed bank fee · DKK",
  "Fast gebyr": "Fixed fee",
  "Fast gebyr · DKK": "Fixed fee · DKK",
  "Gebyrer": "Fees",
  "Gebyrer · DKK": "Fees · DKK",
  "Valutakurs-spread": "Exchange rate spread",
  "Valutakurs-spread · %": "Exchange rate spread · %",
  "Visa valutaspread": "Visa exchange spread",
  "Visa valutaspread · %": "Visa exchange spread · %",
  "Kurs": "Rate",
  "Kurs · THB pr. DKK": "Rate · THB per DKK",
  "Kurs · THB pr. DKK (markedskurs)": "Rate · THB per DKK (market rate)",
  "Auto-kurs · THB pr. DKK": "Auto rate · THB per DKK",
  "Kurs efter Visa-spread": "Rate after Visa spread",
  "Kurs og gebyr": "Rate and fee",
  "Margin fra markedskurs": "Margin from market rate",
  "Margin fra markedskurs · %": "Margin from market rate · %",
  "Levering": "Delivery",
  "Levering · DKK (automatisk efter beløb)": "Delivery · DKK (automatic by amount)",
  "Øvrige gebyrer": "Other fees",
  "Øvrige gebyrer · DKK": "Other fees · DKK",
  "Gebyrfri hævegrænse": "Free withdrawal limit",
  "Gebyrfri hævegrænse pr. måned": "Free monthly withdrawal limit",
  "Gebyrfri hævning op til månedsgrænsen": "Free withdrawals up to the monthly limit",
  "Beløb over grænse": "Amount over limit",
  "Over grænse · %": "Over limit · %",
  "Revolut-gebyr over grænse": "Revolut fee over limit",
  "Wise-gebyr over grænse": "Wise fee over limit",
  "Plan": "Plan",
  "pr. måned": "per month",
  "Kontanter": "Cash",
  "Kontanter ønsket": "Cash wanted",
  "Kontant valuta hjemmefra": "Cash currency from home",
  "Ingen ATM-gebyr": "No ATM fee",
  "Fast gebyr ved hævning i automat": "Fixed fee for ATM withdrawal",
  "Thailand standard ATM-gebyr": "Thailand standard ATM fee",
  "Bank og kort": "Bank and card",
  "Vekslingssted": "Exchange place",
  "Kun afhentning": "Pickup only",
  "Loomis levering": "Loomis delivery",
  "Tavex levering": "Tavex delivery",
  "Loomis butik / afhentning": "Loomis store / pickup",
  "Tavex butik / afhentning": "Tavex store / pickup",
  "FOREX afhentning": "FOREX pickup",
  "Loomis regnes som kontanter hjemmefra, ikke hævning i Thailand.": "Loomis is counted as cash from home, not an ATM withdrawal in Thailand.",
  "FOREX regnes som kontanter hjemmefra, ikke hævning i Thailand.": "FOREX is counted as cash from home, not an ATM withdrawal in Thailand.",
  "Tavex regnes som kontanter hjemmefra, ikke hævning i Thailand.": "Tavex is counted as cash from home, not an ATM withdrawal in Thailand.",
  "FOREX kan ikke leveres. Valuta afhentes i butik.": "FOREX cannot be delivered. Currency is collected in store.",
  "Billigst": "Cheapest",
  "Bedste valg": "Best choice",
  "Kontanter hjemmefra": "Cash from home",
  "Over grænse": "Over limit",
  "Pris før Revolut-gebyr": "Price before Revolut fee",
  "Pris før Wise-gebyr": "Price before Wise fee",
  "Pris før bankgebyr": "Price before bank fee",
  "Pris før gebyrer": "Price before fees",
  "Total THB inkl. ATM-gebyr": "Total THB incl. ATM fee",
  "Total THB inkl. gebyr": "Total THB incl. fee",
  "Bankgebyrer og hævning": "Bank fees and withdrawal",
  "Rediger Revolut-indstillinger": "Edit Revolut settings",
  "Rediger Wise-indstillinger": "Edit Wise settings",
  "Rediger Visa-indstillinger": "Edit Visa settings",
  "Rediger Mastercard-indstillinger": "Edit Mastercard settings",
  "Rediger Loomis-indstillinger": "Edit Loomis settings",
  "Rediger FOREX-indstillinger": "Edit FOREX settings",
  "Rediger Tavex-indstillinger": "Edit Tavex settings",
  "Anden bank": "Other bank"
};

function currentLanguage() {
  return data.language || "da";
}

function setLanguage(lang) {
  data.language = lang === "en" ? "en" : "da";
  persist();
  translatePage();
}

function translateNodeText(text) {
  if (currentLanguage() !== "en") return text;
  if (translations[text]) return translations[text];
  if (text.startsWith("Kurser opdateres hver time. Sidst opdateret ")) {
    return text.replace("Kurser opdateres hver time. Sidst opdateret ", "Rates update hourly. Last updated ");
  }
  if (text.includes("Over grænse")) return text.replaceAll("Over grænse", "Over limit");
  if (text.includes("over grænse")) return text.replaceAll("over grænse", "over limit");
  if (text.startsWith("Gem ") && text.endsWith("-indstillinger")) return text.replace("Gem ", "Save ").replace("-indstillinger", " settings");
  if (text.includes(" pr. hævning")) return text.replace("Gebyr", "Fee").replace(" pr. hævning", " per withdrawal").replace("Min", "Min");
  if (text.includes("Kontanter hjemmefra")) return text.replace("Kontanter hjemmefra", "Cash from home");
  return text;
}

function translatePage() {
  const lang = currentLanguage();
  document.documentElement.lang = lang;
  document.title = lang === "en" ? "ATM Cash" : "ATM Cash";
  document.querySelectorAll(".language-toggle[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (["rateStatus", "converterRateStatus"].includes(parent.id)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    const original = originalTextNodes.get(node);
    node.nodeValue = translateNodeText(original);
  });
  updateRateStatus();
}


const allMethods = ["revolut", "wise", "visa", "mastercard", "loomis", "forex", "tavex"];
let lastEditedCurrency = "dkk";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeDefaults(defaultObj, savedObj) {
  const merged = clone(defaultObj);
  if (!savedObj || typeof savedObj !== "object") return merged;

  Object.keys(savedObj).forEach((key) => {
    if (merged[key] && typeof merged[key] === "object" && !Array.isArray(merged[key])) {
      merged[key] = { ...merged[key], ...savedObj[key] };
    } else {
      merged[key] = savedObj[key];
    }
  });

  return merged;
}

function loadData() {
  try {
    const saved = localStorage.getItem("atmCashData");
    return saved ? mergeDefaults(defaults, JSON.parse(saved)) : clone(defaults);
  } catch {
    return clone(defaults);
  }
}

function ensureVisibleMethods() {
  if (!Array.isArray(data.visibleMethods) || data.visibleMethods.length === 0) {
    data.visibleMethods = [...allMethods];
  }
}

function persist() {
  ensureVisibleMethods();
  localStorage.setItem("atmCashData", JSON.stringify(data));
}

function parseNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", ".")) || 0;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("da-DK");
}

function formatDecimal(value) {
  return String(value).replace(".", ",");
}

function formatCurrencyInput(value) {
  if (!Number.isFinite(value)) value = 0;
  return value.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCurrencyRates() {
  const fallback = { DKK: 1, THB: data.market?.rate || 5.05441, EUR: 0.134, USD: 0.146, GBP: 0.114 };
  return { ...fallback, ...(data.market?.rates || {}), DKK: 1 };
}

function getHomeCurrency() {
  return data.homeCurrency || "DKK";
}

function getHomeRate() {
  const rates = getCurrencyRates();
  return rates[getHomeCurrency()] || 1;
}

function amountToDkk(amount) {
  return amount / getHomeRate();
}

function dkkToHome(dkk) {
  return dkk * getHomeRate();
}

function homeCurrencyLabel() {
  return getHomeCurrency();
}

function homeFlagClass() {
  const code = getHomeCurrency();
  if (code === "EUR") return "flag eu";
  if (code === "USD") return "flag us";
  return "flag dk";
}

function syncHomeCurrencyUi() {
  const select = document.getElementById("homeCurrency");
  if (select) select.value = getHomeCurrency();
  const flag = document.getElementById("homeCurrencyFlag");
  if (flag) flag.className = homeFlagClass();
}

function updateConverterStatus() {
  const el = document.getElementById("converterRateStatus");
  if (!el) return;
  const en = currentLanguage() === "en";
  const updated = formatRateUpdateTime(data.market?.updatedAtHour || data.market?.date);
  el.textContent = updated
    ? (en ? `Rates update hourly. Last updated ${updated}.` : `Kurser opdateres hver time. Sidst opdateret ${updated}.`)
    : (en ? "Rates update hourly." : "Kurser opdateres hver time.");
}

function updateConverterFrom(currency) {
  const input = document.querySelector(`.converter-input[data-currency="${currency}"]`);
  if (!input) return;
  const amount = parseNumber(input.value);
  const rates = getCurrencyRates();
  const fromRate = rates[currency] || 1;
  const dkkValue = fromRate ? amount / fromRate : 0;

  document.querySelectorAll(".converter-input").forEach((field) => {
    const code = field.dataset.currency;
    if (code === currency) return;
    field.value = formatCurrencyInput(dkkValue * (rates[code] || 1));
  });
}

function setupConverter() {
  const fields = document.querySelectorAll(".converter-input");
  fields.forEach((field) => {
    field.addEventListener("focus", () => field.select());
    field.addEventListener("input", () => updateConverterFrom(field.dataset.currency));
  });
  updateConverterStatus();
  updateConverterFrom("DKK");
}

