import { world, Player } from "@minecraft/server";
import { getPing, detect, entityDistance, isOp } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";
let lastAttack = new Map();
world.beforeEvents.entityHurt.subscribe( (event) => {
  try {
    const { hurtEntity, damageSource } = event;
    if (!damageSource || !v()) return;
   const cause = event?.damageSource?.cause
    const attacker = damageSource.damagingEntity;
    const target = hurtEntity
    if (!attacker || cause == "projectile") return;
    if (!(attacker instanceof Player) && !(target instanceof Player) || isOp(attacker)) return;
    const ping = getPing(attacker.id);
    const killauraCfg = config.modules.combat.killaura
    const a = attacker.location;
    const t = hurtEntity.location;

    const dx = t.x - a.x;
    const dy = t.y - a.y;
    const dz = t.z - a.z;

    const distance = entityDistance(attacker, target).distance
    const dirLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dirX = dx / dirLength;
    const dirY = dy / dirLength;
    const dirZ = dz / dirLength;

    const view = attacker.getViewDirection();

    const dot = view.x * dirX + view.y * dirY + view.z * dirZ;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    if (lastAttack.get(attacker.id) == undefined) {
    lastAttack.set(attacker.id, { lastTime: Date.now(), lastTarget: hurtEntity.id })
    return
    }
    const hit = Date.now() - lastAttack.get(attacker.id).lastTime
    function flag(type) {
    event.cancel = true;
    let flagMsg;
    if (type == "A") flagMsg = { flagMessage: `§f${attacker.name} §7failed §cKillaura §8§l(§r§c${type}§l§8) §8§l(§r§c${angle.toFixed(2)}°§8§l/§r§a${killauraCfg.max}°§l§8) §8§l(§r§fPing§8: §7${getPing(attacker.id).toFixed(2)} ms§8§l)`, staffTag: config.staff.utility.notifyTag }
    else if (type == "B") flagMsg = { flagMessage: `§f${attacker.name} §7failed §cKillaura §8§l(§r§c${type}§l§8) §8§l(§r§c${angle.toFixed(2)}°§8§l/§r§a${killauraCfg.min}°§l§8) §8§l(§r§fPing§8: §7${getPing(attacker.id).toFixed(2)} ms§8§l)`, staffTag: config.staff.utility.notifyTag }
    else if (type == "C") flagMsg = { flagMessage: `§f${attacker.name} §7failed §cKillaura §8§l(§r§c${type}§l§8) §8§l(§r§c${hit} ms§8§l/§r§a${killauraCfg.cooldown} ms§l§8) §8§l(§r§fPing§8: §7${getPing(attacker.id).toFixed(2)} ms§8§l)`, staffTag: config.staff.utility.notifyTag }
    detect(flagMsg)
     }
    if (ping >= killauraCfg.maxPing) {
      event.cancel = true;
      return
    } 
    if (angle > killauraCfg.max && distance >= killauraCfg.distance) {
    flag("A")
    } 
    if (angle <= killauraCfg.min) {
    flag("B")
    }
    if (hit <= killauraCfg.cooldown && lastAttack.get(attacker.id).lastTarget != target.id) {
    flag("C")
    }
  lastAttack.set(attacker.id, { lastTime: Date.now(), lastTarget: hurtEntity.id })
  } catch (err) {
    console.error("entityHurt handler error:", err);
  }
});
world.afterEvents.playerLeave.subscribe((ev) => {
lastAttack.delete(ev.id)
})