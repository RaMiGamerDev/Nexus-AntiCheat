import { world, system } from "@minecraft/server";
import { runCmd, MORE_INFO } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";

const utilityConfig = config.staff.utility;
let registred = [];
system.runInterval(() => {
world.sendMessage(`§8[§uNexus§8] §7This server is protected by §uNexus AntiCheat §8(§7made by §uDr.hex§8)§r\n§cinformation §8: `+MORE_INFO)
}, 6000)
system.runInterval(() => {
    let data = JSON.parse(world.getDynamicProperty(utilityConfig.dataBaseId) || '{}').playerData || [];
   if (!v()) return
    for (let player of world.getAllPlayers()) {
        if (registred.includes(player.id)) continue;
        let exist = false;
        for (let p of data) {
            if (player.id === p.id) exist = true;
        }

        if (!exist) {
            data.push({
                name: player.name,
                id: player.id,
                mute: {
                    muteDuration: 0,
                    muteDate: Date.now(),
                    mutedBy: ""
                },
                ban: {
                    banDuration: 0,
                    banDate: Date.now(),
                    banReason: "",
                    bannedBy: ""
                },
                nexusOpped: false
            });

            world.setDynamicProperty(utilityConfig.dataBaseId, JSON.stringify({ playerData: data }));
            registred.push(player.id);
        }
    }
});
world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    const data = JSON.parse(world.getDynamicProperty(utilityConfig.dataBaseId) || '{}').playerData || [];
    
    if (initialSpawn) {
        for (let p of data) {
            if (player.id === p.id && p.ban) {

                const now = Date.now();
                const durationMs = p.ban.banDuration * 60 * 60 * 1000;
                const expiresAt = p.ban.banDate + durationMs;
                const remainingMs = expiresAt - now;
                const banCheck = remainingMs > 0;

                if (banCheck) {
                    const duration = (remainingMs / (1000 * 60 * 60)).toFixed(2);

                    system.runTimeout(() => {
                        runCmd(`kick "${player.name}" .\n§c§lYou have been banned!§r\n\n§8§l>> §r§eBy §8§l:§r ${p.ban.bannedBy}\n§8§l>> §r§eReason §8§l:§r §c${p.ban.banReason}\n§8§l>> §r§eExpires in §8§l:§r §c${duration} §8h\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}`);
                    }, 40);
                }
            }
        }
        player.sendMessage(`§8[§uNexus§8] §7This server is protected by §uNexus AntiCheat §8(§7made by §uDr.hex§8)§r\n§cinformation §8: `+MORE_INFO)
    }
});