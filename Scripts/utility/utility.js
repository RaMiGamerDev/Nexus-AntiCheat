import { world, system } from "@minecraft/server"
import { config } from "../config.js";
import { v } from "../main.js";
const utilityConfig = config.staff.utility
const dataBaseId = utilityConfig.dataBaseId
//check if the player is  nexus operator
export function isOp(player) {
    if (!player) return false;
    let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
    if (!data) return false;

    let entry = data.find(p => p.id === player.id);
    if (!entry) return false;

    return entry.nexusOpped === true;
}
//caculate distance
export function generalDistance(location, location1) {
const { x, y, z } = location
const { x: x1, y: y1, z: z1 } = location1
const disX = x - x1
const disY = y - y1
const disZ = z - z1
const distance = Math.sqrt(disX*disX+disY*disY+disZ*disZ)
return distance
}
//entity distance
export function entityDistance(entity, entity1) {
const loc = entity.location
const loc1 = entity1.location
const { x, y, z } = entity.getVelocity()
const { x: x1, y: y1, z: z1 } = entity1.getVelocity()
const vX = Math.abs(x) + Math.abs(x1)
const vY = Math.abs(y) + Math.abs(y1)
const vZ = Math.abs(z) + Math.abs(z1)
const velocity = (vX+vY+vZ) * 2.3 
let distance = generalDistance(loc, loc1)  - velocity
if (distance < 0) distance = 0
return { distance, velocity }
}
//block distance
export function blockDistance(entity, block) {
const loc = entity.getHeadLocation()
const loc1 = block.location
const { x, y, z } = entity.getVelocity()
const vX = Math.abs(x)
const vY = Math.abs(y)
const vZ = Math.abs(z)
const velocity = (vX+vY+vZ) * 2.3
let distance = generalDistance(loc, loc1)  - velocity
if (loc.x > loc1.x+1 || loc.z > loc1.z+1 ) distance = distance - 1.2
if (distance < 0) distance = 0
return { distance, velocity }
}
//runs a cmd all over the world
export function runCmd(cmd, dimHint) {
  try {
    const d0 = dimHint ?? world.getDimension?.("overworld");
    if (d0?.runCommandAsync) {
      d0.runCommandAsync(cmd);
      return true;
    }
  } catch {}
  try {
    const d1 = world.getDimension?.("overworld");
    if (d1?.runCommandAsync) {
       d1.runCommandAsync(cmd);
      return true;
    }
  } catch {}
  return false;
}
//detect a player and notify moderators
export function detect(flag, punishment) {
  const message = flag.flagMessage.replace(/§./g, "");
  for (let player of world.getAllPlayers()) {
     if (isOp(player) || player.hasTag(flag.staffTag)) {
      player.sendMessage(`§8[§uNexus§8] `+flag.flagMessage)
     }
     console.warn(`[Nexus] `+message)
  }
}
//get ping system
const storage = new Map()
const lastPing = new Map()
let lastTickTime = Date.now()

system.runInterval(() => {
if (!v()) return
  for (const player of world.getAllPlayers()) {
    const loc = player.location
    const vel = player.getVelocity()
    const prev = storage.get(player.id)

    if (!prev) {
      storage.set(player.id, {
        location: { x: loc.x, y: loc.y, z: loc.z },
        distance: 0,
        velocity: { x: vel.x, y: vel.y, z: vel.z },
        ticks: 0
      })
      continue
    }

    const dx = loc.x - prev.location.x
    const dy = loc.y - prev.location.y
    const dz = loc.z - prev.location.z

    prev.distance += Math.sqrt(dx * dx + dy * dy + dz * dz)

    prev.location.x = loc.x
    prev.location.y = loc.y
    prev.location.z = loc.z

    prev.velocity.x = vel.x
    prev.velocity.y = vel.y
    prev.velocity.z = vel.z

    prev.ticks++
    storage.set(player.id, prev)
  }
})
system.runInterval(() => {
  const now = Date.now()
  const elapsed = now - lastTickTime
  lastTickTime = now
  const tpsFactor = elapsed / 50  
  if (!v()) return
  for (const player of world.getAllPlayers()) {
    const data = storage.get(player.id)
    if (!data || data.ticks === 0) continue

    const v = data.velocity
    const velocityMag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    const distance = data.distance
    const ratio = velocityMag / (distance + 0.001)

    let pseudoPing = Math.log2(ratio + 1) * 120
    pseudoPing /= tpsFactor
    pseudoPing = Math.max(0, Math.min(pseudoPing, 10000))

    lastPing.set(player.id, pseudoPing)

    data.distance = 0
    data.ticks = 0
    storage.set(player.id, data)

  }
}, 20)

