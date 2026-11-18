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
    state.fishing.message = "Lad kastet.";
    state.fishing.hint = "Hold inne lenger for lengre kast.";
    return true;
  };

  function resolveBitePress(state, map) {
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
    fishing.mode = "reeling";
    fishing.timer = 0;
    fishing.elapsed = 0;
    fishing.progress = 0.36 + reelData.controlBonus * 0.16 + reelingSkill * 0.02;
    fishing.marker = 0.45;
    fishing.markerVelocity = 0;
    fishing.targetCenter = 0.36 + Math.random() * 0.28;
    fishing.targetWidth = clamp(
      0.44 -
        difficulty * 0.036 +
        rodData.easeBonus * 0.45 +
        reelData.controlBonus * 0.38 +
        reelingSkill * 0.03,
      0.26,
      0.54
    );
    fishing.targetVelocity = 0.075 + difficulty * 0.032;
    fishing.tension = 0.18;
    fishing.burstTimer = 0;
    fishing.message = `${preview ? preview.fish.name : "Fisk"} på kroken!`;
    fishing.hint = "Hold space: høyre. Slipp: venstre. Følg grønt felt.";
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
    if (fishing.mode === "bite" && input.interactPressed) {
      resolveBitePress(state, map);
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
      const chargeSpeed = 0.72 + App.getSkillLevel(state, "casting") * 0.04;
      if (input.interactHeld) {
        fishing.charge = clamp(fishing.charge + deltaSeconds * chargeSpeed, 0, 1);
        fishing.castPower = fishing.charge;
        fishing.message = `Kast ${Math.round(fishing.castPower * 100)}%`;
        fishing.hint = "Slipp space for å kaste.";
      }
      if (input.interactReleased || fishing.charge >= 1) {
        const castContext = App.getCastContext(state, map, fishing.castPower);
        if (!castContext.ok) {
          state.fishing = App.createEmptyFishingState();
          App.addMessage(state, castContext.reason);
          return;
        }
        fishing.mode = "casting";
        fishing.timer = 0;
        fishing.castStrength = fishing.castPower;
        fishing.castPoint = castContext.castPoint;
        fishing.message = "Snøret flyr ut.";
        fishing.hint = "Vent på napp.";
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
          2.4 + Math.random() * (3.6 + map.difficulty * 0.35) - instincts * 0.12,
          1.5,
          7.8
        );
        fishing.message = "Snøret ligger ute.";
        fishing.hint = "Vent på napp.";
      }
      return;
    }

    if (fishing.mode === "waiting") {
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

    if (fishing.mode === "reeling") {
      const reelData = App.getReelData(state.equipment.reelLevel) || App.getReelData(1);
      const rodData = App.getRodData(state.equipment.rodLevel) || App.getRodData(1);
      const reelingSkill = App.getSkillLevel(state, "reeling");
      fishing.elapsed += deltaSeconds;

      if (Math.random() < (0.28 + map.difficulty * 0.08) * deltaSeconds) {
        fishing.targetVelocity *= -1;
        fishing.burstTimer = 0.55 + Math.random() * 0.5;
      }
      fishing.burstTimer = Math.max(0, fishing.burstTimer - deltaSeconds);
      fishing.targetCenter += fishing.targetVelocity * (fishing.burstTimer > 0 ? 1.9 : 1) * deltaSeconds;
      if (
        fishing.targetCenter < fishing.targetWidth / 2 ||
        fishing.targetCenter > 1 - fishing.targetWidth / 2
      ) {
        fishing.targetVelocity *= -1;
        fishing.targetCenter = clamp(
          fishing.targetCenter,
          fishing.targetWidth / 2,
          1 - fishing.targetWidth / 2
        );
      }

      const push = input.interactHeld ? 2.15 + reelData.controlBonus * 1.8 : -1.55;
      fishing.markerVelocity += push * deltaSeconds;
      fishing.markerVelocity *= Math.exp(-7 * deltaSeconds);
      fishing.marker = clamp(fishing.marker + fishing.markerVelocity * deltaSeconds, 0, 1);

      const inTarget =
        Math.abs(fishing.marker - fishing.targetCenter) <= fishing.targetWidth / 2;
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

