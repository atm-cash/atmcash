// ATM Cash v4.8 - user interface, filters, accordions and startup
function setupEmbeddedSettings() {
  const methods = ["revolut", "wise", "visa", "mastercard", "loomis", "forex", "tavex", "eurcash"];

  methods.forEach((method) => {
    const calcPage = document.getElementById(`${method}CalcPage`);
    const settingsPage = document.getElementById(`${method}Page`);
    const summary = calcPage?.querySelector(".calc-summary");
    if (!calcPage || !settingsPage || !summary || calcPage.querySelector(".embedded-settings")) return;

    const settingsCard = document.createElement("section");
    settingsCard.className = "card embedded-settings accordion-card collapsed";
    settingsCard.innerHTML = `
      <button class="accordion-header" type="button">
        <span>${methodTitle(method)}</span><span class="accordion-arrow">⌄</span>
      </button>
      <div class="accordion-body"></div>
    `;

    const body = settingsCard.querySelector(".accordion-body");
    Array.from(settingsPage.children).forEach((child) => {
      if (child.classList.contains("topbar")) return;
      if (child.matches?.("button[data-save]")) return;
      body.appendChild(child);
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.dataset.save = method;
    saveBtn.textContent = `Gem ${methodTitle(method)}`;
    body.appendChild(saveBtn);

    const calcScroll = calcPage.querySelector(".calc-scroll");
    if (calcScroll) {
      calcScroll.insertAdjacentElement("afterbegin", settingsCard);
    } else {
      summary.insertAdjacentElement("afterend", settingsCard);
    }

    const settingsHeader = settingsCard.querySelector(".accordion-header");
    settingsHeader.addEventListener("click", () => {
      settingsCard.classList.toggle("collapsed");
    });
  });
}

function setupCalcAccordions() {
  document.querySelectorAll(".calc-scroll > .card").forEach((card) => {
    if (card.classList.contains("accordion-ready")) return;
    const label = card.querySelector(":scope > .section-label");
    if (!label) return;

    const title = label.textContent.trim();
    const body = document.createElement("div");
    body.className = "accordion-body";

    Array.from(card.childNodes).forEach((node) => {
      if (node !== label) body.appendChild(node);
    });

    const header = document.createElement("button");
    header.className = "accordion-header";
    header.type = "button";
    header.innerHTML = `<span>${title}</span><span class="accordion-arrow">⌄</span>`;

    label.remove();
    card.prepend(header);
    card.appendChild(body);
    card.classList.add("accordion-card", "accordion-ready");

    if (title.toLowerCase().includes("udregning")) {
      card.classList.remove("collapsed");
    } else {
      card.classList.add("collapsed");
    }

    header.addEventListener("click", () => {
      card.classList.toggle("collapsed");
    });
  });
}

function currentCalcPageName() {
  const active = document.querySelector(".page.active");
  if (!active || !active.id.endsWith("CalcPage")) return "";
  return active.id.replace("Page", "");
}

function syncFilters() {
  const map = {
    filterRevolut: "revolut",
    filterWise: "wise",
    filterVisa: "visa",
    filterMastercard: "mastercard",
    filterLoomis: "loomis",
    filterForex: "forex",
    filterTavex: "tavex",
    filterEurcash: "eurcash"
  };

  Object.entries(map).forEach(([id, method]) => {
    const el = document.getElementById(id);
    if (el) el.checked = data.visibleMethods.includes(method);
  });
}

function saveFilters() {
  const selected = [];
  document.querySelectorAll("#filterPage input[type='checkbox']").forEach((box) => {
    if (box.checked) selected.push(box.value);
  });

  data.visibleMethods = selected.length ? selected : [...allMethods];
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

async function init() {
  await loadConfig();
  ensureVisibleMethods();
  applyMarketRates();
  setupEmbeddedSettings();
  setupCalcAccordions();
  syncInputs();
  syncHomeCurrencyUi();
  syncFilters();
  updateRateStatus();
  calculate();
  setupConverter();
  updateMarketRateIfNeeded();
  setInterval(updateMarketRateIfNeeded, RATE_UPDATE_INTERVAL_MS);

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => goNav(btn.dataset.nav));
  });

  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", () => {
      syncFilters();
      showPage("filter");
    });
  }

  const saveFiltersBtn = document.getElementById("saveFiltersBtn");
  if (saveFiltersBtn) {
    saveFiltersBtn.addEventListener("click", saveFilters);
  }

  const saveFiltersTop = document.getElementById("saveFiltersTop");
  if (saveFiltersTop) {
    saveFiltersTop.addEventListener("click", saveFilters);
  }

  const editRevolutSettingsBtn = document.getElementById("editRevolutSettingsBtn");
  if (editRevolutSettingsBtn) {
    editRevolutSettingsBtn.addEventListener("click", () => showPage("revolut"));
  }

  const openRevolutSettings = document.getElementById("openRevolutSettings");
  if (openRevolutSettings) {
    openRevolutSettings.addEventListener("click", () => showPage("revolut"));
  }

  const revolutMaxPerWithdrawal = document.getElementById("revolutMaxPerWithdrawal");
  if (revolutMaxPerWithdrawal) {
    revolutMaxPerWithdrawal.addEventListener("input", calculateRevolutDetails);
  }

  const editWiseSettingsBtn = document.getElementById("editWiseSettingsBtn");
  if (editWiseSettingsBtn) {
    editWiseSettingsBtn.addEventListener("click", () => showPage("wise"));
  }

  const openWiseSettings = document.getElementById("openWiseSettings");
  if (openWiseSettings) {
    openWiseSettings.addEventListener("click", () => showPage("wise"));
  }

  const wiseMaxPerWithdrawal = document.getElementById("wiseMaxPerWithdrawal");
  if (wiseMaxPerWithdrawal) {
    wiseMaxPerWithdrawal.addEventListener("input", calculateWiseDetails);
  }

  const editVisaSettingsBtn = document.getElementById("editVisaSettingsBtn");
  if (editVisaSettingsBtn) {
    editVisaSettingsBtn.addEventListener("click", () => showPage("visa"));
  }

  const openVisaSettings = document.getElementById("openVisaSettings");
  if (openVisaSettings) {
    openVisaSettings.addEventListener("click", () => showPage("visa"));
  }

  const visaMaxPerWithdrawal = document.getElementById("visaMaxPerWithdrawal");
  if (visaMaxPerWithdrawal) {
    visaMaxPerWithdrawal.addEventListener("input", calculateVisaDetails);
  }

  const editMastercardSettingsBtn = document.getElementById("editMastercardSettingsBtn");
  if (editMastercardSettingsBtn) {
    editMastercardSettingsBtn.addEventListener("click", () => showPage("mastercard"));
  }

  const openMastercardSettings = document.getElementById("openMastercardSettings");
  if (openMastercardSettings) {
    openMastercardSettings.addEventListener("click", () => showPage("mastercard"));
  }

  const mcMaxPerWithdrawal = document.getElementById("mcMaxPerWithdrawal");
  if (mcMaxPerWithdrawal) {
    mcMaxPerWithdrawal.addEventListener("input", calculateMastercardDetails);
  }

  const editLoomisSettingsBtn = document.getElementById("editLoomisSettingsBtn");
  if (editLoomisSettingsBtn) {
    editLoomisSettingsBtn.addEventListener("click", () => showPage("loomis"));
  }

  const openLoomisSettings = document.getElementById("openLoomisSettings");
  if (openLoomisSettings) {
    openLoomisSettings.addEventListener("click", () => showPage("loomis"));
  }

  const editFOREXSettingsBtn = document.getElementById("editFOREXSettingsBtn");
  if (editFOREXSettingsBtn) {
    editFOREXSettingsBtn.addEventListener("click", () => showPage("forex"));
  }

  const openFOREXSettings = document.getElementById("openFOREXSettings");
  if (openFOREXSettings) {
    openFOREXSettings.addEventListener("click", () => showPage("forex"));
  }

  const editTavexSettingsBtn = document.getElementById("editTavexSettingsBtn");
  if (editTavexSettingsBtn) {
    editTavexSettingsBtn.addEventListener("click", () => showPage("tavex"));
  }

  const openTavexSettings = document.getElementById("openTavexSettings");
  if (openTavexSettings) {
    openTavexSettings.addEventListener("click", () => showPage("tavex"));
  }


  const editEurcashSettingsBtn = document.getElementById("editEurcashSettingsBtn");
  if (editEurcashSettingsBtn) {
    editEurcashSettingsBtn.addEventListener("click", () => showPage("eurcash"));
  }

  const openEurcashSettings = document.getElementById("openEurcashSettings");
  if (openEurcashSettings) {
    openEurcashSettings.addEventListener("click", () => showPage("eurcash"));
  }

  ["eurcashDkkPerEur", "eurcashEurToThb", "eurcashMaxDkk"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calculateEurcashDetails);
  });

  document.querySelectorAll(".language-toggle[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  const homeCurrency = document.getElementById("homeCurrency");
  if (homeCurrency) {
    homeCurrency.value = getHomeCurrency();
    homeCurrency.addEventListener("change", () => {
      data.homeCurrency = homeCurrency.value;
      syncHomeCurrencyUi();
      persist();
      calculate();
    });
  }

  const dkkAmount = document.getElementById("dkkAmount");
  if (dkkAmount) {
    dkkAmount.addEventListener("input", () => {
      lastEditedCurrency = "dkk";
      calculate();
    });
  }

  const bestThb = document.getElementById("bestThb");
  if (bestThb) {
    bestThb.addEventListener("input", () => {
      lastEditedCurrency = "thb";
      calculate();
    });
  }

  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPage("home"));
  });

  const visaBank = document.getElementById("visaBank");
  const visaType = document.getElementById("visaType");
  [visaBank, visaType].forEach((el) => {
    if (el) el.addEventListener("change", applyVisaNordeaPresetToInputs);
  });

  const loomisPlace = document.getElementById("loomisPlace");
  if (loomisPlace) {
    loomisPlace.addEventListener("change", () => {
      const fee = document.getElementById("loomisFixed");
      if (!fee) return;
      const value = loomisPlace.value.toLowerCase();
      fee.value = value.includes("butik") || value.includes("afhentning") ? "0" : "49";
    });
  }

  const tavexPlace = document.getElementById("tavexPlace");
  if (tavexPlace) {
    tavexPlace.addEventListener("change", () => {
      const fee = document.getElementById("tavexDelivery");
      if (!fee) return;
      const value = tavexPlace.value.toLowerCase();
      fee.value = value.includes("butik") || value.includes("afhentning") ? "0" : "99";
    });
  }

  document.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", () => saveMethod(btn.dataset.save));
  });

  document.querySelectorAll(".plan[data-plan]").forEach((plan) => {
    plan.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      data.revolut.plan = plan.dataset.plan;
      data.revolut.limit = Number(plan.dataset.limit);
      document.querySelectorAll(".plan[data-plan]").forEach((p) => p.classList.remove("active"));
      plan.classList.add("active");
      persist();
      calculate();
      if (currentCalcPageName() === "revolutCalc") calculateRevolutDetails();
    });
  });
  translatePage();
}

document.addEventListener("DOMContentLoaded", init);
