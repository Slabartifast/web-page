import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceRoot = process.cwd();
await import(pathToFileURL(path.join(workspaceRoot, "scripts", "tower-defense-pathing.js")).href);

if (!globalThis.TowerDefensePathing || typeof globalThis.TowerDefensePathing.createRouter !== "function") {
  throw new Error("TowerDefensePathing.createRouter was not registered.");
}

const GRID_SIZE = 10;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 100;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function getGridCellAtWorld(x, y) {
  return {
    col: clamp(Math.floor(x / GRID_SIZE), 0, WORLD_WIDTH / GRID_SIZE - 1),
    row: clamp(Math.floor(y / GRID_SIZE), 0, WORLD_HEIGHT / GRID_SIZE - 1)
  };
}

function getGridCellCenter(col, row) {
  return {
    x: col * GRID_SIZE + GRID_SIZE / 2,
    y: row * GRID_SIZE + GRID_SIZE / 2
  };
}

function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  return distance(cx, cy, nx, ny) < r - 1e-6;
}

function createHarness(blockedCells, options = {}) {
  const blocked = new Set(blockedCells.map(([col, row]) => `${col},${row}`));
  const state = {
    base: { x: 15, y: 15, radius: 9 },
    mapMeta: { cols: WORLD_WIDTH / GRID_SIZE, rows: WORLD_HEIGHT / GRID_SIZE },
    pathing: { mapVersion: 1, flowCache: {}, lastInvalidationReason: "" }
  };

  function isBlockedCell(col, row) {
    return blocked.has(`${col},${row}`);
  }

  function isOpenPosition(x, y, radius) {
    if (x - radius < 0 || y - radius < 0 || x + radius > WORLD_WIDTH || y + radius > WORLD_HEIGHT) return false;
    const minCol = clamp(Math.floor((x - radius) / GRID_SIZE), 0, state.mapMeta.cols - 1);
    const maxCol = clamp(Math.floor((x + radius) / GRID_SIZE), 0, state.mapMeta.cols - 1);
    const minRow = clamp(Math.floor((y - radius) / GRID_SIZE), 0, state.mapMeta.rows - 1);
    const maxRow = clamp(Math.floor((y + radius) / GRID_SIZE), 0, state.mapMeta.rows - 1);
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (!isBlockedCell(col, row)) continue;
        const rx = col * GRID_SIZE;
        const ry = row * GRID_SIZE;
        if (circleIntersectsRect(x, y, radius, rx, ry, GRID_SIZE, GRID_SIZE)) return false;
      }
    }
    return true;
  }

  function moveEntityWithTileSlide(entity, dx, dy, opts = {}) {
    const radius = Math.max(2, (entity.radius || 0) + (opts.padding || 0));
    const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
    const steps = Math.max(1, Math.ceil(maxDelta / 4));
    const stepX = dx / steps;
    const stepY = dy / steps;
    let moved = false;
    for (let i = 0; i < steps; i += 1) {
      if (stepX !== 0) {
        const nextX = clamp(entity.x + stepX, radius, WORLD_WIDTH - radius);
        if (isOpenPosition(nextX, entity.y, radius, opts)) {
          entity.x = nextX;
          moved = true;
        }
      }
      if (stepY !== 0) {
        const nextY = clamp(entity.y + stepY, radius, WORLD_HEIGHT - radius);
        if (isOpenPosition(entity.x, nextY, radius, opts)) {
          entity.y = nextY;
          moved = true;
        }
      }
    }
    entity._lastValidX = entity.x;
    entity._lastValidY = entity.y;
    return moved;
  }

  const router = globalThis.TowerDefensePathing.createRouter({
    getState: () => state,
    gridSize: GRID_SIZE,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    clamp,
    distance,
    normalize,
    getGridCellAtWorld,
    getGridCellCenter,
    isOpenPosition,
    searchNearestOpenPosition: null,
    moveEntityWithTileSlide
  });

  if (options.invalidate !== false) router.invalidate("test");
  return { state, router, isOpenPosition };
}

function makeEnemy(x, y) {
  return {
    x,
    y,
    radius: 4,
    speed: 18,
    hp: 10,
    dead: false,
    angle: 0,
    facing: 0
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runDetourTest() {
  const harness = createHarness([
    [5, 1], [5, 2], [5, 3], [5, 4], [5, 6], [5, 7], [5, 8]
  ]);
  const enemy = makeEnemy(85, 85);
  const startDist = distance(enemy.x, enemy.y, harness.state.base.x, harness.state.base.y);
  for (let i = 0; i < 80; i += 1) {
    harness.router.moveEnemy(enemy, harness.state.base.x, harness.state.base.y, 0.1, 1, {
      routeMode: "detour-test",
      goalRadiusCells: 1
    });
  }
  const endDist = distance(enemy.x, enemy.y, harness.state.base.x, harness.state.base.y);
  assert(endDist < startDist - 18, `enemy did not make meaningful detour progress (${startDist} -> ${endDist})`);
  assert(harness.isOpenPosition(enemy.x, enemy.y, enemy.radius), "enemy ended inside blocked geometry after detour test");
}

function runPocketProxyTest() {
  const harness = createHarness([
    [5, 5], [6, 5], [7, 5],
    [5, 6],         [7, 6],
    [5, 7], [6, 7], [7, 7]
  ]);
  const enemy = makeEnemy(85, 85);
  const moved = harness.router.moveEnemy(enemy, 65, 65, 0.1, 1, {
    routeMode: "pocket-test",
    goalRadiusCells: 0
  });
  assert(moved, "enemy did not move when target sat inside an unreachable pocket");
  assert(Array.isArray(enemy.routeCells) && enemy.routeCells.length > 0, "router did not build a proxy route around unreachable pocket");
}

function runBlockedRecoveryTest() {
  const harness = createHarness([[8, 8]]);
  const enemy = makeEnemy(85, 85);
  enemy.x = 85;
  enemy.y = 85;
  const moved = harness.router.moveEnemy(enemy, harness.state.base.x, harness.state.base.y, 0.1, 1, {
    routeMode: "recovery-test",
    goalRadiusCells: 1
  });
  assert(moved, "enemy did not recover from blocked starting position");
  assert(harness.isOpenPosition(enemy.x, enemy.y, enemy.radius), "enemy recovery left unit inside blocked geometry");
}

runDetourTest();
runPocketProxyTest();
runBlockedRecoveryTest();

console.log("pathing regression tests passed");
