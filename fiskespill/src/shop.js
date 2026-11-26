(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});

  App.RODS = [
    {
      level: 1,
      name: "Bambusstang",
      cost: 0,
      rareBonus: 0,
      easeBonus: 0,
      sizeBonus: 0.02,
      note: "Lager mer nostalgi enn rekkevidde, men den duger.",
    },
    {
      level: 2,
      name: "Enkel teleskopstang",
      cost: 280,
      rareBonus: 0.06,
      easeBonus: 0.05,
      sizeBonus: 0.05,
      note: "Kaster lenger og får deg til å se ut som du mener alvor.",
    },
    {
      level: 3,
      name: "Solid haspelstang",
      cost: 760,
      rareBonus: 0.12,
      easeBonus: 0.1,
      sizeBonus: 0.1,
      note: "Mindre kvist, mer fisk. Ren hverdagsluksus.",
    },
    {
      level: 4,
      name: "Proff kyststang",
      cost: 1850,
      rareBonus: 0.18,
      easeBonus: 0.16,
      sizeBonus: 0.16,
      note: "Får fjorden til å føle seg sett og lommeboka til å skjelve litt.",
    },
    {
      level: 5,
      name: "Dypvannsstang",
      cost: 4200,
      rareBonus: 0.24,
      easeBonus: 0.22,
      sizeBonus: 0.22,
      note: "Når kastet ditt får egen postadresse ute på havet.",
    },
  ];

  App.REELS = [
    { level: 1, name: "Enkel snelle", cost: 0, controlBonus: 0, note: "Den durer, den virker, og den klager ikke." },
    { level: 2, name: "Bedre snelle", cost: 240, controlBonus: 0.07, note: "Litt glattere gange, litt mindre banning." },
    { level: 3, name: "Presisjonssnelle", cost: 640, controlBonus: 0.14, note: "Lar deg late som alt var planlagt." },
    { level: 4, name: "Havsnelle", cost: 1800, controlBonus: 0.22, note: "Bygd for tyngre tak og roligere skuldre." },
  ];

  App.LINES = [
    { level: 1, name: "Tynt snøre", cost: 0, heavyBonus: 0.02, note: "Billig og modig. Noen ganger litt for modig." },
    { level: 2, name: "Sterkere snøre", cost: 210, heavyBonus: 0.08, note: "Tåler mer før dramatikken starter." },
    { level: 3, name: "Flettet snøre", cost: 620, heavyBonus: 0.14, note: "Skikkelig arbeidsjern med færre overraskelser." },
    { level: 4, name: "Havsnøre", cost: 1550, heavyBonus: 0.22, note: "Til fisk som tror de driver treningssenter." },
  ];

  App.BOATS = [
    { level: 0, name: "Ingen båt", cost: 0, rareBonus: 0, speedBonus: 0, cargoBonus: 0, note: "To bein og en drøm." },
    { level: 1, name: "Liten robåt", cost: 2500, rareBonus: 0.12, speedBonus: 0, cargoBonus: 2, note: "Tar deg sakte utover fjorden. Velg kurs med omhu." },
    { level: 2, name: "Påhengsmotor", cost: 6200, rareBonus: 0.22, speedBonus: 25, cargoBonus: 5, note: "Mer rekkevidde, mer fart og mer nabomisunnelse." },
  ];

  App.BAGS = [
    { level: 1, name: "Liten fiskebag", cost: 0, capacity: 3, note: "Plass til 3 kg fisk." },
    { level: 2, name: "Romslig fiskebag", cost: 300, capacity: 6, note: "Plass til 6 kg fisk." },
    { level: 3, name: "Stor fiskebag", cost: 850, capacity: 12, note: "Plass til 12 kg fisk." },
    { level: 4, name: "Kjølekasse", cost: 1900, capacity: 24, note: "Plass til 24 kg fisk." },
  ];
  App.TANKS = [
    { level: 0, name: "Ingen fisketank", cost: 0, capacity: 0, note: "Kjøp en tank for å spare fisk." },
    { level: 1, name: "Liten fisketank", cost: 0, capacity: 5, note: "Lagrer 5 kg levende fisk til senere kvelder." },
    { level: 2, name: "Større fisketank", cost: 650, capacity: 12, note: "Lagrer 12 kg levende fisk." },
    { level: 3, name: "Fjordbasseng", cost: 1750, capacity: 25, note: "Lagrer 25 kg levende fisk." },
  ];
  App.KITCHENS = [
    { level: 0, name: "Enkelt kjøkken", cost: 0, bonus: 0, note: "Grunnutstyr." },
    { level: 1, name: "God stekeplass", cost: 500, bonus: 4, note: "+4 matpoeng." },
    { level: 2, name: "Fagkjøkken", cost: 1450, bonus: 8, note: "+8 matpoeng og fin filet." },
    { level: 3, name: "Mesterkjøkken", cost: 3600, bonus: 13, note: "+13 matpoeng og fiskesuppe." },
  ];
  App.CHAIRS = [
    { level: 0, name: "Ingen ekstra stoler", cost: 0, seats: 0, note: "Grunnkapasitet." },
    { level: 1, name: "To ekstra stoler", cost: 450, seats: 2, note: "+2 sitteplasser." },
    { level: 2, name: "Flere bord", cost: 1250, seats: 5, note: "+5 sitteplasser." },
    { level: 3, name: "Stor sal", cost: 3100, seats: 9, note: "+9 sitteplasser." },
  ];
  App.COMFORTS = [
    { level: 0, name: "Enkel innredning", cost: 0, bonus: 0, note: "Nøkternt og rent." },
    { level: 1, name: "Varme benker", cost: 360, bonus: 3, note: "+3 servicepoeng." },
    { level: 2, name: "Trivelig sal", cost: 950, bonus: 7, note: "+7 servicepoeng." },
    { level: 3, name: "Fjordutsikt", cost: 2400, bonus: 12, note: "+12 servicepoeng." },
  ];
  App.SERVICE_UPGRADES = [
    { level: 0, name: "Enmannsdrift", cost: 0, bonus: 0, note: "Du gjør alt selv." },
    { level: 1, name: "Raskere servering", cost: 650, bonus: 4, note: "+4 servicepoeng." },
    { level: 2, name: "God flyt", cost: 1700, bonus: 9, note: "+9 servicepoeng." },
  ];

  App.RESTAURANT_UPGRADES = [
    { level: 1, name: "Liten takeaway", cost: 0, saleMultiplier: 1.0, seats: 2, note: "To sitteplasser og et enkelt kjøkken." },
    { level: 2, name: "Bedre frityr", cost: 420, saleMultiplier: 1.08, seats: 3, note: "Tre sitteplasser og jevnere service." },
    { level: 3, name: "Større kjøkken", cost: 980, saleMultiplier: 1.16, seats: 5, note: "Fem sitteplasser og rom for fin filet." },
    { level: 4, name: "Flere bord", cost: 2300, saleMultiplier: 1.25, seats: 8, note: "Åtte sitteplasser tar unna køen." },
    { level: 5, name: "Spesialmeny", cost: 5200, saleMultiplier: 1.36, seats: 12, note: "Tolv sitteplasser og flere menyvalg." },
  ];

  App.BAITS = {
    mark: {
      id: "mark",
      name: "Mark",
      cost: 0,
      description: "Klassikeren. Litt slim, mye arbeidsglede.",
      bonusSpecies: ["laue", "mort", "abbor", "orret", "harr", "roye"],
    },
    mais: {
      id: "mais",
      name: "Mais",
      cost: 90,
      description: "Rolige ferskvannsfisk elsker det. Nakne kroker blir bare flaue.",
      bonusSpecies: ["laue", "mort", "abbor"],
    },
    sluk: {
      id: "sluk",
      name: "Sluk",
      cost: 210,
      description: "For fisk som liker fart, glimt og dårlig impulskontroll.",
      bonusSpecies: ["gjedde", "laks", "sei", "lyr"],
    },
    spinner: {
      id: "spinner",
      name: "Spinner",
      cost: 260,
      description: "Allsidig og litt flørtete. Ørreten tar den personlig.",
      bonusSpecies: ["orret", "harr", "gjedde", "makrell"],
    },
    reke: {
      id: "reke",
      name: "Reke",
      cost: 380,
      description: "Bryggenes diplomat. Får saltvannsfisk til å senke garden.",
      bonusSpecies: ["torsk", "steinbit", "uer"],
    },
    sild: {
      id: "sild",
      name: "Sild",
      cost: 520,
      description: "Lukter penger, fjord og en anelse overmot.",
      bonusSpecies: ["sei", "torsk", "lyr", "steinbit", "breiflabb", "kveite"],
    },
    pilk: {
      id: "pilk",
      name: "Pilk",
      cost: 880,
      description: "Tung, direkte og fullstendig uinteressert i småprat.",
      bonusSpecies: ["brosme", "lange", "uer", "breiflabb", "kveite"],
    },
  };

  App.getRodData = function getRodData(level) {
    return App.RODS.find((item) => item.level === level) || null;
  };

  App.getReelData = function getReelData(level) {
    return App.REELS.find((item) => item.level === level) || null;
  };

  App.getLineData = function getLineData(level) {
    return App.LINES.find((item) => item.level === level) || null;
  };

  App.getBoatData = function getBoatData(level) {
    return App.BOATS.find((item) => item.level === level) || null;
  };

  App.getBagData = function getBagData(level) {
    return App.BAGS.find((item) => item.level === level) || App.BAGS[0];
  };
  App.getTankData = function getTankData(level) {
    return App.TANKS.find((item) => item.level === level) || App.TANKS[0];
  };
  App.getTankCapacity = function getTankCapacity(state) {
    return App.getTankData(state.equipment.tankLevel).capacity;
  };
  App.getTankWeight = function getTankWeight(state) {
    return state.fishTank.reduce((sum, fish) => sum + fish.weightKg, 0);
  };

  App.getBagCapacity = function getBagCapacity(state) {
    return App.getBagData(state.equipment.bagLevel).capacity +
      (App.getBoatData(state.equipment.boatLevel)?.cargoBonus || 0);
  };
  App.getBagWeight = function getBagWeight(state) {
    return state.inventory.reduce((sum, fish) => sum + fish.weightKg, 0);
  };

  App.getRestaurantData = function getRestaurantData(level) {
    return App.RESTAURANT_UPGRADES.find((item) => item.level === level) || null;
  };

  App.getActiveBait = function getActiveBait(state) {
    return App.BAITS[state.activeBaitId] || App.BAITS.mark;
  };
  App.getUpgradeRequiredLevel = function (type, nextLevel) {
    if (type === "rod") return Math.max(1, nextLevel * 2 - 2);
    if (type === "boat") return nextLevel * 3;
    if (type === "kitchen") return nextLevel * 2;
    return 1;
  };

  App.getBaitModifier = function getBaitModifier(fish, baitId) {
    const bait = App.BAITS[baitId];
    if (!bait) {
      return 1;
    }
    if (bait.bonusSpecies.includes(fish.id)) return 1.65;
    return fish.preferredBaits.includes(baitId) ? 1.25 : 0.8;
  };

  App.setActiveBait = function setActiveBait(state, baitId) {
    if (!state.ownedBaits[baitId]) {
      return false;
    }
    state.activeBaitId = baitId;
    App.addMessage(state, `Du gjør klar ${App.BAITS[baitId].name.toLowerCase()}.`);
    return true;
  };

  App.purchaseItem = function purchaseItem(state, type, itemId) {
    if (type === "bait") {
      const bait = App.BAITS[itemId];
      if (!bait) {
        return { ok: false, message: "Fant ikke agnet." };
      }
      if (state.ownedBaits[itemId]) {
        App.setActiveBait(state, itemId);
        return { ok: true, message: `${bait.name} valgt som aktivt agn.` };
      }
      if (state.money < bait.cost && !state.devFreeUpgrades) {
        return { ok: false, message: "Du har ikke nok penger." };
      }
      if (!state.devFreeUpgrades) state.money -= bait.cost;
      state.ownedBaits[itemId] = true;
      state.activeBaitId = itemId;
      App.addMessage(state, `Du kjøpte ${bait.name.toLowerCase()}${state.devFreeUpgrades ? " gratis" : ` for ${bait.cost} kr`}.`);
      return { ok: true, message: "Kjøpet er gjennomført." };
    }

    const categoryMap = {
      rod: { key: "rodLevel", items: App.RODS },
      reel: { key: "reelLevel", items: App.REELS },
      line: { key: "lineLevel", items: App.LINES },
      boat: { key: "boatLevel", items: App.BOATS },
      bag: { key: "bagLevel", items: App.BAGS },
      tank: { key: "tankLevel", items: App.TANKS },
      restaurant: { key: "restaurantLevel", items: App.RESTAURANT_UPGRADES },
      kitchen: { key: "kitchenLevel", items: App.KITCHENS },
      chairs: { key: "chairsLevel", items: App.CHAIRS },
      comfort: { key: "comfortLevel", items: App.COMFORTS },
      service: { key: "serviceLevel", items: App.SERVICE_UPGRADES },
    };

    const category = categoryMap[type];
    if (!category) {
      return { ok: false, message: "Ukjent oppgradering." };
    }

    const currentLevel = state.equipment[category.key];
    const nextItem =
      type === "boat"
        ? category.items[currentLevel + 1]
        : category.items.find((item) => item.level === currentLevel + 1);

    if (!nextItem) {
      return { ok: false, message: "Denne oppgraderingen er allerede maks." };
    }
    const neededLevel = App.getUpgradeRequiredLevel(type, nextItem.level);
    if (state.level < neededLevel && !state.devFreeUpgrades) {
      return { ok: false, message: `Krever fiskernivå ${neededLevel}. Du er nivå ${state.level}.` };
    }
    if (state.money < nextItem.cost && !state.devFreeUpgrades) {
      return { ok: false, message: `Du trenger ${nextItem.cost} kr, men har ${Math.round(state.money)} kr.` };
    }

    if (!state.devFreeUpgrades) state.money -= nextItem.cost;
    state.equipment[category.key] = nextItem.level;
    App.addMessage(state, `Du kjøpte ${nextItem.name.toLowerCase()}${state.devFreeUpgrades ? " gratis" : ` for ${nextItem.cost} kr`}.`);
    return { ok: true, message: `${nextItem.name} er nå i bruk.` };
  };
})();

