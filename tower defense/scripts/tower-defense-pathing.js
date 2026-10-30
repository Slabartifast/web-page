(function attachTowerDefensePathing(global) {
  const ORTHO_DIRS = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  const ALL_DIRS = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  class MinHeap {
    constructor() {
      this.items = [];
    }

    push(entry) {
      this.items.push(entry);
      this.#bubbleUp(this.items.length - 1);
    }

    pop() {
      if (!this.items.length) return null;
      const first = this.items[0];
      const last = this.items.pop();
      if (this.items.length && last) {
        this.items[0] = last;
        this.#bubbleDown(0);
      }
      return first;
    }

    get size() {
      return this.items.length;
    }

    #bubbleUp(index) {
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (this.items[parent].score <= this.items[index].score) break;
        const temp = this.items[parent];
        this.items[parent] = this.items[index];
        this.items[index] = temp;
        index = parent;
      }
    }

    #bubbleDown(index) {
      const length = this.items.length;
      while (true) {
        let smallest = index;
        const left = index * 2 + 1;
        const right = left + 1;
        if (left < length && this.items[left].score < this.items[smallest].score) smallest = left;
        if (right < length && this.items[right].score < this.items[smallest].score) smallest = right;
        if (smallest === index) break;
        const temp = this.items[smallest];
        this.items[smallest] = this.items[index];
        this.items[index] = temp;
        index = smallest;
      }
    }
  }

  function cellKey(col, row) {
    return col + "," + row;
  }

  function octile(ax, ay, bx, by) {
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    const diag = Math.min(dx, dy);
    const straight = Math.max(dx, dy) - diag;
    return diag * 1.41421356237 + straight;
  }

  function createRouter(deps) {
    const {
      getState,
      gridSize,
      worldWidth,
      worldHeight,
      clamp,
      distance,
      normalize,
      getGridCellAtWorld,
      getGridCellCenter,
      isOpenPosition,
      searchNearestOpenPosition,
      moveEntityWithTileSlide
    } = deps;
    const slideEntity = (typeof moveEntityWithTileSlide === "function") ? moveEntityWithTileSlide : function() { return false; };

    function ensurePathingState() {
      const state = getState();
      if (!state) return null;
      if (!state.pathing || typeof state.pathing !== "object") state.pathing = {};
      if (!Number.isFinite(state.pathing.mapVersion)) state.pathing.mapVersion = 1;
      if (!state.pathing.flowCache || typeof state.pathing.flowCache !== "object") state.pathing.flowCache = {};
      return state.pathing;
    }

    function clearRouteState(unit) {
      if (!unit) return;
      const nav = unit._pathingNav || (unit._pathingNav = {});
      nav.key = "";
      nav.path = [];
      nav.index = 0;
      nav.proxyTarget = null;
      nav.repathAt = 0;
      nav.stallTime = 0;
      nav.bestRemaining = Number.POSITIVE_INFINITY;
      nav.bestIndex = -1;
      unit._pathingStallTime = 0;
      unit.routeCells = [];
      unit.routeKey = null;
      unit.routeTimer = 0;
    }

    function invalidate(reason) {
      const pathing = ensurePathingState();
      if (!pathing) return;
      pathing.mapVersion += 1;
      pathing.flowCache = {};
      pathing.lastInvalidationReason = reason || "";
    }

    function buildClearanceFlow(radius, friendly) {
      const state = getState();
      if (!state || !state.mapMeta || !state.base) return null;
      const cols = state.mapMeta.cols;
      const rows = state.mapMeta.rows;
      const blocked = Array.from({ length: rows }, () => Array(cols).fill(false));
      const distanceField = Array.from({ length: rows }, () => Array(cols).fill(Number.POSITIVE_INFINITY));
      const openOpts = friendly ? { friendly: true, mode: "unit" } : { mode: "unit" };
      const heap = new MinHeap();

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const center = getGridCellCenter(col, row);
          const cellBlocked = !isOpenPosition(center.x, center.y, radius, openOpts);
          blocked[row][col] = cellBlocked;
          if (!cellBlocked && distance(center.x, center.y, state.base.x, state.base.y) <= state.base.radius + 34) {
            distanceField[row][col] = 0;
            heap.push({ col, row, score: 0 });
          }
        }
      }

      while (heap.size) {
        const current = heap.pop();
        const baseCost = distanceField[current.row][current.col];
        if (current.score > baseCost + 1e-6) continue;
        for (const dir of ALL_DIRS) {
          const nextCol = current.col + dir[0];
          const nextRow = current.row + dir[1];
          if (nextCol < 0 || nextRow < 0 || nextCol >= cols || nextRow >= rows) continue;
          if (blocked[nextRow][nextCol]) continue;
          if (dir[0] !== 0 && dir[1] !== 0) {
            if (blocked[current.row][nextCol] || blocked[nextRow][current.col]) continue;
          }
          const nextCost = baseCost + (dir[0] !== 0 && dir[1] !== 0 ? 1.41421356237 : 1);
          if (nextCost + 1e-6 < distanceField[nextRow][nextCol]) {
            distanceField[nextRow][nextCol] = nextCost;
            heap.push({ col: nextCol, row: nextRow, score: nextCost });
          }
        }
      }

      return {
        cols,
        rows,
        blocked,
        distanceField,
        clearance: radius,
        friendly: !!friendly
      };
    }

    function getFlow(radius, friendly) {
      const pathing = ensurePathingState();
      if (!pathing) return null;
      const key = [
        pathing.mapVersion,
        friendly ? "friendly" : "enemy",
        Math.max(2, Math.ceil(radius || 0))
      ].join(":");
      if (!pathing.flowCache[key]) {
        pathing.flowCache[key] = buildClearanceFlow(Math.max(2, Math.ceil(radius || 0)), !!friendly);
      }
      return pathing.flowCache[key];
    }

    function getDistanceAt(flow, x, y) {
      if (!flow) return Number.POSITIVE_INFINITY;
      const col = clamp(Math.floor(x / gridSize), 0, flow.cols - 1);
      const row = clamp(Math.floor(y / gridSize), 0, flow.rows - 1);
      if (!flow.distanceField[row]) return Number.POSITIVE_INFINITY;
      return flow.distanceField[row][col];
    }

    function isReachable(flow, x, y) {
      return Number.isFinite(getDistanceAt(flow, x, y));
    }

    function isCellReachable(flow, col, row) {
      if (!flow) return false;
      if (col < 0 || row < 0 || col >= flow.cols || row >= flow.rows) return false;
      return Number.isFinite(flow.distanceField[row][col]);
    }

    function findNearestOpenCell(flow, col, row, maxRadius = 8) {
      if (!flow) return null;
      if (col >= 0 && row >= 0 && col < flow.cols && row < flow.rows && !flow.blocked[row][col]) {
        return { col, row, key: cellKey(col, row) };
      }
      for (let radius = 1; radius <= maxRadius; radius += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const nextCol = col + dx;
            const nextRow = row + dy;
            if (nextCol < 0 || nextRow < 0 || nextCol >= flow.cols || nextRow >= flow.rows) continue;
            if (flow.blocked[nextRow][nextCol]) continue;
            return { col: nextCol, row: nextRow, key: cellKey(nextCol, nextRow) };
          }
        }
      }
      return null;
    }

    function collectGoalCells(flow, tx, ty, radiusCells = 1, expandMax = 12, opts = {}) {
      if (!flow) return [];
      const target = getGridCellAtWorld(tx, ty);
      const startRadius = Math.max(0, radiusCells || 0);
      const requireReachable = !!opts.requireReachable;
      for (let radius = startRadius; radius <= expandMax; radius += 1) {
        const goals = [];
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const col = target.col + dx;
            const row = target.row + dy;
            if (col < 0 || row < 0 || col >= flow.cols || row >= flow.rows) continue;
            if (flow.blocked[row][col]) continue;
            if (requireReachable && !isCellReachable(flow, col, row)) continue;
            goals.push({ col, row, key: cellKey(col, row) });
          }
        }
        if (goals.length) return goals;
      }
      return [];
    }

    function planPathToTarget(flow, startCell, target, opts = {}) {
      const requireReachable = !!opts.requireReachable;
      const radius = Math.max(2, opts.radius || 0);
      let goals = collectGoalCells(
        flow,
        target.x,
        target.y,
        opts.goalRadiusCells,
        opts.goalSearchRadius,
        { requireReachable }
      );
      let path = buildPath(flow, startCell, goals);
      let proxyTarget = null;

      if (path.length) {
        return { goals, path, proxyTarget };
      }

      proxyTarget = nearestReachablePosition(target.x, target.y, radius, {
        friendly: !!opts.friendly,
        goal: target
      });
      if (!proxyTarget) {
        return { goals, path, proxyTarget: null };
      }

      goals = collectGoalCells(
        flow,
        proxyTarget.x,
        proxyTarget.y,
        0,
        Math.max(6, opts.goalSearchRadius || 0),
        { requireReachable }
      );
      path = buildPath(flow, startCell, goals);
      return { goals, path, proxyTarget };
    }

    function heuristicToGoals(col, row, goals) {
      let best = Number.POSITIVE_INFINITY;
      for (const goal of goals) {
        const score = octile(col, row, goal.col, goal.row);
        if (score < best) best = score;
      }
      return best;
    }

    function buildPath(flow, startCell, goals) {
      if (!flow || !goals.length) return [];
      const start = findNearestOpenCell(flow, startCell.col, startCell.row, 8);
      if (!start) return [];
      const goalSet = new Set(goals.map((goal) => goal.key));
      if (goalSet.has(start.key)) return [];
      const open = new MinHeap();
      const cameFrom = new Map();
      const gScore = new Map();
      const startKey = start.key;
      gScore.set(startKey, 0);
      open.push({ col: start.col, row: start.row, key: startKey, score: heuristicToGoals(start.col, start.row, goals) });

      while (open.size) {
        const current = open.pop();
        const currentCost = gScore.get(current.key);
        if (goalSet.has(current.key)) {
          const path = [];
          let cursor = current.key;
          while (cursor && cursor !== startKey) {
            const parts = cursor.split(",");
            path.push({ col: Number(parts[0]), row: Number(parts[1]) });
            cursor = cameFrom.get(cursor);
          }
          path.reverse();
          return path;
        }

        for (const dir of ALL_DIRS) {
          const nextCol = current.col + dir[0];
          const nextRow = current.row + dir[1];
          if (nextCol < 0 || nextRow < 0 || nextCol >= flow.cols || nextRow >= flow.rows) continue;
          if (flow.blocked[nextRow][nextCol]) continue;
          if (dir[0] !== 0 && dir[1] !== 0) {
            if (flow.blocked[current.row][nextCol] || flow.blocked[nextRow][current.col]) continue;
          }
          const nextKey = cellKey(nextCol, nextRow);
          const stepCost = dir[0] !== 0 && dir[1] !== 0 ? 1.41421356237 : 1;
          const nextCost = currentCost + stepCost;
          if (nextCost + 1e-6 >= (gScore.get(nextKey) || Number.POSITIVE_INFINITY)) continue;
          cameFrom.set(nextKey, current.key);
          gScore.set(nextKey, nextCost);
          open.push({
            col: nextCol,
            row: nextRow,
            key: nextKey,
            score: nextCost + heuristicToGoals(nextCol, nextRow, goals)
          });
        }
      }

      return [];
    }

    function setUnitPosition(unit, x, y) {
      unit.x = x;
      unit.y = y;
      if (typeof unit.vx === "number") unit.vx = 0;
      if (typeof unit.vy === "number") unit.vy = 0;
      if (typeof unit.kbX === "number") unit.kbX = 0;
      if (typeof unit.kbY === "number") unit.kbY = 0;
      unit._lastValidX = x;
      unit._lastValidY = y;
    }

    function nearestReachablePosition(x, y, radius, opts = {}) {
      const friendly = !!opts.friendly;
      const openOpts = friendly ? { friendly: true, mode: "unit" } : { mode: "unit" };
      const flow = friendly ? null : getFlow(radius, false);
      if (isOpenPosition(x, y, radius, openOpts) && (friendly || isReachable(flow, x, y))) {
        return { x, y };
      }

      let best = null;
      for (let distStep = 4; distStep <= gridSize * 12; distStep += 4) {
        const samples = Math.max(16, Math.ceil(distStep / 3));
        for (let i = 0; i < samples; i += 1) {
          const angle = (i / samples) * Math.PI * 2;
          const nx = clamp(x + Math.cos(angle) * distStep, radius, worldWidth - radius);
          const ny = clamp(y + Math.sin(angle) * distStep, radius, worldHeight - radius);
          if (!isOpenPosition(nx, ny, radius, openOpts)) continue;
          if (!friendly && !isReachable(flow, nx, ny)) continue;
          const score = distance(nx, ny, x, y)
            + (opts.goal ? distance(nx, ny, opts.goal.x, opts.goal.y) * 0.06 : 0)
            + (!friendly ? getDistanceAt(flow, nx, ny) * 0.1 : 0);
          if (!best || score < best.score) best = { x: nx, y: ny, score };
        }
        if (best) return best;
      }

      if (typeof searchNearestOpenPosition === "function") {
        const fallback = searchNearestOpenPosition(x, y, radius, openOpts);
        if (fallback && (friendly || isReachable(flow, fallback.x, fallback.y))) return fallback;
      }

      if (!friendly && flow) {
        for (let row = 0; row < flow.rows; row += 1) {
          for (let col = 0; col < flow.cols; col += 1) {
            if (flow.blocked[row][col]) continue;
            if (!Number.isFinite(flow.distanceField[row][col])) continue;
            const center = getGridCellCenter(col, row);
            if (!isOpenPosition(center.x, center.y, radius, openOpts)) continue;
            const score = distance(center.x, center.y, x, y)
              + flow.distanceField[row][col] * 0.2
              + (opts.goal ? distance(center.x, center.y, opts.goal.x, opts.goal.y) * 0.05 : 0);
            if (!best || score < best.score) best = { x: center.x, y: center.y, score };
          }
        }
      }

      return best;
    }

    function estimateRemaining(unit, target, path, index) {
      if (!Array.isArray(path) || index >= path.length) {
        return distance(unit.x, unit.y, target.x, target.y);
      }
      const next = getGridCellCenter(path[index].col, path[index].row);
      return distance(unit.x, unit.y, next.x, next.y)
        + Math.max(0, path.length - index - 1) * gridSize
        + distance(next.x, next.y, target.x, target.y);
    }

    function markProgress(unit, nav, remaining) {
      if (remaining < nav.bestRemaining - 1.5 || nav.index > nav.bestIndex) {
        nav.bestRemaining = remaining;
        nav.bestIndex = nav.index;
        nav.stallTime = 0;
      }
    }

    function moveUnit(unit, target, dt, speed, opts = {}) {
      if (!unit || unit.dead || unit.hp <= 0) return false;
      const friendly = !!opts.friendly;
      const radius = Math.max(2, unit.radius || 8);
      const openOpts = friendly ? { friendly: true, mode: "unit" } : { mode: "unit" };

      if (!isOpenPosition(unit.x, unit.y, radius, openOpts)) {
        const safe = nearestReachablePosition(unit.x, unit.y, radius, { friendly, goal: target });
        if (safe) {
          setUnitPosition(unit, safe.x, safe.y);
          clearRouteState(unit);
        }
      }

      const flow = getFlow(radius, friendly);
      if (!flow) return false;
      const pathing = ensurePathingState();
      const nav = unit._pathingNav || (unit._pathingNav = {});
      const radiusCells = opts.goalRadiusCells == null ? (friendly ? 0 : 1) : opts.goalRadiusCells;
      const routeMode = opts.routeMode || (friendly ? "friendly" : "enemy");
      const targetCell = getGridCellAtWorld(target.x, target.y);
      const routeKey = [
        pathing.mapVersion,
        friendly ? "friendly" : "enemy",
        Math.max(2, Math.ceil(radius)),
        routeMode,
        targetCell.col + "," + targetCell.row,
        "r" + radiusCells
      ].join(":");

      nav.repathAt = (nav.repathAt || 0) - Math.max(0, dt || 0);
      const mustRepath = nav.key !== routeKey
        || nav.mapVersion !== pathing.mapVersion
        || !Array.isArray(nav.path)
        || nav.repathAt <= 0;

      if (mustRepath) {
        const routePlan = planPathToTarget(
          flow,
          getGridCellAtWorld(unit.x, unit.y),
          target,
          {
            friendly,
            radius,
            goalRadiusCells: radiusCells,
            goalSearchRadius: opts.goalSearchRadius || 12,
            requireReachable: !friendly
          }
        );
        nav.path = routePlan.path;
        nav.proxyTarget = routePlan.proxyTarget;
        nav.index = 0;
        nav.key = routeKey;
        nav.mapVersion = pathing.mapVersion;
        nav.repathAt = opts.repathTime || 0.4;
        nav.bestRemaining = Number.POSITIVE_INFINITY;
        nav.bestIndex = -1;
        unit.routeCells = nav.path.slice();
        unit.routeKey = routeKey;
        unit.routeTimer = nav.repathAt;
      }

      while (nav.path && nav.index < nav.path.length) {
        const nextCenter = getGridCellCenter(nav.path[nav.index].col, nav.path[nav.index].row);
        if (distance(unit.x, unit.y, nextCenter.x, nextCenter.y) <= Math.max(8, radius + 3)) {
          nav.index += 1;
          continue;
        }
        break;
      }

      let aim = null;
      if (nav.path && nav.index < nav.path.length) {
        aim = getGridCellCenter(nav.path[nav.index].col, nav.path[nav.index].row);
      } else if (!friendly && isReachable(flow, unit.x, unit.y)) {
        const flowDir = getFlowDirectionFor(radius, unit.x, unit.y, false);
        aim = {
          x: clamp(unit.x + flowDir.x * gridSize, radius, worldWidth - radius),
          y: clamp(unit.y + flowDir.y * gridSize, radius, worldHeight - radius)
        };
      } else if (friendly && nav.proxyTarget) {
        aim = nav.proxyTarget;
      }
      const beforeX = unit.x;
      const beforeY = unit.y;
      let moved = false;

      if (aim) {
        const dx = aim.x - unit.x;
        const dy = aim.y - unit.y;
        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
          const dir = normalize(dx, dy);
          if (typeof unit.facing === "number") unit.facing = Math.atan2(dir.y, dir.x);
          if (typeof unit.angle === "number") unit.angle = Math.atan2(dir.y, dir.x);
          moved = !!slideEntity(
            unit,
            dir.x * Math.max(0, speed || 0) * Math.max(0, dt || 0),
            dir.y * Math.max(0, speed || 0) * Math.max(0, dt || 0),
            { friendly, padding: 0, mode: "unit" }
          );
        }
      }

      if (!aim && nav.proxyTarget && (nav.stallTime || 0) < (friendly ? 2.5 : 5.0)) {
        nav.repathAt = 0;
      }

      unit._lastValidX = unit.x;
      unit._lastValidY = unit.y;
      const movedDist = distance(beforeX, beforeY, unit.x, unit.y);
      const remaining = estimateRemaining(unit, target, nav.path, nav.index);
      markProgress(unit, nav, remaining);

      const movementThreshold = Math.max(0.12, Math.max(0, speed || 0) * Math.max(0, dt || 0) * 0.05);
      if (movedDist < movementThreshold) {
        nav.stallTime = (nav.stallTime || 0) + Math.max(0, dt || 0);
      } else if (remaining >= nav.bestRemaining - 0.5) {
        nav.stallTime = Math.max(0, (nav.stallTime || 0) - Math.max(0, dt || 0) * 0.8);
      }

      unit._pathingStallTime = nav.stallTime || 0;

      if (!moved) nav.repathAt = 0;
      if ((nav.stallTime || 0) >= (friendly ? 0.9 : 1.2)) nav.repathAt = 0;

      const hardRecoverAt = friendly ? 2.5 : 5.0;
      if ((nav.stallTime || 0) >= hardRecoverAt) {
        const safe = nearestReachablePosition(unit.x, unit.y, radius, { friendly, goal: target });
        if (safe) {
          setUnitPosition(unit, safe.x, safe.y);
          clearRouteState(unit);
          unit._pathingRecoveredAt = Date.now();
          return true;
        }
      }

      return moved;
    }

    function moveAway(unit, fromX, fromY, dt, speed, retreatDistance = 84, opts = {}) {
      if (!unit) return false;
      const radius = unit.radius || 8;
      const dir = normalize(unit.x - fromX, unit.y - fromY);
      const target = {
        x: clamp(unit.x + dir.x * retreatDistance, radius, worldWidth - radius),
        y: clamp(unit.y + dir.y * retreatDistance, radius, worldHeight - radius)
      };
      return moveUnit(unit, target, dt, speed, {
        ...opts,
        goalRadiusCells: opts.goalRadiusCells == null ? 1 : opts.goalRadiusCells,
        routeMode: opts.routeMode || "retreat"
      });
    }

    function getFlowDirectionFor(radius, x, y, friendly) {
      const flow = getFlow(radius, friendly);
      if (!flow) return normalize(0, 0);
      const col = clamp(Math.floor(x / gridSize), 0, flow.cols - 1);
      const row = clamp(Math.floor(y / gridSize), 0, flow.rows - 1);
      let best = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const dir of ALL_DIRS) {
        const nextCol = col + dir[0];
        const nextRow = row + dir[1];
        if (nextCol < 0 || nextRow < 0 || nextCol >= flow.cols || nextRow >= flow.rows) continue;
        if (flow.blocked[nextRow][nextCol]) continue;
        if (dir[0] !== 0 && dir[1] !== 0) {
          if (flow.blocked[row][nextCol] || flow.blocked[nextRow][col]) continue;
        }
        const nextDist = flow.distanceField[nextRow][nextCol];
        if (!Number.isFinite(nextDist) || nextDist >= bestDist) continue;
        bestDist = nextDist;
        best = getGridCellCenter(nextCol, nextRow);
      }
      if (!best) {
        const state = getState();
        if (!state || !state.base) return { x: 0, y: 0 };
        return normalize(state.base.x - x, state.base.y - y);
      }
      return normalize(best.x - x, best.y - y);
    }

    return {
      invalidate,
      clearRouteState,
      getDistanceValue(x, y, radius = 10) {
        return getDistanceAt(getFlow(radius, false), x, y);
      },
      getFlowDirection(x, y, radius = 10, friendly = false) {
        return getFlowDirectionFor(radius, x, y, friendly);
      },
      moveEnemy(enemy, tx, ty, dt, speedFactor = 1, opts = {}) {
        return moveUnit(enemy, { x: tx, y: ty }, dt, (enemy && enemy.speed ? enemy.speed : 0) * speedFactor, opts);
      },
      moveFriendly(unit, tx, ty, dt, speedCap = 228, opts = {}) {
        return moveUnit(unit, { x: tx, y: ty }, dt, speedCap, { ...opts, friendly: true });
      },
      moveEnemyAway(enemy, fromX, fromY, dt, speedFactor = 1, retreatDistance = 84, opts = {}) {
        return moveAway(enemy, fromX, fromY, dt, (enemy && enemy.speed ? enemy.speed : 0) * speedFactor, retreatDistance, opts);
      },
      nearestReachablePosition,
      isReachableEnemyPosition(x, y, radius = 10) {
        return isReachable(getFlow(radius, false), x, y);
      }
    };
  }

  global.__TD_USE_UNIFIED_PATHING = true;
  global.TowerDefensePathing = {
    createRouter
  };
})(typeof window !== "undefined" ? window : globalThis);
