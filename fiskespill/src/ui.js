(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  function byId(id) {
    return document.getElementById(id);
  }

  App.initializeUI = function initializeUI(game) {
    const refs = {
      moneyValue: byId("moneyValue"),
      caughtValue: byId("caughtValue"),
      rodValue: byId("rodValue"),
      baitValue: byId("baitValue"),
      demandValue: byId("demandValue"),
      phaseOverlay: byId("phaseOverlay"),
      welcomeScreen: byId("welcomeScreen"),
      mapSelectScreen: byId("mapSelectScreen"),
      summaryScreen: byId("summaryScreen"),
      startGameButton: byId("startGameButton"),
      nextDayButton: byId("nextDayButton"),
      mapSelectPanel: byId("mapSelectPanel"),
      summarySpeech: byId("summarySpeech"),
      summaryRevenue: byId("summaryRevenue"),
      summaryCaught: byId("summaryCaught"),
      summaryXp: byId("summaryXp"),
      summaryWish: byId("summaryWish"),
      summaryLines: byId("summaryLines"),
      panelDrawer: byId("panelDrawer"),
      panelTitle: byId("panelTitle"),
      panelMeta: byId("panelMeta"),
      mapPanel: byId("mapPanel"),
      shopPanel: byId("shopPanel"),
      skillsPanel: byId("skillsPanel"),
      journalPanel: byId("journalPanel"),
      menuPanel: byId("menuPanel"),
      catchLog: byId("catchLog"),
      logDock: byId("logDock"),
      toggleLogButton: byId("toggleLogButton"),
      endDayButton: byId("endDayButton"),
      fishingHud: byId("fishingHud"),
      fishingStatus: byId("fishingStatus"),
      fishingHint: byId("fishingHint"),
      actionMeterWrap: byId("actionMeterWrap"),
      actionMeterLabel: byId("actionMeterLabel"),
      actionMeterValue: byId("actionMeterValue"),
      actionMeterFill: byId("actionMeterFill"),
      minigameTrack: byId("minigameTrack"),
      targetZone: byId("targetZone"),
      marker: byId("marker"),
      touchControls: byId("touchControls"),
      touchInteractButton: byId("touchInteractButton"),
      virtualJoystick: byId("virtualJoystick"),
      joystickBase: byId("joystickBase"),
      joystickKnob: byId("joystickKnob"),
      navButtons: Array.from(document.querySelectorAll(".nav-button[data-panel]")),
      panelBodies: Array.from(document.querySelectorAll(".panel-body")),
    };

    game.refs = refs;

    refs.startGameButton.addEventListener("click", () => game.actions.beginCareer());
    refs.nextDayButton.addEventListener("click", () => game.actions.nextDay());
    refs.endDayButton.addEventListener("click", () => game.actions.endDay());
    refs.toggleLogButton.addEventListener("click", () => game.actions.toggleLog());
    refs.navButtons.forEach((button) => {
      button.addEventListener("click", () => game.actions.togglePanel(button.dataset.panel));
    });

    refs.mapPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='map']");
      if (button) {
        game.actions.changeMap(button.dataset.mapId);
      }
    });
    refs.mapSelectPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='map']");
      if (button) {
        game.actions.changeMap(button.dataset.mapId);
      }
    });
    refs.shopPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "buy") {
        game.actions.purchase(button.dataset.upgradeType);
      }
      if (button.dataset.action === "bait") {
        game.actions.chooseBait(button.dataset.baitId);
      }
    });
    refs.skillsPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='skill']");
      if (button) {
        game.actions.spendSkill(button.dataset.skillId);
      }
    });
    refs.menuPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }
      if (button.dataset.action === "save") {
        game.actions.save(false);
      }
      if (button.dataset.action === "load") {
        game.actions.load();
      }
      if (button.dataset.action === "reset") {
        const accepted = window.confirm("Nullstille lagringen og starte helt på nytt?");
        if (accepted) {
          game.actions.reset();
        }
      }
    });
  };

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function getPanelConfig(panelId) {
    const configs = {
      maps: { title: "Kart", meta: "Bytt område hvis du vil prøve lykken et annet sted." },
      shop: { title: "Utstyr", meta: "Bedre verktøy, bedre historier og færre unnskyldninger." },
      skills: { title: "Ferdigheter", meta: "Bruk erfaringspoeng på fordeler som faktisk merkes." },
      journal: { title: "Dagbok", meta: "Her bor rekordene og alle fiskene du skrøt av." },
      menu: { title: "Meny", meta: "Oppdrag, lagring og en liten huskelapp." },
    };
    return configs[panelId] || { title: "Panel", meta: "" };
  }

  function renderMapCards(game, actionText) {
    return App.MAPS.map((map) => {
      const unlocked = game.state.unlockedMapIds.includes(map.id);
      const current = game.state.currentMapId === map.id && game.state.phase === "day";
      const fishNames = map.fishPool
        .slice(0, 4)
        .map((entry) => App.getFishById(entry.fishId).name)
        .join(", ");
      return `
        <article class="map-card">
          <div class="card-head">
            <h3>${map.name}</h3>
            <span class="tag">${map.waterType}</span>
          </div>
          <p class="map-meta">${map.bonusText}</p>
          <p class="map-meta">Typiske arter: ${fishNames}</p>
          <p class="map-meta">Størrelse: ${map.size.width} × ${map.size.height}</p>
          <p class="map-meta">Krav: ${App.getRequirementText(map.unlockRequirement)}</p>
          <button
            class="map-button ${current ? "active" : ""}"
            type="button"
            data-action="map"
            data-map-id="${map.id}"
            ${unlocked ? "" : "disabled"}
          >
            ${current ? "Du fisker her" : unlocked ? actionText : "Låst"}
          </button>
        </article>
      `;
    }).join("");
  }

  function getUpgradeDetails(type, item) {
    if (!item) {
      return [];
    }
    if (type === "rod") {
      return [
        `Kastelengde: ca. ${92 + item.level * 22} grunnpoeng før du lader opp ekstra.`,
        `Sjansen for finere fisk øker med ${formatPercent(item.rareBonus)}.`,
        `Innsveivingen blir ${formatPercent(item.easeBonus)} snillere.`,
        item.note,
      ];
    }
    if (type === "reel") {
      return [
        `Gir ${formatPercent(item.controlBonus)} ekstra kontroll i innsveivingen.`,
        item.note,
      ];
    }
    if (type === "line") {
      return [
        `Hjelper mot tyngre og staere fisk med ${formatPercent(item.heavyBonus)} ekstra dragkraft.`,
        item.note,
      ];
    }
    if (type === "boat") {
      return [
        `Sjansen for sjeldne arter øker med ${formatPercent(item.rareBonus)}.`,
        `Fartsbonus: ${item.speedBonus}.`,
        item.cargoBonus ? `Plass til ${item.cargoBonus} ekstra historier om storfangst.` : "Ingen ekstra sjøbein ennå.",
        item.note,
      ];
    }
    if (type === "restaurant") {
      return [
        `Kveldsprisen på fisk ganges med ${item.saleMultiplier.toFixed(2)}.`,
        item.note,
      ];
    }
    return [];
  }

  function renderUpgradeCard(title, current, next, type) {
    const currentLines = getUpgradeDetails(type, current)
      .map((line) => `<li>${line}</li>`)
      .join("");
    const nextLines = next
      ? getUpgradeDetails(type, next).map((line) => `<li>${line}</li>`).join("")
      : `<li>Dette er toppnivå. Nå er det bare å se profesjonell ut.</li>`;
    return `
      <article class="shop-card">
        <div class="card-head">
          <h3>${title}</h3>
          <span class="quality-pill">${current.name}</span>
        </div>
        <p class="shop-meta">Nåværende nivå: ${current.note}</p>
        <ul class="detail-list">${currentLines}</ul>
        <p class="shop-meta">${next ? `Neste oppgradering koster ${next.cost} kr.` : "Maksnivå nådd."}</p>
        <ul class="detail-list">${nextLines}</ul>
        <button
          class="shop-button"
          type="button"
          data-action="buy"
          data-upgrade-type="${type}"
          ${next ? "" : "disabled"}
        >
          ${next ? `Kjøp ${next.name}` : "Ferdig oppgradert"}
        </button>
      </article>
    `;
  }

  function renderBaitCards(game) {
    return Object.values(App.BAITS)
      .map((bait) => {
        const owned = !!game.state.ownedBaits[bait.id];
        const active = game.state.activeBaitId === bait.id;
        const fishNames = bait.bonusSpecies
          .slice(0, 5)
          .map((fishId) => App.getFishById(fishId).name)
          .join(", ");
        return `
          <article class="shop-card">
            <div class="card-head">
              <h3>${bait.name}</h3>
              <span class="tag">${owned ? "Eid" : `${bait.cost} kr`}</span>
            </div>
            <p class="shop-meta">${bait.description}</p>
            <ul class="detail-list">
              <li>Bonus på arter som ${fishNames}.</li>
              <li>Best når du vil overtale fisken til å gjøre noe dumt.</li>
            </ul>
            <button
              class="bait-button"
              type="button"
              data-action="bait"
              data-bait-id="${bait.id}"
            >
              ${active ? "Valgt agn" : owned ? "Bytt til dette" : `Kjøp ${bait.name}`}
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderShop(game) {
    const state = game.state;
    const rodCurrent = App.getRodData(state.equipment.rodLevel);
    const rodNext = App.getRodData(state.equipment.rodLevel + 1);
    const reelCurrent = App.getReelData(state.equipment.reelLevel);
    const reelNext = App.getReelData(state.equipment.reelLevel + 1);
    const lineCurrent = App.getLineData(state.equipment.lineLevel);
    const lineNext = App.getLineData(state.equipment.lineLevel + 1);
    const boatCurrent = App.getBoatData(state.equipment.boatLevel);
    const boatNext = App.getBoatData(state.equipment.boatLevel + 1);
    const restaurantCurrent = App.getRestaurantData(state.equipment.restaurantLevel);
    const restaurantNext = App.getRestaurantData(state.equipment.restaurantLevel + 1);

    return `
      ${renderUpgradeCard("Fiskestang", rodCurrent, rodNext, "rod")}
      ${renderUpgradeCard("Snelle", reelCurrent, reelNext, "reel")}
      ${renderUpgradeCard("Snøre", lineCurrent, lineNext, "line")}
      ${renderUpgradeCard("Båt", boatCurrent, boatNext, "boat")}
      ${renderUpgradeCard("Restaurant", restaurantCurrent, restaurantNext, "restaurant")}
      ${renderBaitCards(game)}
    `;
  }

  function renderSkills(game) {
    const skillPoints = game.state.skillPoints;
    const levelProgress = App.getLevelProgress(game.state);
    const skillCards = Object.values(App.SKILLS)
      .map((skill) => {
        const level = App.getSkillLevel(game.state, skill.id);
        const dots = new Array(skill.maxLevel)
          .fill(0)
          .map((_, index) => `<span class="skill-dot ${index < level ? "filled" : ""}"></span>`)
          .join("");
        return `
          <article class="skill-card">
            <div class="skill-row">
              <strong>${skill.name}</strong>
              <span class="tag">Nivå ${level}/${skill.maxLevel}</span>
            </div>
            <p class="skill-meta">${skill.description}</p>
            <div class="skill-levels">${dots}</div>
            <button
              class="skill-button"
              type="button"
              data-action="skill"
              data-skill-id="${skill.id}"
              ${skillPoints > 0 && level < skill.maxLevel ? "" : "disabled"}
            >
              ${skillPoints > 0 && level < skill.maxLevel ? "Bruk ferdighetspoeng" : "Ingen poeng eller maks nivå"}
            </button>
          </article>
        `;
      })
      .join("");

    return `
      <article class="skill-card">
        <div class="xp-block">
          <div class="xp-head">
            <span>Nivå ${game.state.level}</span>
            <span>${game.state.skillPoints} ferdighetspoeng</span>
          </div>
          <div class="xp-bar"><div id="xpBarFill"></div></div>
          <div class="xp-head">
            <span>${Math.round(levelProgress.current)} / ${Math.round(levelProgress.needed)} XP</span>
            <span>${game.state.dayStats.xpGained} XP i dag</span>
          </div>
        </div>
      </article>
      ${skillCards}
    `;
  }

  function renderJournal(game) {
    return Object.values(App.FISH)
      .map((fish) => {
        const entry = game.state.journal[fish.id];
        if (!entry) {
          return `
            <article class="journal-card">
              <div class="card-head">
                <h3>???</h3>
                <span class="tag">Uoppdaget</span>
              </div>
              <p class="journal-meta">Utforsk flere kart, kast lenger og prøv nytt agn.</p>
            </article>
          `;
        }
        return `
          <article class="journal-card">
            <div class="card-head">
              <h3>${fish.name}</h3>
              <span class="quality-pill">${entry.bestQualityLabel}</span>
            </div>
            <p class="journal-meta">${fish.description}</p>
            <p class="journal-meta">Antall fanget: ${entry.count}</p>
            <p class="journal-meta">Beste vekt: ${entry.bestWeight.toFixed(1)} kg</p>
            <p class="journal-meta">Vann: ${fish.waterType}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderQuests(game) {
    const activeQuests = game.state.questState.activeQuestIds
      .map((questId) => App.QUESTS.find((entry) => entry.id === questId))
      .filter(Boolean);
    if (!activeQuests.length) {
      return `<article class="quest-card"><p class="journal-meta">Ingen aktive oppdrag akkurat nå.</p></article>`;
    }

    return activeQuests
      .map((quest) => {
        const value = App.getQuestProgressValue(game.state, quest);
        const ratio = Math.max(0, Math.min(1, value / quest.target));
        return `
          <article class="quest-card">
            <div class="card-head">
              <strong>${quest.title}</strong>
              <span class="tag">${quest.rewardMoney} kr</span>
            </div>
            <p class="journal-meta">${quest.description}</p>
            <p class="journal-meta">${App.getQuestProgressText(game.state, quest)}</p>
            <div class="quest-progress"><div style="width:${ratio * 100}%"></div></div>
          </article>
        `;
      })
      .join("");
  }

  function renderMenu(game) {
    return `
      <article class="menu-card">
        <div class="card-head">
          <h3>Dagens fokus</h3>
          <span class="tag">${game.state.dailyDemand ? App.getFishById(game.state.dailyDemand.fishId).name : "Fangst"}</span>
        </div>
        <p class="journal-meta">${game.state.dailyDemand ? game.state.dailyDemand.text : "Finn noe som får tavernen til å summe i kveld."}</p>
      </article>
      <article class="menu-card">
        <div class="card-head">
          <h3>Oppdrag</h3>
          <span class="small-note">aktive mål</span>
        </div>
        ${renderQuests(game)}
      </article>
      <article class="menu-card">
        <div class="card-head">
          <h3>Lagring og hjelp</h3>
          <span class="small-note">lokalt i nettleseren</span>
        </div>
        <div class="save-row">
          <button class="secondary-button" type="button" data-action="save">Lagre</button>
          <button class="secondary-button" type="button" data-action="load">Last inn</button>
          <button class="danger-button" type="button" data-action="reset">Nullstill</button>
        </div>
        <div class="help-list">
          <p><strong>Kast:</strong> hold inne og slipp for lengre kast.</p>
          <p><strong>Napp:</strong> vent på utropstegn og trykk raskt.</p>
          <p><strong>Innsveiving:</strong> hold inne for høyre, slipp for venstre.</p>
          <p><strong>Mål:</strong> fyll kassa, gled kona og bygg bedre utstyr.</p>
        </div>
      </article>
    `;
  }

  function renderLogs(game) {
    return game.state.catchLog
      .slice(0, game.state.ui.logCollapsed ? 0 : 3)
      .map((line) => `<div class="log-entry">${line}</div>`)
      .join("");
  }

  App.renderUI = function renderUI(game) {
    const state = game.state;
    const refs = game.refs;
    const currentMap = App.getMapById(state.currentMapId);
    const activeBait = App.getActiveBait(state);
    const demandFish = state.dailyDemand ? App.getFishById(state.dailyDemand.fishId) : null;
    const activePanel = state.ui.activePanel;
    const fishing = state.fishing;
    const phase = state.phase;

    refs.moneyValue.textContent = App.utils.formatKr(state.money);
    refs.caughtValue.textContent = String(state.dayStats.caughtCount);
    refs.rodValue.textContent = App.getRodData(state.equipment.rodLevel).name;
    refs.baitValue.textContent = activeBait.name;
    refs.demandValue.textContent = demandFish ? demandFish.name : "Ingen";

    refs.mapPanel.innerHTML = phase === "day" ? renderMapCards(game, "Reis hit") : "";
    refs.shopPanel.innerHTML = renderShop(game);
    refs.skillsPanel.innerHTML = renderSkills(game);
    refs.journalPanel.innerHTML = renderJournal(game);
    refs.menuPanel.innerHTML = renderMenu(game);
    refs.mapSelectPanel.innerHTML = renderMapCards(game, "Fisk her i dag");
    refs.catchLog.innerHTML = renderLogs(game);

    const levelProgress = App.getLevelProgress(state);
    const xpFill = refs.skillsPanel.querySelector("#xpBarFill");
    if (xpFill) {
      xpFill.style.width = `${levelProgress.ratio * 100}%`;
    }

    refs.logDock.classList.toggle("collapsed", !!state.ui.logCollapsed);
    refs.toggleLogButton.textContent = state.ui.logCollapsed ? "+" : "−";

    const showOverlay = phase !== "day";
    refs.phaseOverlay.classList.toggle("hidden", !showOverlay);
    refs.welcomeScreen.classList.toggle("hidden", phase !== "welcome");
    refs.mapSelectScreen.classList.toggle("hidden", phase !== "mapSelect");
    refs.summaryScreen.classList.toggle("hidden", phase !== "summary");

    const summary = state.lastDaySummary;
    refs.summarySpeech.textContent = summary ? summary.spouseLine : "";
    refs.summaryRevenue.textContent = summary ? App.utils.formatKr(summary.revenue) : "0 kr";
    refs.summaryCaught.textContent = summary ? String(summary.caughtCount) : "0";
    refs.summaryXp.textContent = summary ? `${summary.xpGained} XP` : "0 XP";
    refs.summaryWish.textContent = summary ? String(summary.bonusCount) : "0";
    refs.summaryLines.innerHTML = summary
      ? [
          `<p><strong>Sted:</strong> ${summary.mapName}</p>`,
          `<p><strong>Ønskefisk:</strong> ${summary.demandFishName}</p>`,
          `<p><strong>Solgt:</strong> ${summary.soldCount} fisk</p>`,
        ]
          .concat(summary.lines.map((line) => `<p>${line}</p>`))
          .join("")
      : "";

    refs.panelDrawer.classList.toggle("active", phase === "day" && !!activePanel);
    const panelConfig = getPanelConfig(activePanel);
    refs.panelTitle.textContent = panelConfig.title;
    refs.panelMeta.textContent = panelConfig.meta;
    refs.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.panel === activePanel);
    });
    refs.panelBodies.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `panel-${activePanel}`);
    });

    refs.endDayButton.disabled = phase !== "day";
    refs.touchControls.classList.toggle("hidden", phase !== "day");
    refs.logDock.classList.toggle("hidden", phase !== "day");

    refs.fishingHud.classList.toggle("hidden", phase !== "day" || fishing.mode === "idle");
    refs.minigameTrack.classList.toggle("hidden", fishing.mode !== "reeling");

    const showMeter = ["charging", "casting", "reeling"].includes(fishing.mode);
    refs.actionMeterWrap.classList.toggle("hidden", !showMeter);
    refs.fishingStatus.textContent = fishing.message || "";
    refs.fishingHint.textContent = fishing.hint || "";

    let meterLabel = "Kastestyrke";
    let meterValue = 0;
    if (fishing.mode === "charging") {
      meterLabel = "Kastestyrke";
      meterValue = fishing.castPower;
    } else if (fishing.mode === "casting") {
      meterLabel = "Kast";
      meterValue = 1;
    } else if (fishing.mode === "reeling") {
      meterLabel = "Fangst";
      meterValue = fishing.progress;
    }

    refs.actionMeterLabel.textContent = meterLabel;
    refs.actionMeterValue.textContent = `${Math.round(meterValue * 100)}%`;
    refs.actionMeterFill.style.width = `${meterValue * 100}%`;
    refs.targetZone.style.left = `${(fishing.targetCenter - fishing.targetWidth / 2) * 100}%`;
    refs.targetZone.style.width = `${fishing.targetWidth * 100}%`;
    refs.marker.style.left = `calc(${fishing.marker * 100}% - 5px)`;

    refs.touchInteractButton.textContent =
      fishing.mode === "bite" ? "Napp!" : fishing.mode === "reeling" ? "Sveiv" : "Kast";
  };
})();