// Exportable function to get ping by player ID
export function getPing(playerId) {
  return lastPing.get(playerId) ?? 0
}
const MORE_INFO = "§7version "+utilityConfig.version+" §cGet §uNexus AntiCheat §cat §ahttps://discord.gg/QvRhTebnVu";
//cmd logic
export function ban(options, sender) {
    if (options.name && options.by && options.duration && options.reason) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                player.ban.banDuration = Number(options.duration);
                player.ban.banDate = Date.now();
                player.ban.banReason = options.reason;
                player.ban.bannedBy = options.by;
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§c§lYou have been banned!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eReason §8§l:§r §c${options.reason}\n§8§l>> §r§eExpires in §8§l:§r §c${options.duration} §8h\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                runCmd(`kick "${player.name}" .\n§c§lYou have been banned!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eReason §8§l:§r §c${options.reason}\n§8§l>> §r§eExpires in §8§l:§r §c${options.duration} §8h\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §cexecuted a ban command on §e${options.name} §8- §r§7Reason: ${options.reason} §8- §r§7Duration: ${options.duration}h`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed ban command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}ban <playerName> <reason> <duration in hours>\n example\n${utilityConfig.prefix}ban "dr hex" "because you are a goat" 1`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}ban <playerName> <reason> <duration in hours>\n example\n${utilityConfig.prefix}ban "dr hex" "because you are a goat" 1`);
}

export function mute(options, sender) {
    if (options.name && options.by && options.duration && options.reason) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                player.mute.muteDuration = Number(options.duration);
                player.mute.muteDate = Date.now();
                player.mute.muteReason = options.reason;
                player.mute.mutedBy = options.by;
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§c§lYou have been muted!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eReason §8§l:§r §c${options.reason}\n§8§l>> §r§eExpires in §8§l:§r §c${options.duration} §8min\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §cexecuted a mute command on §e${options.name} §8- §r§7Reason: ${options.reason} §8- §r§7Duration: ${options.duration}min`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed mute command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}mute <playerName> <reason> <duration in minutes>\n example\n${utilityConfig.prefix}mute "dr hex" "spamming chat" 30`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}mute <playerName> <reason> <duration in minutes>\n example\n${utilityConfig.prefix}mute "dr hex" "spamming chat" 30`);
}

export function kick(options, sender) {
    if (options.name && options.by && options.reason) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§c§lYou have been kicked!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eReason §8§l:§r §c${options.reason}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                runCmd(`kick "${player.name}" .\n§c§lYou have been kicked!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eReason §8§l:§r §c${options.reason}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §cexecuted a kick command on §e${options.name} §8- §r§7Reason: ${options.reason}`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed kick command\nbut the target doesn't exist!");
        }
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}kick <playerName> <reason>\n example\n${utilityConfig.prefix}kick "dr hex" "spamming chat"`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}kick <playerName> <reason>\n example\n${utilityConfig.prefix}kick "dr hex" "spamming chat"`);
}

export function unban(options, sender) {
    if (options.name && options.by) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                player.ban.banDuration = 0;
                player.ban.banDate = 0;
                player.ban.banReason = "";
                player.ban.bannedBy = "";
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§a§lYou have been unbanned.§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §aexecuted an unban command on §e${options.name}`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed unban command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\n§acorrect usage: ${utilityConfig.prefix}unban <playerName>\n example\n${utilityConfig.prefix}unban "dr hex"`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}unban <playerName>\n example\n${utilityConfig.prefix}unban "dr hex"`);
}

