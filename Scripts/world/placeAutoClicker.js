import { world, system } from "@minecraft/server";
import { getPing, detect, isOp } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";

let placeCPSData = new Map();
const autoClickerCfg = config.modules.world.autoClicker;

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const player = ev.player;
    if (!player || !autoClickerCfg.enabled || isOp(player) || !v()) return;

    const now = Date.now();
    let data = placeCPSData.get(player.id);

    if (!data) {
        data = { count: 0, lastPlace: now, place: true };
        placeCPSData.set(player.id, data);
    }

    if (!data.place) {
        ev.cancel = true;
        return;
    }

    if (now - data.lastPlace >= 500) {
    data.lastPlace = now;
    data.count = 0;
    }

    data.count++;
    
    if (data.count > autoClickerCfg.max) {
        ev.cancel = true;
        const ping = getPing(player.id);

        if (ping <= autoClickerCfg.maxPing) {
            data.place = false;

            const flagMsg = {
                flagMessage: `§f${player.name} §7failed §cBlock AutoClicker §8§l(§r§c${data.count}§8§l/§r§a${autoClickerCfg.max}§l§8) §8§l(§r§fPing§8: §7${ping.toFixed(2)} ms§8§l)`,
                staffTag: config.staff.utility.notifyTag
            };
            detect(flagMsg);

            system.runTimeout(() => {
                data.place = true;
                placeCPSData.set(player.id, data);
            }, autoClickerCfg.cooldown);

            data.count = 0;
        }
    }

    placeCPSData.set(player.id, data);
});
world.afterEvents.playerLeave.subscribe((ev) => {
playerCpsData.delete(ev.id)
})