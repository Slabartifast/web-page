import datetime
import json
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request

key = os.environ["STEAM_API_KEY"]
steam_id = "76561198030319279"

def steam(path, **params):
    query = urllib.parse.urlencode({"key": key, "steamid": steam_id, **params})
    request = urllib.request.Request("https://api.steampowered.com/" + path + "?" + query,
                                     headers={"User-Agent": "slabartifast-web-page/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)

recent = steam("IPlayerService/GetRecentlyPlayedGames/v0001/", count=12).get("response", {}).get("games", [])
owned = steam("IPlayerService/GetOwnedGames/v0001/", include_appinfo=1, include_played_free_games=1).get("response", {}).get("games", [])

def game(g):
    return {"appid": g["appid"], "name": g.get("name", f"Spill {g['appid']}"),
            "playtime_2weeks": g.get("playtime_2weeks", 0),
            "playtime_forever": g.get("playtime_forever", 0)}

all_time = sorted((game(g) for g in owned if g.get("playtime_forever", 0) > 0),
                  key=lambda g: g["playtime_forever"], reverse=True)
favorites = [g for g in (game(x) for x in owned)
             if g["appid"] in (294100, 526870)
             or g["name"].lower().startswith("age of empires")]
favorites.sort(key=lambda g: (g["appid"] not in (294100, 526870), -g["playtime_forever"]))

achievements = []
for g in {g['appid']: g for g in (favorites + all_time[:5])}.values():
    try:
        response = steam("ISteamUserStats/GetPlayerAchievements/v0001/", appid=g["appid"], l="norwegian")
        for a in response.get("playerstats", {}).get("achievements", []):
            if a.get("achieved") and a.get("unlocktime"):
                achievements.append({"appid": g["appid"], "game": g["name"],
                                     "name": a.get("name") or a.get("apiname") or "Achievement",
                                     "unlocktime": a["unlocktime"]})
    except (urllib.error.HTTPError, KeyError, ValueError):
        continue
achievements.sort(key=lambda a: a["unlocktime"], reverse=True)
pathlib.Path("data").mkdir(exist_ok=True)
pathlib.Path("data/steam-recent.json").write_text(
    json.dumps({"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "games": [game(g) for g in recent], "all_time": all_time[:5],
                "favorites": favorites, "achievements": achievements[:5]},
               ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
