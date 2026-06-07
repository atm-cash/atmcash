// ATM Cash v3.3 - method settings and saved method data
function syncInputs() {
  applyVisaBankPresetToData();
  setInputValue("revolutAtm", data.revolut.atm);
  setInputValue("revolutManualRate", data.revolut.manualRate || data.revolut.rate || 0);
  setInputValue("quickRevolutRate", data.revolut.manualRate || data.revolut.rate || 0);

  setInputValue("wiseOver", data.wise.over);
  setInputValue("wiseRate", data.wise.rate);
  setInputValue("wiseAtm", data.wise.atm);

  document.getElementById("visaBank").value = data.visa.bank;
  document.getElementById("visaType").value = data.visa.type;
  setInputValue("visaRate", data.visa.rawRate || data.visa.rate || 0);
  setInputValue("quickVisaRate", data.visa.rawRate || data.visa.rate || 0);
  setInputValue("visaPercent", data.visa.percent);
  setInputValue("visaSpread", data.visa.spread || 0);
  setInputValue("visaFixed", data.visa.fixedDkk);
  applyVisaNordeaPresetToInputs();
  setInputValue("visaAtm", data.visa.atm);

  document.getElementById("mastercardBank").value = data.mastercard.bank;
  document.getElementById("mastercardType").value = data.mastercard.type;
  setInputValue("mastercardRate", data.mastercard.rate || 0);
  setInputValue("quickMastercardRate", data.mastercard.rate || 0);
  setInputValue("mastercardPercent", data.mastercard.percent);
  setInputValue("mastercardSpread", data.mastercard.spread || 0);
  setInputValue("mastercardFixed", data.mastercard.fixedDkk);
  setInputValue("mastercardAtm", data.mastercard.atm);

  
  if (![...document.getElementById("loomisPlace").options].some(o => o.value === data.loomis.place)) data.loomis.place = "Loomis online";
  document.getElementById("loomisPlace").value = data.loomis.place;
  setInputValue("loomisRate", data.loomis.rate);
  setInputValue("loomisMargin", data.loomis.margin || 0);
  setInputValue("loomisFixed", data.loomis.fixedDkk);

  if (![...document.getElementById("forexPlace").options].some(o => o.value === data.forex.place)) data.forex.place = "FOREX afhentning";
  document.getElementById("forexPlace").value = data.forex.place;
  setInputValue("forexRate", data.forex.rate);
  setInputValue("forexMargin", data.forex.margin || 0);
  setInputValue("forexFixed", data.forex.fixedDkk);
  data.forex.delivery = 0;
  data.forex.other = 0;

  
  if (!data.tavex.place || ![...document.getElementById("tavexPlace").options].some(o => o.value === data.tavex.place)) data.tavex.place = "Tavex webshop";
  document.getElementById("tavexPlace").value = data.tavex.place;
  setInputValue("tavexRate", data.tavex.rate);
  setInputValue("tavexMargin", data.tavex.margin || 0);
  setInputValue("tavexFixed", data.tavex.fixedDkk);
  setInputValue("tavexDelivery", data.tavex.delivery);
  setInputValue("tavexOther", data.tavex.other);

  if (data.eurcash) {
    document.getElementById("eurcashBank").value = data.eurcash.bank || "Nordea";
    document.getElementById("eurcashPlace").value = data.eurcash.exchangePlace || "SuperRich";
    setInputValue("eurcashDkkPerEur", data.eurcash.dkkPerEur || dkkPerEurRate());
    setInputValue("eurcashEurToThb", data.eurcash.eurToThb || 37.95);
    setInputValue("eurcashMaxDkk", data.eurcash.maxDkkPerWithdrawal || 15000);
  }

  document.querySelectorAll(".plan[data-plan]").forEach((plan) => {
    plan.classList.toggle("active", plan.dataset.plan === data.revolut.plan);
  });
}

function setManualCardRate(method, value) {
  const rate = parseNumber(value);
  if (!(rate > 0)) return;
  if (method === "revolut") {
    data.revolut.manualRate = rate;
    data.revolut.rate = rate;
    data.revolut.rateSource = "manual";
    data.revolut.rateUnavailable = !(rate > 3 && rate < 7);
    setInputValue("revolutManualRate", rate);
    setInputValue("quickRevolutRate", rate);
  }
  if (method === "visa") {
    data.visa.rawRate = rate;
    applyVisaBankPresetToData();
    setInputValue("visaRate", rate);
    setInputValue("quickVisaRate", rate);
  }
  if (method === "mastercard") {
    data.mastercard.rate = rate;
    setInputValue("mastercardRate", rate);
    setInputValue("quickMastercardRate", rate);
  }
  applyMarketRates();
  persist();
  calculate();
  const calcPage = currentCalcPageName();
  if (calcPage === "revolutCalc") calculateRevolutDetails();
  if (calcPage === "visaCalc") calculateVisaDetails();
  if (calcPage === "mastercardCalc") calculateMastercardDetails();
}

