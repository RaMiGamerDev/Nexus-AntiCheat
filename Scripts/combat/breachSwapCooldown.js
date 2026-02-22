import { world } from "@minecraft/server";
import { isOp, getPing } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";

let mace = new Map();

world.beforeEvents.entityHurt.subscribe((ev) => {
    if (!v()) return;

    const attacker = ev?.damageSource?.damagingEntity;
    const target = ev?.hurtEntity;
    const cause = ev?.damageSource?.cause;
    const maceCfg = config.modules.combat.breachSwap;

    if (!attacker || !target || !maceCfg?.enabled || cause === "projectile" || isOp(attacker)) return;
    if (getPing(attacker.id) >= maceCfg.maxPing) return;

    const item = attacker.getComponent("minecraft:inventory")?.container?.getItem(attacker.selectedSlotIndex)?.typeId;
    if (!maceCfg.maceItems.includes(item)) return;

    const now = Date.now();
    let data = mace.get(attacker.id);

    if (!data) {
        data = { lastHit: 0 };
        mace.set(attacker.id, data);
    }

    if (now - data.lastHit < maceCfg.cooldown) {
        ev.cancel = true;
        return;
    }

    data.lastHit = now;
    mace.set(attacker.id, data);
});

world.afterEvents.playerLeave.subscribe((ev) => {
    mace.delete(ev.id);
});