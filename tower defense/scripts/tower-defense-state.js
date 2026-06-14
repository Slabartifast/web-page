(function attachTowerDefenseState(global) {
  const phaseApi = global.TowerDefensePhases || {};
  const PHASES = phaseApi.PHASES || { START: "start" };

  function createRuntimeState(deps) {
    const proceduralMap = deps.createProceduralMap();
    const runtimeFlow = deps.buildFlowField({
      worldWidth: proceduralMap.worldWidth,
      worldHeight: proceduralMap.worldHeight,
      walls: proceduralMap.naturalWalls,
      base: proceduralMap.base
    });
    proceduralMap.gridMeta = deps.buildGridData(proceduralMap, runtimeFlow);

    return {
      phase: PHASES.START,
      phaseHistory: [],
      selectedMapKey: deps.selectedMapKey,
      nextWave: 0,
      gold: 240,
      wood: 130,
      stone: 100,
      food: 44,
      villagerProgress: 0,
      villagers: 6,
      jobs: {
        farmers: 2,
        lumberjacks: 2,
        quarryers: 1,
        builders: 1
      },
      townOpen: false,
      map: proceduralMap,
      mapMeta: proceduralMap.gridMeta,
      runtimeFlow,
      runtimeBlockers: [...proceduralMap.naturalWalls],
      difficultyKey: "normal",
      camera: {
        x: deps.clamp(proceduralMap.base.x - deps.width / 2, 0, deps.worldWidth - deps.width),
        y: deps.clamp(proceduralMap.base.y - deps.height / 2, 0, deps.worldHeight - deps.height)
      },
      base: {
        x: proceduralMap.base.x,
        y: proceduralMap.base.y,
        radius: proceduralMap.base.radius,
        noBuildRadius: proceduralMap.base.noBuildRadius,
        hp: 560,
        maxHp: 560,
        archerLevel: 0,
        marketLevel: 0,
        wallLevel: 0,
        workshopLevel: 0,
        cooldown: 0
      },
      player: {
        x: proceduralMap.base.x,
        y: proceduralMap.base.y,
        radius: 18,
        hp: 150,
        maxHp: 150,
        maxSpeed: 228,
        accel: 980,
        drag: 6.8,
        damage: 22,
        range: 194,
        fireRate: 2.25,
        projectileSpeed: 560,
        cooldown: 0,
        angle: -Math.PI / 2,
        visualAngle: -Math.PI / 2,
        aimAngle: -Math.PI / 2,
        alive: true,
        respawnTimer: 0,
        invuln: 0,
        vx: 0,
        vy: 0,
        momentum: 0,
        chargeThreshold: 170,
        chargeCooldown: 0,
        chargeBase: 18,
        aimMode: "nearest"
      },
      towers: [],
      barriers: [],
      supportUnits: [],
      camps: proceduralMap.campSlots.map(deps.buildCampState),
      enemies: [],
      projectiles: [],
      floaters: [],
      rings: [],
      banners: [],
      splats: [],
      activeWave: null,
      hoverTowerId: null,
      hoveredEnemyId: null,
      logs: [],
      focusBoss: false,
      uiPulse: 0,
      researchPoints: 0,
      researchResource: 0,
      audio: {
        enabled: true,
        unlocked: false,
        ctx: null
      },
      menu: null,
      briefingWave: null,
      score: deps.createScoreState("normal"),
      upgrades: {
        player: {
          damage: 0,
          rate: 0,
          range: 0,
          speed: 0,
          armor: 0
        },
        village: {
          walls: 0,
          archers: 0,
          market: 0,
          workshop: 0
        }
      },
      research: {
        fletching: false,
        cavalry: false,
        torchlight: false,
        masonry: false,
        logistics: false,
        cartography: false,
        towerLanterns: false,
        deconstruction: false,
        bookkeeping: false,
        ballistaUnlock: false,
        sniperUnlock: false,
        bombardUnlock: false
      }
    };
  }

  global.TowerDefenseState = {
    createRuntimeState
  };
})(window);