function saveMethod(method) {
  if (method === "revolut") {
    data.revolut.atm = parseNumber(document.getElementById("revolutAtm").value);
    data.revolut.manualRate = parseNumber(document.getElementById("revolutManualRate")?.value || document.getElementById("quickRevolutRate")?.value || "0");
    data.revolut.rate = data.revolut.manualRate;
    data.revolut.rateSource = "manual";
    data.revolut.rateUnavailable = !(data.revolut.rate > 3 && data.revolut.rate < 7);
    applyMarketRates();
  }

  if (method === "wise") {
    data.wise.over = parseNumber(document.getElementById("wiseOver").value);
    data.wise.rate = parseNumber(document.getElementById("wiseRate").value);
    data.wise.atm = parseNumber(document.getElementById("wiseAtm").value);
  }

  if (method === "visa") {
    data.visa.bank = document.getElementById("visaBank").value;
    data.visa.type = document.getElementById("visaType").value;
    data.visa.rawRate = parseNumber(document.getElementById("visaRate")?.value || document.getElementById("quickVisaRate")?.value || data.visa.rawRate || data.visa.rate || "0");
    data.visa.percent = parseNumber(document.getElementById("visaPercent").value);
    data.visa.spread = parseNumber(document.getElementById("visaSpread")?.value || "0");
    data.visa.fixedDkk = parseNumber(document.getElementById("visaFixed").value);
    data.visa.atm = parseNumber(document.getElementById("visaAtm").value);
    data.visa.ruleKey = getVisaBankRuleKey(data.visa);
    applyVisaBankPresetToData();
    applyMarketRates();
  }

  if (method === "mastercard") {
    data.mastercard.bank = document.getElementById("mastercardBank").value;
    data.mastercard.type = document.getElementById("mastercardType").value;
    data.mastercard.rate = parseNumber(document.getElementById("mastercardRate")?.value || document.getElementById("quickMastercardRate")?.value || data.mastercard.rate || "0");
    data.mastercard.percent = parseNumber(document.getElementById("mastercardPercent").value);
    data.mastercard.spread = parseNumber(document.getElementById("mastercardSpread")?.value || "0");
    data.mastercard.fixedDkk = parseNumber(document.getElementById("mastercardFixed").value);
    data.mastercard.atm = parseNumber(document.getElementById("mastercardAtm").value);
    applyMarketRates();
  }

  if (method === "loomis") {
    data.loomis.place = document.getElementById("loomisPlace").value;
    data.loomis.rate = parseNumber(document.getElementById("loomisRate")?.value || data.loomis.rate || "0");
    data.loomis.margin = parseNumber(document.getElementById("loomisMargin")?.value || data.loomis.margin || "0");
    data.loomis.fixedDkk = parseNumber(document.getElementById("loomisFixed").value);
    applyMarketRates();
  }

  if (method === "forex") {
    data.forex.place = document.getElementById("forexPlace").value;
    data.forex.rate = parseNumber(document.getElementById("forexRate")?.value || data.forex.rate || "0");
    data.forex.margin = parseNumber(document.getElementById("forexMargin")?.value || data.forex.margin || "0");
    data.forex.fixedDkk = parseNumber(document.getElementById("forexFixed").value);
    data.forex.delivery = 0;
    data.forex.other = 0;
    applyMarketRates();
  }

  if (method === "tavex") {
    data.tavex.place = document.getElementById("tavexPlace").value;
    data.tavex.rate = parseNumber(document.getElementById("tavexRate")?.value || data.tavex.rate || "0");
    data.tavex.margin = parseNumber(document.getElementById("tavexMargin")?.value || data.tavex.margin || "0");
    data.tavex.fixedDkk = 0;
    data.tavex.delivery = 50;
    data.tavex.other = 0;
    applyMarketRates();
  }

  if (method === "eurcash") {
    data.eurcash = data.eurcash || {};
    data.eurcash.bank = document.getElementById("eurcashBank").value;
    data.eurcash.exchangePlace = document.getElementById("eurcashPlace").value;
    data.eurcash.dkkPerEur = parseNumber(document.getElementById("eurcashDkkPerEur").value);
    data.eurcash.eurToThb = parseNumber(document.getElementById("eurcashEurToThb").value);
    data.eurcash.maxDkkPerWithdrawal = parseNumber(document.getElementById("eurcashMaxDkk").value) || 15000;
  }

  persist();
  calculate();
  syncInputs();
  const calcPage = currentCalcPageName();
  if (calcPage) {
    showPage(calcPage);
  } else {
    showPage("home");
  }
}

