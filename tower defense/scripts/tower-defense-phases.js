(function attachTowerDefensePhases(global) {
  const PHASES = Object.freeze({
    START: "start",
    MAP_SELECT: "mapselect",
    TOWN_PLACEMENT: "townPlacement",
    BUILD: "build",
    BRIEFING: "briefing",
    WAVE: "wave",
    SUMMARY: "summary",
    VICTORY: "victory",
    DEFEAT: "defeat"
  });

  function ensureHistory(state) {
    if (!state) return [];
    if (!Array.isArray(state.phaseHistory)) state.phaseHistory = [];
    return state.phaseHistory;
  }

  function setPhase(state, nextPhase, meta = {}) {
    if (!state || !nextPhase) return nextPhase;
    const previousPhase = state.phase || null;
    if (previousPhase === nextPhase) return nextPhase;
    const history = ensureHistory(state);
    history.push({
      from: previousPhase,
      to: nextPhase,
      reason: meta.reason || "",
      at: Date.now()
    });
    if (history.length > 40) history.splice(0, history.length - 40);
    state.phase = nextPhase;
    state.lastPhaseChange = history[history.length - 1];
    return nextPhase;
  }

  function isPhase(state, phase) {
    return !!state && state.phase === phase;
  }

  function isAnyPhase(state, phases) {
    return !!state && Array.isArray(phases) && phases.includes(state.phase);
  }

  global.TowerDefensePhases = {
    PHASES,
    setPhase,
    isPhase,
    isAnyPhase
  };
})(window);
