(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  function byId(id) {
    return document.getElementById(id);
  }
  const renderedHtml = new WeakMap();
  function setHtml(element, html) {
    if (renderedHtml.get(element) !== html) {
      element.innerHTML = html;
      renderedHtml.set(element, html);
    }
  }

  App.initializeUI = function initializeUI(game) {
    const refs = {
      moneyValue: byId("moneyValue"),
      caughtValue: byId("caughtValue"),
      catchOverlay: byId("catchOverlay"),
      catchTitle: byId("catchTitle"),
      catchDetails: byId("catchDetails"),
      catchBagStatus: byId("catchBagStatus"),
      catchActions: byId("catchActions"),
      catchSprite: byId("catchSprite"),
      catchAdvice: byId("catchAdvice"),
      rodValue: byId("rodValue"),
      baitValue: byId("baitValue"),
      demandValue: byId("demandValue"),
      timeValue: byId("timeValue"),
      clockStat: byId("clockStat"),
      levelLabel: byId("levelLabel"),
      headerXpFill: byId("headerXpFill"),
      headerXpText: byId("headerXpText"),
      phaseOverlay: byId("phaseOverlay"),
      titleScreen: byId("titleScreen"),
      titleProgress: byId("titleProgress"),
      titleAchievements: byId("titleAchievements"),
      continueButton: byId("continueButton"),
      newCareerButton: byId("newCareerButton"),
      titleFullscreenButton: byId("titleFullscreenButton"),
      endDayConfirm: byId("endDayConfirm"),
      confirmEndDayButton: byId("confirmEndDayButton"),
      cancelEndDayButton: byId("cancelEndDayButton"),
      summaryIncomeHero: byId("summaryIncomeHero"),
      incomeBreakdown: byId("incomeBreakdown"),
      welcomeScreen: byId("welcomeScreen"),
      mapSelectScreen: byId("mapSelectScreen"),
      summaryScreen: byId("summaryScreen"),
      restaurantScreen: byId("restaurantScreen"),
      eveningScreen: byId("eveningScreen"),
      eveningTitle: byId("eveningTitle"),
      eveningProgressFill: byId("eveningProgressFill"),
      eveningCount: byId("eveningCount"),
      eveningEvents: byId("eveningEvents"),
      summaryReputation: byId("summaryReputation"),
      summaryReputationChange: byId("summaryReputationChange"),
      reputationFactors: byId("reputationFactors"),
      restaurantPanel: byId("restaurantPanel"),
      restaurantMeta: byId("restaurantMeta"),
      serveButton: byId("serveButton"),
      afterShopScreen: byId("afterShopScreen"),
      afterShopPanel: byId("afterShopPanel"),
      shopBalance: byId("shopBalance"),
      shopNotice: byId("shopNotice"),
      afterShopButton: byId("afterShopButton"),
      afterSkillsScreen: byId("afterSkillsScreen"),
      afterSkillsPanel: byId("afterSkillsPanel"),
      afterSkillsButton: byId("afterSkillsButton"),
      startGameButton: byId("startGameButton"),
      nextDayButton: byId("nextDayButton"),
      mapSelectPanel: byId("mapSelectPanel"),
      summaryRevenue: byId("summaryRevenue"),
      summaryCaught: byId("summaryCaught"),
      summaryXp: byId("summaryXp"),
      summaryWish: byId("summaryWish"),
      summaryLines: byId("summaryLines"),
      summaryAchievements: byId("summaryAchievements"),
      panelDrawer: byId("panelDrawer"),
      backMenuButton: byId("backMenuButton"),
      panelTitle: byId("panelTitle"),
      panelMeta: byId("panelMeta"),
      mapPanel: byId("mapPanel"),
      shopPanel: byId("shopPanel"),
      skillsPanel: byId("skillsPanel"),
      journalPanel: byId("journalPanel"),
      achievementsPanel: byId("achievementsPanel"),
      menuPanel: byId("menuPanel"),
      focusPanel: byId("focusPanel"),
      questsPanel: byId("questsPanel"),
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
      reelFish: byId("reelFish"),
      hookTrack: byId("hookTrack"),
      hookZone: byId("hookZone"),
      hookIndicator: byId("hookIndicator"),
      tensionWrap: byId("tensionWrap"),
      tensionFill: byId("tensionFill"),
      targetZone: byId("targetZone"),
      touchControls: byId("touchControls"),
      touchInteractButton: byId("touchInteractButton"),
      virtualJoystick: byId("virtualJoystick"),
      joystickTouchArea: byId("joystickTouchArea"),
      joystickBase: byId("joystickBase"),
      joystickKnob: byId("joystickKnob"),
      navButtons: Array.from(document.querySelectorAll(".nav-button[data-panel]")),
      panelBodies: Array.from(document.querySelectorAll(".panel-body")),
    };

    game.refs = refs;

    refs.startGameButton.addEventListener("click", () => game.actions.beginCareer());
    refs.continueButton.addEventListener("click", () => game.actions.continueCareer());
    refs.newCareerButton.addEventListener("click", () => game.actions.newCareer());
    refs.titleFullscreenButton.addEventListener("click", () => game.actions.toggleFullscreen());
    refs.confirmEndDayButton.addEventListener("click", () => game.actions.confirmEndDay());
    refs.cancelEndDayButton.addEventListener("click", () => game.actions.cancelEndDay());
    refs.nextDayButton.addEventListener("click", () => game.actions.afterShop());
    refs.serveButton.addEventListener("click", () => game.actions.serve());
    refs.afterShopButton.addEventListener("click", () => game.actions.afterSkills());
    refs.afterSkillsButton.addEventListener("click", () => game.actions.nextDay());
    refs.endDayButton.addEventListener("click", () => game.actions.endDay());
    refs.toggleLogButton.addEventListener("click", () => game.actions.toggleLog());
    refs.backMenuButton.addEventListener("click", () => game.actions.togglePanel("menu"));
    refs.catchActions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-catch-action]");
      if (button) game.actions.resolveCatch(button.dataset.catchAction, button.dataset.replaceId);
    });
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
      if (button.dataset.action === "shop-category") game.actions.chooseShopCategory(button.dataset.category);
      if (button.dataset.action === "bait") {
        game.actions.chooseBait(button.dataset.baitId);
      }
    });
    refs.afterShopPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (button?.dataset.action === "buy") game.actions.purchase(button.dataset.upgradeType);
      if (button?.dataset.action === "bait") game.actions.chooseBait(button.dataset.baitId);
      if (button?.dataset.action === "shop-category") game.actions.chooseShopCategory(button.dataset.category);
    });
    refs.afterSkillsPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='skill']");
      if (button) game.actions.spendSkill(button.dataset.skillId);
    });
    refs.restaurantPanel.addEventListener("change", (event) => {
      if (event.target.matches("[data-restaurant-fish]")) {
        game.actions.chooseRecipe(event.target.dataset.restaurantFish, event.target.value);
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
      if (button.dataset.action === "panel") game.actions.togglePanel(button.dataset.panel);
      if (button.dataset.action === "load") {
        game.actions.load();
      }
      if (button.dataset.action === "reset") {
        const accepted = window.confirm("Nullstille lagringen og starte helt på nytt?");
        if (accepted) {
          game.actions.reset();
        }
      }
      if (button.dataset.action === "dev") game.actions.toggleDev();
      if (button.dataset.action === "fullscreen") game.actions.toggleFullscreen();
    });
  };

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function getPanelConfig(panelId) {
    const configs = {
      maps: { title: "Kart", meta: "Bytt område hvis du vil prøve lykken et annet sted." },
      shop: { title: "Butikker", meta: "Fiskeutstyr, agn og restaurant." },
      skills: { title: "Ferdigheter", meta: "Bruk erfaringspoeng på fordeler som faktisk merkes." },
      journal: { title: "Dagbok", meta: "Her bor rekordene og alle fiskene du skrøt av." },
      achievements: { title: "Achievements", meta: "Små milepæler som belønner nysgjerrighet." },
      menu: { title: "Meny", meta: "Oppdrag, lagring og en liten huskelapp." },
      focus: { title: "Dagens fokus", meta: "Ønskefisken gir bedre pris i kveld." },
      quests: { title: "Oppdrag", meta: "Mål som gir penger og erfaring." },
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
        item.cargoBonus ? `${item.cargoBonus} kg ekstra bagplass.` : "Ingen ekstra bagplass.",
        item.note,
      ];
    }
    if (type === "bag" || type === "tank") return [`Kapasitet: ${item.capacity} kg.`, item.note];
    if (type === "kitchen") return [`Matbonus: +${item.bonus}.`, item.note];
    if (type === "chairs") return [`Ekstra plasser: ${item.seats}.`, item.note];
    if (type === "comfort" || type === "service") return [`Servicebonus: +${item.bonus}.`, item.note];
    if (type === "wholesale") return [`Grossist betaler ${Math.round(item.rate * 100)} % av råvareverdien.`, item.note];
    if (type === "restaurant") {
      return [
        `${item.seats} sitteplasser.`,
        `Kveldsprisen på fisk ganges med ${item.saleMultiplier.toFixed(2)}.`,
        item.note,
      ];
    }
    return [];
  }

  function renderUpgradeCard(title, current, next, type, state) {
    const currentLines = getUpgradeDetails(type, current);
    const nextLines = next ? getUpgradeDetails(type, next) : [];
    const rows = Array.from({ length: Math.max(currentLines.length, nextLines.length) }, (_, index) => `
      <div class="upgrade-cell">${currentLines[index] || ""}</div>
      <div class="upgrade-cell">${next ? nextLines[index] || "" : "Maksnivå"}</div>
    `).join("");
    return `
      <article class="shop-card">
        <div class="card-head">
          <h3>${title}</h3>
          <span class="quality-pill">Nivå ${current.level}</span>
        </div>
        <p class="shop-price">${next ? `Oppgradering: ${next.cost} kr` : "Maksnivå nådd"}</p>
        ${next && App.getUpgradeRequiredLevel(type, next.level) > 1 ? `<p class="shop-meta">Krever nivå ${App.getUpgradeRequiredLevel(type, next.level)}${state.level < App.getUpgradeRequiredLevel(type, next.level) && !state.devFreeUpgrades ? " · låst ennå" : ""}</p>` : ""}
        <div class="upgrade-compare" role="table" aria-label="Sammenligning av ${title.toLowerCase()}">
          <div class="upgrade-heading" role="columnheader">Nåværende: ${current.name}</div>
          <div class="upgrade-heading" role="columnheader">${next ? `Oppgradering: ${next.name}` : "Fullt oppgradert"}</div>
          ${rows}
        </div>
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
    const bagCurrent = App.getBagData(state.equipment.bagLevel);
    const bagNext = App.BAGS.find((item) => item.level === state.equipment.bagLevel + 1);
    const restaurantCurrent = App.getRestaurantData(state.equipment.restaurantLevel);
    const restaurantNext = App.getRestaurantData(state.equipment.restaurantLevel + 1);
    const tankCurrent = App.getTankData(state.equipment.tankLevel);
    const tankNext = App.getTankData(state.equipment.tankLevel + 1);
    const category = state.ui.shopCategory || "fishing";
    const categories = `<div class="shop-categories">${[["fishing", "Fiskeutstyr"], ["bait", "Agn og sluk"], ["restaurant", "Restaurant"]].map(([id, label]) => `<button type="button" data-action="shop-category" data-category="${id}" class="secondary-button ${category === id ? "active" : ""}">${label}</button>`).join("")}</div>`;

    return `
      ${state.devFreeUpgrades ? '<p class="shop-price">Utviklermodus: alle kjøp er gratis.</p>' : ''}
      ${categories}
      ${category === "fishing" ? `
      ${renderUpgradeCard("Fiskestang", rodCurrent, rodNext, "rod", state)}
      ${renderUpgradeCard("Snelle", reelCurrent, reelNext, "reel", state)}
      ${renderUpgradeCard("Snøre", lineCurrent, lineNext, "line", state)}
      ${renderUpgradeCard("Båt", boatCurrent, boatNext, "boat", state)}
      ${renderUpgradeCard("Fiskebag", bagCurrent, bagNext, "bag", state)}
      ` : ""}
      ${category === "restaurant" ? `
      ${renderUpgradeCard("Restaurant", restaurantCurrent, restaurantNext, "restaurant", state)}
      ${renderUpgradeCard("Kjøkken", App.KITCHENS[state.equipment.kitchenLevel], App.KITCHENS[state.equipment.kitchenLevel + 1], "kitchen", state)}
      ${renderUpgradeCard("Stoler og bord", App.CHAIRS[state.equipment.chairsLevel], App.CHAIRS[state.equipment.chairsLevel + 1], "chairs", state)}
      ${renderUpgradeCard("Komfort", App.COMFORTS[state.equipment.comfortLevel], App.COMFORTS[state.equipment.comfortLevel + 1], "comfort", state)}
      ${renderUpgradeCard("Servering", App.SERVICE_UPGRADES[state.equipment.serviceLevel], App.SERVICE_UPGRADES[state.equipment.serviceLevel + 1], "service", state)}
      ${renderUpgradeCard("Grossistavtale", App.WHOLESALE[state.equipment.wholesaleLevel], App.WHOLESALE[state.equipment.wholesaleLevel + 1], "wholesale", state)}
      ${renderUpgradeCard("Fisketank", tankCurrent, tankNext, "tank", state)}
      ` : ""}
      ${category === "bait" ? renderBaitCards(game) : ""}
    `;
  }

  function renderRestaurant(game) {
    const state = game.state;
    const recipes = App.getAvailableRecipes(state);
    const candidates = App.getRestaurantCandidates(state);
    if (!candidates.length) return `<p class="phase-lead">Ingen fisk i dag. Det blir en rolig kveld.</p>`;
    return candidates.map(({ fish, source }) => {
      const choice = App.getRestaurantChoice(state, fish, source);
      const options = recipes.map((recipe) => `<option value="${recipe.id}" ${choice === recipe.id ? "selected" : ""}>${recipe.name} — ${recipe.description}</option>`).join("");
      return `<article class="restaurant-fish"><img src="${App.getFishSprite(fish.fishId)}" alt="" />
        <div><strong>${fish.name}</strong><small>${fish.weightKg.toFixed(1)} kg · ${fish.qualityLabel} · ${source === "tank" ? "i tanken" : "i bagen"}</small></div>
        <select aria-label="Tilbered ${fish.name}" data-restaurant-fish="${fish.id}">
          ${options}<option value="tank" ${choice === "tank" ? "selected" : ""} ${fish.weightKg > App.getTankCapacity(state) ? "disabled" : ""}>Spar i tanken</option>
        </select></article>`;
    }).join("");
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
              ${(skillPoints > 0 || game.state.devFreeUpgrades) && level < skill.maxLevel ? "" : "disabled"}
            >
              ${(skillPoints > 0 || game.state.devFreeUpgrades) && level < skill.maxLevel ? "Øk ferdigheten" : "Ingen poeng eller maks nivå"}
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
              <img class="fish-sprite undiscovered" src="${App.getFishSprite(fish.id)}" alt="Uoppdaget fisk" />
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
            <img class="fish-sprite" src="${App.getFishSprite(fish.id)}" alt="${fish.name}" />
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
      <article class="menu-card"><button class="secondary-button" type="button" data-action="panel" data-panel="skills">Ferdigheter</button>
      <button class="secondary-button" type="button" data-action="panel" data-panel="journal">Dagbok</button>
      <button class="secondary-button" type="button" data-action="panel" data-panel="achievements">Achievements</button></article>
      <article class="menu-card"><h3>Utviklerinnstilling</h3><p>For rask testing. Kjøp og ferdighetsøkninger blir gratis.</p>
      <button class="secondary-button" type="button" data-action="dev" aria-pressed="${game.state.devFreeUpgrades}">${game.state.devFreeUpgrades ? "Gratis oppgraderinger: På" : "Gratis oppgraderinger: Av"}</button></article>
      <article class="menu-card">
        <div class="card-head">
          <h3>Lagring og hjelp</h3>
          <span class="small-note">lokalt i nettleseren</span>
        </div>
        <div class="save-row">
          <button class="secondary-button" type="button" data-action="fullscreen">${document.fullscreenElement ? "Avslutt fullskjerm" : "Full skjerm"}</button>
          <button class="secondary-button" type="button" data-action="save">Lagre</button>
          <button class="secondary-button" type="button" data-action="load">Last inn</button>
          <button class="danger-button" type="button" data-action="reset">Nullstill</button>
        </div>
        <div class="help-list">
          <p><strong>Kast:</strong> trykk space for lengde, igjen for å låse, igjen for retning.</p>
          <p><strong>Napp:</strong> trykk space, så treff grønt felt.</p>
          <p><strong>Fiskekamp:</strong> hold space for opp, slipp for ned.</p>
          <p><strong>Mål:</strong> fang god fisk, server klokt og bygg opp ryktet.</p>
        </div>
      </article>
    `;
  }

  function renderAchievements(state) {
    return App.ACHIEVEMENTS.map((entry) => {
      const earned = state.achievements.find((item) => item.id === entry.id);
      return `<article class="achievement-card ${earned ? "earned" : ""}"><strong>${earned ? "✓ " : "○ "}${entry.name}</strong><span>${earned ? `Oppnådd dag ${earned.day}` : entry.hint}</span></article>`;
    }).join("");
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
    refs.caughtValue.textContent = `${App.getBagWeight(state).toFixed(1)} / ${App.getBagCapacity(state)} kg`;
    refs.catchOverlay.classList.toggle("hidden", phase !== "day" || !state.pendingCatch);
    refs.endDayConfirm.classList.toggle("hidden", phase !== "day" || !game.confirmEndDay);
    if (state.pendingCatch) {
      const fish = state.pendingCatch;
      const capacity = App.getBagCapacity(state);
      const bagWeight = App.getBagWeight(state);
      const full = bagWeight + fish.weightKg > capacity + 0.001;
      refs.catchTitle.textContent = fish.name;
      refs.catchSprite.src = App.getFishSprite(fish.fishId);
      refs.catchSprite.alt = fish.name;
      refs.catchDetails.textContent = `${fish.weightKg.toFixed(1)} kg · ${fish.qualityLabel} · kvalitet ${Math.round(fish.quality || 50)}/100 · smak ${Math.round(fish.taste || 45)}/100 · ca. ${fish.baseSaleValue} kr`;
      const best = state.journal[fish.fishId]?.bestWeight || 0;
      refs.catchAdvice.textContent = `${demandFish && demandFish.id === fish.fishId ? "Dagens ønskefisk! " : ""}${fish.weightKg >= best ? "Ny vekt­rekord. " : ""}Velg hva som skal i bagen.`;
      refs.catchBagStatus.textContent = `Fiskebag: ${bagWeight.toFixed(1)}/${capacity} kg${full ? " — for lite plass" : ""}`;
      const actionKey = `${fish.id}|${capacity}|${state.inventory.map((entry) => entry.id).join("|")}`;
      if (refs.catchActions.dataset.renderKey !== actionKey) {
        refs.catchActions.innerHTML = `
          <button class="secondary-button" type="button" data-catch-action="release">Slipp ut</button>
          ${full ? [...state.inventory].filter((entry) => bagWeight - entry.weightKg + fish.weightKg <= capacity + 0.001).sort((a,b) => a.baseSaleValue - b.baseSaleValue).map((entry) => `<button class="primary-button" type="button" data-catch-action="replace" data-replace-id="${entry.id}">Bytt ut ${entry.name} (${entry.weightKg.toFixed(1)} kg · ${entry.baseSaleValue} kr)</button>`).join("") : '<button class="primary-button" type="button" data-catch-action="keep">Behold</button>'}
        `;
        refs.catchActions.dataset.renderKey = actionKey;
      }
    } else {
      delete refs.catchActions.dataset.renderKey;
    }
    refs.rodValue.textContent = App.getRodData(state.equipment.rodLevel).name;
    refs.baitValue.textContent = activeBait.name;
    refs.demandValue.textContent = demandFish ? demandFish.name : "Ingen";
    const dayRatio = Math.max(0, Math.min(1, state.dayTimeRemaining / 180));
    const clockMinutes = Math.min(720, Math.floor((1 - dayRatio) * 720));
    refs.timeValue.textContent = `${String(6 + Math.floor(clockMinutes / 60)).padStart(2, "0")}:${String(clockMinutes % 60).padStart(2, "0")}`;
    refs.clockStat.style.backgroundColor = `hsl(${Math.round(dayRatio * 120)} 72% 78%)`;
    const headerProgress = App.getLevelProgress(state);
    refs.levelLabel.textContent = `Nivå ${state.level}`;
    refs.headerXpFill.style.width = `${headerProgress.ratio * 100}%`;
    refs.headerXpText.textContent = `${Math.floor(headerProgress.current)} / ${headerProgress.needed} XP`;

    setHtml(refs.mapPanel, "");
    setHtml(refs.focusPanel, `<article class="menu-card"><h3>${demandFish ? demandFish.name : "Fangst"}</h3><p>${state.dailyDemand ? state.dailyDemand.text : "Velg fiskeplass."}</p></article>`);
    setHtml(refs.questsPanel, renderQuests(game));
    setHtml(refs.shopPanel, renderShop(game));
    setHtml(refs.skillsPanel, renderSkills(game));
    const shopScroll = refs.afterShopPanel.scrollTop;
    setHtml(refs.afterShopPanel, renderShop(game));
    refs.afterShopPanel.scrollTop = shopScroll;
    setHtml(refs.afterSkillsPanel, renderSkills(game));
    setHtml(refs.restaurantPanel, renderRestaurant(game));
    const plannedTankWeight = App.getRestaurantCandidates(state)
      .filter(({ fish, source }) => App.getRestaurantChoice(state, fish, source) === "tank")
      .reduce((sum, { fish }) => sum + fish.weightKg, 0);
    const seats = App.getRestaurantData(state.equipment.restaurantLevel).seats + (App.CHAIRS[state.equipment.chairsLevel]?.seats || 0);
    refs.restaurantMeta.textContent = `Rykte ${state.reputation.toFixed(1)} · ${state.customerMix.length} kunder ventet · ${seats} sitteplasser · tank ${plannedTankWeight.toFixed(1)}/${App.getTankCapacity(state)} kg${plannedTankWeight > App.getTankCapacity(state) ? " — for mye i tanken" : ""}`;
    refs.serveButton.disabled = plannedTankWeight > App.getTankCapacity(state) + 0.001;
    refs.shopBalance.textContent = `Penger: ${App.utils.formatKr(state.money)}${state.devFreeUpgrades ? " · Gratis testmodus" : ""}`;
    refs.shopNotice.textContent = game.shopNotice || "";
    setHtml(refs.journalPanel, renderJournal(game));
    setHtml(refs.achievementsPanel, renderAchievements(state));
    setHtml(refs.menuPanel, renderMenu(game));
    setHtml(refs.mapSelectPanel, renderMapCards(game, "Fisk her i dag"));
    setHtml(refs.catchLog, renderLogs(game));

    const levelProgress = App.getLevelProgress(state);
    [refs.skillsPanel, refs.afterSkillsPanel].forEach((panel) => {
      const xpFill = panel.querySelector("#xpBarFill");
      if (xpFill) xpFill.style.width = `${levelProgress.ratio * 100}%`;
    });

    refs.logDock.classList.toggle("collapsed", !!state.ui.logCollapsed);
    refs.toggleLogButton.textContent = state.ui.logCollapsed ? "+" : "−";

    const showOverlay = phase !== "day";
    refs.phaseOverlay.classList.toggle("hidden", !showOverlay);
    refs.titleScreen.classList.toggle("hidden", phase !== "title");
    refs.titleFullscreenButton.textContent = document.fullscreenElement ? "Avslutt fullskjerm" : "Full skjerm";
    refs.continueButton.disabled = !game.hasSavedCareer;
    const earned = state.achievements || [];
    const upgrades = [`Stang ${state.equipment.rodLevel}`, `Snelle ${state.equipment.reelLevel}`, `Restaurant ${state.equipment.restaurantLevel}`].join(" · ");
    refs.titleProgress.textContent = game.hasSavedCareer
      ? `Dag ${state.day} · Nivå ${state.level} · Rykte ${state.reputation.toFixed(1)} · ${upgrades}`
      : "Ingen lagret karriere ennå.";
    refs.titleAchievements.textContent = `${earned.length}/${App.ACHIEVEMENTS.length} achievements · ${earned.slice(-2).map((item) => App.ACHIEVEMENTS.find((entry) => entry.id === item.id)?.name).filter(Boolean).join(" · ") || "Første venter på deg"}`;
    refs.welcomeScreen.classList.toggle("hidden", phase !== "welcome");
    refs.mapSelectScreen.classList.toggle("hidden", phase !== "mapSelect");
    refs.summaryScreen.classList.toggle("hidden", phase !== "summary");
    refs.restaurantScreen.classList.toggle("hidden", phase !== "restaurant");
    refs.eveningScreen.classList.toggle("hidden", phase !== "evening");
    refs.afterShopScreen.classList.toggle("hidden", phase !== "afterShop");
    refs.afterSkillsScreen.classList.toggle("hidden", phase !== "afterSkills");

    const summary = state.lastDaySummary;
    refs.summaryReputation.textContent = summary ? (summary.reputation || 0).toFixed(1) : "0";
    refs.summaryReputationChange.textContent = summary && Number.isFinite(summary.reputationChange)
      ? `${summary.reputationChange >= 0 ? "+" : ""}${summary.reputationChange.toFixed(1)} i kveld` : "";
    setHtml(refs.reputationFactors, summary?.reputationFactors
      ? summary.reputationFactors.map((factor) => `<div><span>${factor.label}</span><strong class="${factor.value < 0 ? "negative" : "positive"}">${factor.value >= 0 ? "+" : ""}${factor.value.toFixed(1)}</strong></div>`).join("")
      : "");
    const evening = state.evening;
    const elapsed = phase === "evening" ? evening?.elapsed || 0 : 0;
    refs.eveningProgressFill.style.width = `${Math.min(100, elapsed / 5 * 100)}%`;
    const events = evening?.events || [];
    const visibleCount = Math.min(events.length, Math.floor(elapsed / 3.8 * events.length));
    refs.eveningTitle.textContent = elapsed >= 4.2 ? "Restauranten er stengt" : "Serverer gjestene";
    refs.eveningCount.textContent = `${Math.min(state.lastDaySummary?.arrivals || 0, Math.round(elapsed / 3.8 * (state.lastDaySummary?.arrivals || 0)))} av ${state.lastDaySummary?.arrivals || 0} kunder`;
    setHtml(refs.eveningEvents, events.slice(0, visibleCount).map((line) => `<p>${line}</p>`).join(""));
    refs.summaryRevenue.textContent = summary ? App.utils.formatKr(summary.revenue) : "0 kr";
    refs.summaryIncomeHero.textContent = summary ? App.utils.formatKr(summary.revenue) : "0 kr";
    refs.incomeBreakdown.textContent = summary && Number.isFinite(summary.tableRevenue)
      ? `Servering ${App.utils.formatKr(summary.tableRevenue)} + grossist ${App.utils.formatKr(summary.wholesaleRevenue)} (${Math.round(summary.wholesaleRate * 100)} % av råvareverdi) = ${App.utils.formatKr(summary.revenue)}`
      : "";
    refs.summaryCaught.textContent = summary ? String(summary.caughtCount) : "0";
    refs.summaryXp.textContent = summary ? `${summary.xpGained} XP` : "0 XP";
    refs.summaryWish.textContent = summary ? String(summary.bonusCount) : "0";
    refs.summaryLines.innerHTML = summary
      ? [
          `<p><strong>Sted:</strong> ${summary.mapName}</p>`,
          `<p><strong>Ønskefisk:</strong> ${summary.demandFishName}</p>`,
          `<p><strong>Solgt:</strong> ${summary.soldCount} fisk</p>`,
          ...(Number.isFinite(summary.avgReview) ? [
            `<p><strong>Kunder:</strong> ${summary.seated || 0}/${summary.arrivals || 0} fikk plass · ${summary.served || 0} fikk fisk</p>`,
            `<p><strong>Mat:</strong> ${summary.avgFood || 0}/100 · <strong>Service:</strong> ${summary.serviceScore || 0}/100 · <strong>Snittomtale:</strong> ${summary.avgReview}/100</p>`,
            `<p><strong>I tanken:</strong> ${summary.storedCount || 0} fisk</p>`,
          ] : []),
        ]
          .concat(summary.lines.map((line) => `<p>${line}</p>`))
          .join("")
      : "";
    const today = earned.filter((item) => item.day === summary?.dayNumber);
    refs.summaryAchievements.textContent = today.length
      ? `Achievements i dag: ${today.map((item) => App.ACHIEVEMENTS.find((entry) => entry.id === item.id)?.name).filter(Boolean).join(", ")}`
      : `Achievements: ${earned.length}/${App.ACHIEVEMENTS.length}`;

    refs.panelDrawer.classList.toggle("active", phase === "day" && !!activePanel);
    refs.backMenuButton.classList.toggle("hidden", !["skills", "journal", "achievements"].includes(activePanel));
    const panelConfig = getPanelConfig(activePanel);
    refs.panelTitle.textContent = panelConfig.title;
    refs.panelMeta.textContent = panelConfig.meta;
    refs.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.panel === activePanel);
    });
    refs.panelBodies.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `panel-${activePanel}`);
    });

    refs.endDayButton.disabled = phase !== "day" || !!state.pendingCatch;
    refs.touchControls.classList.toggle("hidden", phase !== "day" || !!activePanel);
    refs.joystickTouchArea.classList.toggle("hidden", phase !== "day" || !!activePanel);
    refs.logDock.classList.toggle("hidden", phase !== "day");

    refs.fishingHud.classList.toggle("hidden", phase !== "day" || fishing.mode === "idle");
    refs.fishingHud.classList.toggle("reeling", fishing.mode === "reeling");
    refs.logDock.classList.toggle("hidden", phase !== "day" || fishing.mode === "reeling");
    refs.minigameTrack.classList.toggle("hidden", fishing.mode !== "reeling");
    refs.hookTrack.classList.toggle("hidden", fishing.mode !== "hooking");
    refs.tensionWrap.classList.toggle("hidden", fishing.mode !== "reeling");
    refs.tensionFill.style.width = `${Math.round(fishing.tension * 100)}%`;

    const showMeter = ["charging", "aiming", "casting", "reeling"].includes(fishing.mode);
    refs.actionMeterWrap.classList.toggle("hidden", !showMeter);
    refs.fishingStatus.textContent = fishing.message || "";
    refs.fishingHint.textContent = fishing.hint || "";

    let meterLabel = "Kastestyrke";
    let meterValue = 0;
    if (fishing.mode === "charging") {
      meterLabel = "Kastestyrke";
      meterValue = fishing.castPower;
    } else if (fishing.mode === "aiming") {
      meterLabel = "Retning";
      meterValue = fishing.aim;
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
    refs.targetZone.style.top = `${(fishing.marker - fishing.targetWidth / 2) * 100}%`;
    refs.targetZone.style.height = `${fishing.targetWidth * 100}%`;
    refs.reelFish.style.top = `${fishing.fishPosition * 100}%`;
    if (fishing.hookedFishId) {
      const sprite = App.getFishSprite(fishing.hookedFishId);
      if (refs.reelFish.dataset.fishId !== fishing.hookedFishId) {
        refs.reelFish.src = sprite;
        refs.reelFish.dataset.fishId = fishing.hookedFishId;
      }
    }
    refs.hookZone.style.left = `${(fishing.hookCenter - fishing.hookWidth / 2) * 100}%`;
    refs.hookZone.style.width = `${fishing.hookWidth * 100}%`;
    refs.hookIndicator.style.left = `${fishing.hookMarker * 100}%`;

    refs.touchInteractButton.textContent =
      fishing.mode === "bite" ? "Napp!" : fishing.mode === "hooking" ? "Tilslag" :
      fishing.mode === "charging" ? "Lås" : fishing.mode === "aiming" ? "Kast" :
      fishing.mode === "waiting" && ["sluk", "spinner", "pilk"].includes(state.activeBaitId) ? "Sveiv" :
      fishing.mode === "reeling" ? "Løft" : "Kast";
  };

  App.renderFishingMotion = function renderFishingMotion(game) {
    const fishing = game.state.fishing;
    const refs = game.refs;
    if (!refs || fishing.mode === "idle") return;
    const value = fishing.mode === "charging" ? fishing.castPower :
      fishing.mode === "aiming" ? fishing.aim : fishing.mode === "reeling" ? fishing.progress : 1;
    refs.actionMeterFill.style.width = `${value * 100}%`;
    refs.actionMeterValue.textContent = `${Math.round(value * 100)}%`;
    if (fishing.mode === "hooking") refs.hookIndicator.style.left = `${fishing.hookMarker * 100}%`;
    if (fishing.mode === "reeling") {
      refs.targetZone.style.top = `${(fishing.marker - fishing.targetWidth / 2) * 100}%`;
      refs.reelFish.style.top = `${fishing.fishPosition * 100}%`;
      refs.tensionFill.style.width = `${Math.round(fishing.tension * 100)}%`;
    }
  };
})();

