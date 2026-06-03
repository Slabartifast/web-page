(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  const demandTemplates = [
    "Denne {fish}en blir populær i kveld!",
    "Kundene spør etter fersk {fish} i dag.",
    "Vi trenger mer {fish} til dagens spesial.",
    "Hvis du finner fin {fish}, selger jeg den dyrt i kveld.",
  ];

  App.rollDailyDemand = function rollDailyDemand(state) {
    const unlockedFishIds = [];
    state.unlockedMapIds.forEach((mapId) => {
      const map = App.getMapById(mapId);
      if (!map) {
        return;
      }
      map.fishPool.forEach((entry) => {
        if (!unlockedFishIds.includes(entry.fishId)) {
          unlockedFishIds.push(entry.fishId);
        }
      });
    });
    const pickedFishId =
      unlockedFishIds[Math.floor(Math.random() * unlockedFishIds.length)] || "abbor";
    const fish = App.getFishById(pickedFishId);
    const template = demandTemplates[Math.floor(Math.random() * demandTemplates.length)];
    state.dailyDemand = {
      fishId: pickedFishId,
      multiplier: 1.18,
      text: template.replace("{fish}", fish ? fish.name.toLowerCase() : "fangsten"),
    };
  };

  App.endDay = function endDay(state) {
    if (state.phase !== "day") {
      return false;
    }
    if (!state.dailyDemand) {
      App.rollDailyDemand(state);
    }

    const restaurant = App.getRestaurantData(state.equipment.restaurantLevel);
    const commerceBonus = 1 + App.getSkillLevel(state, "commerce") * 0.05;
    const demand = state.dailyDemand;
    const demandFish = demand ? App.getFishById(demand.fishId) : null;
    let revenue = 0;
    let soldCount = 0;
    let bonusCount = 0;
    const soldLines = [];

    for (let i = 0; i < state.inventory.length; i += 1) {
      const catchData = state.inventory[i];
      const matchesDemand = demand && catchData.fishId === demand.fishId;
      const salePrice = Math.round(
        catchData.baseSaleValue *
          restaurant.saleMultiplier *
          commerceBonus *
          (matchesDemand ? demand.multiplier : 1)
      );
      revenue += salePrice;
      soldCount += 1;
      if (matchesDemand) {
        bonusCount += 1;
      }
      state.stats.soldByFishId[catchData.fishId] =
        (state.stats.soldByFishId[catchData.fishId] || 0) + 1;
      soldLines.push(`${catchData.name} ${catchData.weightKg.toFixed(1)} kg ga ${salePrice} kr.`);
    }

    state.money += revenue;
    state.stats.totalSold += soldCount;
    state.stats.bestDayRevenue = Math.max(state.stats.bestDayRevenue, revenue);
    if (soldCount > 0) {
      App.gainXp(
        state,
        Math.round(12 + soldCount * 4 + revenue / 25),
        `Kveldssalg ga ${revenue} kr`
      );
    } else {
      App.addMessage(state, "Kvelden ble rolig. Kona serverte poteter og profesjonell tålmodighet.");
    }

    const spouseLine =
      soldCount === 0
        ? "Ingen fisk i dag, men jeg holdt smilet oppe og frityren varm. Vi prøver igjen i morgen."
        : bonusCount > 0
        ? `For en kveld. ${bonusCount} ønskefisk forsvant raskere enn pommes fritesen.`
        : revenue >= 700
        ? "Du kom hjem med varer som fikk hele tavernen til å nikke respektfullt."
        : "Fin flyt i kveld. Litt mer slik, så får vi snart faste stamgjester med god smak.";

    state.lastDaySummary = {
      dayNumber: state.day,
      soldCount,
      revenue,
      bonusCount,
      spouseLine,
      lines: soldLines.slice(0, 8),
      caughtCount: state.dayStats.caughtCount,
      xpGained: state.dayStats.xpGained,
      demandFishName: demandFish ? demandFish.name : "Ingen",
      mapName: (App.getMapById(state.currentMapId) || {}).name || "Ukjent sted",
    };

    state.inventory = [];
    state.phase = "summary";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    App.syncQuests(state);
    App.addMessage(state, `Dag ${state.day} er over. Restauranten omsatte for ${revenue} kr.`);
    return true;
  };
})();
