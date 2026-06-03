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
    { level: 1, name: "Liten robåt", cost: 2500, rareBonus: 0.12, speedBonus: 14, cargoBonus: 2, note: "Sjarmerende og smått våt, men plutselig er fjorden din." },
    { level: 2, name: "Påhengsmotor", cost: 6200, rareBonus: 0.22, speedBonus: 34, cargoBonus: 5, note: "Mer rekkevidde, mer fart og mer nabomisunnelse." },
  ];

  App.RESTAURANT_UPGRADES = [
    { level: 1, name: "Liten takeaway", cost: 0, saleMultiplier: 1.0, note: "En stekepanne, en kurv og stor selvtillit." },
    { level: 2, name: "Bedre frityr", cost: 420, saleMultiplier: 1.08, note: "Mindre søl, mer margin og færre triste poteter." },
    { level: 3, name: "Større kjøkken", cost: 980, saleMultiplier: 1.16, note: "Gir kona plass til å svinge seg med både fisk og kø." },
    { level: 4, name: "Flere bord", cost: 2300, saleMultiplier: 1.25, note: "Når ryktene går og gjestene blir sittende." },
    { level: 5, name: "Spesialmeny", cost: 5200, saleMultiplier: 1.36, note: "Plutselig serveres fangsten din som signaturrett." },
  ];

  App.BAITS = {
    mark: {
      id: "mark",
      name: "Mark",
      cost: 0,
      description: "Klassikeren. Litt slim, mye arbeidsglede.",
      bonusSpecies: ["mort", "abbor", "orret", "harr", "roye"],
    },
    mais: {
      id: "mais",
      name: "Mais",
      cost: 90,
      description: "Rolige ferskvannsfisk elsker det. Nakne kroker blir bare flaue.",
      bonusSpecies: ["mort", "abbor"],
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

  App.getRestaurantData = function getRestaurantData(level) {
    return App.RESTAURANT_UPGRADES.find((item) => item.level === level) || null;
  };

  App.getActiveBait = function getActiveBait(state) {
    return App.BAITS[state.activeBaitId] || App.BAITS.mark;
  };

  App.getBaitModifier = function getBaitModifier(fish, baitId) {
    const bait = App.BAITS[baitId];
    if (!bait) {
      return 1;
    }
    return bait.bonusSpecies.includes(fish.id) ? 1.35 : 1;
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
      if (state.money < bait.cost) {
        return { ok: false, message: "Du har ikke nok penger." };
      }
      state.money -= bait.cost;
      state.ownedBaits[itemId] = true;
      state.activeBaitId = itemId;
      App.addMessage(state, `Du kjøpte ${bait.name.toLowerCase()} for ${bait.cost} kr.`);
      return { ok: true, message: "Kjøpet er gjennomført." };
    }

    const categoryMap = {
      rod: { key: "rodLevel", items: App.RODS },
      reel: { key: "reelLevel", items: App.REELS },
      line: { key: "lineLevel", items: App.LINES },
      boat: { key: "boatLevel", items: App.BOATS },
      restaurant: { key: "restaurantLevel", items: App.RESTAURANT_UPGRADES },
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
    if (state.money < nextItem.cost) {
      return { ok: false, message: "Du har ikke nok penger." };
    }

    state.money -= nextItem.cost;
    state.equipment[category.key] = nextItem.level;
    App.addMessage(state, `Du kjøpte ${nextItem.name.toLowerCase()} for ${nextItem.cost} kr.`);
    return { ok: true, message: `${nextItem.name} er nå i bruk.` };
  };
})();
