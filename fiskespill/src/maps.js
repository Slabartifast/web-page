(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const { clamp } = App.utils;

  App.MAPS = [
    {
      id: "skogstjern",
      name: "Skogstjern",
      waterType: "ferskvann",
      unlockRequirement: { type: "start" },
      fishPool: [
        { fishId: "mort", weight: 36 },
        { fishId: "abbor", weight: 34 },
        { fishId: "orret", weight: 18 },
        { fishId: "roye", weight: 5 },
      ],
      difficulty: 1,
      requiresBoat: false,
      size: { width: 1240, height: 760 },
      spawn: { x: 272, y: 472 },
      palette: {
        land: "#7fa564",
        landAlt: "#6f8e59",
        water: "#5da8c0",
        waterDeep: "#3a7994",
      },
      waterBodies: [{ type: "ellipse", x: 640, y: 390, rx: 340, ry: 220 }],
      decor: [
        { type: "hut", x: 122, y: 118, scale: 1.1 },
        { type: "tree", x: 112, y: 148, scale: 1.2 },
        { type: "tree", x: 196, y: 208, scale: 1.05 },
        { type: "tree", x: 196, y: 572, scale: 1.2 },
        { type: "tree", x: 1016, y: 126, scale: 1.1 },
        { type: "tree", x: 1076, y: 564, scale: 1.22 },
        { type: "tree", x: 916, y: 470, scale: 1.1 },
        { type: "reed", x: 358, y: 252, scale: 1.05 },
        { type: "reed", x: 874, y: 546, scale: 1.1 },
        { type: "rock", x: 338, y: 522, scale: 1.0 },
        { type: "rock", x: 950, y: 602, scale: 1.1 },
      ],
      bonusText: "Lunt og oversiktlig. Her lærer du rytmen før fjorden begynner å yppe seg.",
    },
    {
      id: "elvebredden",
      name: "Elvebredden",
      waterType: "ferskvann",
      unlockRequirement: { type: "level", amount: 2 },
      fishPool: [
        { fishId: "abbor", weight: 10 },
        { fishId: "orret", weight: 22 },
        { fishId: "harr", weight: 24 },
        { fishId: "gjedde", weight: 18 },
        { fishId: "laks", weight: 5 },
      ],
      difficulty: 2,
      requiresBoat: false,
      size: { width: 1680, height: 960 },
      spawn: { x: 188, y: 292 },
      palette: {
        land: "#8faf69",
        landAlt: "#76925d",
        water: "#4f97af",
        waterDeep: "#2d6881",
      },
      waterBodies: [
        { type: "ellipse", x: 250, y: 170, rx: 145, ry: 100 },
        { type: "ellipse", x: 520, y: 332, rx: 190, ry: 112 },
        { type: "ellipse", x: 840, y: 482, rx: 210, ry: 118 },
        { type: "ellipse", x: 1180, y: 620, rx: 225, ry: 126 },
        { type: "ellipse", x: 1460, y: 768, rx: 180, ry: 114 },
      ],
      decor: [
        { type: "tree", x: 110, y: 478, scale: 1.16 },
        { type: "tree", x: 244, y: 840, scale: 1.06 },
        { type: "tree", x: 462, y: 122, scale: 1.14 },
        { type: "tree", x: 934, y: 160, scale: 1.1 },
        { type: "tree", x: 1340, y: 244, scale: 1.2 },
        { type: "tree", x: 1510, y: 544, scale: 1.24 },
        { type: "reed", x: 616, y: 268, scale: 1.16 },
        { type: "reed", x: 998, y: 412, scale: 1.12 },
        { type: "reed", x: 1312, y: 560, scale: 1.08 },
        { type: "rock", x: 392, y: 556, scale: 1.22 },
        { type: "rock", x: 726, y: 644, scale: 1.08 },
        { type: "rock", x: 1530, y: 868, scale: 1.18 },
      ],
      bonusText: "Lang elv med mange kanter. Mer vandring, mer variasjon og mer drama i stanga.",
    },
    {
      id: "fjordkanten",
      name: "Fjordkanten",
      waterType: "saltvann",
      unlockRequirement: { type: "rodLevel", amount: 2 },
      fishPool: [
        { fishId: "makrell", weight: 26 },
        { fishId: "sei", weight: 24 },
        { fishId: "torsk", weight: 22 },
        { fishId: "lyr", weight: 12 },
        { fishId: "steinbit", weight: 4 },
      ],
      difficulty: 3,
      requiresBoat: false,
      size: { width: 1860, height: 980 },
      spawn: { x: 594, y: 238 },
      palette: {
        land: "#aca57c",
        landAlt: "#8f896a",
        water: "#5599b8",
        waterDeep: "#2b5f79",
      },
      waterBodies: [{ type: "rect", x: 640, y: 58, w: 1120, h: 860 }],
      decor: [
        { type: "dock", x: 540, y: 204, scale: 1.0 },
        { type: "dock", x: 584, y: 418, scale: 1.08 },
        { type: "dock", x: 568, y: 682, scale: 0.94 },
        { type: "hut", x: 156, y: 134, scale: 1.0 },
        { type: "tree", x: 190, y: 256, scale: 1.1 },
        { type: "tree", x: 208, y: 762, scale: 1.18 },
        { type: "rock", x: 516, y: 122, scale: 1.0 },
        { type: "rock", x: 572, y: 884, scale: 1.12 },
        { type: "reed", x: 506, y: 584, scale: 1.0 },
      ],
      bonusText: "Fjorden åpner seg. Bedre kast og riktige agn begynner å bety ordentlig penger.",
    },
    {
      id: "dypfjorden",
      name: "Dypfjorden",
      waterType: "saltvann",
      unlockRequirement: { type: "boatLevel", amount: 1 },
      fishPool: [
        { fishId: "torsk", weight: 14 },
        { fishId: "steinbit", weight: 18 },
        { fishId: "brosme", weight: 18 },
        { fishId: "lange", weight: 16 },
        { fishId: "kveite", weight: 6 },
      ],
      difficulty: 4,
      requiresBoat: true,
      size: { width: 2120, height: 1180 },
      spawn: { x: 280, y: 590 },
      palette: {
        land: "#8a8e7e",
        landAlt: "#768072",
        water: "#4a87a5",
        waterDeep: "#224b66",
      },
      waterBodies: [{ type: "rect", x: 0, y: 0, w: 2120, h: 1180 }],
      decor: [
        { type: "island", x: 302, y: 214, scale: 1.12 },
        { type: "island", x: 862, y: 330, scale: 0.98 },
        { type: "island", x: 1540, y: 262, scale: 1.06 },
        { type: "island", x: 1840, y: 816, scale: 1.1 },
        { type: "rock", x: 492, y: 962, scale: 1.02 },
        { type: "rock", x: 1194, y: 844, scale: 1.06 },
      ],
      bonusText: "Stor fjord, tung fisk og lang båtdag. Her begynner de voksne porsjonene.",
    },
    {
      id: "apenthav",
      name: "Åpent hav",
      waterType: "saltvann",
      unlockRequirement: {
        type: "all",
        requirements: [
          { type: "boatLevel", amount: 2 },
          { type: "level", amount: 5 },
        ],
      },
      fishPool: [
        { fishId: "steinbit", weight: 18 },
        { fishId: "brosme", weight: 14 },
        { fishId: "lange", weight: 15 },
        { fishId: "uer", weight: 14 },
        { fishId: "breiflabb", weight: 8 },
        { fishId: "kveite", weight: 10 },
      ],
      difficulty: 5,
      requiresBoat: true,
      size: { width: 2600, height: 1500 },
      spawn: { x: 420, y: 780 },
      palette: {
        land: "#919796",
        landAlt: "#7a8080",
        water: "#447f9f",
        waterDeep: "#1c3d56",
      },
      waterBodies: [{ type: "rect", x: 0, y: 0, w: 2600, h: 1500 }],
      decor: [
        { type: "island", x: 520, y: 302, scale: 0.94 },
        { type: "island", x: 1104, y: 1114, scale: 0.98 },
        { type: "island", x: 1910, y: 470, scale: 1.08 },
        { type: "rock", x: 2182, y: 1260, scale: 1.14 },
        { type: "rock", x: 1586, y: 962, scale: 0.94 },
        { type: "rock", x: 632, y: 1320, scale: 1.02 },
      ],
      bonusText: "Stor horisont, store penger og fisk som ser på budsjettet ditt som et forslag.",
    },
  ];

  App.getMapById = function getMapById(mapId) {
    return App.MAPS.find((map) => map.id === mapId);
  };

  function isInsideRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function isInsideEllipse(x, y, ellipse) {
    const normX = (x - ellipse.x) / ellipse.rx;
    const normY = (y - ellipse.y) / ellipse.ry;
    return normX * normX + normY * normY <= 1;
  }

  App.isPointInWater = function isPointInWater(map, x, y) {
    return map.waterBodies.some((body) => {
      if (body.type === "rect") {
        return isInsideRect(x, y, body);
      }
      return isInsideEllipse(x, y, body);
    });
  };

  App.canOccupyPoint = function canOccupyPoint(map, state, x, y) {
    const radius = state.player.radius || 14;
    const withinBounds =
      x >= radius &&
      x <= map.size.width - radius &&
      y >= radius &&
      y <= map.size.height - radius;
    if (!withinBounds) {
      return false;
    }
    const inWater = App.isPointInWater(map, x, y);
    return map.requiresBoat ? inWater : !inWater;
  };

  function getFacingVector(state) {
    const x = state.player.facingX || 1;
    const y = state.player.facingY || 0;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  function samplePoint(startX, startY, dirX, dirY, distance) {
    return {
      x: startX + dirX * distance,
      y: startY + dirY * distance,
    };
  }

  App.getCastContext = function getCastContext(state, map, castPower) {
    const direction = getFacingVector(state);
    const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
    const castingSkill = App.getSkillLevel(state, "casting");
    const power = clamp(castPower || 0, 0, 1);
    const minDistance = 18;
    const maxDistance =
      92 + rodData.level * 22 + castingSkill * 20 + power * (115 + rodData.level * 24);
    const startX = state.player.x;
    const startY = state.player.y;

    if (map.requiresBoat) {
      if (!App.isPointInWater(map, startX, startY)) {
        return { ok: false, reason: "Båten står ikke i vannet." };
      }
      let bestPoint = null;
      for (let distance = minDistance; distance <= maxDistance; distance += 8) {
        const point = samplePoint(startX, startY, direction.x, direction.y, distance);
        if (!App.isPointInWater(map, point.x, point.y)) {
          break;
        }
        bestPoint = point;
      }
      if (!bestPoint) {
        return { ok: false, reason: "Kastet fant ikke åpent vann." };
      }
      return { ok: true, castPoint: bestPoint, castDistance: maxDistance };
    }

    let firstWaterPoint = null;
    let lastWaterPoint = null;
    let firstWaterDistance = 0;

    for (let distance = 12; distance <= maxDistance; distance += 4) {
      const point = samplePoint(startX, startY, direction.x, direction.y, distance);
      const inWater = App.isPointInWater(map, point.x, point.y);
      if (!firstWaterPoint && inWater) {
        firstWaterPoint = point;
        firstWaterDistance = distance;
      }
      if (firstWaterPoint && inWater) {
        lastWaterPoint = point;
      }
      if (firstWaterPoint && !inWater) {
        break;
      }
    }

    if (!firstWaterPoint) {
      return { ok: false, reason: "Kastet traff land." };
    }
    if (firstWaterDistance > 82) {
      return { ok: false, reason: "Kastet landet for kort." };
    }
    return {
      ok: true,
      castPoint: lastWaterPoint || firstWaterPoint,
      castDistance: firstWaterDistance,
    };
  };

  App.ensureUnlockedMaps = function ensureUnlockedMaps(state) {
    for (let i = 0; i < App.MAPS.length; i += 1) {
      const map = App.MAPS[i];
      const unlocked = state.unlockedMapIds.includes(map.id);
      if (!unlocked && App.meetsRequirement(state, map.unlockRequirement)) {
        state.unlockedMapIds.push(map.id);
        App.addMessage(state, `Nytt område låst opp: ${map.name}.`);
      }
    }
  };

  App.changeMap = function changeMap(state, mapId) {
    const map = App.getMapById(mapId);
    if (!map || !state.unlockedMapIds.includes(mapId)) {
      return false;
    }
    state.currentMapId = mapId;
    state.player.x = clamp(map.spawn.x, 30, map.size.width - 30);
    state.player.y = clamp(map.spawn.y, 30, map.size.height - 30);
    state.fishing = App.createEmptyFishingState();
    state.ui.activePanel = null;
    state.phase = "day";
    App.addMessage(state, `Du drar til ${map.name}.`);
    return true;
  };
})();
