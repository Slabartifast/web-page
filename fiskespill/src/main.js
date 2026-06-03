(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const { clamp } = App.utils;

  function createInputState() {
    return {
      held: new Set(),
      pressed: new Set(),
      released: new Set(),
      touchHeld: new Set(),
      touchPressed: new Set(),
      touchReleased: new Set(),
      moveX: 0,
      moveY: 0,
      virtualJoystick: {
        active: false,
        pointerId: null,
        originScreenX: 0,
        originScreenY: 0,
        knobScreenX: 0,
        knobScreenY: 0,
        x: 0,
        y: 0,
      },
      left: false,
      right: false,
      up: false,
      down: false,
      interactPressed: false,
      interactHeld: false,
      interactReleased: false,
    };
  }

  function installInput(game) {
    const keyMap = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      KeyA: "left",
      KeyD: "right",
      KeyW: "up",
      KeyS: "down",
      KeyE: "interact",
      Space: "interact",
    };

    window.addEventListener("keydown", (event) => {
      const action = keyMap[event.code];
      if (!action) {
        return;
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (!game.input.held.has(action)) {
        game.input.pressed.add(action);
      }
      game.input.held.add(action);
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap[event.code];
      if (!action) {
        return;
      }
      game.input.held.delete(action);
      game.input.released.add(action);
    });

    document.querySelectorAll("[data-touch-action]").forEach((button) => {
      const action = button.dataset.touchAction;
      if (!action) {
        return;
      }

      const release = () => {
        if (game.input.touchHeld.has(action)) {
          game.input.touchHeld.delete(action);
          game.input.touchReleased.add(action);
        }
      };

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (!game.input.touchHeld.has(action)) {
          game.input.touchPressed.add(action);
        }
        game.input.touchHeld.add(action);
        if (button.setPointerCapture) {
          button.setPointerCapture(event.pointerId);
        }
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });

    const joystick = game.input.virtualJoystick;
    const showJoystick = () => {
      game.refs.virtualJoystick.classList.remove("hidden");
      game.refs.virtualJoystick.classList.add("active");
      game.refs.joystickBase.style.left = `${joystick.originScreenX}px`;
      game.refs.joystickBase.style.top = `${joystick.originScreenY}px`;
      game.refs.joystickKnob.style.left = `${joystick.knobScreenX}px`;
      game.refs.joystickKnob.style.top = `${joystick.knobScreenY}px`;
    };
    const hideJoystick = () => {
      joystick.active = false;
      joystick.pointerId = null;
      joystick.x = 0;
      joystick.y = 0;
      game.refs.virtualJoystick.classList.add("hidden");
      game.refs.virtualJoystick.classList.remove("active");
    };
    const updateJoystick = (clientX, clientY) => {
      const rect = game.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const dx = x - joystick.originScreenX;
      const dy = y - joystick.originScreenY;
      const distance = Math.hypot(dx, dy) || 1;
      const maxDistance = 34;
      const limited = Math.min(distance, maxDistance);
      const nx = dx / distance;
      const ny = dy / distance;
      joystick.x = (nx * limited) / maxDistance;
      joystick.y = (ny * limited) / maxDistance;
      joystick.knobScreenX = joystick.originScreenX + joystick.x * maxDistance;
      joystick.knobScreenY = joystick.originScreenY + joystick.y * maxDistance;
      showJoystick();
    };

    game.canvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || game.state.phase !== "day" || game.state.ui.activePanel) {
        return;
      }
      event.preventDefault();
      const rect = game.canvas.getBoundingClientRect();
      joystick.active = true;
      joystick.pointerId = event.pointerId;
      joystick.originScreenX = event.clientX - rect.left;
      joystick.originScreenY = event.clientY - rect.top;
      joystick.knobScreenX = joystick.originScreenX;
      joystick.knobScreenY = joystick.originScreenY;
      joystick.x = 0;
      joystick.y = 0;
      showJoystick();
      if (game.canvas.setPointerCapture) {
        game.canvas.setPointerCapture(event.pointerId);
      }
    });

    game.canvas.addEventListener("pointermove", (event) => {
      if (!joystick.active || joystick.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      updateJoystick(event.clientX, event.clientY);
    });

    const endJoystick = (event) => {
      if (!joystick.active || joystick.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      hideJoystick();
    };

    game.canvas.addEventListener("pointerup", endJoystick);
    game.canvas.addEventListener("pointercancel", endJoystick);
    game.canvas.addEventListener("lostpointercapture", endJoystick);

    window.addEventListener("blur", () => {
      game.input.held.clear();
      game.input.touchHeld.clear();
      hideJoystick();
    });
  }

  function updateActionSnapshot(game) {
    const held = new Set([...game.input.held, ...game.input.touchHeld]);
    const pressed = new Set([...game.input.pressed, ...game.input.touchPressed]);
    const released = new Set([...game.input.released, ...game.input.touchReleased]);

    const digitalX = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
    const digitalY = (held.has("down") ? 1 : 0) - (held.has("up") ? 1 : 0);
    const joystickX = Math.abs(game.input.virtualJoystick.x) > 0.14 ? game.input.virtualJoystick.x : 0;
    const joystickY = Math.abs(game.input.virtualJoystick.y) > 0.14 ? game.input.virtualJoystick.y : 0;
    game.input.moveX = joystickX || digitalX;
    game.input.moveY = joystickY || digitalY;
    game.input.left = game.input.moveX < -0.1;
    game.input.right = game.input.moveX > 0.1;
    game.input.up = game.input.moveY < -0.1;
    game.input.down = game.input.moveY > 0.1;
    game.input.interactPressed = pressed.has("interact");
    game.input.interactHeld = held.has("interact");
    game.input.interactReleased = released.has("interact");
  }

  function clearTransientInput(game) {
    game.input.pressed.clear();
    game.input.released.clear();
    game.input.touchPressed.clear();
    game.input.touchReleased.clear();
  }

  function drawEllipse(ctx, body) {
    ctx.beginPath();
    ctx.ellipse(body.x, body.y, body.rx, body.ry, 0, 0, Math.PI * 2);
    ctx.closePath();
  }

  function drawRect(ctx, body) {
    ctx.beginPath();
    ctx.rect(body.x, body.y, body.w, body.h);
    ctx.closePath();
  }

  function drawWater(ctx, map, timeSeconds) {
    ctx.save();
    map.waterBodies.forEach((body) => {
      if (body.type === "rect") {
        drawRect(ctx, body);
      } else {
        drawEllipse(ctx, body);
      }
      const gradient = ctx.createLinearGradient(0, 0, 0, map.size.height);
      gradient.addColorStop(0, map.palette.water);
      gradient.addColorStop(1, map.palette.waterDeep);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i += 1) {
      const y = 70 + i * 56 + Math.sin(timeSeconds * 1.6 + i * 0.7) * 7;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.bezierCurveTo(map.size.width * 0.22, y - 8, map.size.width * 0.54, y + 8, map.size.width - 40, y - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDecor(ctx, decor) {
    ctx.save();
    switch (decor.type) {
      case "tree":
        ctx.fillStyle = "#356044";
        ctx.beginPath();
        ctx.arc(decor.x, decor.y, 18 * decor.scale, 0, Math.PI * 2);
        ctx.arc(decor.x - 10 * decor.scale, decor.y + 10 * decor.scale, 14 * decor.scale, 0, Math.PI * 2);
        ctx.arc(decor.x + 12 * decor.scale, decor.y + 12 * decor.scale, 13 * decor.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5f4430";
        ctx.fillRect(decor.x - 4, decor.y + 12 * decor.scale, 8, 16 * decor.scale);
        break;
      case "reed":
        ctx.strokeStyle = "#648b46";
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(decor.x + i * 6, decor.y + 12);
          ctx.lineTo(decor.x + i * 4, decor.y - 12 * decor.scale);
          ctx.stroke();
        }
        break;
      case "rock":
        ctx.fillStyle = "#7e817f";
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, 14 * decor.scale, 10 * decor.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "dock":
        ctx.fillStyle = "#8a6243";
        ctx.fillRect(decor.x, decor.y, 86 * decor.scale, 18 * decor.scale);
        ctx.fillRect(decor.x + 10 * decor.scale, decor.y + 18 * decor.scale, 8, 24 * decor.scale);
        ctx.fillRect(decor.x + 56 * decor.scale, decor.y + 18 * decor.scale, 8, 24 * decor.scale);
        break;
      case "hut":
        ctx.fillStyle = "#c78652";
        ctx.fillRect(decor.x, decor.y, 52 * decor.scale, 34 * decor.scale);
        ctx.fillStyle = "#804f34";
        ctx.beginPath();
        ctx.moveTo(decor.x - 6, decor.y + 4);
        ctx.lineTo(decor.x + 26 * decor.scale, decor.y - 18 * decor.scale);
        ctx.lineTo(decor.x + 58 * decor.scale, decor.y + 4);
        ctx.closePath();
        ctx.fill();
        break;
      case "island":
        ctx.fillStyle = "#9fa56f";
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, 44 * decor.scale, 26 * decor.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#557046";
        ctx.beginPath();
        ctx.arc(decor.x - 8, decor.y - 8, 10 * decor.scale, 0, Math.PI * 2);
        ctx.arc(decor.x + 10, decor.y + 2, 12 * decor.scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        break;
    }
    ctx.restore();
  }

  function drawPlayer(ctx, state, map) {
    const player = state.player;
    ctx.save();
    if (map.requiresBoat) {
      ctx.fillStyle = "#8b593c";
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 28, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6efe0";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 24);
      ctx.lineTo(player.x, player.y);
      ctx.lineTo(player.x + 16, player.y - 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#24414f";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6a86c";
    ctx.beginPath();
    ctx.arc(player.x, player.y - 16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5232";
    ctx.fillRect(player.x - 11, player.y - 22, 22, 5);
    ctx.strokeStyle = "#e9dfc9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + 7, player.y - 8);
    ctx.lineTo(player.x + 18 + player.facingX * 8, player.y - 24 + player.facingY * 10);
    ctx.stroke();

    if (state.fishing.mode === "bite" || state.fishing.exclamationTimer > 0) {
      ctx.fillStyle = "#fff4de";
      ctx.beginPath();
      ctx.roundRect(player.x - 10, player.y - 58, 20, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#de8540";
      ctx.font = "bold 20px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("!", player.x, player.y - 37);
    }
    ctx.restore();
  }

  function drawFishingLine(ctx, state) {
    if (!state.fishing.castPoint) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255, 248, 236, 0.8)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(state.player.x + 10, state.player.y - 12);
    ctx.lineTo(state.fishing.castPoint.x, state.fishing.castPoint.y);
    ctx.stroke();
    ctx.fillStyle = "#f7f5ef";
    ctx.beginPath();
    ctx.arc(state.fishing.castPoint.x, state.fishing.castPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (state.fishing.mode === "bite") {
      ctx.fillStyle = "#ffe08b";
      ctx.beginPath();
      ctx.arc(state.fishing.castPoint.x, state.fishing.castPoint.y - 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function updateCamera(game) {
    const map = App.getMapById(game.state.currentMapId);
    if (!map) {
      return;
    }
    const viewport = App.getPlayableViewport();
    game.camera.x = clamp(
      game.state.player.x - viewport.width / 2,
      0,
      Math.max(0, map.size.width - viewport.width)
    );
    game.camera.y = clamp(
      game.state.player.y - viewport.height / 2,
      0,
      Math.max(0, map.size.height - viewport.height)
    );
  }

  function renderGame(game, timeMs) {
    const ctx = game.ctx;
    const state = game.state;
    const map = App.getMapById(state.currentMapId);
    const timeSeconds = timeMs / 1000;
    const viewport = App.getPlayableViewport();

    ctx.clearRect(0, 0, App.WORLD_WIDTH, App.WORLD_HEIGHT);
    ctx.fillStyle = "#d6c6a5";
    ctx.fillRect(0, 0, App.WORLD_WIDTH, App.WORLD_HEIGHT);

    if (!map) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
    ctx.clip();
    ctx.translate(viewport.x - game.camera.x, viewport.y - game.camera.y);

    ctx.fillStyle = map.palette.land;
    ctx.fillRect(0, 0, map.size.width, map.size.height);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = map.palette.landAlt;
    for (let x = 120; x < map.size.width; x += 220) {
      for (let y = 130; y < map.size.height; y += 210) {
        ctx.beginPath();
        ctx.ellipse(x, y, 92, 60, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    drawWater(ctx, map, timeSeconds);
    map.decor.forEach((decor) => drawDecor(ctx, decor));
    drawPlayer(ctx, state, map);
    drawFishingLine(ctx, state);
    ctx.restore();
  }

  function update(game, deltaSeconds) {
    const state = game.state;
    const map = App.getMapById(state.currentMapId);
    updateActionSnapshot(game);

    App.ensureUnlockedMaps(state);
    App.ensurePlayerOnValidGround(state);

    if (map && state.phase === "day") {
      App.updatePlayer(state, game.input, deltaSeconds);
      App.handleFishingInput(state, map, game.input);
      App.updateFishing(state, game.input, deltaSeconds, map);
    } else if (game.input.virtualJoystick.active) {
      game.input.virtualJoystick.active = false;
      game.input.virtualJoystick.pointerId = null;
      game.input.virtualJoystick.x = 0;
      game.input.virtualJoystick.y = 0;
      if (game.refs) {
        game.refs.virtualJoystick.classList.add("hidden");
        game.refs.virtualJoystick.classList.remove("active");
      }
    }

    updateCamera(game);
    clearTransientInput(game);
  }

  function createGame() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const loaded = App.loadGame();
    const state = loaded || App.createInitialState();
    App.ensureUnlockedMaps(state);
    App.ensurePlayerOnValidGround(state);
    if (!state.dailyDemand) {
      App.rollDailyDemand(state);
    }
    if (!state.dayStats) {
      App.resetDayStats(state);
    }
    App.syncQuests(state);

    return {
      canvas,
      ctx,
      state,
      input: createInputState(),
      lastFrameTime: 0,
      lastUiRender: 0,
      refs: null,
      camera: { x: 0, y: 0 },
      actions: {},
    };
  }

  function attachActions(game) {
    game.actions = {
      beginCareer() {
        App.beginCareer(game.state);
        App.saveGame(game.state, true);
        App.renderUI(game);
      },
      nextDay() {
        App.advanceToNextDay(game.state);
        App.saveGame(game.state, true);
        App.renderUI(game);
      },
      endDay() {
        if (App.endDay(game.state)) {
          App.saveGame(game.state, true);
        }
        App.renderUI(game);
      },
      save(silent) {
        App.saveGame(game.state, !!silent);
        App.renderUI(game);
      },
      load() {
        const nextState = App.loadGame();
        if (!nextState) {
          App.addMessage(game.state, "Fant ingen lagring å hente.");
          App.renderUI(game);
          return;
        }
        game.state = nextState;
        App.ensureUnlockedMaps(game.state);
        App.ensurePlayerOnValidGround(game.state);
        if (!game.state.dailyDemand) {
          App.rollDailyDemand(game.state);
        }
        App.renderUI(game);
      },
      reset() {
        App.clearSavedGame();
        game.state = App.createInitialState();
        App.rollDailyDemand(game.state);
        App.renderUI(game);
      },
      changeMap(mapId) {
        if (App.changeMap(game.state, mapId)) {
          App.saveGame(game.state, true);
        }
        App.renderUI(game);
      },
      purchase(type) {
        const result = App.purchaseItem(game.state, type);
        if (result.ok) {
          App.ensureUnlockedMaps(game.state);
          App.syncQuests(game.state);
          App.saveGame(game.state, true);
        } else {
          App.addMessage(game.state, result.message);
        }
        App.renderUI(game);
      },
      chooseBait(baitId) {
        const result = App.purchaseItem(game.state, "bait", baitId);
        if (result.ok) {
          App.saveGame(game.state, true);
        } else {
          App.addMessage(game.state, result.message);
        }
        App.renderUI(game);
      },
      spendSkill(skillId) {
        const result = App.spendSkillPoint(game.state, skillId);
        if (result.ok) {
          App.saveGame(game.state, true);
        } else {
          App.addMessage(game.state, result.message);
        }
        App.renderUI(game);
      },
      togglePanel(panelId) {
        if (game.state.phase !== "day") {
          return;
        }
        game.state.ui.activePanel = game.state.ui.activePanel === panelId ? null : panelId;
        App.renderUI(game);
      },
      toggleLog() {
        game.state.ui.logCollapsed = !game.state.ui.logCollapsed;
        App.renderUI(game);
      },
    };
  }

  function frame(timeMs, game) {
    if (!game.lastFrameTime) {
      game.lastFrameTime = timeMs;
    }
    const deltaSeconds = clamp((timeMs - game.lastFrameTime) / 1000, 0, 0.05);
    game.lastFrameTime = timeMs;

    update(game, deltaSeconds);
    renderGame(game, timeMs);
    if (!game.lastUiRender || timeMs - game.lastUiRender > 100) {
      App.renderUI(game);
      game.lastUiRender = timeMs;
    }
    window.requestAnimationFrame((nextTime) => frame(nextTime, game));
  }

  window.addEventListener("DOMContentLoaded", () => {
    const game = createGame();
    attachActions(game);
    App.initializeUI(game);
    installInput(game);
    updateCamera(game);
    App.renderUI(game);
    window.requestAnimationFrame((timeMs) => frame(timeMs, game));
  });
})();
