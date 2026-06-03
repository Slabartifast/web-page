(function () {
  const App = (window.FjordFritert = window.FjordFritert || {});
  const STORAGE_KEY = "fjord-og-fritert-save-v1";

  App.saveGame = function saveGame(state, silent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(App.utils.deepClone(state)));
      if (!silent) {
        App.addMessage(state, "Spillet er lagret lokalt.");
      }
      return true;
    } catch (error) {
      App.addMessage(state, "Kunne ikke lagre spillet i nettleseren.");
      return false;
    }
  };

  App.loadGame = function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return App.hydrateState(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  };

  App.clearSavedGame = function clearSavedGame() {
    localStorage.removeItem(STORAGE_KEY);
  };
})();
