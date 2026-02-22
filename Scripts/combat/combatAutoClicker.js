import { world, Player, system } from "@minecraft/server";
import { getPing, detect, isOp } from "../utility/utility.js";
import { config } from "../config.js";
import { v } from "../main.js";

const cps = new Map();

world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event;
    const attacker = damagingEntity;

    const autoClickerCfg = config.modules.combat.autoClicker;
    const now = Date.now();

    if (
        !hitEntity ||
        !v() ||
        !attacker ||
        !(attacker instanceof Player) ||
        !autoClickerCfg.enabled ||
        isOp(attacker)
    ) return;
    if (getPing(attacker.id) > autoClickerCfg.maxPing) return
    let data = cps.get(attacker.id);

    if (!data) {
        data = {
            cps: 0,
            start: now,
            hit: true
        };
        cps.set(attacker.id, data);
    }

    if (!data.hit) return;

    if (now - data.start <= 500) {
        data.cps++;
    } else {
        data.cps = 0;
        data.start = now;
    }

    const flag = {
        flagMessage: `§f${attacker.name} §7failed §cAutoClicker §8§l(§r§c${data.cps * 2}§8§l/§r§a${autoClickerCfg.max * 2}§l§8) §8§l(§r§fPing§8: §7${getPing(attacker.id).toFixed(2)} ms§8§l)`,
        staffTag: config.staff.utility.notifyTag
    };

    if (data.cps > autoClickerCfg.max) {
        detect(flag);
        data.hit = false;

        system.runTimeout(() => {
            data.hit = true;
            cps.set(attacker.id, data);
        }, autoClickerCfg.disableCombatTimer);
    }
    cps.set(attacker.id, data);
});

world.beforeEvents.entityHurt.subscribe((ev) => {
    const { damageSource } = ev;
    const attacker = damageSource.damagingEntity;

    if (!attacker) return;

    const data = cps.get(attacker.id);
    if (!data) return;

    if (!data.hit) {
        ev.cancel = true;
    }
});
world.afterEvents.playerLeave.subscribe((ev) => {
cps.delete(ev.id)
})