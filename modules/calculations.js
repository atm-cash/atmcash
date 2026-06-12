// ATM Cash v5.8 - price calculations and detail views
// v1.11: Mastercard uses one shared Mastercard rate with calculator bank fee removed.
// Cash suppliers use fixed webshop prices in DKK per THB.
const CASH_SUPPLIER_PRICES = {
  forex: { dkkPerThb: 0.211671, fixedDkk: 0, delivery: 0, other: 0 },
  tavex: { dkkPerThb: 0.2066, fixedDkk: 0, delivery: 50, other: 0 },
  loomis: { dkkPerThb: 0.208767, fixedDkk: 49.95, delivery: 0, other: 0 }
};

function cashSupplierPrice(method) {
  return CASH_SUPPLIER_PRICES[method] || null;
}

function cashSupplierRate(method, fallbackRate) {
  const official = cashSupplierPrice(method);
  return official ? 1 / official.dkkPerThb : fallbackRate;
}

function cashSupplierFees(method, wantedThb = 0) {
  if (method === "forex") {
    const cfg = data.forex || {};
    return { fixed: cfg.fixedDkk || 0, delivery: 0, other: 0 };
  }
  const official = cashSupplierPrice(method);
  if (official) {
    return {
      fixed: official.fixedDkk || 0,
      delivery: typeof official.delivery === "function" ? official.delivery(wantedThb) : (official.delivery || 0),
      other: official.other || 0
    };
  }
  const cfg = data[method];
  const delivery = getDeliveryForMethod(method, wantedThb);
  return { fixed: cfg.fixedDkk || 0, delivery, other: cfg.other || 0 };
}

function dkkPerEurRate() {
  const eurPerDkk = getCurrencyRates().EUR || 0.134;
  return eurPerDkk > 0 ? 1 / eurPerDkk : 7.46;
}

function eurcashEffectiveRate(cfg) {
  const dkkPerEur = cfg?.dkkPerEur || dkkPerEurRate();
  const eurToThb = cfg?.eurToThb || 37.95;
  return dkkPerEur > 0 ? eurToThb / dkkPerEur : 0;
}

function calculateResults(dkk) {
  updateVisaRateFromSettings();
  const revolut = data.revolut;
  const revolutAvailable = revolut.rate > 3 && revolut.rate < 7;
  const revolutOver = Math.max(0, dkk - revolut.limit);
  const revolutThb = revolutAvailable ? (dkk * revolut.rate - revolutOver * revolut.rate * (revolut.over / 100) - revolut.atm) : -Infinity;

  const wise = data.wise;
  const wiseOver = Math.max(0, dkk - wise.limit);
  const wiseThb = dkk * wise.rate - wiseOver * wise.rate * (wise.over / 100) - wise.atm;

  const visa = data.visa;
  const visaBeforeFeeDkk = getBeforeCardFeeDkkFromTotal(dkk, visa);
  const visaThb = visaBeforeFeeDkk * visa.rate - visa.atm;

  const mastercard = data.mastercard;
  if (typeof applyMastercardModelToData === "function") applyMastercardModelToData();
  const mastercardMaxPerWithdrawal = parseNumber(document.getElementById("mcMaxPerWithdrawal")?.value || "20000") || 20000;
  let mastercardWithdrawalCount = 1;
  let mastercardAtmFeeThb = 0;
  let mastercardAtmFeeDkk = 0;
  let mastercardBeforeFeeDkk = 0;
  let mastercardGrossThb = 0;
  let mastercardThb = 0;
  for (let i = 0; i < 8; i += 1) {
    mastercardAtmFeeThb = mastercardWithdrawalCount * mastercard.atm;
    mastercardAtmFeeDkk = mastercardAtmFeeThb / mastercard.rate;
    const afterAtmDkk = Math.max(0, dkk - mastercardAtmFeeDkk);
    const minFee = (mastercard.fixedDkk || 0) * mastercardWithdrawalCount;
    const percent = (mastercard.percent || 0) / 100;
    if (percent > 0) {
      const beforeByPercent = afterAtmDkk / (1 + percent);
      mastercardBeforeFeeDkk = beforeByPercent * percent >= minFee ? beforeByPercent : Math.max(0, afterAtmDkk - minFee);
    } else {
      mastercardBeforeFeeDkk = Math.max(0, afterAtmDkk - minFee);
    }
    mastercardGrossThb = mastercardBeforeFeeDkk * mastercard.rate;
    mastercardThb = Math.max(0, mastercardGrossThb - mastercardAtmFeeThb);
    const nextCount = Math.max(1, Math.ceil(mastercardThb / mastercardMaxPerWithdrawal));
    if (nextCount === mastercardWithdrawalCount) break;
    mastercardWithdrawalCount = nextCount;
  }

  const loomisRate = cashSupplierRate("loomis", data.loomis.rate);
  const loomisFees = cashSupplierFees("loomis");
  const loomisThb = Math.max(0, (dkk - loomisFees.fixed - loomisFees.delivery - loomisFees.other) * loomisRate);

  const forexRate = cashSupplierRate("forex", data.forex.rate);
  const forexFees = cashSupplierFees("forex");
  const forexThb = Math.max(0, (dkk - forexFees.fixed - forexFees.delivery - forexFees.other) * forexRate);

  const tavexRate = cashSupplierRate("tavex", data.tavex.rate);
  const tavexFees = cashSupplierFees("tavex");
  const tavexThb = Math.max(0, (dkk - tavexFees.fixed - tavexFees.delivery - tavexFees.other) * tavexRate);

  const eurcash = data.eurcash || {};
  const eurcashRate = eurcashEffectiveRate(eurcash);
  const eurcashThb = Math.max(0, dkk * eurcashRate);

  return [
    { id: "revolut", logoText: "R", logoClass: "revolut-logo", name: "Revolut", sub: revolutAvailable ? `${revolut.plan} · ATM ${revolut.atm} THB` : "Live kurs utilgængelig", thb: revolutThb },
    { id: "wise", logoText: "W", logoClass: "wise-logo", name: "Wise", sub: `Over grænse ${formatDecimal(wise.over)}% · ATM ${wise.atm} THB`, thb: wiseThb },
    { id: "visa", logoText: "VISA", logoClass: "visa-logo", name: "Visa", sub: `${visa.bank} · ${formatDecimal(visa.percent)}%`, thb: visaThb },
    { id: "mastercard", logoText: "", logoClass: "mastercard-logo", name: "Mastercard", sub: `${mastercard.bank} · ${formatDecimal(mastercard.percent)}%`, thb: mastercardThb },
    { id: "loomis", logoText: "L", logoClass: "loomis-logo", name: "Loomis", sub: "Kontanter hjemmefra", thb: loomisThb },
    { id: "forex", logoText: "FOREX", logoClass: "forex-logo", name: "FOREX", sub: "Kontanter hjemmefra", thb: forexThb },
    { id: "tavex", logoText: "TAVEX", logoClass: "tavex-logo", name: "Tavex", sub: "Kontanter hjemmefra", thb: tavexThb },
    { id: "eurcash", logoText: "€", logoClass: "eurcash-logo", name: "EUR kontanter", sub: `${eurcash.exchangePlace || "SuperRich"} · ${formatDecimal(eurcash.eurToThb || 37.95)} THB/EUR`, thb: eurcashThb }
  ].sort((a, b) => b.thb - a.thb);
}


