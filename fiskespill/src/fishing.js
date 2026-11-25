(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const { clamp, lerp, weightedPick } = App.utils;

  function getEligibleFish(state, map) {
    const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
    const lineData = App.getLineData(state.equipment.lineLevel) || App.getLineData(1);
    const boatData = App.getBoatData(state.equipment.boatLevel) || App.getBoatData(0);
    const castingSkill = App.getSkillLevel(state, "casting");

    return map.fishPool
      .map((entry) => {
        const fish = App.getFishById(entry.fishId);
        if (!fish) {
          return null;
        }
        if (fish.minRodLevel > state.equipment.rodLevel) {
          return null;
        }
        if ((fish.minBoatLevel || 0) > state.equipment.boatLevel) {
          return null;
        }
        let weight = entry.weight;
        weight *= App.getBaitModifier(fish, state.activeBaitId);
        const depth = state.fishing.waterDepth || 0;
        const requiredDepth = Math.max(0, (fish.basePrice - 30) * 0.65);
        if (depth < requiredDepth) return null;
        weight *= 0.8 + Math.min(1, depth / 180) * Math.max(0, fish.qualityTier - 1) * 0.45;
        weight *= 1 + rodData.rareBonus * Math.max(0, fish.qualityTier - 1);
        weight *= 1 + lineData.heavyBonus * Math.max(0, fish.baseDifficulty - 1);
        weight *= 1 + boatData.rareBonus * Math.max(0, fish.qualityTier - 2);
        weight *= 1 + castingSkill * 0.03;
        return { fish, weight };
      })
      .filter(Boolean);
  }

  function buildCatch(state, map, reactionScore, reelScore, castStrength, hookedFishId) {
    const choices = getEligibleFish(state, map);
    const picked = choices.find((entry) => entry.fish.id === hookedFishId);
    if (!picked) {
      return null;
    }

    const fish = picked.fish;
    const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
    const reelData = App.getReelData(state.equipment.reelLevel) || App.getReelData(1);
    const lineData = App.getLineData(state.equipment.lineLevel) || App.getLineData(1);
    const boatData = App.getBoatData(state.equipment.boatLevel) || App.getBoatData(0);
    const castingSkill = App.getSkillLevel(state, "casting");
    const reelingSkill = App.getSkillLevel(state, "reeling");

    const minWeight = fish.weightRangeKg[0];
    const maxWeight = fish.weightRangeKg[1];
    const weightBias = clamp(
      0.35 +
        rodData.sizeBonus +
        lineData.heavyBonus +
        boatData.rareBonus * 0.45 +
        castingSkill * 0.03 +
        (castStrength || 0) * 0.1 +
        Math.random() * 0.38,
      0,
      1
    );
    const weightKg = lerp(minWeight, maxWeight, Math.pow(weightBias, 0.9));
    const sizeBonus = weightKg >= lerp(minWeight, maxWeight, 0.7) ? 0.7 : 0.25;
    const qualityScore =
      fish.qualityTier +
      reactionScore * 0.7 +
      reelScore * 1.15 +
      rodData.easeBonus * 2 +
      reelData.controlBonus * 2 +
      reelingSkill * 0.18 +
      sizeBonus;
    const qualityInfo = App.getQualityInfo(qualityScore);
    const qualityRank = App.QUALITY_CLASSES.indexOf(qualityInfo);
    const baseSaleValue = Math.max(
      8,
      Math.round(fish.basePrice * weightKg * qualityInfo.multiplier)
    );

    return {
      id: `${fish.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fishId: fish.id,
      name: fish.name,
      weightKg,
      baseSaleValue,
      qualityLabel: qualityInfo.label,
      qualityMultiplier: qualityInfo.multiplier,
      qualityRank,
      rarity: fish.rarity,
      caughtOnDay: state.day,
      mapId: map.id,
    };
  }

  App.beginFishingCharge = function beginFishingCharge(state, map) {
    if (state.phase !== "day") {
      return false;
    }
    const castContext = App.getCastContext(state, map, 0.05);
    if (!castContext.ok) {
      App.addMessage(state, castContext.reason);
      return false;
    }

    state.fishing = App.createEmptyFishingState();
    state.fishing.mode = "charging";
    state.fishing.message = "Kastelengde";
    state.fishing.hint = "Slipp space for å låse lengden.";
    return true;
  };

  function startHooking(state, map) {
    const fishing = state.fishing;
    const instincts = App.getSkillLevel(state, "instincts");
    const maxWindow = fishing.biteWindow;
    const ratio = maxWindow <= 0 ? 0.5 : clamp(fishing.timer / maxWindow, 0, 1);
    const centered = 1 - Math.abs(ratio - 0.55) / 0.55;
    fishing.reactionScore = clamp(centered + instincts * 0.05, 0.3, 1);

    const eligible = getEligibleFish(state, map);
    const preview = weightedPick(eligible, (entry) => entry.weight);
    const difficulty = preview ? preview.fish.baseDifficulty : map.difficulty + 1;
    const reelingSkill = App.getSkillLevel(state, "reeling");
    const reelData = App.getReelData(state.equipment.reelLevel) || App.getReelData(1);
    const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);

    fishing.hookedFishId = preview ? preview.fish.id : null;
    fishing.mode = "hooking";
    fishing.hookMarker = Math.random() * 0.2;
    fishing.hookDirection = 1;
    fishing.hookCenter = 0.18 + Math.random() * 0.64;
    fishing.hookWidth = clamp(0.34 - difficulty * 0.035 + instincts * 0.018, 0.13, 0.32);
    fishing.hookTime = 3.5;
    fishing.message = "Tilslag!";
    fishing.hint = "Trykk space i grønt felt.";
  }

  function startReeling(state, map) {
    const fishing = state.fishing;
    const fish = App.getFishById(fishing.hookedFishId);
    const difficulty = fish ? fish.baseDifficulty : map.difficulty + 1;
    const reelingSkill = App.getSkillLevel(state, "reeling");
    const reelData = App.getReelData(state.equipment.reelLevel) || App.getReelData(1);
    const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
    fishing.mode = "reeling";
    fishing.timer = 0;
    fishing.elapsed = 0;
    fishing.progress = 0.25 + reelData.controlBonus * 0.12 + reelingSkill * 0.02;
    fishing.marker = 0.55;
    fishing.markerVelocity = 0;
    fishing.targetCenter = 0.55;
    fishing.targetWidth = clamp(
      0.50 -
        difficulty * 0.043 +
        rodData.easeBonus * 0.45 +
        reelData.controlBonus * 0.38 +
        reelingSkill * 0.03,
      0.26,
      0.54
    );
    const pattern = fish ? [...fish.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4 : 0;
    fishing.targetVelocity = (0.065 + difficulty * 0.036) * (pattern % 2 ? -1 : 1);
    fishing.fishPosition = 0.35;
    fishing.fishDestination = 0.35;
    fishing.fishMoveTimer = 0.25;
    fishing.fishSpeed = 0.22 + difficulty * 0.08 + pattern * 0.025;
    fishing.fishJumpiness = 0.8 + difficulty * 0.16 + pattern * 0.08;
    fishing.tension = 0.18;
    fishing.burstTimer = 0;
    fishing.message = `${fish ? fish.name : "Fisk"} på kroken!`;
    fishing.hint = "Hold space: opp. Slipp: ned. Hold fisken i grønt.";
  }

  App.handleFishingInput = function handleFishingInput(state, map, input) {
    const fishing = state.fishing;
    if (state.phase !== "day") {
      return;
    }
    if (fishing.mode === "idle" && input.interactPressed) {
      App.beginFishingCharge(state, map);
      return;
    }
    if (fishing.mode === "aiming" && input.interactPressed) {
      const castContext = App.getCastContext(state, map, fishing.castPower, fishing.aim);
      if (!castContext.ok) {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, castContext.reason);
        return;
      }
      fishing.mode = "casting";
      fishing.timer = 0;
      fishing.castStrength = fishing.castPower;
      fishing.castPoint = castContext.castPoint;
      fishing.waterDepth = castContext.waterDepth;
      fishing.message = "Kast!";
      fishing.hint = "Vent på napp.";
      return;
    }
    if (fishing.mode === "bite" && input.interactPressed) {
      startHooking(state, map);
      return;
    }
    if (fishing.mode === "hooking" && input.interactPressed) {
      if (Math.abs(fishing.hookMarker - fishing.hookCenter) <= fishing.hookWidth / 2) {
        startReeling(state, map);
      } else {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, "Tilslaget bommet. Fisken slapp unna.");
      }
      return;
    } else if (fishing.mode === "waiting" && input.interactPressed &&
      ["sluk", "spinner", "pilk"].includes(state.activeBaitId) &&
      fishing.jigCooldown <= 0 && fishing.jigCount < 3) {
      fishing.timer += 0.55;
      fishing.jigCooldown = 0.6;
      fishing.jigCount += 1;
      fishing.message = "Agn i bevegelse";
    }
  };

  App.updateFishing = function updateFishing(state, input, deltaSeconds, map) {
    const fishing = state.fishing;
    if (fishing.mode === "idle") {
      return;
    }

    if (fishing.exclamationTimer > 0) {
      fishing.exclamationTimer = Math.max(0, fishing.exclamationTimer - deltaSeconds);
    }

    if (fishing.mode === "charging") {
      fishing.charge += deltaSeconds * (1.25 + App.getSkillLevel(state, "casting") * 0.03) * (fishing.chargeDirection || 1);
      if (fishing.charge >= 1 || fishing.charge <= 0) {
        fishing.charge = clamp(fishing.charge, 0, 1);
        fishing.chargeDirection = fishing.charge >= 1 ? -1 : 1;
      }
      fishing.castPower = fishing.charge;
      fishing.message = `Lengde ${Math.round(fishing.castPower * 100)}%`;
      if (input.interactReleased) {
        fishing.mode = "aiming";
        fishing.aim = 0.5;
        fishing.aimDirection = 1;
        fishing.message = "Velg retning";
        fishing.hint = "Trykk space for å kaste.";
      }
      return;
    }

    if (fishing.mode === "aiming") {
      fishing.aim += deltaSeconds * 1.25 * fishing.aimDirection;
      if (fishing.aim >= 1 || fishing.aim <= 0) {
        fishing.aim = clamp(fishing.aim, 0, 1);
        fishing.aimDirection *= -1;
      }
      return;
    }

    if (fishing.mode === "casting") {
      fishing.timer += deltaSeconds;
      if (fishing.timer >= 0.35) {
        const instincts = App.getSkillLevel(state, "instincts");
        fishing.mode = "waiting";
        fishing.timer = 0;
        fishing.waitTime = clamp(
          2.4 + Math.random() * (3.6 + map.difficulty * 0.35) - instincts * 0.12 - (state.activeBaitId === "sluk" || state.activeBaitId === "spinner" ? 0.8 : 0),
          1.5,
          7.8
        );
        fishing.message = "Snøret ligger ute.";
        fishing.hint = ["sluk", "spinner", "pilk"].includes(state.activeBaitId)
          ? "Trykk space for å lokke fisken." : "Vent på napp.";
      }
      return;
    }

    if (fishing.mode === "waiting") {
      fishing.jigCooldown = Math.max(0, fishing.jigCooldown - deltaSeconds);
      fishing.timer += deltaSeconds;
      if (fishing.timer >= fishing.waitTime) {
        const instincts = App.getSkillLevel(state, "instincts");
        fishing.mode = "bite";
        fishing.biteWindow = clamp(1.9 + instincts * 0.2 - map.difficulty * 0.1, 1.2, 2.7);
        fishing.timer = fishing.biteWindow;
        fishing.exclamationTimer = fishing.biteWindow;
        fishing.message = "Napp!";
        fishing.hint = "Trykk på space!";
      }
      return;
    }

    if (fishing.mode === "bite") {
      fishing.timer -= deltaSeconds;
      if (fishing.timer <= 0) {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, "For sent! Fisken slapp unna.");
      }
      return;
    }

    if (fishing.mode === "hooking") {
      fishing.hookMarker += deltaSeconds * (0.85 + map.difficulty * 0.08) * fishing.hookDirection;
      if (fishing.hookMarker >= 1 || fishing.hookMarker <= 0) {
        fishing.hookMarker = clamp(fishing.hookMarker, 0, 1);
        fishing.hookDirection *= -1;
      }
      fishing.hookTime -= deltaSeconds;
      if (fishing.hookTime <= 0) {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, "For sent med tilslaget.");
      }
      return;
    }

    if (fishing.mode === "reeling") {
      const reelData = App.getReelData(state.equipment.reelLevel) || App.getReelData(1);
      const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
      const reelingSkill = App.getSkillLevel(state, "reeling");
      fishing.elapsed += deltaSeconds;

      fishing.fishMoveTimer -= deltaSeconds;
      if (fishing.fishMoveTimer <= 0) {
        fishing.fishDestination = 0.06 + Math.random() * 0.88;
        fishing.fishMoveTimer = (0.25 + Math.random() * 0.7) / fishing.fishJumpiness;
      }
      const swim = fishing.fishDestination - fishing.fishPosition;
      fishing.fishPosition += Math.sign(swim) * Math.min(Math.abs(swim), fishing.fishSpeed * deltaSeconds);

      fishing.markerVelocity += (input.interactHeld ? -4.8 : 3.6) * deltaSeconds;
      fishing.markerVelocity = clamp(fishing.markerVelocity, -2.2, 2.2);
      fishing.marker = clamp(fishing.marker + fishing.markerVelocity * deltaSeconds,
        fishing.targetWidth / 2, 1 - fishing.targetWidth / 2);
      if (fishing.marker === fishing.targetWidth / 2 || fishing.marker === 1 - fishing.targetWidth / 2) {
        fishing.markerVelocity = 0;
      }

      const inTarget = Math.abs(fishing.fishPosition - fishing.marker) <= fishing.targetWidth / 2;
      if (inTarget) {
        fishing.tension = Math.max(0, fishing.tension - 0.28 * deltaSeconds);
        fishing.progress +=
          (0.31 + rodData.easeBonus * 0.22 + reelData.controlBonus * 0.22 + reelingSkill * 0.027) *
          deltaSeconds;
      } else {
        fishing.tension = Math.min(1, fishing.tension + (input.interactHeld ? 0.21 : 0.09) * deltaSeconds);
        fishing.progress -= clamp(
          0.135 - reelData.controlBonus * 0.04 - reelingSkill * 0.012,
          0.05,
          0.16
        ) * deltaSeconds;
      }
      fishing.progress = clamp(fishing.progress, 0, 1);
      fishing.message = fishing.tension > 0.72 ? "Snøret er stramt! Slipp space." : "Sveiv inn fisken";
      if (fishing.tension >= 1) {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, "Snøret røyk. Slipp opp når det strammer seg!");
        return;
      }

      if (fishing.progress >= 1) {
        const reelScore = clamp(0.72 + (1 - fishing.elapsed / 20) * 0.18, 0.55, 1);
        const catchData = buildCatch(
          state,
          map,
          fishing.reactionScore,
          reelScore,
          fishing.castStrength,
          fishing.hookedFishId
        );
        state.fishing = App.createEmptyFishingState();
        if (!catchData) {
          App.addMessage(state, "Det ble bare rusk på kroken denne gangen.");
          return;
        }
        state.pendingCatch = catchData;
        state.dayStats.caughtCount += 1;
        state.dayStats.catches.unshift(catchData);
        state.dayStats.catches = state.dayStats.catches.slice(0, 8);
        state.stats.totalCaught += 1;
        state.stats.totalWeight += catchData.weightKg;
        state.stats.catchesByFishId[catchData.fishId] =
          (state.stats.catchesByFishId[catchData.fishId] || 0) + 1;
        App.recordCatchInJournal(state, catchData);
        App.gainXp(
          state,
          Math.round(10 + catchData.weightKg * 2 + catchData.qualityMultiplier * 5),
          `Du fikk ${catchData.name}`
        );
        App.addMessage(state, `${catchData.name}, ${catchData.weightKg.toFixed(1)} kg!`);
        App.syncQuests(state);
        return;
      }

      if (fishing.progress <= 0 && fishing.elapsed > 6) {
        state.fishing = App.createEmptyFishingState();
        App.addMessage(state, "Fisken ristet seg løs etter en seig dragkamp.");
      }
    }
  };

  App.resolvePendingCatch = function resolvePendingCatch(state, action, replaceId) {
    const catchData = state.pendingCatch;
    if (!catchData || state.phase !== "day") return false;
    if (action === "release") {
      App.addMessage(state, `${catchData.name} svømte videre.`);
    } else if (action === "keep") {
      if (state.inventory.length >= App.getBagCapacity(state)) return false;
      state.inventory.push(catchData);
      App.addMessage(state, `${catchData.name} i bagen.`);
    } else if (action === "replace") {
      const index = state.inventory.findIndex((fish) => fish.id === replaceId);
      if (index < 0) return false;
      const released = state.inventory.splice(index, 1, catchData)[0];
      App.addMessage(state, `${catchData.name} inn, ${released.name} ut.`);
    } else return false;
    state.pendingCatch = null;
    return true;
  };
})();

