(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  App.ASSET_MODE = "vector";
  App.WORLD_WIDTH = 960;
  App.WORLD_HEIGHT = 540;
  App.TOP_BANNER_HEIGHT = 86;
  App.BOTTOM_BAR_HEIGHT = 58;

  App.utils = {
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },
    lerp(start, end, amount) {
      return start + (end - start) * amount;
    },
    distance(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    },
    weightedPick(entries, getWeight) {
      let total = 0;
      for (let i = 0; i < entries.length; i += 1) {
        total += Math.max(0, getWeight(entries[i]));
      }
      if (total <= 0) {
        return null;
      }
      let roll = Math.random() * total;
      for (let i = 0; i < entries.length; i += 1) {
        roll -= Math.max(0, getWeight(entries[i]));
        if (roll <= 0) {
          return entries[i];
        }
      }
      return entries[entries.length - 1];
    },
    deepClone(value) {
      return JSON.parse(JSON.stringify(value));
    },
    deepMerge(base, extra) {
      if (Array.isArray(base)) {
        return Array.isArray(extra) ? extra.slice() : base.slice();
      }
      if (!base || typeof base !== "object") {
        return extra === undefined ? base : extra;
      }
      const merged = { ...base };
      Object.keys(extra || {}).forEach((key) => {
        if (!(key in base)) {
          merged[key] = extra[key];
          return;
        }
        const baseValue = base[key];
        const extraValue = extra[key];
        if (
          baseValue &&
          extraValue &&
          typeof baseValue === "object" &&
          typeof extraValue === "object" &&
          !Array.isArray(baseValue) &&
          !Array.isArray(extraValue)
        ) {
          merged[key] = App.utils.deepMerge(baseValue, extraValue);
        } else {
          merged[key] = extraValue;
        }
      });
      return merged;
    },
    formatKr(amount) {
      return `${Math.round(amount)} kr`;
    },
  };

  App.QUESTS = [
    {
      id: "quest_abbor",
      title: "Abbor på kroken",
      description: "Fang 5 abbor.",
      type: "catchCount",
      fishId: "abbor",
      target: 5,
      rewardMoney: 120,
      rewardXp: 30,
      unlockRequirement: { type: "start" },
    },
    {
      id: "quest_big_orret",
      title: "Fin fjelltur",
      description: "Fang en ørret over 1 kg.",
      type: "catchWeight",
      fishId: "orret",
      target: 1,
      rewardMoney: 180,
      rewardXp: 35,
      unlockRequirement: { type: "start" },
    },
    {
      id: "quest_discover_five",
      title: "Nye arter",
      description: "Oppdag 5 fiskearter.",
      type: "discoverCount",
      target: 5,
      rewardMoney: 220,
      rewardXp: 50,
      unlockRequirement: { type: "level", amount: 2 },
    },
    {
      id: "quest_torsk_delivery",
      title: "Torsk til huset",
      description: "Selg 3 torsk i restauranten.",
      type: "sellCount",
      fishId: "torsk",
      target: 3,
      rewardMoney: 280,
      rewardXp: 65,
      unlockRequirement: { type: "mapUnlocked", mapId: "fjordkanten" },
    },
    {
      id: "quest_evening_income",
      title: "God kveldskasse",
      description: "Tjen 500 kr på en kveld.",
      type: "bestDayRevenue",
      target: 500,
      rewardMoney: 260,
      rewardXp: 55,
      unlockRequirement: { type: "level", amount: 3 },
    },
    {
      id: "quest_first_boat",
      title: "På vannet",
      description: "Kjøp din første båt.",
      type: "boatLevel",
      target: 1,
      rewardMoney: 350,
      rewardXp: 90,
      unlockRequirement: { type: "level", amount: 3 },
    },
    {
      id: "quest_halibut",
      title: "Storfangst",
      description: "Fang en kveite.",
      type: "catchCount",
      fishId: "kveite",
      target: 1,
      rewardMoney: 800,
      rewardXp: 150,
      unlockRequirement: { type: "boatLevel", amount: 1 },
    },
  ];

  App.SKILLS = {
    casting: {
      id: "casting",
      name: "Kasteteknikk",
      maxLevel: 5,
      description: "Lengre kast, litt friere valgfrihet og mindre busk-basert ydmykelse.",
    },
    instincts: {
      id: "instincts",
      name: "Fiskeblikk",
      maxLevel: 5,
      description: "Bedre reaksjon når det napper og litt mer fiskete intuisjon.",
    },
    reeling: {
      id: "reeling",
      name: "Rolig hånd",
      maxLevel: 5,
      description: "Snillere innsveiving, større grønn sone og færre panikkrykk.",
    },
    commerce: {
      id: "commerce",
      name: "Markedssans",
      maxLevel: 5,
      description: "Kona di får bedre pris når du faktisk kommer hjem med noe brukbart.",
    },
  };

  App.getPlayableViewport = function getPlayableViewport() {
    return {
      x: 0,
      y: App.TOP_BANNER_HEIGHT,
      width: App.WORLD_WIDTH,
      height: App.WORLD_HEIGHT - App.TOP_BANNER_HEIGHT - App.BOTTOM_BAR_HEIGHT,
    };
  };

  App.createEmptyFishingState = function createEmptyFishingState() {
    return {
      mode: "idle",
      timer: 0,
      charge: 0,
      castPower: 0,
      castStrength: 0,
      waitTime: 0,
      biteWindow: 0,
      marker: 0.5,
      markerVelocity: 0,
      targetCenter: 0.5,
      targetWidth: 0.3,
      targetVelocity: 0.14,
      progress: 0.3,
      message: "",
      hint: "",
      castPoint: null,
      hookedFishId: null,
      reactionScore: 0,
      reelScore: 0,
      result: null,
      elapsed: 0,
      exclamationTimer: 0,
    };
  };

  App.createDayStats = function createDayStats(xp) {
    return {
      caughtCount: 0,
      xpGained: 0,
      catches: [],
      startXp: xp || 0,
    };
  };

  App.createEmptyStateTemplate = function createEmptyStateTemplate() {
    return {
      day: 1,
      phase: "welcome",
      money: 180,
      xp: 0,
      level: 1,
      skillPoints: 0,
      skills: {
        casting: 0,
        instincts: 0,
        reeling: 0,
        commerce: 0,
      },
      currentMapId: "skogstjern",
      unlockedMapIds: ["skogstjern"],
      equipment: {
        rodLevel: 1,
        reelLevel: 1,
        lineLevel: 1,
        restaurantLevel: 1,
        boatLevel: 0,
      },
      ownedBaits: {
        mark: true,
      },
      activeBaitId: "mark",
      inventory: [],
      catchLog: [],
      messageLog: [],
      lastDaySummary: null,
      dailyDemand: null,
      dayStats: App.createDayStats(0),
      player: {
        x: 170,
        y: 320,
        radius: 14,
        speed: 170,
        facingX: 1,
        facingY: 0,
      },
      fishing: App.createEmptyFishingState(),
      journal: {},
      stats: {
        totalCaught: 0,
        totalSold: 0,
        totalWeight: 0,
        bestDayRevenue: 0,
        catchesByFishId: {},
        soldByFishId: {},
      },
      questState: {
        activeQuestIds: [],
        completedQuestIds: [],
      },
      ui: {
        activePanel: null,
        logCollapsed: false,
      },
    };
  };

  App.createInitialState = function createInitialState() {
    const state = App.createEmptyStateTemplate();
    state.catchLog = [
      "Morgenen starter hjemme ved brygga. Velg område og håp at kona liker dagens fangst.",
    ];
    return App.hydrateState(state);
  };

  App.getLevelFromXp = function getLevelFromXp(xp) {
    return Math.max(1, Math.floor(Math.sqrt((xp || 0) / 90)) + 1);
  };

  App.hydrateState = function hydrateState(rawState) {
    const merged = App.utils.deepMerge(App.createEmptyStateTemplate(), rawState || {});
    merged.money = Number.isFinite(merged.money) ? merged.money : 0;
    merged.day = Math.max(1, merged.day || 1);
    merged.xp = Math.max(0, merged.xp || 0);
    merged.level = App.getLevelFromXp(merged.xp);
    merged.skillPoints = Number.isFinite(merged.skillPoints)
      ? merged.skillPoints
      : Math.max(0, merged.level - 1);
    merged.inventory = Array.isArray(merged.inventory) ? merged.inventory : [];
    merged.catchLog = Array.isArray(merged.catchLog) ? merged.catchLog.slice(0, 16) : [];
    merged.messageLog = Array.isArray(merged.messageLog) ? merged.messageLog.slice(0, 16) : [];
    merged.unlockedMapIds = Array.isArray(merged.unlockedMapIds)
      ? merged.unlockedMapIds
      : ["skogstjern"];
    merged.player.radius = merged.player.radius || 14;
    merged.fishing = App.utils.deepMerge(App.createEmptyFishingState(), merged.fishing || {});
    merged.skills = App.utils.deepMerge(
      {
        casting: 0,
        instincts: 0,
        reeling: 0,
        commerce: 0,
      },
      merged.skills || {}
    );
    merged.stats.catchesByFishId = merged.stats.catchesByFishId || {};
    merged.stats.soldByFishId = merged.stats.soldByFishId || {};
    merged.questState.activeQuestIds = Array.isArray(merged.questState.activeQuestIds)
      ? merged.questState.activeQuestIds
      : [];
    merged.questState.completedQuestIds = Array.isArray(merged.questState.completedQuestIds)
      ? merged.questState.completedQuestIds
      : [];
    merged.ownedBaits = merged.ownedBaits || { mark: true };
    merged.ownedBaits.mark = true;
    merged.activeBaitId = merged.ownedBaits[merged.activeBaitId] ? merged.activeBaitId : "mark";
    merged.ui = App.utils.deepMerge(
      {
        activePanel: null,
        logCollapsed: false,
      },
      merged.ui || {}
    );
    merged.dayStats = App.utils.deepMerge(
      App.createDayStats(merged.xp),
      merged.dayStats || {}
    );
    if (!merged.currentMapId) {
      merged.currentMapId = "skogstjern";
    }
    if (!merged.phase) {
      merged.phase = "welcome";
    }
    App.syncQuests(merged);
    return merged;
  };

  App.resetDayStats = function resetDayStats(state) {
    state.dayStats = App.createDayStats(state.xp);
  };

  App.getLevelProgress = function getLevelProgress(state) {
    const level = state.level;
    const currentFloor = Math.pow(level - 1, 2) * 90;
    const nextFloor = Math.pow(level, 2) * 90;
    const progress = (state.xp - currentFloor) / Math.max(1, nextFloor - currentFloor);
    return {
      current: state.xp - currentFloor,
      needed: nextFloor - currentFloor,
      ratio: App.utils.clamp(progress, 0, 1),
    };
  };

  App.getSkillLevel = function getSkillLevel(state, skillId) {
    return (state.skills && state.skills[skillId]) || 0;
  };

  App.addMessage = function addMessage(state, message) {
    if (!message) {
      return;
    }
    state.catchLog.unshift(message);
    state.catchLog = state.catchLog.slice(0, 16);
  };

  App.gainXp = function gainXp(state, amount, reason) {
    if (!amount) {
      return;
    }
    const oldLevel = state.level;
    state.xp += amount;
    state.level = App.getLevelFromXp(state.xp);
    state.dayStats.xpGained += amount;
    if (reason) {
      App.addMessage(state, `${reason} (+${amount} XP)`);
    }
    if (state.level > oldLevel) {
      const gainedPoints = state.level - oldLevel;
      state.skillPoints += gainedPoints;
      App.addMessage(state, `Du gikk opp til nivå ${state.level}.`);
      App.addMessage(state, `Du fikk ${gainedPoints} ferdighetspoeng.`);
    }
  };

  App.spendSkillPoint = function spendSkillPoint(state, skillId) {
    const skill = App.SKILLS[skillId];
    if (!skill) {
      return { ok: false, message: "Ukjent ferdighet." };
    }
    if (state.skillPoints <= 0) {
      return { ok: false, message: "Du har ingen ledige ferdighetspoeng." };
    }
    const currentLevel = App.getSkillLevel(state, skillId);
    if (currentLevel >= skill.maxLevel) {
      return { ok: false, message: `${skill.name} er allerede på maks.` };
    }
    state.skills[skillId] = currentLevel + 1;
    state.skillPoints -= 1;
    App.addMessage(state, `${skill.name} økte til nivå ${state.skills[skillId]}.`);
    return { ok: true, message: `${skill.name} forbedret.` };
  };

  App.meetsRequirement = function meetsRequirement(state, requirement) {
    if (!requirement || requirement.type === "start") {
      return true;
    }
    switch (requirement.type) {
      case "level":
        return state.level >= requirement.amount;
      case "money":
        return state.money >= requirement.amount;
      case "rodLevel":
        return state.equipment.rodLevel >= requirement.amount;
      case "reelLevel":
        return state.equipment.reelLevel >= requirement.amount;
      case "lineLevel":
        return state.equipment.lineLevel >= requirement.amount;
      case "boatLevel":
        return state.equipment.boatLevel >= requirement.amount;
      case "restaurantLevel":
        return state.equipment.restaurantLevel >= requirement.amount;
      case "discoverCount":
        return App.getDiscoveredFishCount(state) >= requirement.amount;
      case "mapUnlocked":
        return state.unlockedMapIds.includes(requirement.mapId);
      case "completedQuest":
        return state.questState.completedQuestIds.includes(requirement.questId);
      case "all":
        return requirement.requirements.every((entry) => App.meetsRequirement(state, entry));
      case "any":
        return requirement.requirements.some((entry) => App.meetsRequirement(state, entry));
      default:
        return false;
    }
  };

  App.getRequirementText = function getRequirementText(requirement) {
    if (!requirement || requirement.type === "start") {
      return "Tilgjengelig fra start";
    }
    switch (requirement.type) {
      case "level":
        return `Krever nivå ${requirement.amount}`;
      case "money":
        return `Krever ${requirement.amount} kr`;
      case "rodLevel":
        return `Krever stang nivå ${requirement.amount}`;
      case "reelLevel":
        return `Krever snelle nivå ${requirement.amount}`;
      case "lineLevel":
        return `Krever snøre nivå ${requirement.amount}`;
      case "boatLevel":
        return requirement.amount > 0 ? `Krever båt nivå ${requirement.amount}` : "Krever båt";
      case "restaurantLevel":
        return `Krever restaurant nivå ${requirement.amount}`;
      case "discoverCount":
        return `Krever ${requirement.amount} oppdagede arter`;
      case "mapUnlocked":
        return "Låses opp senere";
      case "completedQuest":
        return "Krever tidligere oppdrag";
      case "all":
        return requirement.requirements.map((entry) => App.getRequirementText(entry)).join(" + ");
      case "any":
        return requirement.requirements.map((entry) => App.getRequirementText(entry)).join(" eller ");
      default:
        return "Låst";
    }
  };

  App.recordCatchInJournal = function recordCatchInJournal(state, catchData) {
    const fishId = catchData.fishId;
    const existing = state.journal[fishId] || {
      bestWeight: 0,
      bestQuality: -1,
      count: 0,
      bestQualityLabel: "Ukjent",
      discoveredAtDay: state.day,
    };
    const isFirstCatch = !state.journal[fishId];
    existing.count += 1;
    existing.bestWeight = Math.max(existing.bestWeight, catchData.weightKg);
    if (catchData.qualityRank > existing.bestQuality) {
      existing.bestQuality = catchData.qualityRank;
      existing.bestQualityLabel = catchData.qualityLabel;
    }
    state.journal[fishId] = existing;
    if (isFirstCatch) {
      App.gainXp(state, 18, `Ny art oppdaget: ${catchData.name}`);
    }
  };

  App.getDiscoveredFishCount = function getDiscoveredFishCount(state) {
    return Object.keys(state.journal || {}).length;
  };

  App.getQuestProgressValue = function getQuestProgressValue(state, quest) {
    switch (quest.type) {
      case "catchCount":
        return state.stats.catchesByFishId[quest.fishId] || 0;
      case "catchWeight":
        return (state.journal[quest.fishId] && state.journal[quest.fishId].bestWeight) || 0;
      case "sellCount":
        return state.stats.soldByFishId[quest.fishId] || 0;
      case "discoverCount":
        return App.getDiscoveredFishCount(state);
      case "bestDayRevenue":
        return state.stats.bestDayRevenue || 0;
      case "boatLevel":
        return state.equipment.boatLevel || 0;
      default:
        return 0;
    }
  };

  App.getQuestProgressText = function getQuestProgressText(state, quest) {
    const current = App.getQuestProgressValue(state, quest);
    if (quest.type === "catchWeight") {
      return `${current.toFixed(1)} / ${quest.target.toFixed(1)} kg`;
    }
    if (quest.type === "bestDayRevenue") {
      return `${Math.round(current)} / ${quest.target} kr`;
    }
    return `${Math.min(current, quest.target)} / ${quest.target}`;
  };

  App.syncQuests = function syncQuests(state) {
    const completed = new Set(state.questState.completedQuestIds || []);
    for (let i = 0; i < App.QUESTS.length; i += 1) {
      const quest = App.QUESTS[i];
      if (completed.has(quest.id)) {
        continue;
      }
      if (!App.meetsRequirement(state, quest.unlockRequirement)) {
        continue;
      }
      if (App.getQuestProgressValue(state, quest) >= quest.target) {
        completed.add(quest.id);
        state.money += quest.rewardMoney;
        App.gainXp(state, quest.rewardXp, `Oppdrag fullført: ${quest.title}`);
        App.addMessage(state, `Belønning: ${quest.rewardMoney} kr for "${quest.title}".`);
      }
    }
    state.questState.completedQuestIds = Array.from(completed);
    state.questState.activeQuestIds = App.QUESTS.filter(
      (quest) =>
        !completed.has(quest.id) && App.meetsRequirement(state, quest.unlockRequirement)
    )
      .slice(0, 3)
      .map((quest) => quest.id);
  };

  App.beginCareer = function beginCareer(state) {
    if (!state.dailyDemand) {
      App.rollDailyDemand(state);
    }
    App.resetDayStats(state);
    state.phase = "mapSelect";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    App.addMessage(state, "Morgenen er i gang. Velg hvor du vil fiske i dag.");
  };

  App.advanceToNextDay = function advanceToNextDay(state) {
    state.day += 1;
    App.resetDayStats(state);
    App.rollDailyDemand(state);
    state.phase = "mapSelect";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    App.addMessage(state, `Dag ${state.day} starter. Velg dagens fiskeplass.`);
  };
})();
