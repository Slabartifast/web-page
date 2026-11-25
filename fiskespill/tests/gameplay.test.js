const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = vm.createContext({ window: {}, console, Math, Date });
for (const file of ["gameState", "spriteData", "fishData", "maps", "shop", "player", "fishing"]) {
  vm.runInContext(fs.readFileSync(`src/${file}.js`, "utf8"), context, { filename: file });
}
const App = context.window.FjordFritert;
const state = App.createInitialState();
state.phase = "day";
const map = App.getMapById(state.currentMapId);
assert.equal(App.getBagCapacity(state), 3);
state.player.x = map.spawn.x;
state.player.y = map.spawn.y;
const shortCast = App.getCastContext(state, map, 1);
state.equipment.rodLevel = 3;
const improvedCast = App.getCastContext(state, map, 1);
assert.ok(improvedCast.waterDepth > shortCast.waterDepth, "Bedre stang må nå dypere vann");
state.equipment.rodLevel = 1;

const lureState = App.createInitialState();
lureState.phase = "day";
lureState.activeBaitId = "sluk";
lureState.player.x = map.spawn.x;
lureState.player.y = map.spawn.y;
lureState.fishing.mode = "waiting";
lureState.fishing.castPoint = { x: 390, y: map.spawn.y };
lureState.fishing.waterDepth = 75;
const startDistance = Math.abs(lureState.fishing.castPoint.x - lureState.player.x);
App.handleFishingInput(lureState, map, { interactPressed: true });
assert.ok(Math.abs(lureState.fishing.castPoint.x - lureState.player.x) < startDistance,
  "Sveiving med sluk må trekke agnet inn");

const castState = App.createInitialState();
castState.phase = "day";
castState.player.x = map.spawn.x;
castState.player.y = map.spawn.y;
assert.equal(App.beginFishingCharge(castState, map), true);
App.updateFishing(castState, { interactHeld: true }, 0.35, map);
App.handleFishingInput(castState, map, { interactPressed: true });
assert.equal(castState.fishing.mode, "aiming");
App.updateFishing(castState, {}, 0.23, map);
castState.fishing.aim = 0.5;
App.handleFishingInput(castState, map, { interactPressed: true });
assert.equal(castState.fishing.mode, "casting");
App.updateFishing(castState, {}, 0.36, map);
assert.equal(castState.fishing.mode, "waiting");
for (let attempt = 0; attempt < 100 && castState.fishing.mode === "waiting"; attempt += 1) {
  App.updateFishing(castState, {}, castState.fishing.waitTime + 0.01, map);
}
assert.equal(castState.fishing.mode, "bite");

state.fishing.mode = "bite";
state.fishing.timer = 0.4;
state.fishing.biteWindow = 0.4;
App.updateFishing(state, {}, 0.2, map);
assert.equal(state.fishing.mode, "bite");
App.updateFishing(state, {}, 0.21, map);
assert.equal(state.fishing.mode, "idle", "Nappet må forsvinne når fristen går ut");

state.fishing.mode = "bite";
state.fishing.timer = 1;
state.fishing.biteWindow = 1;
App.handleFishingInput(state, map, { interactPressed: true });
assert.equal(state.fishing.mode, "hooking");
state.fishing.hookMarker = state.fishing.hookCenter;
App.handleFishingInput(state, map, { interactPressed: true });
assert.equal(state.fishing.mode, "reeling");
const hooked = state.fishing.hookedFishId;
state.fishing.fishSpeed = 0;
state.fishing.fishMoveTimer = 100;
state.fishing.fishPosition = state.fishing.marker;
for (let frame = 0; frame < 40; frame += 1) {
  App.updateFishing(state, { interactHeld: frame % 2 === 0 }, 0.05, map);
}
assert.ok(state.fishing.mode === "reeling" && state.fishing.progress < 1,
  "En fiskekamp skal ikke være ferdig etter to sekunder");
state.fishing.progress = 0.999;
state.fishing.marker = state.fishing.fishPosition;
App.updateFishing(state, { interactHeld: false }, 0.05, map);
assert.equal(state.pendingCatch.fishId, hooked, "Fangsten må være fisken som bet");
assert.equal(state.inventory.length, 0);
assert.equal(App.resolvePendingCatch(state, "keep"), true);
assert.equal(state.inventory.length, 1);

const first = state.inventory[0];
state.inventory.push({ ...first, id: "two" }, { ...first, id: "three" });
state.pendingCatch = { ...first, id: "new" };
assert.equal(App.resolvePendingCatch(state, "keep"), false, "Full bag kan ikke overfylles");
assert.equal(App.resolvePendingCatch(state, "replace", first.id), true);
assert.equal(state.inventory.length, 3);
assert.equal(state.inventory[0].id, "new");

state.money = 1000;
assert.equal(App.purchaseItem(state, "bag").ok, true);
assert.equal(App.getBagCapacity(state), 5);
const hydrated = App.hydrateState(JSON.parse(JSON.stringify(state)));
assert.equal(App.getBagCapacity(hydrated), 5);
for (const destination of App.MAPS) {
  const traveler = App.createInitialState();
  traveler.phase = "mapSelect";
  traveler.unlockedMapIds.push(destination.id);
  assert.equal(App.changeMap(traveler, destination.id), true);
  assert.equal(App.canOccupyPoint(destination, traveler, traveler.player.x, traveler.player.y), true,
    `${destination.name}: startpunktet må være gyldig`);
  assert.equal(App.getCastContext(traveler, destination, 0.7).ok, true,
    `${destination.name}: første kast må nå vann`);
  assert.ok(destination.fishPool.every(({ fishId }) => App.getFishById(fishId)),
    `${destination.name}: alle arter må finnes`);
}
assert.equal(App.MAPS.find((map) => map.id === "skogstjern").fishPool.some((entry) => entry.fishId === "laue"), true);
assert.match(App.getFishSprite("abbor"), /^data:image\/png;base64,/);
assert.match(App.getFishSprite("orret"), /^data:image\/svg\+xml,/);
console.log("Gameplay checks passed");

