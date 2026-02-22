import { world } from "@minecraft/server";
import { MORE_INFO } from "../utility/utility.js";
import { config } from "../config.js";
import { v } from "../main.js";

const utilityConfig = config.staff.utility;
world.beforeEvents.chatSend.subscribe((ev) => {
    const { message, sender } = ev;
    if (!v()) return
    const data = JSON.parse(world.getDynamicProperty(utilityConfig.dataBaseId) || '{}').playerData || [];

    for (let p of data) {
        if (sender.id === p.id && p.mute) {

            const now = Date.now();
            const durationMs = p.mute.muteDuration * 60 * 1000;
            const expiresAt = p.mute.muteDate + durationMs;
            const remainingMs = expiresAt - now;

            if (remainingMs > 0) {
                const duration = (remainingMs / (1000 * 60)).toFixed(2);

                ev.cancel = true;
                if (!message.startsWith(utilityConfig.prefix)) sender.sendMessage(`§8[§uNexus§8] §c§lYou are muted!§r\n\n§8§l>> §r§eBy §8§l:§c ${p.mute.mutedBy}\n§8§l>> §r§eExpires in §8§l:§r §c${duration} §8minutes\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}`);
            }

            break;
        }
    }
});