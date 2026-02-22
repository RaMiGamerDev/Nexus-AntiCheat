import { world } from "@minecraft/server";
import { getPing, detect, blockDistance, isOp } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";
world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const reachCfg = config.modules.world.blockReach;
    const { block, player } = ev;
    if (!reachCfg.enabled || isOp(player) || !v()) return;
    const distance = blockDistance(player, block).distance;
    if (distance > reachCfg.max) {
        ev.cancel = true;
        const ping = getPing(player.id);
        if (ping >= reachCfg.maxPing) return;
        detect({ flagMessage: `§f${player.name} §7failed §cBlock Reach §8§l(§r§cPlace§l§8) §8§l(§r§c${distance.toFixed(2)}§8§l/§r§a${reachCfg.max}§l§8) §8§l(§r§fPing§8: §7${ping.toFixed(2)} ms§8§l)`, staffTag: config.staff.utility.notifyTag });
    }
});