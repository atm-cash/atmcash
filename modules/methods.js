// ATM Cash v1.32 - method settings and saved method data
function syncInputs() {
  applyVisaBankPresetToData();
  setInputValue("revolutAtm", data.revolut.atm);

  setInputValue("wiseOver", data.wise.over);
  setInputValue("wiseRate", data.wise.rate);
  setInputValue("wiseAtm", data.wise.atm);

  document.getElementById("visaBank").value = data.visa.bank;
  document.getElementById("visaType").value = data.visa.type;
  setInputValue("visaPercent", data.visa.percent);
  setInputValue("visaSpread", data.visa.spread || 0);
  setInputValue("visaFixed", data.visa.fixedDkk);
  applyVisaNordeaPresetToInputs();
  setInputValue("visaAtm", data.visa.atm);

  document.getElementById("mastercardBank").value = data.mastercard.bank;
  document.getElementById("mastercardType").value = data.mastercard.type;
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

  data.superrich = data.superrich || { place: "SuperRich Thailand", rate: 37.80, fixedDkk: 0 };
  if (![...document.getElementById("superrichPlace").options].some(o => o.value === data.superrich.place)) data.superrich.place = "SuperRich Thailand";
  document.getElementById("superrichPlace").value = data.superrich.place;
  setInputValue("superrichRate", data.superrich.rate);
  setInputValue("superrichFixed", data.superrich.fixedDkk);

  
  if (!data.tavex.place || ![...document.getElementById("tavexPlace").options].some(o => o.value === data.tavex.place)) data.tavex.place = "Tavex webshop";
  document.getElementById("tavexPlace").value = data.tavex.place;
  setInputValue("tavexRate", data.tavex.rate);
  setInputValue("tavexMargin", data.tavex.margin || 0);
  setInputValue("tavexFixed", data.tavex.fixedDkk);
  setInputValue("tavexDelivery", data.tavex.delivery);
  setInputValue("tavexOther", data.tavex.other);

  document.querySelectorAll(".plan[data-plan]").forEach((plan) => {
    plan.classList.toggle("active", plan.dataset.plan === data.revolut.plan);
  });
}

function saveMethod(method) {
  if (method === "revolut") {
    data.revolut.atm = parseNumber(document.getElementById("revolutAtm").value);
  }

  if (method === "wise") {
    data.wise.over = parseNumber(document.getElementById("wiseOver").value);
    data.wise.rate = parseNumber(document.getElementById("wiseRate").value);
    data.wise.atm = parseNumber(document.getElementById("wiseAtm").value);
  }

  if (method === "visa") {
    data.visa.bank = document.getElementById("visaBank").value;
    data.visa.type = document.getElementById("visaType").value;
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
    data.mastercard.percent = parseNumber(document.getElementById("mastercardPercent").value);
    data.mastercard.spread = parseNumber(document.getElementById("mastercardSpread")?.value || "0");
    data.mastercard.fixedDkk = parseNumber(document.getElementById("mastercardFixed").value);
    data.mastercard.atm = parseNumber(document.getElementById("mastercardAtm").value);
    applyMarketRates();
  }

  if (method === "loomis") {
    data.loomis.place = document.getElementById("loomisPlace").value;
    data.loomis.fixedDkk = parseNumber(document.getElementById("loomisFixed").value);
    applyMarketRates();
  }

  if (method === "forex") {
    data.forex.place = document.getElementById("forexPlace").value;
    data.forex.fixedDkk = parseNumber(document.getElementById("forexFixed").value);
    data.forex.delivery = 0;
    data.forex.other = 0;
    applyMarketRates();
  }

  if (method === "superrich") {
    data.superrich = data.superrich || {};
    data.superrich.place = document.getElementById("superrichPlace").value;
    data.superrich.rate = parseNumber(document.getElementById("superrichRate").value);
    data.superrich.fixedDkk = parseNumber(document.getElementById("superrichFixed").value);
    applyMarketRates();
  }

  if (method === "tavex") {
    data.tavex.place = document.getElementById("tavexPlace").value;
    data.tavex.fixedDkk = 0;
    data.tavex.delivery = 50;
    data.tavex.other = 0;
    applyMarketRates();
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

