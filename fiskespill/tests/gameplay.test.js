const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = vm.createContext({ window: {}, console, Math, Date });
for (const file of ["gameState", "fishData", "maps", "shop", "player", "fishing"]) {
  vm.runInContext(fs.readFileSync(`src/${file}.js`, "utf8"), context, { filename: file });
}
const App = context.window.FjordFritert;
const state = App.createInitialState();
state.phase = "day";
const map = App.getMapById(state.currentMapId);
assert.equal(App.getBagCapacity(state), 3);

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
assert.equal(state.fishing.mode, "reeling");
const hooked = state.fishing.hookedFishId;
state.fishing.progress = 0.999;
state.fishing.marker = state.fishing.targetCenter;
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
console.log("Gameplay checks passed");

