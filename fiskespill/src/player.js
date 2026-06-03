(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const { clamp } = App.utils;

  App.updatePlayer = function updatePlayer(state, input, deltaSeconds) {
    const map = App.getMapById(state.currentMapId);
    const fishingBusy = state.fishing.mode !== "idle";
    if (!map || fishingBusy || state.phase !== "day") {
      return;
    }

    let moveX = input.moveX || 0;
    let moveY = input.moveY || 0;
    if (moveX === 0 && moveY === 0) {
      return;
    }

    const length = Math.hypot(moveX, moveY) || 1;
    moveX /= length;
    moveY /= length;

    const boatBonus = App.getBoatData(state.equipment.boatLevel).speedBonus || 0;
    const speed = (map.requiresBoat ? 190 : 165) + boatBonus;
    const desiredX = state.player.x + moveX * speed * deltaSeconds;
    const desiredY = state.player.y + moveY * speed * deltaSeconds;

    const nextX = clamp(desiredX, state.player.radius, map.size.width - state.player.radius);
    const nextY = clamp(desiredY, state.player.radius, map.size.height - state.player.radius);

    if (App.canOccupyPoint(map, state, nextX, state.player.y)) {
      state.player.x = nextX;
    }
    if (App.canOccupyPoint(map, state, state.player.x, nextY)) {
      state.player.y = nextY;
    }

    state.player.facingX = moveX;
    state.player.facingY = moveY;
  };

  App.ensurePlayerOnValidGround = function ensurePlayerOnValidGround(state) {
    const map = App.getMapById(state.currentMapId);
    if (!map) {
      return;
    }
    if (!App.canOccupyPoint(map, state, state.player.x, state.player.y)) {
      state.player.x = map.spawn.x;
      state.player.y = map.spawn.y;
    }
  };
})();