function visibleResultsForDkk(dkk) {
  ensureVisibleMethods();
  const allowed = getHomeCurrency() === "DKK" ? data.visibleMethods : ["revolut", "wise"];
  return calculateResults(dkk).filter((item) => allowed.includes(item.id));
}

function bestThbForDkk(dkk) {
  const results = visibleResultsForDkk(dkk);
  return results[0]?.thb || 0;
}

function dkkNeededForThb(wantedThb) {
  if (!wantedThb || wantedThb <= 0) return 0;

  let low = 0;
  let high = Math.max(1000, wantedThb / 3);

  for (let i = 0; i < 40 && bestThbForDkk(high) < wantedThb; i++) {
    high *= 2;
  }

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (bestThbForDkk(mid) < wantedThb) low = mid;
    else high = mid;
  }

  return high;
}


function updateDirectionArrow() {
  const arrow = document.getElementById("directionArrow");
  if (!arrow) return;
  arrow.textContent = lastEditedCurrency === "thb" ? "←" : "→";
}


function tavexDeliveryForThb(thb) {
  if (!thb || thb <= 0) return 50;
  if (thb <= 28000) return 50;
  if (thb <= 48000) return 99;
  if (thb <= 70000) return 129;
  if (thb <= 96000) return 159;
  return 199;
}

function isPickupPlace(place) {
  const value = String(place || "").toLowerCase();
  return value.includes("butik") || value.includes("afhentning");
}

function getDeliveryForMethod(method, thbAmount) {
  if (method === "tavex") {
    return isPickupPlace(data.tavex.place) ? 0 : tavexDeliveryForThb(thbAmount);
  }
  return data[method]?.delivery || 0;
}

function costForTargetThb(method, targetThb) {
  if (!targetThb || targetThb <= 0) return 0;

  const cfg = data[method] || {};

  if (method === "eurcash") {
    const c = data.eurcash || {};
    const rate = eurcashEffectiveRate(c);
    return rate > 0 ? targetThb / rate : Infinity;
  }

  const rate = cfg.rate || 0;
  if (!rate) return 0;

  if (method === "revolut") {
    const r = data.revolut;
    const atm = r.atm || 0;
    let low = 0;
    let high = Math.max(1000, targetThb / rate);

    function cashFromDkk(dkk) {
      const maxPerWithdrawal = 20000;
      const rawCashThb = dkk * r.rate;
      const withdrawalCount = Math.max(1, Math.ceil(rawCashThb / maxPerWithdrawal));
      const atmFeeThb = withdrawalCount * atm;
      const beforeRevolutFeeDkk = (rawCashThb) / r.rate;
      const overLimitDkk = Math.max(0, beforeRevolutFeeDkk - r.limit);
      const revolutFeeDkk = overLimitDkk * (r.over / 100);
      return Math.max(0, (dkk - revolutFeeDkk) * r.rate - atmFeeThb);
    }

    for (let i = 0; i < 40 && cashFromDkk(high) < targetThb; i++) high *= 2;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (cashFromDkk(mid) < targetThb) low = mid;
      else high = mid;
    }
    return high;
  }

  if (method === "wise") {
    const w = data.wise;
    const atm = w.atm || 0;
    let low = 0;
    let high = Math.max(1000, targetThb / rate);

    function cashFromDkk(dkk) {
      const maxPerWithdrawal = 20000;
      const rawCashThb = dkk * w.rate;
      const withdrawalCount = Math.max(1, Math.ceil(rawCashThb / maxPerWithdrawal));
      const atmFeeThb = withdrawalCount * atm;
      const beforeWiseFeeDkk = rawCashThb / w.rate;
      const overLimitDkk = Math.max(0, beforeWiseFeeDkk - w.limit);
      const wiseFeeDkk = overLimitDkk * (w.over / 100);
      return Math.max(0, (dkk - wiseFeeDkk) * w.rate - atmFeeThb);
    }

    for (let i = 0; i < 40 && cashFromDkk(high) < targetThb; i++) high *= 2;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (cashFromDkk(mid) < targetThb) low = mid;
      else high = mid;
    }
    return high;
  }


  if (method === "visa" || method === "mastercard") {
    const c = data[method];
    const atm = c.atm || 0;
    let low = 0;
    let high = Math.max(1000, targetThb / rate);

    function cashFromDkk(dkk) {
      const maxPerWithdrawal = 20000;
      const beforeFeeDkk = method === "visa" ? getBeforeCardFeeDkkFromTotal(dkk, c) : Math.max(0, dkk - (c.fixedDkk || 0)) * (1 - (c.percent || 0) / 100);
      const grossThb = beforeFeeDkk * c.rate;
      const withdrawalCount = Math.max(1, Math.ceil(grossThb / maxPerWithdrawal));
      const atmFeeThb = withdrawalCount * atm;
      return Math.max(0, grossThb - atmFeeThb);
    }

    for (let i = 0; i < 40 && cashFromDkk(high) < targetThb; i++) high *= 2;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (cashFromDkk(mid) < targetThb) low = mid;
      else high = mid;
    }
    return high;
  }

  // Cash exchange: exact target THB / rate + fees
  if (method === "loomis" || method === "forex" || method === "tavex") {
    const delivery = getDeliveryForMethod(method, targetThb);
    const fees = (cfg.fixedDkk || 0) + delivery + (cfg.other || 0);
    return targetThb / rate + fees;
  }

  return targetThb / rate;
}

