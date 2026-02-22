import { world } from "@minecraft/server";
import { getPing, detect, entityDistance, isOp } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";
let reachData = new Map()
world.beforeEvents.entityHurt.subscribe((ev) => {
  if (v()) {
    const attacker = ev?.damageSource?.damagingEntity;
    const target = ev?.hurtEntity;
    const cause = ev?.damageSource?.cause
    const reachCfg = config.modules.combat.reach
    if (!attacker || !target || !v() || !reachCfg.enabled || cause == "projectile" || isOp(attacker)) return;
    if (getPing(attacker.id) >= reachCfg.maxPing) return
    const distance = entityDistance(attacker, target)
    const now = Date.now()
    let data = reachData.get(attacker.id)
    if (!data) {
      data = {
       lastHit: now,
       lastReach: 0,
       count: 0
      }
      reachData.set(attacker.id, data)
    }
    if (now - data.lastHit < reachCfg.cooldown) return
    else data.lastHit = now
    if (distance.distance > reachCfg.max) {
    data.count++
    data.lastReach = now
    ev.cancel = true
    } else if (now - data.lastReach >= 5000 && data.count > 0) data.count = 0
    if (data.count >= reachCfg.count) {
    const flag = { flagMessage: `§f${attacker.name} §7failed §cReach §8§l(§r§c${distance.distance.toFixed(2)}§8§l/§r§a${reachCfg.max}§l§8) §8§l(§r§fPing§8: §7${getPing(attacker.id).toFixed(2)} ms§8§l)`, staffTag: config.staff.utility.notifyTag }
    detect(flag)
    data.count = 0
    }
    reachData.set(attacker.id, data)
  }
});
world.afterEvents.playerLeave.subscribe((ev) => {
reachData.delete(ev.id)
})