export function unmute(options, sender) {
    if (options.name && options.by) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                player.mute.muteDuration = 0;
                player.mute.muteDate = 0;
                player.mute.muteReason = "";
                player.mute.mutedBy = "";
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§a§lYou have been unmuted.§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §aexecuted an unmute command on §e${options.name}`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed unmute command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\n§acorrect usage: ${utilityConfig.prefix}unmute <playerName>\n example\n${utilityConfig.prefix}unmute "dr hex"`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}unmute <playerName>\n example\n${utilityConfig.prefix}unmute "dr hex"`);
}

export function op(options, sender) {
    if (options.name && options.by) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                if (!player.nexusOpped) player.nexusOpped = true;
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§a§lYou have been Nexus Opped!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §agave Nexus Opped privileges to §e${player.name}`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed op command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\n§acorrect usage: ${utilityConfig.prefix}op <playerName>\nexample:\n${utilityConfig.prefix}op "dr hex"`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}op <playerName>\nexample:\n${utilityConfig.prefix}op "dr hex"`);
}

export function deop(options, sender) {
    if (options.name && options.by) {
        let data = JSON.parse(world.getDynamicProperty(dataBaseId))?.playerData;
        if (!data) return;
        let found = false;
        for (let player of data) {
            if (options.name.toLowerCase() === player.name.toLowerCase()) {
                found = true;
                player.nexusOpped = false;
                runCmd(`tellraw "${player.name}" {"rawtext":[{"text":"§c§lYour Nexus Opped privileges have been removed!§r\n\n§8§l>> §r§eBy §8§l:§r ${options.by}\n§8§l>> §r§eMore information §8§l:§r §c${MORE_INFO}"}]}`);
                if (sender) {
                    for (let staff of world.getAllPlayers()) {
                        if (isOp(staff)) staff.sendMessage(`§8[§uNexus§8] §e${sender.name} §cremoved Nexus Opped privileges from §e${player.name}`);
                    }
                }
            }
        }
        if (!found) {
            if (sender) sender.sendMessage(`§8[§uNexus§8] §cThe target doesn't exist!`);
            else console.log("[Nexus] Executed deop command\nbut the target doesn't exist!");
        }
        if (found) world.setDynamicProperty(dataBaseId, JSON.stringify({ playerData: data }));
    } else if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong syntax (missing argument)!\n§acorrect usage: ${utilityConfig.prefix}deop <playerName>\nexample:\n${utilityConfig.prefix}deop "dr hex"`);
    else console.log(`[Nexus] Wrong syntax (missing argument)!\ncorrect usage: ${utilityConfig.prefix}deop <playerName>\nexample:\n${utilityConfig.prefix}deop "dr hex"`);
}

export function help(sender) {
    if (!sender) return;
    const commands = utilityConfig.commands
    let message = "§8[§uNexus§8] §eAvailable Commands:\n\n";
    for (let c of commands) {
        message += `§8>> §r§e${c.cmd} §8- §r§7Usage: ${c.usage}\n`;
    }
    sender.sendMessage(message);
}

export function checkPassword(options, sender) {
    if (!options.pass) {
        if (sender) sender.sendMessage(`§8[§uNexus§8] §cNo password provided!`);
        return;
    }
    if (options.pass === config.staff.authority.password) {
        if (sender) sender.sendMessage(`§8[§uNexus§8] §ePassword correct!`);
        let data = JSON.parse(world.getDynamicProperty(config.staff.utility.dataBaseId) || '{}').playerData || [];
        for (let player of data) {
            if (player.name === sender.name) {
                player.nexusOpped = true;
            }
        }
        world.setDynamicProperty(config.staff.utility.dataBaseId, JSON.stringify({ playerData: data }));
        for (let player of world.getAllPlayers()) {
            if (isOp(player)) {
                player.sendMessage(`§8[§uNexus§8] §e${sender.name} §aentered the correct op password!`);
            }
        }
    } else {
        if (sender) sender.sendMessage(`§8[§uNexus§8] §cWrong password!`);
    }
}
export { MORE_INFO }