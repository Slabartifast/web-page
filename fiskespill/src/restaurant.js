(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  const demandTemplates = [
    "Denne {fish}en blir populær i kveld!",
    "Kundene spør etter fersk {fish} i dag.",
    "Vi trenger mer {fish} til dagens spesial.",
    "Hvis du finner fin {fish}, selger jeg den dyrt i kveld.",
  ];
  App.RECIPES = [
    { id: "stekt", name: "Stekt fisk", taste: 1.04, quality: 0.75, weight: 0.2, price: 1, likes: ["lokale", "turister"] },
    { id: "kokt", name: "Kokt fisk", taste: 0.85, quality: 1, weight: 0.25, price: 0.94, likes: ["lokale"] },
    { id: "kaker", name: "Fiskekaker", taste: 1.12, quality: 0.5, weight: 0.32, price: 0.94, likes: ["familier"] },
    { id: "filet", name: "Fin filet", taste: 0.9, quality: 1.35, weight: 0.16, price: 1.25, likes: ["matnerder", "turister"], minStars: 2 },
    { id: "suppe", name: "Fiskesuppe", taste: 1.08, quality: 0.85, weight: 0.36, price: 1.18, likes: ["familier", "turister"], minStars: 2.5 },
  ];
  App.CUSTOMERS = [
    { id: "lokale", name: "Lokale stamgjester", priceSensitivity: 0.75, strictness: 0.8 },
    { id: "familier", name: "Barnefamilier", priceSensitivity: 1.2, strictness: 0.72 },
    { id: "matnerder", name: "Matnerder", priceSensitivity: 0.65, strictness: 1.25 },
    { id: "turister", name: "Turister", priceSensitivity: 0.9, strictness: 0.95 },
  ];

  App.getAvailableRecipes = function getAvailableRecipes(state) {
    return App.RECIPES.filter((recipe) => state.stars >= (recipe.minStars || 1));
  };

  App.getRestaurantCandidates = function getRestaurantCandidates(state) {
    return state.inventory.map((fish) => ({ fish, source: "bag" }))
      .concat(state.fishTank.map((fish) => ({ fish, source: "tank" })));
  };

  App.getRestaurantChoice = function getRestaurantChoice(state, fish, source) {
    const requested = state.restaurantPlan[fish.id];
    return requested || (source === "tank" ? "tank" : "stekt");
  };

  App.setRestaurantChoice = function setRestaurantChoice(state, fishId, choice) {
    if (state.phase !== "restaurant") return false;
    const candidate = App.getRestaurantCandidates(state).find(({ fish }) => fish.id === fishId);
    if (!candidate) return false;
    if (choice !== "tank" && !App.getAvailableRecipes(state).some((recipe) => recipe.id === choice)) return false;
    if (choice === "tank" && candidate.fish.weightKg > App.getTankCapacity(state)) return false;
    state.restaurantPlan[fishId] = choice;
    return true;
  };

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
    if (state.phase !== "day" || state.pendingCatch) {
      return false;
    }
    if (!state.dailyDemand) {
      App.rollDailyDemand(state);
    }
    state.dayTimeRemaining = 0;

    state.phase = "restaurant";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    state.restaurantPlan = {};
    state.customerMix = App.CUSTOMERS.map((customer) => ({
      id: customer.id,
      count: 1 + Math.floor(Math.random() * (1 + state.stars)),
    }));
    App.addMessage(state, `Klokka er 18. Kona er klar til å planlegge serveringen.`);
    return true;
  };

  App.runRestaurantService = function runRestaurantService(state) {
    if (state.phase !== "restaurant") return false;
    const restaurant = App.getRestaurantData(state.equipment.restaurantLevel);
    const commerceBonus = 1 + App.getSkillLevel(state, "commerce") * 0.08;
    const demand = state.dailyDemand;
    const demandFish = demand ? App.getFishById(demand.fishId) : null;
    const candidates = App.getRestaurantCandidates(state);
    const stored = candidates.filter(({ fish, source }) => App.getRestaurantChoice(state, fish, source) === "tank")
      .map(({ fish }) => fish);
    const storedWeight = stored.reduce((sum, fish) => sum + fish.weightKg, 0);
    if (storedWeight > App.getTankCapacity(state) + 0.001) {
      App.addMessage(state, `Tanken rommer bare ${App.getTankCapacity(state)} kg. Velg noen fisk til servering.`);
      return false;
    }
    let revenue = 0;
    let soldCount = 0;
    let bonusCount = 0;
    const soldLines = [];
    const reviews = [];
    const weightedCustomers = state.customerMix.flatMap(({ id, count }) =>
      Array.from({ length: count }, () => App.CUSTOMERS.find((customer) => customer.id === id)));

    for (const { fish: catchData, source } of candidates) {
      const choice = App.getRestaurantChoice(state, catchData, source);
      if (choice === "tank") continue;
      const recipe = App.getAvailableRecipes(state).find((entry) => entry.id === choice) || App.RECIPES[0];
      const customer = weightedCustomers[Math.floor(Math.random() * weightedCustomers.length)] || App.CUSTOMERS[0];
      const matchesDemand = demand && catchData.fishId === demand.fishId;
      const taste = catchData.taste || 45;
      const quality = catchData.quality || 50;
      const weightScore = Math.min(100, 30 + catchData.weightKg * 12);
      const foodScore = (taste * recipe.taste + quality * recipe.quality + weightScore * recipe.weight) /
        (recipe.taste + recipe.quality + recipe.weight);
      const matchBonus = recipe.likes.includes(customer.id) ? 8 : 0;
      const pricePenalty = Math.max(0, recipe.price - 1) * customer.priceSensitivity * 28;
      const review = App.utils.clamp(Math.round(50 + (foodScore - 55) * customer.strictness * 0.82 +
        matchBonus + state.equipment.restaurantLevel * 1.5 - pricePenalty), 5, 100);
      reviews.push(review);
      const salePrice = Math.round(
        catchData.baseSaleValue *
          restaurant.saleMultiplier *
          commerceBonus *
          recipe.price *
          (0.85 + review / 300) *
          (matchesDemand ? demand.multiplier : 1)
      );
      revenue += salePrice;
      soldCount += 1;
      if (matchesDemand) {
        bonusCount += 1;
      }
      state.stats.soldByFishId[catchData.fishId] =
        (state.stats.soldByFishId[catchData.fishId] || 0) + 1;
      soldLines.push(`${recipe.name} av ${catchData.name}: ${salePrice} kr · ${customer.name} ga ${review}/100.`);
    }

    const avgReview = reviews.length ? Math.round(reviews.reduce((sum, score) => sum + score, 0) / reviews.length) : 0;
    state.lastReview = avgReview;
    if (reviews.length) state.reputation = App.utils.clamp(state.reputation + (avgReview - 50) * 0.06, 0, 100);
    state.stars = App.utils.clamp(1 + state.reputation / 25, 1, 5);
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
      avgReview,
      reputation: state.reputation,
      stars: state.stars,
      storedCount: stored.length,
      spouseLine,
      lines: soldLines.slice(0, 8),
      caughtCount: state.dayStats.caughtCount,
      xpGained: state.dayStats.xpGained,
      demandFishName: demandFish ? demandFish.name : "Ingen",
      mapName: (App.getMapById(state.currentMapId) || {}).name || "Ukjent sted",
    };

    state.inventory = [];
    state.fishTank = stored;
    state.restaurantPlan = {};
    state.phase = "summary";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    App.syncQuests(state);
    App.addMessage(state, `Dag ${state.day} er over. Restauranten omsatte for ${revenue} kr.`);
    return true;
  };
})();