function resultCostListForThb(targetThb) {
  const allowed = getHomeCurrency() === "DKK" ? data.visibleMethods : ["revolut", "wise"];
  const baseResults = calculateResults(1000).filter((item) => allowed.includes(item.id));

  return baseResults.map((item) => ({
    ...item,
    thb: targetThb,
    dkkCost: costForTargetThb(item.id, targetThb)
  })).sort((a, b) => a.dkkCost - b.dkkCost);
}

function calculate() {
  const dkkInput = document.getElementById("dkkAmount");
  const thbInput = document.getElementById("bestThb");
  const currentDkkInput = amountToDkk(parseNumber(dkkInput?.value || "0"));
  const currentThbInput = parseNumber(thbInput?.value || "0");
  const activeAmount = document.body?.dataset?.activeAmount || "";
  const focusedId = document.activeElement?.id || "";

  // v5.8: Robust THB→DKK detection. The right THB field wins when it is focused,
  // when its input handler marked it active, or when DKK is empty/0 and THB has a value.
  const useThbInput = currentThbInput > 0 && (
    activeAmount === "thb" ||
    focusedId === "bestThb" ||
    lastEditedCurrency === "thb" ||
    currentDkkInput <= 0
  );

  if (useThbInput) {
    lastEditedCurrency = "thb";
    if (document.body?.dataset) document.body.dataset.activeAmount = "thb";
    updateDirectionArrow();

    const targetThb = parseNumber(document.getElementById("bestThb").value);
    const results = resultCostListForThb(targetThb);
    const bestCost = results[0]?.dkkCost || 0;
    const bestHomeCost = dkkToHome(bestCost);

    if (focusedId !== "dkkAmount") {
      document.getElementById("dkkAmount").value = formatNumber(bestHomeCost);
    }

    document.getElementById("results").innerHTML = results.map((item, index) => {
      const diff = Math.max(0, item.dkkCost - bestCost);
      return `
        <button class="result-card ${index === 0 ? "best" : ""}" type="button" data-open="${item.id}">
          <div class="method-logo ${item.logoClass || ""}">${item.logoText || ""}</div>
          <div>
            <div class="name">${item.name}${index === 0 ? '<span class="badge">Billigst</span>' : ""}</div>
            <div class="sub">${item.sub}</div>
          </div>
          <div class="result-value">
            ${formatNumber(dkkToHome(item.dkkCost))} ${homeCurrencyLabel()}
            <div class="${index === 0 ? "saving" : "diff"}">${index === 0 ? "Bedste valg" : "+" + formatNumber(dkkToHome(diff)) + " " + homeCurrencyLabel()}</div>
          </div>
          <div class="chev">›</div>
        </button>
      `;
    }).join("");

    document.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => showPage(button.dataset.open === 'revolut' ? 'revolutCalc' : button.dataset.open === 'wise' ? 'wiseCalc' : button.dataset.open === 'visa' ? 'visaCalc' : button.dataset.open === 'mastercard' ? 'mastercardCalc' : button.dataset.open === 'loomis' ? 'loomisCalc' : button.dataset.open === 'forex' ? 'forexCalc' : button.dataset.open === 'tavex' ? 'tavexCalc' : button.dataset.open === 'eurcash' ? 'eurcashCalc' : button.dataset.open));
    });
    translatePage();

    return;
  }

  updateDirectionArrow();

  let homeAmount = parseNumber(document.getElementById("dkkAmount").value);
  let dkk = amountToDkk(homeAmount);
  const results = visibleResultsForDkk(dkk);
  const best = results[0]?.thb || 0;

  if (focusedId !== "bestThb") {
    document.getElementById("bestThb").value = formatNumber(best);
  }

  document.getElementById("results").innerHTML = results.map((item, index) => {
    const diff = Math.max(0, best - item.thb);
    return `
      <button class="result-card ${index === 0 ? "best" : ""}" type="button" data-open="${item.id}">
        <div class="method-logo ${item.logoClass || ""}">${item.logoText || ""}</div>
        <div>
          <div class="name">${item.name}${index === 0 ? '<span class="badge">Billigst</span>' : ""}</div>
          <div class="sub">${item.sub}</div>
        </div>
        <div class="result-value">
          ${formatNumber(item.thb)} THB
          <div class="${index === 0 ? "saving" : "diff"}">${index === 0 ? "Bedste valg" : "-" + formatNumber(diff) + " THB"}</div>
        </div>
        <div class="chev">›</div>
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.open === 'revolut' ? 'revolutCalc' : button.dataset.open === 'wise' ? 'wiseCalc' : button.dataset.open === 'visa' ? 'visaCalc' : button.dataset.open === 'mastercard' ? 'mastercardCalc' : button.dataset.open === 'loomis' ? 'loomisCalc' : button.dataset.open === 'forex' ? 'forexCalc' : button.dataset.open === 'tavex' ? 'tavexCalc' : button.dataset.open === 'eurcash' ? 'eurcashCalc' : button.dataset.open));
  });
  translatePage();
}


function calculateRevolutDetails() {
  const r = data.revolut;
  if (!(r.rate > 3 && r.rate < 7) || r.rateUnavailable === true) {
    setText("revolutCalcPlan", `Revolut ${r.plan}`);
    setText("revolutCalcSubtitle", "Live kurs utilgængelig");
    const totalEl = document.getElementById("revolutCalcTotal");
    if (totalEl) totalEl.innerHTML = `— ${homeCurrencyLabel()}<span>Total pris</span>`;
    ["revolutCalcCash", "revolutCalcCount", "revolutCalcAtm"].forEach((id) => setText(id, "—"));
    setText("lineWanted", "—");
    setText("lineAtm", "—");
    setText("lineTotalThb", "—");
    setText("lineRate", "Live kurs utilgængelig");
    setText("lineBeforeFee", "—");
    setText("lineLimit", `${formatNumber(r.limit)} DKK`);
    setText("lineOverLimit", "—");
    setText("lineRevolutFee", `${formatDecimal(r.over)}% = — DKK`);
    setText("lineTotalFee", "— DKK");
    setText("lineFinalTotal", "— DKK");
    const formula = document.getElementById("revolutFormula");
    if (formula) formula.innerHTML = "Revolut live-kurs kunne ikke hentes. Beregningen er deaktiveret, så der ikke bruges gammel eller forkert kurs.";
    return;
  }
  const maxPerWithdrawal = parseNumber(document.getElementById("revolutMaxPerWithdrawal")?.value || "20000") || 20000;

  let wantedCashThb;
  let withdrawalCount;
  let atmFeeThb;
  let totalThbWithFees;
  let beforeRevolutFeeDkk;
  let overLimitDkk;
  let revolutFeeDkk;
  let finalTotalDkk;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    withdrawalCount = Math.max(1, Math.ceil(wantedCashThb / maxPerWithdrawal));
    atmFeeThb = withdrawalCount * r.atm;
    totalThbWithFees = wantedCashThb + atmFeeThb;
    beforeRevolutFeeDkk = totalThbWithFees / r.rate;
    overLimitDkk = Math.max(0, beforeRevolutFeeDkk - r.limit);
    revolutFeeDkk = overLimitDkk * (r.over / 100);
    finalTotalDkk = beforeRevolutFeeDkk + revolutFeeDkk;
  } else {
    const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    const rawCashThb = dkk * r.rate;
    withdrawalCount = Math.max(1, Math.ceil(rawCashThb / maxPerWithdrawal));
    atmFeeThb = withdrawalCount * r.atm;
    wantedCashThb = Math.max(0, rawCashThb - atmFeeThb);
    totalThbWithFees = wantedCashThb + atmFeeThb;
    beforeRevolutFeeDkk = totalThbWithFees / r.rate;
    overLimitDkk = Math.max(0, beforeRevolutFeeDkk - r.limit);
    revolutFeeDkk = overLimitDkk * (r.over / 100);
    finalTotalDkk = beforeRevolutFeeDkk + revolutFeeDkk;
  }

  setText("revolutCalcPlan", `Revolut ${r.plan}`);
  setText("revolutCalcSubtitle", `${formatNumber(wantedCashThb)} THB hævet i Thailand`);
  const totalEl = document.getElementById("revolutCalcTotal");
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText("revolutCalcCash", formatNumber(wantedCashThb));
  setText("revolutCalcCount", formatNumber(withdrawalCount));
  setText("revolutCalcAtm", formatNumber(atmFeeThb));

  setText("lineWanted", `${formatNumber(wantedCashThb)} THB`);
  setText("lineAtm", `${withdrawalCount} × ${formatNumber(r.atm)} = ${formatNumber(atmFeeThb)} THB`);
  setText("lineTotalThb", `${formatNumber(totalThbWithFees)} THB`);
  setText("lineRate", `${formatDecimal(r.rate)} THB/DKK`);
  setText("lineBeforeFee", `${formatNumber(beforeRevolutFeeDkk)} DKK`);
  setText("lineLimit", `${formatNumber(r.limit)} DKK`);
  setText("lineOverLimit", `${formatNumber(overLimitDkk)} DKK`);
  setText("lineRevolutFee", `${formatDecimal(r.over)}% = ${formatNumber(revolutFeeDkk)} DKK`);
  setTotalFeeLine("lineTotalFee", (atmFeeThb / r.rate) + revolutFeeDkk);
  setText("lineFinalTotal", `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById("revolutFormula");
  if (formula) {
    formula.innerHTML = `
      <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB.<br>
      <strong>2.</strong> Det kræver ${withdrawalCount} hævning${withdrawalCount === 1 ? "" : "er"} ved maks ${formatNumber(maxPerWithdrawal)} THB pr. gang.<br>
      <strong>3.</strong> ATM-gebyr: ${withdrawalCount} × ${formatNumber(r.atm)} THB = ${formatNumber(atmFeeThb)} THB.<br>
      <strong>4.</strong> Total inkl. ATM-gebyr: ${formatNumber(wantedCashThb)} + ${formatNumber(atmFeeThb)} = ${formatNumber(totalThbWithFees)} THB.<br>
      <strong>5.</strong> ${formatNumber(totalThbWithFees)} / ${formatDecimal(r.rate)} = ${formatNumber(beforeRevolutFeeDkk)} DKK.<br>
      <strong>6.</strong> Over grænsen: ${formatNumber(overLimitDkk)} DKK × ${formatDecimal(r.over)}% = ${formatNumber(revolutFeeDkk)} DKK.<br>
      <strong>9.</strong> Total: ${formatNumber(beforeRevolutFeeDkk)} + ${formatNumber(revolutFeeDkk)} = ${formatNumber(finalTotalDkk)} DKK.
    `;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setTotalFeeLine(id, valueDkk) {
  setText(id, `${formatNumber(Math.max(0, valueDkk || 0))} DKK`);
}

function spreadCostDkk(totalThb, rawRate, effectiveRate) {
  if (!totalThb || !rawRate || !effectiveRate || rawRate <= 0 || effectiveRate <= 0) return 0;
  return Math.max(0, (totalThb / effectiveRate) - (totalThb / rawRate));
}


function calculateWiseDetails() {
  const w = data.wise;
  const maxPerWithdrawal = parseNumber(document.getElementById("wiseMaxPerWithdrawal")?.value || "20000") || 20000;

  let wantedCashThb;
  let withdrawalCount;
  let atmFeeThb;
  let totalThbWithFees;
  let beforeWiseFeeDkk;
  let overLimitDkk;
  let wiseFeeDkk;
  let finalTotalDkk;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    withdrawalCount = Math.max(1, Math.ceil(wantedCashThb / maxPerWithdrawal));
    atmFeeThb = withdrawalCount * w.atm;
    totalThbWithFees = wantedCashThb + atmFeeThb;
    beforeWiseFeeDkk = totalThbWithFees / w.rate;
    overLimitDkk = Math.max(0, beforeWiseFeeDkk - w.limit);
    wiseFeeDkk = overLimitDkk * (w.over / 100);
    finalTotalDkk = beforeWiseFeeDkk + wiseFeeDkk;
  } else {
    const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    const rawCashThb = dkk * w.rate;
    withdrawalCount = Math.max(1, Math.ceil(rawCashThb / maxPerWithdrawal));
    atmFeeThb = withdrawalCount * w.atm;
    wantedCashThb = Math.max(0, rawCashThb - atmFeeThb);
    totalThbWithFees = wantedCashThb + atmFeeThb;
    beforeWiseFeeDkk = totalThbWithFees / w.rate;
    overLimitDkk = Math.max(0, beforeWiseFeeDkk - w.limit);
    wiseFeeDkk = overLimitDkk * (w.over / 100);
    finalTotalDkk = beforeWiseFeeDkk + wiseFeeDkk;
  }

  setText("wiseCalcSubtitle", `${formatNumber(wantedCashThb)} THB hævet i Thailand`);
  const totalEl = document.getElementById("wiseCalcTotal");
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText("wiseCalcCash", formatNumber(wantedCashThb));
  setText("wiseCalcCount", formatNumber(withdrawalCount));
  setText("wiseCalcAtm", formatNumber(atmFeeThb));

  setText("wiseLineWanted", `${formatNumber(wantedCashThb)} THB`);
  setText("wiseLineAtm", `${withdrawalCount} × ${formatNumber(w.atm)} = ${formatNumber(atmFeeThb)} THB`);
  setText("wiseLineTotalThb", `${formatNumber(totalThbWithFees)} THB`);
  setText("wiseLineRate", `${formatDecimal(w.rate)} THB/DKK`);
  setText("wiseLineBeforeFee", `${formatNumber(beforeWiseFeeDkk)} DKK`);
  setText("wiseLineLimit", `${formatNumber(w.limit)} DKK`);
  setText("wiseLineOverLimit", `${formatNumber(overLimitDkk)} DKK`);
  setText("wiseLineWiseFee", `${formatDecimal(w.over)}% = ${formatNumber(wiseFeeDkk)} DKK`);
  setTotalFeeLine("wiseLineTotalFee", (atmFeeThb / w.rate) + wiseFeeDkk);
  setText("wiseLineFinalTotal", `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById("wiseFormula");
  if (formula) {
    formula.innerHTML = `
      <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB.<br>
      <strong>2.</strong> Det kræver ${withdrawalCount} hævning${withdrawalCount === 1 ? "" : "er"} ved maks ${formatNumber(maxPerWithdrawal)} THB pr. gang.<br>
      <strong>3.</strong> ATM-gebyr: ${withdrawalCount} × ${formatNumber(w.atm)} THB = ${formatNumber(atmFeeThb)} THB.<br>
      <strong>4.</strong> Total inkl. ATM-gebyr: ${formatNumber(wantedCashThb)} + ${formatNumber(atmFeeThb)} = ${formatNumber(totalThbWithFees)} THB.<br>
      <strong>5.</strong> ${formatNumber(totalThbWithFees)} / ${formatDecimal(w.rate)} = ${formatNumber(beforeWiseFeeDkk)} DKK.<br>
      <strong>6.</strong> Over grænsen: ${formatNumber(overLimitDkk)} DKK × ${formatDecimal(w.over)}% = ${formatNumber(wiseFeeDkk)} DKK.<br>
      <strong>9.</strong> Total: ${formatNumber(beforeWiseFeeDkk)} + ${formatNumber(wiseFeeDkk)} = ${formatNumber(finalTotalDkk)} DKK.
    `;
  }
}


function calculateVisaDetails() {
  updateVisaRateFromSettings();
  const c = data.visa;
  const maxPerWithdrawal = parseNumber(document.getElementById("visaMaxPerWithdrawal")?.value || "2000") || 2000;

  let wantedCashThb;
  let withdrawalCount;
  let atmFeeThb;
  let totalThbWithFees;
  let beforeBankFeeDkk;
  let percentFeeDkk;
  let finalTotalDkk;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    withdrawalCount = 1;
    for (let i = 0; i < 8; i += 1) {
      atmFeeThb = withdrawalCount * c.atm;
      totalThbWithFees = wantedCashThb + atmFeeThb;
      beforeBankFeeDkk = totalThbWithFees / c.rate;
      percentFeeDkk = getCardFeeDkk(beforeBankFeeDkk, c, withdrawalCount);
      finalTotalDkk = beforeBankFeeDkk + percentFeeDkk + getVisaFixedExtraDkk(c);
      const nextCount = Math.max(1, Math.ceil(finalTotalDkk / maxPerWithdrawal));
      if (nextCount === withdrawalCount) break;
      withdrawalCount = nextCount;
    }
  } else {
    const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    withdrawalCount = Math.max(1, Math.ceil(dkk / maxPerWithdrawal));
    for (let i = 0; i < 8; i += 1) {
      atmFeeThb = withdrawalCount * c.atm;
      const atmFeeDkk = atmFeeThb / c.rate;
      beforeBankFeeDkk = getBeforeCardFeeDkkFromTotal(Math.max(0, dkk - atmFeeDkk), c, withdrawalCount);
      totalThbWithFees = beforeBankFeeDkk * c.rate;
      wantedCashThb = Math.max(0, totalThbWithFees - atmFeeThb);
      percentFeeDkk = getCardFeeDkk(beforeBankFeeDkk, c, withdrawalCount);
      finalTotalDkk = beforeBankFeeDkk + percentFeeDkk + getVisaFixedExtraDkk(c) + atmFeeDkk;
      const nextCount = Math.max(1, Math.ceil(finalTotalDkk / maxPerWithdrawal));
      if (nextCount === withdrawalCount) break;
      withdrawalCount = nextCount;
    }
  }

  setText("visaCalcCard", getVisaTypeLabel(c));
  setText("visaCalcSubtitle", `${formatNumber(wantedCashThb)} THB hævet i Thailand`);
  const totalEl = document.getElementById("visaCalcTotal");
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText("visaCalcCash", formatNumber(wantedCashThb));
  setText("visaCalcCount", formatNumber(withdrawalCount));
  setText("visaCalcAtm", formatNumber(atmFeeThb));

  setText("visaLineWanted", `${formatNumber(wantedCashThb)} THB`);
  setText("visaLineAtm", `${withdrawalCount} × ${formatNumber(c.atm)} = ${formatNumber(atmFeeThb)} THB`);
  setText("visaLineTotalThb", `${formatNumber(totalThbWithFees)} THB`);
  setText("visaLineRate", `${formatDecimal(c.rawRate || c.rate)} THB/DKK`);
  setText("visaLineMarkup", `${formatDecimal(c.spread || 0)}%`);
  setText("visaLineBeforeFee", `${formatNumber(beforeBankFeeDkk)} DKK`);
  const visaMinimumFeeDkk = getVisaMinimumFeeDkk(c);
  const visaMinimumTotalDkk = visaMinimumFeeDkk * Math.max(1, withdrawalCount || 1);
  const fixedRow = document.getElementById("visaLineFixedRow");
  if (fixedRow) fixedRow.style.display = "none";
  setText("visaLineFixed", `${formatNumber(c.fixedDkk)} DKK`);
  setText("visaLinePercent", visaMinimumFeeDkk
    ? c.percent ? `${formatDecimal(c.percent)}% / min. ${withdrawalCount} × ${formatNumber(visaMinimumFeeDkk)} = ${formatNumber(percentFeeDkk)} DKK` : `${withdrawalCount} × ${formatNumber(visaMinimumFeeDkk)} = ${formatNumber(percentFeeDkk)} DKK`
    : `${formatDecimal(c.percent)}% = ${formatNumber(percentFeeDkk)} DKK`);
  setTotalFeeLine("visaLineTotalFee", (atmFeeThb / c.rate) + spreadCostDkk(totalThbWithFees, c.rawRate || c.rate, c.rate) + percentFeeDkk + getVisaFixedExtraDkk(c));
  setText("visaLineFinalTotal", `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById("visaFormula");
  if (formula) {
    formula.innerHTML = `
      <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB.<br>
      <strong>2.</strong> Det kræver ${withdrawalCount} hævning${withdrawalCount === 1 ? "" : "er"} ved maks ${formatNumber(maxPerWithdrawal)} THB pr. gang.<br>
      <strong>3.</strong> ATM-gebyr: ${withdrawalCount} × ${formatNumber(c.atm)} THB = ${formatNumber(atmFeeThb)} THB.<br>
      <strong>4.</strong> Total inkl. ATM-gebyr: ${formatNumber(wantedCashThb)} + ${formatNumber(atmFeeThb)} = ${formatNumber(totalThbWithFees)} THB.<br>
      <strong>5.</strong> Visa-kurs: ${formatDecimal(c.rawRate || c.rate)} THB/DKK (${c.manualRate ? "manuel" : "valutaomregner"}).<br>
      <strong>6.</strong> Bankens valutakurstillæg ${formatDecimal(c.spread || 0)}% giver beregningskurs ${formatDecimal(c.rate)} THB/DKK.<br>
      <strong>7.</strong> ${formatNumber(totalThbWithFees)} / ${formatDecimal(c.rate)} = ${formatNumber(beforeBankFeeDkk)} DKK før hævegebyr.<br>
      <strong>8.</strong> Hævegebyr: ${visaMinimumFeeDkk ? c.percent ? `${formatDecimal(c.percent)}% / min. ${withdrawalCount} × ${formatNumber(visaMinimumFeeDkk)} DKK` : `${withdrawalCount} × ${formatNumber(visaMinimumFeeDkk)} DKK` : `${formatDecimal(c.percent)}%`} = ${formatNumber(percentFeeDkk)} DKK.<br>
      <strong>9.</strong> Total: ${formatNumber(beforeBankFeeDkk)} + ${formatNumber(percentFeeDkk)}${getVisaFixedExtraDkk(c) ? ` + ${formatNumber(getVisaFixedExtraDkk(c))}` : ""} = ${formatNumber(finalTotalDkk)} DKK.
    `;
  }
}


function getMastercardMinimumFeeDkk(card) {
  return card.fixedDkk || 0;
}

function getMastercardFeeDkk(beforeFeeDkk, card, withdrawalCount = 1) {
  const percentFee = beforeFeeDkk * ((card.percent || 0) / 100);
  const minimumFee = getMastercardMinimumFeeDkk(card) * Math.max(1, withdrawalCount || 1);
  return minimumFee ? Math.max(percentFee, minimumFee) : percentFee;
}

function getBeforeMastercardFeeDkkFromTotal(totalDkk, card, withdrawalCount = 1) {
  const percent = (card.percent || 0) / 100;
  const minimumFee = getMastercardMinimumFeeDkk(card) * Math.max(1, withdrawalCount || 1);
  if (minimumFee && totalDkk <= minimumFee) return 0;
  if (percent <= 0) return Math.max(0, totalDkk - minimumFee);
  const beforeByPercent = totalDkk / (1 + percent);
  return beforeByPercent * percent >= minimumFee
    ? beforeByPercent
    : Math.max(0, totalDkk - minimumFee);
}

function calculateMastercardDetails() {
  if (typeof applyMastercardModelToData === "function") applyMastercardModelToData();
  const c = data.mastercard;
  const maxPerWithdrawal = parseNumber(document.getElementById("mcMaxPerWithdrawal")?.value || "20000") || 20000;

  let wantedCashThb;
  let withdrawalCount;
  let atmFeeThb;
  let totalThbWithFees;
  let beforeBankFeeDkk;
  let percentFeeDkk;
  let finalTotalDkk;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    withdrawalCount = Math.max(1, Math.ceil(wantedCashThb / maxPerWithdrawal));
    atmFeeThb = withdrawalCount * c.atm;
    totalThbWithFees = wantedCashThb + atmFeeThb;
    beforeBankFeeDkk = totalThbWithFees / c.rate;
    percentFeeDkk = getMastercardFeeDkk(beforeBankFeeDkk, c, withdrawalCount);
    finalTotalDkk = beforeBankFeeDkk + percentFeeDkk;
  } else {
    const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    withdrawalCount = 1;
    for (let i = 0; i < 8; i += 1) {
      atmFeeThb = withdrawalCount * c.atm;
      const atmFeeDkk = atmFeeThb / c.rate;
      beforeBankFeeDkk = getBeforeMastercardFeeDkkFromTotal(Math.max(0, dkk - atmFeeDkk), c, withdrawalCount);
      totalThbWithFees = beforeBankFeeDkk * c.rate;
      wantedCashThb = Math.max(0, totalThbWithFees - atmFeeThb);
      percentFeeDkk = getMastercardFeeDkk(beforeBankFeeDkk, c, withdrawalCount);
      finalTotalDkk = beforeBankFeeDkk + percentFeeDkk + atmFeeDkk;
      const nextCount = Math.max(1, Math.ceil(wantedCashThb / maxPerWithdrawal));
      if (nextCount === withdrawalCount) break;
      withdrawalCount = nextCount;
    }
  }

  setText("mcCalcCard", c.type);
  setText("mcCalcSubtitle", `${formatNumber(wantedCashThb)} THB hævet i Thailand`);
  const totalEl = document.getElementById("mcCalcTotal");
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText("mcCalcCash", formatNumber(wantedCashThb));
  setText("mcCalcCount", formatNumber(withdrawalCount));
  setText("mcCalcAtm", formatNumber(atmFeeThb));

  setText("mcLineWanted", `${formatNumber(wantedCashThb)} THB`);
  setText("mcLineAtm", `${withdrawalCount} × ${formatNumber(c.atm)} = ${formatNumber(atmFeeThb)} THB`);
  setText("mcLineTotalThb", `${formatNumber(totalThbWithFees)} THB`);
  setText("mcLineRate", `${formatDecimal(c.rawRate || data.market?.rate || c.rate)} THB/DKK`);
  setText("mcLineSpread", `${formatDecimal(c.spread || 0)}%`);
  setText("mcLineBeforeFee", `${formatNumber(beforeBankFeeDkk)} DKK`);
  setText("mcLinePercent", `${formatDecimal(c.percent)}% / min. ${withdrawalCount} × ${formatNumber(getMastercardMinimumFeeDkk(c))} = ${formatNumber(percentFeeDkk)} DKK`);
  setTotalFeeLine("mcLineTotalFee", (atmFeeThb / c.rate) + spreadCostDkk(totalThbWithFees, c.rawRate || c.rate, c.rate) + percentFeeDkk);
  setText("mcLineFinalTotal", `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById("mcFormula");
  if (formula) {
    formula.innerHTML = `
      <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB.<br>
      <strong>2.</strong> Det kræver ${withdrawalCount} hævning${withdrawalCount === 1 ? "" : "er"} ved maks ${formatNumber(maxPerWithdrawal)} THB pr. gang.<br>
      <strong>3.</strong> ATM-gebyr: ${withdrawalCount} × ${formatNumber(c.atm)} THB = ${formatNumber(atmFeeThb)} THB.<br>
      <strong>4.</strong> Total inkl. ATM-gebyr: ${formatNumber(wantedCashThb)} + ${formatNumber(atmFeeThb)} = ${formatNumber(totalThbWithFees)} THB.<br>
      <strong>5.</strong> Mastercard grundkurs: ${formatDecimal(c.rawRate || data.market?.rate || c.rate)} THB/DKK (Nationalbanken).<br>
      <strong>6.</strong> Bankens valutakurstillæg ${formatDecimal(c.spread || 0)}% giver beregningskurs ${formatDecimal(c.rate)} THB/DKK.<br>
      <strong>7.</strong> ${formatNumber(totalThbWithFees)} / ${formatDecimal(c.rate)} = ${formatNumber(beforeBankFeeDkk)} DKK før hævegebyr.<br>
      <strong>8.</strong> Hævegebyr: ${formatDecimal(c.percent)}% / min. ${withdrawalCount} × ${formatNumber(getMastercardMinimumFeeDkk(c))} DKK = ${formatNumber(percentFeeDkk)} DKK.<br>
      <strong>9.</strong> Total: ${formatNumber(beforeBankFeeDkk)} + ${formatNumber(percentFeeDkk)} = ${formatNumber(finalTotalDkk)} DKK.
    `;
  }
}


function calculateCashDetails(method, title) {
  const cfg = data[method];
  const official = cashSupplierPrice(method);
  const rate = cashSupplierRate(method, cfg.rate || 0);
  let feesForZero = cashSupplierFees(method, 0);
  const fixed = feesForZero.fixed;
  let delivery = feesForZero.delivery;
  let other = feesForZero.other;

  let wantedCashThb;
  let beforeFeesDkk;
  let finalTotalDkk;
  let fees;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    const currentFees = cashSupplierFees(method, wantedCashThb);
    delivery = currentFees.delivery;
    other = currentFees.other;
    fees = fixed + delivery + other;
    beforeFeesDkk = official ? wantedCashThb * official.dkkPerThb : (rate > 0 ? wantedCashThb / rate : 0);
    finalTotalDkk = beforeFeesDkk + fees;
  } else {
    const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    const preliminaryFees = fixed + delivery + other;
    const preliminaryThb = Math.max(0, (dkk - preliminaryFees) * rate);
    const currentFees = cashSupplierFees(method, preliminaryThb);
    delivery = currentFees.delivery;
    other = currentFees.other;
    fees = fixed + delivery + other;
    wantedCashThb = Math.max(0, (dkk - fees) * rate);
    beforeFeesDkk = official ? wantedCashThb * official.dkkPerThb : (rate > 0 ? wantedCashThb / rate : 0);
    finalTotalDkk = beforeFeesDkk + fees;
  }

  setText(`${method}CalcSubtitle`, `${formatNumber(wantedCashThb)} THB kontant`);
  const totalEl = document.getElementById(`${method}CalcTotal`);
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText(`${method}CalcCash`, formatNumber(wantedCashThb));
  setText(`${method}CalcRate`, formatDecimal(rate));
  setText(`${method}CalcFees`, formatNumber(fees));
  setText(`${method}CalcPlace`, cfg.place || "-");

  setText(`${method}LineWanted`, `${formatNumber(wantedCashThb)} THB`);
  setText(`${method}LineRate`, `${formatDecimal(rate)} THB/DKK`);
  const marketRate = data.market?.rate || rate;
  setText(`${method}LineMargin`, `${formatDecimal(cfg.margin || 0)}% (mid-market ${formatDecimal(marketRate)} → ${formatDecimal(rate)})`);
  setText(`${method}LineBeforeFees`, `${formatNumber(beforeFeesDkk)} DKK`);
  setText(`${method}LineFixed`, `${formatNumber(fixed)} DKK`);
  if (method !== "forex") {
    setText(`${method}LineDelivery`, `${formatNumber(delivery)} DKK`);
    setText(`${method}LineOther`, `${formatNumber(other)} DKK`);
  }
  setTotalFeeLine(`${method}LineTotalFee`, fees);
  setText(`${method}LineFinalTotal`, `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById(`${method}Formula`);
  if (formula) {
    const feeText = method === "forex"
      ? `${formatNumber(fees)} DKK`
      : `${formatNumber(fixed)} + ${formatNumber(delivery)} + ${formatNumber(other)} = ${formatNumber(fees)} DKK`;
    if (lastEditedCurrency === "thb") {
      formula.innerHTML = `
        <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB på forsiden.<br>
        <strong>2.</strong> Kurs: mid-market ${formatDecimal(marketRate)} minus ${formatDecimal(cfg.margin || 0)}% margin = ${formatDecimal(rate)} THB/DKK.<br>
        <strong>3.</strong> ${formatNumber(wantedCashThb)} / ${formatDecimal(rate)} = ${formatNumber(beforeFeesDkk)} DKK før gebyrer.<br>
        <strong>4.</strong> Gebyr: ${feeText}.<br>
        <strong>5.</strong> Total pris: ${formatNumber(beforeFeesDkk)} + ${formatNumber(fees)} = ${formatNumber(finalTotalDkk)} DKK.
      `;
    } else {
      const dkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
      formula.innerHTML = `
        <strong>1.</strong> Der bruges ${formatNumber(dkk)} DKK som udgangspunkt.<br>
        <strong>2.</strong> Gebyr trækkes fra: ${feeText}.<br>
        <strong>3.</strong> Kurs: mid-market ${formatDecimal(marketRate)} minus ${formatDecimal(cfg.margin || 0)}% margin = ${formatDecimal(rate)} THB/DKK.<br>
        <strong>4.</strong> Beløb til veksling: ${formatNumber(dkk)} - ${formatNumber(fees)} = ${formatNumber(dkk - fees)} DKK.<br>
        <strong>5.</strong> ${formatNumber(dkk - fees)} × ${formatDecimal(rate)} = ${formatNumber(wantedCashThb)} THB.<br>
        <strong>6.</strong> Total pris: ${formatNumber(beforeFeesDkk)} + ${formatNumber(fees)} = ${formatNumber(finalTotalDkk)} DKK.
      `;
    }
  }
}



function calculateEurcashDetails() {
  const c = data.eurcash || {};
  const dkkPerEur = c.dkkPerEur || dkkPerEurRate();
  const eurToThb = c.eurToThb || 37.95;
  const maxDkk = parseNumber(document.getElementById("eurcashMaxDkk")?.value || c.maxDkkPerWithdrawal || "15000") || 15000;

  let wantedCashThb;
  let finalTotalDkk;
  let eurCash;

  if (lastEditedCurrency === "thb") {
    wantedCashThb = parseNumber(document.getElementById("bestThb").value);
    eurCash = eurToThb > 0 ? wantedCashThb / eurToThb : 0;
    finalTotalDkk = eurCash * dkkPerEur;
  } else {
    finalTotalDkk = amountToDkk(parseNumber(document.getElementById("dkkAmount").value));
    eurCash = dkkPerEur > 0 ? finalTotalDkk / dkkPerEur : 0;
    wantedCashThb = eurCash * eurToThb;
  }

  const withdrawalCount = Math.max(1, Math.ceil(finalTotalDkk / maxDkk));
  const effectiveRate = finalTotalDkk > 0 ? wantedCashThb / finalTotalDkk : 0;

  setText("eurcashCalcSubtitle", `${formatNumber(wantedCashThb)} THB via EUR kontanter`);
  const totalEl = document.getElementById("eurcashCalcTotal");
  if (totalEl) totalEl.innerHTML = `${formatNumber(dkkToHome(finalTotalDkk))} ${homeCurrencyLabel()}<span>Total pris</span>`;

  setText("eurcashCalcCash", formatNumber(wantedCashThb));
  setText("eurcashCalcCount", formatNumber(withdrawalCount));
  setText("eurcashCalcEur", `${formatCurrencyInput(eurCash)} EUR`);
  setText("eurcashCalcRate", `${formatDecimal(effectiveRate)} THB/DKK`);

  setText("eurcashLineWanted", `${formatNumber(wantedCashThb)} THB`);
  setText("eurcashLineDkkEur", `${formatDecimal(dkkPerEur)} DKK/EUR`);
  setText("eurcashLineEur", `${formatCurrencyInput(eurCash)} EUR`);
  setText("eurcashLineEurThb", `${formatDecimal(eurToThb)} THB/EUR`);
  setText("eurcashLineReceived", `${formatNumber(wantedCashThb)} THB`);
  setText("eurcashLineWithdrawals", `${withdrawalCount} × maks ${formatNumber(maxDkk)} DKK`);
  setText("eurcashLineFinalTotal", `${formatNumber(finalTotalDkk)} DKK`);

  const formula = document.getElementById("eurcashFormula");
  if (formula) {
    if (lastEditedCurrency === "thb") {
      formula.innerHTML = `
        <strong>1.</strong> Du har valgt ${formatNumber(wantedCashThb)} THB på forsiden.<br>
        <strong>2.</strong> EUR kontanter: ${formatNumber(wantedCashThb)} / ${formatDecimal(eurToThb)} = ${formatCurrencyInput(eurCash)} EUR.<br>
        <strong>3.</strong> DKK/EUR kurs: ${formatDecimal(dkkPerEur)} DKK/EUR.<br>
        <strong>4.</strong> Total pris: ${formatCurrencyInput(eurCash)} × ${formatDecimal(dkkPerEur)} = ${formatNumber(finalTotalDkk)} DKK.<br>
        <strong>5.</strong> Antal hævninger: ${formatNumber(finalTotalDkk)} / ${formatNumber(maxDkk)} = ${withdrawalCount}.
      `;
    } else {
      formula.innerHTML = `
        <strong>1.</strong> Der bruges ${formatNumber(finalTotalDkk)} DKK som udgangspunkt.<br>
        <strong>2.</strong> EUR kontanter: ${formatNumber(finalTotalDkk)} / ${formatDecimal(dkkPerEur)} = ${formatCurrencyInput(eurCash)} EUR.<br>
        <strong>3.</strong> EUR→THB kurs: ${formatDecimal(eurToThb)} THB/EUR.<br>
        <strong>4.</strong> THB modtaget: ${formatCurrencyInput(eurCash)} × ${formatDecimal(eurToThb)} = ${formatNumber(wantedCashThb)} THB.<br>
        <strong>5.</strong> Antal hævninger: ${formatNumber(finalTotalDkk)} / ${formatNumber(maxDkk)} = ${withdrawalCount}.
      `;
    }
  }
}

function calculateLoomisDetails() {
  calculateCashDetails("loomis", "Loomis");
}

function calculateForexDetails() {
  calculateCashDetails("forex", "FOREX");
}

function calculateTavexDetails() {
  calculateCashDetails("tavex", "Tavex");
}




function methodTitle(method) {
  const daTitles = {
    revolut: "Revolut-indstillinger",
    wise: "Wise-indstillinger",
    visa: "Visa-indstillinger",
    mastercard: "Mastercard-indstillinger",
    loomis: "Loomis-indstillinger",
    forex: "FOREX-indstillinger",
    tavex: "Tavex-indstillinger",
    eurcash: "EUR kontanter-indstillinger"
  };
  const enTitles = {
    revolut: "Revolut settings",
    wise: "Wise settings",
    visa: "Visa settings",
    mastercard: "Mastercard settings",
    loomis: "Loomis settings",
    forex: "FOREX settings",
    tavex: "Tavex settings",
    eurcash: "EUR cash settings"
  };
  const titles = currentLanguage() === "en" ? enTitles : daTitles;
  return titles[method] || (currentLanguage() === "en" ? "Settings" : "Indstillinger");
}

