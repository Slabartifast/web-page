(function attachTowerDefenseContent(global) {
  function createPlayerUpgrades(logMessage) {
    return [
      {
        key: "damage",
        label: "Sharper arrows",
        description: "+8 base arrow damage. Momentum amplifies this too.",
        cost: (state) => 80 + state.upgrades.player.damage * 34,
        apply: (state) => {
          state.player.damage += 8;
          state.upgrades.player.damage += 1;
          logMessage("The knight trains for harder hits.", "good");
        }
      },
      {
        key: "rate",
        label: "Bowstring drill",
        description: "+18% attack speed.",
        cost: (state) => 90 + state.upgrades.player.rate * 36,
        apply: (state) => {
          state.player.fireRate *= 1.18;
          state.upgrades.player.rate += 1;
          logMessage("The knight looses arrows faster.", "good");
        }
      },
      {
        key: "range",
        label: "Longbow reach",
        description: "+26 attack range.",
        cost: (state) => 85 + state.upgrades.player.range * 30,
        apply: (state) => {
          state.player.range += 26;
          state.upgrades.player.range += 1;
          logMessage("The knight can strike from farther away.", "good");
        }
      },
      {
        key: "speed",
        label: "Horse training",
        description: "+26 top speed.",
        cost: (state) => 78 + state.upgrades.player.speed * 30,
        apply: (state) => {
          state.player.maxSpeed += 26;
          state.upgrades.player.speed += 1;
          logMessage("The horse surges faster across the field.", "good");
        }
      },
      {
        key: "armor",
        label: "Armor and spear",
        description: "+28 max HP, full heal, and stronger mounted impact.",
        cost: (state) => 82 + state.upgrades.player.armor * 34,
        apply: (state) => {
          state.player.maxHp += 28;
          state.player.hp = state.player.maxHp;
          state.upgrades.player.armor += 1;
          logMessage("Fresh armor keeps the rider in the saddle.", "good");
        }
      }
    ];
  }

  function createVillageUpgrades(logMessage) {
    return [
      {
        key: "walls",
        label: "Reinforce palisade",
        description: "+110 max base HP and repair 70 HP.",
        cost: (state) => 96 + state.upgrades.village.walls * 42,
        apply: (state) => {
          state.base.maxHp += 110;
          state.base.hp = Math.min(state.base.maxHp, state.base.hp + 70);
          state.upgrades.village.walls += 1;
          state.base.wallLevel += 1;
          logMessage("New timber braces the village ring.", "good");
        }
      },
      {
        key: "archers",
        label: "Town archers",
        description: "+1 village arrow per volley.",
        cost: (state) => 116 + state.upgrades.village.archers * 52,
        apply: (state) => {
          state.base.archerLevel += 1;
          state.upgrades.village.archers += 1;
          logMessage("Villagers take the watch with bows.", "good");
        }
      },
      {
        key: "market",
        label: "Village market",
        description: "+35 bonus gold after every cleared wave.",
        cost: (state) => 108 + state.upgrades.village.market * 44,
        apply: (state) => {
          state.base.marketLevel += 1;
          state.upgrades.village.market += 1;
          logMessage("Trade carts increase village income.", "good");
        }
      },
      {
        key: "workshop",
        label: "Siege workshop",
        description: "+12% tower damage and +8% tower fire rate.",
        cost: (state) => 122 + state.upgrades.village.workshop * 56,
        apply: (state) => {
          state.base.workshopLevel += 1;
          state.upgrades.village.workshop += 1;
          logMessage("Local craftsmen improve every tower.", "good");
        }
      },
      {
        key: "repair",
        label: "Repair village",
        description: "Restore 110 base HP immediately.",
        cost: () => 65,
        apply: (state) => {
          state.base.hp = Math.min(state.base.maxHp, state.base.hp + 110);
          logMessage("Builders patch the damaged huts and walls.", "good");
        }
      }
    ];
  }

  function cloneEnemyConfig(config) {
    const clone = {};
    Object.keys(config).forEach((key) => {
      const entry = config[key];
      clone[key] = {
        ...entry,
        summonPack: entry.summonPack ? entry.summonPack.map((pack) => ({ ...pack })) : undefined,
        spawnOnDeath: entry.spawnOnDeath ? entry.spawnOnDeath.map((pack) => ({ ...pack })) : undefined
      };
    });
    return clone;
  }

  function getEditableWaveDefinitions() {
    return [
      {
        name: "Treeline Raid",
        endBonus: 80,
        groups: [["raider", 5, 0.8], ["wolf", 2, 0.6], ["raider", 4, 0.74]]
      },
      {
        name: "Hunting Party",
        endBonus: 112,
        groups: [["raider", 6, 0.72], ["wolf", 3, 0.56], ["hunter", 2, 0.96], ["brute", 1, 1.16], ["raider", 3, 0.7]]
      },
      {
        name: "Broken Shields",
        endBonus: 145,
        groups: [["wolf", 4, 0.54], ["raider", 6, 0.68], ["splitter", 1, 0.94], ["hunter", 2, 0.92], ["brute", 1, 1.12], ["raider", 2, 0.64]]
      },
      {
        name: "Encirclement",
        endBonus: 185,
        groups: [["rat", 8, 0.28], ["raider", 5, 0.6], ["wolf", 4, 0.5], ["hunter", 3, 0.8], ["splitter", 2, 0.86], ["brute", 2, 0.96], ["raider", 3, 0.56]]
      },
      {
        name: "The Warlord",
        endBonus: 245,
        groups: [["rat", 10, 0.24], ["raider", 5, 0.56], ["hunter", 3, 0.74], ["brute", 2, 0.92], ["warlord", 1, 1.5], ["wolf", 4, 0.46], ["splitter", 2, 0.76]]
      },
      {
        name: "Split Hunt",
        endBonus: 285,
        groups: [["rat", 14, 0.22], ["splitter", 4, 0.72], ["hunter", 4, 0.72], ["wolf", 6, 0.42], ["brute", 3, 0.86], ["raider", 6, 0.5]]
      },
      {
        name: "Arrow Storm",
        endBonus: 330,
        groups: [["rat", 16, 0.2], ["hunter", 5, 0.64], ["wolf", 7, 0.38], ["splitter", 4, 0.64], ["brute", 4, 0.8], ["raider", 7, 0.46]]
      },
      {
        name: "Heavy Advance",
        endBonus: 380,
        groups: [["rat", 20, 0.19], ["brute", 5, 0.82], ["hunter", 5, 0.64], ["splitter", 5, 0.6], ["wolf", 8, 0.36], ["raider", 8, 0.44]]
      },
      {
        name: "Siege Line",
        endBonus: 440,
        groups: [["rat", 22, 0.18], ["raider", 9, 0.4], ["hunter", 6, 0.58], ["brute", 6, 0.76], ["splitter", 6, 0.58], ["wolf", 9, 0.34]]
      },
      {
        name: "The Siege King",
        endBonus: 560,
        groups: [["rat", 24, 0.16], ["hunter", 6, 0.56], ["brute", 5, 0.74], ["splitter", 5, 0.56], ["siegeking", 1, 1.8], ["wolf", 8, 0.34], ["raider", 9, 0.4], ["hunter", 4, 0.62]]
      }
    ];
  }

  function expandEditableWaveGroups(groups) {
    return groups.flatMap(([type, count, delay]) => Array.from({ length: count }, () => ({ type, delay })));
  }

  function makeWaveBlueprints(waveDefinitions) {
    const defs = waveDefinitions || getEditableWaveDefinitions();
    return defs.map((wave) => ({
      name: wave.name,
      endBonus: wave.endBonus,
      entries: expandEditableWaveGroups(wave.groups)
    }));
  }

  function createBuildables(buildCosts) {
    return {
      archer: { key: "archer", category: "tower", label: "Archer", costs: { ...buildCosts.tower.archer }, accent: "#dce8bf", tag: "steady" },
      ballista: { key: "ballista", category: "tower", label: "Ballista", costs: { ...buildCosts.tower.ballista }, accent: "#f3c772", tag: "burst" },
      sniper: { key: "sniper", category: "tower", label: "Sniper", costs: { ...buildCosts.tower.sniper }, accent: "#d7eeff", tag: "precision" },
      bombard: { key: "bombard", category: "tower", label: "Bombard", costs: { ...buildCosts.tower.bombard }, accent: "#d9d9d9", tag: "siege" },
      wall: { key: "wall", category: "barrier", label: "Wall", costs: { ...buildCosts.barrier.wall }, accent: "#b8b0a1", tag: "block" },
      gate: { key: "gate", category: "barrier", label: "Gate", costs: { ...buildCosts.barrier.gate }, accent: "#c99156", tag: "pass" },
      stables: { key: "stables", category: "support", label: "Stables", costs: { wood: 78, stone: 26 }, accent: "#caa06a", tag: "cavalry" },
      archeryRange: { key: "archeryRange", category: "support", label: "Archery range", costs: { wood: 72, stone: 22 }, accent: "#b7cf9f", tag: "archery" }
    };
  }

  function createResearchDefinitionsV65(v65) {
    const gather = Object.values(v65.gatherDefs).map((def) => ({ ...def, kind: "gather", repeatable: true }));
    const extra = [{ ...v65.extraResearch.bookkeeping, kind: "extra", repeatable: false }];
    const existing = [
      { key: "fletching", label: "Fletching", cost: 4, short: "Tower damage, reload, and range improve.", detail: "Adds about +12% tower damage, +8% fire rate, and +8 range via workshop improvements.", icon: "research" },
      { key: "cavalry", label: "Cavalry tack", cost: 5, short: "Knight speed improves.", detail: "Adds a permanent top-speed bonus. Stacks with Horse training.", icon: "horse" },
      { key: "torchlight", label: "Knight torch", cost: 4, short: "The knight carries a night light.", detail: "During waves, the knight reveals a small area around himself.", icon: "torch" },
      { key: "masonry", label: "Masonry", cost: 5, short: "More base health and stronger palisade.", detail: "Adds +120 max base HP, repairs 120 HP, and adds a village wall level.", icon: "stone" },
      { key: "logistics", label: "Logistics", cost: 5, short: "+100 wood, +100 stone, +100 food.", detail: "Repeatable. Each purchase immediately grants 100 wood, 100 stone, and 100 food.", icon: "wood", repeatable: true },
      { key: "cartography", label: "Cartography", cost: 5, short: "Unlocks the minimap.", detail: "Shows the minimap with enemies, towers, torches, town, knight, and camera view.", icon: "map" },
      { key: "towerLanterns", label: "Tower lanterns", cost: 6, short: "Towers shine during night waves.", detail: "Every living tower becomes a small fixed light source at night.", icon: "torch" },
      { key: "ballistaUnlock", label: "Ballista plans", cost: 4, short: "Unlocks the Ballista tower.", detail: "Lets you build Ballistas: expensive anti-line towers with heavy hits and a small impact area.", icon: "research" },
      { key: "sniperUnlock", label: "Sniper posts", cost: 5, short: "Unlocks the Sniper tower.", detail: "Lets you build Sniper towers for long-range picks once you can afford their footprint.", icon: "research" },
      { key: "bombardUnlock", label: "Bombard workshop", cost: 7, short: "Unlocks the Bombard tower.", detail: "Lets you build Bombards that lob black bomb shells with strong area damage.", icon: "research" },
      { key: "deconstruction", label: "Deconstruction", cost: 8, short: "Removing buildables refunds 90%.", detail: "Removing towers, walls, and gates returns 90% of their wood and stone build cost.", icon: "wood" }
    ].map((def) => ({ ...def, kind: "existing" }));
    return gather.concat(extra, existing);
  }

  const DIFFICULTIES = Object.freeze({
    easy: {
      key: "easy",
      label: "Easy",
      enemyHpScale: 0.8,
      enemyDamageScale: 0.8,
      upgradeCostScale: 0.8,
      tint: "#8dbf6e"
    },
    normal: {
      key: "normal",
      label: "Normal",
      enemyHpScale: 1,
      enemyDamageScale: 1,
      upgradeCostScale: 1,
      tint: "#f0cd73"
    },
    hard: {
      key: "hard",
      label: "Hard",
      enemyHpScale: 1.2,
      enemyDamageScale: 1.2,
      upgradeCostScale: 1.2,
      tint: "#dd7260"
    }
  });

  const START_SCREEN_OPTIONS = Object.freeze({
    title: "Welcome to the game",
    subtitle: "Choose a difficulty, then replace this start panel with your own title art later.",
    artLabel: "Custom title art slot"
  });

  const TOWER_TYPES = Object.freeze({
    archer: {
      key: "archer",
      label: "Archer tower",
      cost: 90,
      radius: 19,
      durability: 145,
      range: 225,
      fireRate: 1.25,
      damage: 20,
      projectileSpeed: 500,
      projectileRadius: 3,
      knockback: 40,
      description: "Reliable arrows with good reach.",
      tag: "steady",
      color: "#dce8bf"
    },
    ballista: {
      key: "ballista",
      label: "Ballista",
      cost: 165,
      radius: 25,
      durability: 205,
      range: 308,
      fireRate: 0.42,
      damage: 76,
      projectileSpeed: 560,
      projectileRadius: 4,
      pierce: 0,
      knockback: 95,
      splashRadius: 16,
      splashUpgrade: 10,
      researchKey: "ballistaUnlock",
      description: "Heavy siege bolts with a punishing impact zone.",
      tag: "burst",
      color: "#f3c772"
    },
    sniper: {
      key: "sniper",
      label: "Sniper tower",
      cost: 235,
      radius: 24,
      durability: 125,
      range: 410,
      fireRate: 0.36,
      damage: 96,
      projectileSpeed: 850,
      projectileRadius: 3,
      knockback: 150,
      footprintCols: 2,
      footprintRows: 1,
      researchKey: "sniperUnlock",
      description: "Very high damage and extreme range, slow reload.",
      tag: "precision",
      color: "#d7eeff"
    },
    bombard: {
      key: "bombard",
      label: "Bombard tower",
      cost: 285,
      radius: 31,
      durability: 260,
      range: 272,
      fireRate: 0.25,
      damage: 68,
      projectileSpeed: 345,
      projectileRadius: 7,
      knockback: 30,
      splashRadius: 46,
      splashUpgrade: 14,
      footprintCols: 2,
      footprintRows: 2,
      researchKey: "bombardUnlock",
      description: "Lobs crude bombs that burst over clustered enemies.",
      tag: "siege",
      color: "#d9d9d9"
    }
  });

  const BUILD_COSTS = Object.freeze({
    tower: {
      archer: { wood: 26, stone: 16 },
      ballista: { wood: 54, stone: 40 },
      sniper: { wood: 60, stone: 50 },
      bombard: { wood: 74, stone: 66 }
    },
    barrier: {
      wall: { wood: 10, stone: 7 },
      gate: { wood: 16, stone: 11 }
    }
  });

  const EDITABLE_ENEMY_TYPES = {
    raider: {
      key: "raider",
      label: "Raider",
      hp: 60,
      speed: 62,
      radius: 13,
      damage: 13,
      attackRate: 0.9,
      reward: 14,
      fill: "#d55a4c",
      outline: "#69261e",
      behavior: "melee",
      mass: 1.0,
      telegraphColor: "rgba(213, 90, 76, 0.5)",
      spriteSrc: "graphics/Raider.png",
      spriteScale: 1.0,
      spriteW: 58,
      spriteH: 58,
      spriteOffsetX: 0,
      spriteOffsetY: 0,
      spriteFrameW: 126,
      spriteFrameH: 126,
      spriteFrameCount: 5,
      spriteFrameMs: 135,
      spriteFrameColumns: 2
    },
    wolf: {
      key: "wolf",
      label: "Wolf",
      hp: 40,
      speed: 115,
      radius: 11,
      damage: 10,
      attackRate: 0.55,
      reward: 12,
      fill: "#7c8e84",
      outline: "#324139",
      behavior: "melee",
      mass: 0.7,
      telegraphColor: "rgba(160, 180, 170, 0.5)",
      spriteSrc: "graphics/Wolf.png",
      spriteScale: 1.0,
      spriteW: 58,
      spriteH: 58,
      spriteOffsetX: 0,
      spriteOffsetY: 0,
      spriteFrameW: 100,
      spriteFrameH: 100,
      spriteFrameCount: 4,
      spriteFrameMs: 115,
      spriteFrameColumns: 2
    },
    rat: {
      key: "rat",
      label: "Rat swarm",
      hp: 22,
      speed: 164,
      radius: 8,
      damage: 6,
      attackRate: 0.46,
      reward: 6,
      fill: "#8a7864",
      outline: "#40352a",
      behavior: "melee",
      mass: 0.35,
      telegraphColor: "rgba(138, 120, 100, 0.45)",
      spriteSrc: "",
      spriteScale: 1,
      spriteW: 30,
      spriteH: 22,
      spriteOffsetX: 0,
      spriteOffsetY: 0
    },
    brute: {
      key: "brute",
      label: "Brute",
      hp: 190,
      speed: 42,
      radius: 19,
      damage: 24,
      attackRate: 1.08,
      reward: 32,
      fill: "#8f6ed7",
      outline: "#452678",
      behavior: "melee",
      mass: 1.9,
      telegraphColor: "rgba(143, 110, 215, 0.5)",
      spriteSrc: "graphics/Brute.png",
      spriteScale: 1.0,
      spriteW: 76,
      spriteH: 76,
      spriteOffsetX: 0,
      spriteOffsetY: -3,
      spriteFrameW: 128,
      spriteFrameH: 128,
      spriteFrameCount: 3,
      spriteFrameMs: 150,
      spriteFrameColumns: 2
    },
    hunter: {
      key: "hunter",
      label: "Hunter",
      hp: 68,
      speed: 52,
      radius: 13,
      damage: 12,
      attackRate: 1.22,
      reward: 18,
      fill: "#96b8e4",
      outline: "#405c7f",
      behavior: "ranged",
      attackRange: 190,
      projectileSpeed: 380,
      mass: 1.0,
      telegraphColor: "rgba(150, 184, 228, 0.5)",
      spriteSrc: "graphics/Hunter.png",
      spriteScale: 1.0,
      spriteW: 68,
      spriteH: 68,
      spriteOffsetX: 0,
      spriteOffsetY: -2,
      spriteFrameW: 130,
      spriteFrameH: 130,
      spriteFrameCount: 8,
      spriteFrameMs: 135,
      spriteFrameColumns: 3
    },
    splitter: {
      key: "splitter",
      label: "Packleader",
      hp: 88,
      speed: 76,
      radius: 15,
      damage: 16,
      attackRate: 0.82,
      reward: 22,
      fill: "#b99861",
      outline: "#5d4525",
      behavior: "melee",
      mass: 1.15,
      telegraphColor: "rgba(185, 152, 97, 0.5)",
      spawnOnDeath: [{ type: "wolf", count: 2, spread: 16 }],
      spriteSrc: "graphics/packleader.png",
      spriteScale: 1.04,
      spriteW: 116,
      spriteH: 116,
      spriteOffsetX: 0,
      spriteOffsetY: 0,
      spriteFrameW: 100,
      spriteFrameH: 100,
      spriteFrameCount: 3,
      spriteFrameMs: 150,
      spriteFrameColumns: 2
    },
    warlord: {
      key: "warlord",
      label: "Warlord",
      hp: 940,
      speed: 48,
      radius: 27,
      damage: 30,
      attackRate: 0.88,
      reward: 220,
      fill: "#e1ad43",
      outline: "#6b4a0d",
      behavior: "summoner",
      summonCooldown: 6.5,
      summonPack: [{ type: "raider", count: 2 }, { type: "wolf", count: 1 }],
      boss: true,
      mass: 3.8,
      telegraphColor: "rgba(225, 173, 67, 0.55)",
      spriteSrc: "",
      spriteScale: 1.16,
      spriteW: 70,
      spriteH: 70,
      spriteOffsetX: 0,
      spriteOffsetY: 0
    },
    siegeking: {
      key: "siegeking",
      label: "Siege King",
      hp: 2300,
      speed: 32,
      radius: 31,
      damage: 42,
      attackRate: 1.12,
      reward: 420,
      fill: "#f0c26b",
      outline: "#735624",
      behavior: "bossRanged",
      attackRange: 250,
      projectileSpeed: 305,
      summonCooldown: 8.4,
      summonPack: [{ type: "brute", count: 1 }, { type: "hunter", count: 2 }],
      boss: true,
      mass: 4.6,
      telegraphColor: "rgba(240, 194, 107, 0.55)",
      spriteSrc: "",
      spriteScale: 1.22,
      spriteW: 76,
      spriteH: 76,
      spriteOffsetX: 0,
      spriteOffsetY: 0
    },
    siegecart: {
      key: "siegecart",
      label: "Siege cart",
      hp: 180,
      speed: 36,
      radius: 20,
      damage: 24,
      attackRate: 1.55,
      reward: 44,
      fill: "#bc7f4f",
      outline: "#5f3d1e",
      behavior: "siege",
      attackRange: 185,
      projectileSpeed: 255,
      mass: 2.2,
      telegraphColor: "rgba(188, 127, 79, 0.52)",
      spriteSrc: "",
      spriteScale: 1.08,
      spriteW: 60,
      spriteH: 52,
      spriteOffsetX: 0,
      spriteOffsetY: 0
    }
  };

  global.TowerDefenseContent = {
    DIFFICULTIES,
    START_SCREEN_OPTIONS,
    TOWER_TYPES,
    BUILD_COSTS,
    EDITABLE_ENEMY_TYPES,
    cloneEnemyConfig,
    createBuildables,
    createResearchDefinitionsV65,
    getEditableWaveDefinitions,
    expandEditableWaveGroups,
    makeWaveBlueprints,
    createPlayerUpgrades,
    createVillageUpgrades
  };
})(window);
