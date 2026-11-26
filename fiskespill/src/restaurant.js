(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const clamp = App.utils.clamp;
  App.RECIPES = [
    { id: "stekt", name: "Stekt fisk", minKitchen: 0, price: 1.15, likes: ["lokale", "turister"], description: "Best med høy kvalitet." },
    { id: "kokt", name: "Kokt fisk", minKitchen: 0, price: 1, likes: ["lokale"], description: "Trygt mellomvalg." },
    { id: "kaker", name: "Fiskekaker", minKitchen: 0, price: 0.9, likes: ["familier"], description: "Løfter enkel fisk." },
    { id: "filet", name: "Fin filet", minKitchen: 2, price: 1.35, likes: ["matnerder", "turister"], description: "Krever topp råvare." },
    { id: "suppe", name: "Fiskesuppe", minKitchen: 3, price: 1.2, likes: ["familier", "turister"], description: "Allsidig rett." },
  ];
  App.CUSTOMERS = [
    { id: "lokale", name: "Lokale stamgjester", priceSensitivity: 0.75 },
    { id: "familier", name: "Barnefamilier", priceSensitivity: 1.2 },
    { id: "matnerder", name: "Matnerder", priceSensitivity: 0.65 },
    { id: "turister", name: "Turister", priceSensitivity: 0.9 },
  ];
  App.getAvailableRecipes = (state) => App.RECIPES.filter((r) => state.equipment.kitchenLevel >= r.minKitchen);
  App.getRestaurantCandidates = (state) => state.inventory.map((fish) => ({ fish, source: "bag" }))
    .concat(state.fishTank.map((fish) => ({ fish, source: "tank" })));
  App.getRestaurantChoice = (state, fish, source) =>
    state.restaurantPlan[fish.id] || (source === "tank" ? "tank" : "stekt");
  App.setRestaurantChoice = function (state, fishId, choice) {
    if (state.phase !== "restaurant") return false;
    const candidate = App.getRestaurantCandidates(state).find(({ fish }) => fish.id === fishId);
    if (!candidate) return false;
    if (choice !== "tank" && !App.getAvailableRecipes(state).some((r) => r.id === choice)) return false;
    if (choice === "tank" && candidate.fish.weightKg > App.getTankCapacity(state)) return false;
    state.restaurantPlan[fishId] = choice;
    return true;
  };
  App.rollDailyDemand = function (state) {
    const ids = [];
    state.unlockedMapIds.forEach((mapId) => {
      App.getMapById(mapId)?.fishPool.forEach(({ fishId }) => {
        if (!ids.includes(fishId)) ids.push(fishId);
      });
    });
    const fishId = ids[Math.floor(Math.random() * ids.length)] || "abbor";
    state.dailyDemand = { fishId, multiplier: 1.18,
      text: `Kundene spør etter ${App.getFishById(fishId)?.name.toLowerCase() || "fersk fisk"} i dag.` };
  };
  App.endDay = function (state) {
    if (state.phase !== "day" || state.pendingCatch) return false;
    if (!state.dailyDemand) App.rollDailyDemand(state);
    state.dayTimeRemaining = 0;
    state.phase = "restaurant";
    state.ui.activePanel = null;
    state.fishing = App.createEmptyFishingState();
    state.restaurantPlan = {};
    const arrivals = Math.min(20, 1 + Math.floor(state.reputation / 12) + Math.floor(Math.random() * 3));
    state.customerMix = Array.from({ length: arrivals }, () =>
      App.CUSTOMERS[Math.floor(Math.random() * App.CUSTOMERS.length)].id);
    App.addMessage(state, "Klokka er 18. Planlegg kveldens servering.");
    return true;
  };
  function foodScore(fish, recipe, kitchenSkill) {
    const q = Number.isFinite(fish.quality) ? fish.quality : 50;
    const t = Number.isFinite(fish.taste) ? fish.taste : 50;
    const scores = {
      stekt: 55 + (q - 50) * 0.85 + (t - 50) * 0.15,
      kokt: 62 + (q - 50) * 0.55 + (t - 50) * 0.15,
      kaker: 70 + (q - 50) * 0.25 + (t - 50) * 0.2,
      filet: 52 + (q - 50) + (t - 50) * 0.1,
      suppe: 66 + (q - 50) * 0.38 + (t - 50) * 0.2,
    };
    return clamp(scores[recipe.id] + kitchenSkill * 2, 5, 100);
  }
  App.runRestaurantService = function (state) {
    if (state.phase !== "restaurant") return false;
    const restaurant = App.getRestaurantData(state.equipment.restaurantLevel);
    const candidates = App.getRestaurantCandidates(state);
    const stored = candidates.filter(({ fish, source }) => App.getRestaurantChoice(state, fish, source) === "tank")
      .map(({ fish }) => fish);
    if (stored.reduce((sum, fish) => sum + fish.weightKg, 0) > App.getTankCapacity(state) + 0.001) return false;
    const dishes = candidates.filter(({ fish, source }) => App.getRestaurantChoice(state, fish, source) !== "tank")
      .sort((a, b) => {
        const score = (entry) => {
          const recipe = App.getAvailableRecipes(state).find((r) =>
            r.id === App.getRestaurantChoice(state, entry.fish, entry.source)) || App.RECIPES[0];
          return foodScore(entry.fish, recipe, App.getSkillLevel(state, "kitchen"));
        };
        return score(b) - score(a);
      });
    const arrivals = state.customerMix.length;
    const seated = Math.min(arrivals, restaurant.seats + (App.CHAIRS[state.equipment.chairsLevel]?.seats || 0));
    const turnedAway = arrivals - seated;
    const serviceScore = clamp(58 + state.equipment.restaurantLevel * 3 +
      (App.COMFORTS[state.equipment.comfortLevel]?.bonus || 0) +
      (App.SERVICE_UPGRADES[state.equipment.serviceLevel]?.bonus || 0) +
      App.getSkillLevel(state, "social") * 4, 0, 100);
    const reviews = [], foods = [], events = [], lines = [];
    let revenue = 0, tableRevenue = 0, wholesaleRevenue = 0, bonusCount = 0;
    const portions = dishes.map((entry) => ({ ...entry, remaining: entry.fish.weightKg }));
    let cursor = 0, served = 0;
    for (let i = 0; i < seated; i += 1) {
      const customer = App.CUSTOMERS.find((c) => c.id === state.customerMix[i]) || App.CUSTOMERS[0];
      const appetite = { matnerder: 0.22, familier: 0.42, lokale: 0.3, turister: 0.28 }[customer.id] || 0.3;
      let needed = appetite, mealQuality = 0, mealWeight = 0, price = 0, wish = false;
      let mainFish = null, mainRecipe = null;
      while (needed > 0.001 && cursor < portions.length) {
        const part = portions[cursor];
        if (part.remaining <= 0.001) { cursor++; continue; }
        const fish = part.fish;
        const recipe = App.getAvailableRecipes(state).find((r) =>
          r.id === App.getRestaurantChoice(state, fish, part.source)) || App.RECIPES[0];
        const used = Math.min(needed, part.remaining);
        const score = foodScore(fish, recipe, App.getSkillLevel(state, "kitchen")) +
          (App.KITCHENS[state.equipment.kitchenLevel]?.bonus || 0);
        mealQuality += score * used;
        mealWeight += used;
        price += fish.baseSaleValue * used / fish.weightKg * restaurant.saleMultiplier * recipe.price *
          (1 + App.getSkillLevel(state, "commerce") * 0.08) *
          (state.dailyDemand?.fishId === fish.fishId ? state.dailyDemand.multiplier : 1);
        wish ||= state.dailyDemand?.fishId === fish.fishId;
        mainFish ||= fish;
        mainRecipe ||= recipe;
        part.remaining -= used;
        needed -= used;
      }
      if (!mealWeight) break;
      served++;
      const food = clamp(mealQuality / mealWeight - needed * 40, 5, 100);
      foods.push(food);
      const review = clamp(Math.round(0.72 * food + 0.28 * serviceScore +
        (mainRecipe.likes.includes(customer.id) ? 5 : 0) -
        Math.max(0, mainRecipe.price - 1) * customer.priceSensitivity * 20), 5, 100);
      reviews.push(review);
      revenue += Math.round(price);
      tableRevenue += Math.round(price);
      if (wish) bonusCount++;
      lines.push(`${mainRecipe.name} av ${mainFish.name}: ${Math.round(mealWeight * 1000)} g · ${Math.round(price)} kr · ${customer.name} ${review}/100.`);
      events.push(`${customer.name}: ${mainRecipe.name} · ${Math.round(mealWeight * 1000)} g · ${review}/100`);
    }
    for (const part of portions) {
      const fish = part.fish;
      const price = Math.round(fish.baseSaleValue * part.remaining / fish.weightKg * App.WHOLESALE[state.equipment.wholesaleLevel].rate);
      revenue += price;
      wholesaleRevenue += price;
      state.stats.soldByFishId[fish.fishId] = (state.stats.soldByFishId[fish.fishId] || 0) + 1;
      if (part.remaining > 0.01) lines.push(`${fish.name}, ${part.remaining.toFixed(2)} kg til overs: ${price} kr til grossist.`);
    }
    const withoutFood = seated - served;
    for (let i = 0; i < withoutFood; i++) events.push("En gjest fikk ikke mat og gikk misfornøyd.");
    for (let i = 0; i < turnedAway; i++) events.push("En kunde snudde i døra: fullt hus.");
    if (!events.length) events.push("Rolig kveld. Ingen gjester kom innom.");
    const avgFood = foods.length ? foods.reduce((sum, n) => sum + n, 0) / foods.length : 45;
    const avgReview = reviews.length ? Math.round(reviews.reduce((sum, n) => sum + n, 0) / reviews.length) : 0;
    const factors = [
      { label: "Mat og tilberedning", value: (avgFood - 55) * 0.12 },
      { label: "Service", value: (serviceScore - 60) * 0.06 },
      { label: `${turnedAway} avvist ved døra`, value: -turnedAway * 1.2 },
      { label: `${withoutFood} uten mat`, value: -withoutFood * 0.8 },
    ];
    const before = state.reputation;
    const rawChange = factors.reduce((sum, f) => sum + f.value, 0);
    const change = clamp(rawChange, -8, 8);
    state.reputation = clamp(before + change, 0, 100);
    const appliedChange = state.reputation - before;
    if (Math.abs(appliedChange - rawChange) > 0.001) {
      factors.push({ label: "Grense for rykteendring", value: appliedChange - rawChange });
    }
    state.lastReview = avgReview;
    state.money += revenue;
    state.stats.totalSold += dishes.length;
    state.stats.bestDayRevenue = Math.max(state.stats.bestDayRevenue, revenue);
    if (dishes.length) App.gainXp(state, Math.round(12 + dishes.length * 4 + revenue / 25), `Kveldssalg ga ${revenue} kr`);
    state.lastDaySummary = {
      dayNumber: state.day, soldCount: dishes.length, served, arrivals, seated, turnedAway, withoutFood,
      revenue, tableRevenue, wholesaleRevenue, wholesaleRate: App.WHOLESALE[state.equipment.wholesaleLevel].rate,
      bonusCount, avgFood: Math.round(avgFood), avgReview, serviceScore,
      reputationBefore: before, reputation: state.reputation, reputationChange: appliedChange,
      reputationFactors: factors, storedCount: stored.length, lines: lines.slice(0, 12),
      caughtCount: state.dayStats.caughtCount, xpGained: state.dayStats.xpGained,
      demandFishName: App.getFishById(state.dailyDemand?.fishId)?.name || "Ingen",
      mapName: App.getMapById(state.currentMapId)?.name || "Ukjent sted",
    };
    state.inventory = [];
    state.fishTank = stored;
    state.restaurantPlan = {};
    state.evening = { elapsed: 0, events };
    state.phase = "evening";
    App.syncQuests(state);
    return true;
  };
  App.updateEvening = function (state, delta) {
    if (state.phase !== "evening") return false;
    state.evening.elapsed = Math.min(5, state.evening.elapsed + delta);
    if (state.evening.elapsed < 5) return false;
    state.phase = "summary";
    App.addMessage(state, `Kvelden er over. Rykte ${state.reputation.toFixed(1)}.`);
    return true;
  };
})();

