// ATM Cash v1.1 - method settings and saved method data
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
  setInputValue("forexOther", data.forex.other);

  
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
    data.loomis.margin = parseNumber(document.getElementById("loomisMargin").value);
    data.loomis.fixedDkk = parseNumber(document.getElementById("loomisFixed").value);
    data.loomis.rate = (data.market?.rate || 5.05441) * (1 - data.loomis.margin / 100);
  }

  if (method === "forex") {
    data.forex.place = document.getElementById("forexPlace").value;
    data.forex.margin = parseNumber(document.getElementById("forexMargin").value);
    data.forex.fixedDkk = parseNumber(document.getElementById("forexFixed").value);
    data.forex.delivery = 0;
    data.forex.other = parseNumber(document.getElementById("forexOther").value);
    data.forex.rate = (data.market?.rate || 5.05441) * (1 - data.forex.margin / 100);
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



// Dynamisk Total gebyrer tilføjelse
try {
    const calcContainer = document.querySelector('.calc-container');
    if(calcContainer && !document.getElementById('totalGebyrer')){
        const totalDiv = document.createElement('div');
        totalDiv.className = 'calc-line total-fees';
        const label = document.createElement('div');
        label.textContent = 'Total gebyrer (ATM + bank)';
        const strong = document.createElement('strong');
        strong.id = 'totalGebyrer';
        strong.textContent = '0 DKK';
        totalDiv.appendChild(label);
        totalDiv.appendChild(strong);
        // Indsæt lige før Total pris linjen
        const totalLine = calcContainer.querySelector('.calc-line.total-line');
        if(totalLine){ calcContainer.insertBefore(totalDiv, totalLine); }
        // Opdater dynamisk når atmFee og bankFee findes
        const observer = new MutationObserver(()=>{
            try {
                const atm = typeof atmFee !== 'undefined' ? atmFee : 0;
                const bank = typeof bankFee !== 'undefined' ? bankFee : 0;
                strong.textContent = (atm + bank).toFixed(2) + ' DKK';
            } catch(e){}
        });
        observer.observe(calcContainer, {childList:true, subtree:true});
    }
} catch(e){ console.warn(e); }


// Integrer Total gebyrer i udregning
try {
    const atm = typeof atmFee !== 'undefined' ? atmFee : 0;
    const bank = typeof bankFee !== 'undefined' ? bankFee : 0;
    const totalGebyrer = atm + bank;
    const totalGebyrElem = document.getElementById('totalGebyrer');
    if(totalGebyrElem){ totalGebyrElem.textContent = totalGebyrer.toFixed(2) + ' DKK'; }

    // Opdater Total pris inkl. gebyrer hvis ønsket
    const totalFinalElem = document.getElementById('mcLineFinalTotal');
    if(totalFinalElem){ totalFinalElem.textContent = (typeof baseTotal !== 'undefined' ? baseTotal : 0 + totalGebyrer).toFixed(2) + ' DKK'; }
} catch(e){ console.warn(e); }
