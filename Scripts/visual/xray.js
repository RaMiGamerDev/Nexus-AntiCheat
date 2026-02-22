import {
  BlockPermutation,
  world,
  system,
} from "@minecraft/server";
import { isOp } from "../utility/utility.js";
import { config } from "../config.js";

const xray = config.modules.visual.xray;

const CFG = {
  undergroundY: xray.yLevel,               // Y level for fake ores
  maxDistance: xray.radius,                // radius around player to spawn fake ores
  checksPerTickPerPlayer: xray.blocksPerTick, // blocks processed per tick
  spawnChance: 1,                          // still fixed

  fakeLifetimeTicks: xray.blockDelay,      // how long fake ores stay
  regenEveryTicks: xray.regenerateEvery,   // now uses new property from config
  lookScanEveryTicks: 1,                   // scan frequency
  maxRaycastDistance: 9,                   // raycast distance

  storageKey: "ax.fakes.v1",
  maxStored: 6000,

  nearbyCleanupRadius: 1,
  nearbyCleanupBudgetPerTickPerPlayer: 10,

  globalExpireBudget: 80,
  globalPendingBudget: 60,
};

const JUNK_OVERWORLD = new Set([
  "minecraft:stone",
  "minecraft:deepslate",
  "minecraft:andesite",
  "minecraft:diorite",
  "minecraft:granite",
]);

const JUNK_NETHER = new Set([
  "minecraft:netherrack",
]);

const ORES_OVERWORLD = ["minecraft:diamond_ore", "minecraft:gold_ore"];
const ORES_NETHER = ["minecraft:ancient_debris"];

function dimIdToShort(id) {
  if (id === "minecraft:overworld") return "o";
  if (id === "minecraft:nether") return "n";
  if (id === "minecraft:the_end") return "e";
  return "u";
}

function shortToDimId(s) {
  if (s === "o") return "minecraft:overworld";
  if (s === "n") return "minecraft:nether";
  if (s === "e") return "minecraft:the_end";
  return "minecraft:overworld";
}

function keyOf(dimId, x, y, z) {
  return `${dimIdToShort(dimId)}|${x}|${y}|${z}`;
}

function parseKey(k) {
  const p = k.split("|");
  if (p.length !== 4) return undefined;
  return {
    dimId: shortToDimId(p[0]),
    x: (p[1] | 0),
    y: (p[2] | 0),
    z: (p[3] | 0),
  };
}

function safeGetBlock(dimension, loc) {
  try {
    return dimension.getBlock(loc);
  } catch {
    return undefined;
  }
}

function safeSetPermutation(block, perm) {
  try {
    block.setPermutation(perm);
    return true;
  } catch {
    return false;
  }
}

function nowTick() {
  return system.currentTick;
}

function randInt(minInclusive, maxInclusive) {
  return (minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1))) | 0;
}

function pickRandom(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

// FIXED: Proper spherical distribution with accurate radius checking
function randomPointInSphereInt(radius) {
  const radiusSquared = radius * radius;
  
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = randInt(-radius, radius);
    const y = randInt(-radius, radius);
    const z = randInt(-radius, radius);
    
    // Accurate distance check BEFORE returning
    const distSquared = x * x + y * y + z * z;
    if (distSquared <= radiusSquared && distSquared > 0) {
      return { x, y, z };
    }
  }
  
  // Fallback: return point on sphere surface
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI * 2;
  return {
    x: Math.round(radius * Math.cos(angle1) * Math.sin(angle2)),
    y: Math.round(radius * Math.sin(angle1) * Math.sin(angle2)),
    z: Math.round(radius * Math.cos(angle2))
  };
}

function getOrePoolForDimension(dimId) {
  if (dimId === "minecraft:overworld") return ORES_OVERWORLD;
  if (dimId === "minecraft:nether") return ORES_NETHER;
  return undefined;
}

function isUnderground(player) {
  try {
    return player.location.y < CFG.undergroundY;
  } catch {
    return false;
  }
}

function isJunkCover(blockTypeId, dimId) {
  if (dimId === "minecraft:overworld") return JUNK_OVERWORLD.has(blockTypeId);
  if (dimId === "minecraft:nether") return JUNK_NETHER.has(blockTypeId);
  return false;
}

function isFullyEnclosedNoAir(dimension, x, y, z) {
  const neighbors = [
    { x: x + 1, y, z },
    { x: x - 1, y, z },
    { x, y: y + 1, z },
    { x, y: y - 1, z },
    { x, y, z: z + 1 },
    { x, y, z: z - 1 },
  ];

  for (const n of neighbors) {
    const b = safeGetBlock(dimension, n);
    if (!b) return false;
    if (b.isAir) return false;
  }
  return true;
}

function permToString(perm) {
  try {
    const typeId = perm.type.id;
    const states = perm.getAllStates();
    const keys = Object.keys(states).sort();
    const parts = [];
    for (const k of keys) parts.push(`${k}=${String(states[k])}`);
    return `${typeId}${parts.length ? ";" + parts.join(",") : ""}`;
  } catch {
    return "minecraft:air";
  }
}

function stringToPerm(s) {
  if (typeof s !== "string" || s.length < 1) return BlockPermutation.resolve("minecraft:air");
  const semi = s.indexOf(";");
  if (semi === -1) return BlockPermutation.resolve(s);

  const typeId = s.substring(0, semi);
  const tail = s.substring(semi + 1);
  let perm = BlockPermutation.resolve(typeId);

  if (tail.length < 1) return perm;
  const parts = tail.split(",");
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const key = p.substring(0, eq);
    const rawVal = p.substring(eq + 1);

    let val;
    if (rawVal === "true") val = true;
    else if (rawVal === "false") val = false;
    else if (!Number.isNaN(Number(rawVal)) && rawVal.trim() !== "") val = Number(rawVal);
    else val = rawVal;

    try {
      perm = perm.withState(key, val);
    } catch {}
  }
  return perm;
}

// FIXED: Runtime now properly syncs with dynamic properties on load
const runtime = {
  fakes: new Map(),
  dirty: false,
  saving: false,
  loaded: false,
};

function markDirty() {
  runtime.dirty = true;
}

function encodeStorage() {
  const out = [];
  for (const [k, v] of runtime.fakes) {
    out.push([k, v.o, v.t, v.e, v.f]);
    if (out.length >= CFG.maxStored) break;
  }
  return JSON.stringify(out);
}

function decodeStorage(raw) {
  runtime.fakes.clear();
  if (typeof raw !== "string" || raw.length < 2) return;

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(arr)) return;

  for (const row of arr) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const k = row[0];
    const o = row[1];
    const t = row[2] | 0;
    const e = row[3] | 0;
    const f = row[4];

    if (typeof k !== "string" || typeof o !== "string" || typeof f !== "string") continue;
    if (!parseKey(k)) continue;

    // FIXED: Mark as pending so they get properly restored on first tick
    runtime.fakes.set(k, { o, t, e, f, pending: true });
  }
}

function scheduleSave() {
  if (runtime.saving) return;
  runtime.saving = true;

  system.runTimeout(() => {
    runtime.saving = false;
    if (!runtime.dirty) return;
    runtime.dirty = false;
    try {
      world.setDynamicProperty(CFG.storageKey, encodeStorage());
    } catch (err) {
      runtime.dirty = true;
    }
  }, 1);
}

function saveSoon() {
  markDirty();
  scheduleSave();
}

function loadFromWorld() {
  try {
    const stored = world.getDynamicProperty(CFG.storageKey);
    decodeStorage(stored);
    runtime.loaded = true;
  } catch {
    runtime.fakes.clear();
    runtime.loaded = true;
  }
}

// FIXED: Check if position is in cleanup radius of any player
function isInCleanupZone(dimId, x, y, z) {
  const players = world.getAllPlayers();
  const radiusSquared = CFG.nearbyCleanupRadius * CFG.nearbyCleanupRadius;
  
  for (const player of players) {
    try {
      // Skip if player is in different dimension
      if (player.dimension.id !== dimId) continue;
      
      const loc = player.location;
      const px = Math.floor(loc.x);
      const py = Math.floor(loc.y + 0.9); // Center of player body
      const pz = Math.floor(loc.z);
      
      // Calculate distance from player center to position
      const dx = x - px;
      const dy = y - py;
      const dz = z - pz;
      const distSq = dx * dx + dy * dy + dz * dz;
      
      // If position is within cleanup radius of this player, return true
      if (distSq <= radiusSquared) {
        return true;
      }
    } catch {
      continue;
    }
  }
  
  return false;
}

function trySpawnFakeAt(dimension, dimId, x, y, z, fakeBlockId) {
  const k = keyOf(dimId, x, y, z);
  if (runtime.fakes.has(k)) return false;

  // FIXED: Don't spawn if position is in cleanup zone
  if (isInCleanupZone(dimId, x, y, z)) return false;

  const block = safeGetBlock(dimension, { x, y, z });
  if (!block) return false;

  const originalPerm = block.permutation;
  const originalTypeId = originalPerm.type.id;

  if (!isJunkCover(originalTypeId, dimId)) return false;
  if (!isFullyEnclosedNoAir(dimension, x, y, z)) return false;

  const fakePerm = BlockPermutation.resolve(fakeBlockId);
  if (!safeSetPermutation(block, fakePerm)) return false;

  const t = nowTick();
  runtime.fakes.set(k, {
    o: permToString(originalPerm),
    t,
    e: t + CFG.fakeLifetimeTicks,
    f: fakeBlockId,
    pending: false,
  });

  saveSoon();
  return true;
}

function revertFakeByKey(k) {
  const data = runtime.fakes.get(k);
  if (!data) return false;

  const parsed = parseKey(k);
  if (!parsed) {
    runtime.fakes.delete(k);
    saveSoon();
    return true;
  }

  const dim = world.getDimension(parsed.dimId);
  const block = safeGetBlock(dim, { x: parsed.x, y: parsed.y, z: parsed.z });
  if (!block) {
    data.pending = true;
    return false;
  }

  const restorePerm = stringToPerm(data.o);
  if (block.permutation.type.id === data.f) {
    safeSetPermutation(block, restorePerm);
  }

  runtime.fakes.delete(k);
  saveSoon();
  return true;
}

function getLookTargetBlock(player) {
  try {
    const hit = player.getBlockFromViewDirection({
      maxDistance: CFG.maxRaycastDistance,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    });
    if (!hit || !hit.block) return undefined;
    return hit.block;
  } catch {
    return undefined;
  }
}

function pickNearbyAroundLook(block) {
  const base = block.location;
  const d = randomPointInSphereInt(CFG.maxDistance);
  return { x: (base.x + d.x) | 0, y: (base.y + d.y) | 0, z: (base.z + d.z) | 0 };
}

const perPlayer = new Map();
function getState(player) {
  const id = player.id;
  let st = perPlayer.get(id);
  if (!st) {
    st = { nextRegen: 0, lastLookKey: "", lastLookCheck: 0, cleanupIndex: 0 };
    perPlayer.set(id, st);
  }
  return st;
}

function tickLookRevert(player) {
  const st = getState(player);
  const t = nowTick();
  if ((t - st.lastLookCheck) < CFG.lookScanEveryTicks) return;
  st.lastLookCheck = t;

  const hitBlock = getLookTargetBlock(player);
  if (!hitBlock) return;

  const dimId = hitBlock.dimension.id;
  const loc = hitBlock.location;
  const k = keyOf(dimId, loc.x | 0, loc.y | 0, loc.z | 0);

  if (k === st.lastLookKey) return;
  st.lastLookKey = k;

  if (runtime.fakes.has(k)) revertFakeByKey(k);
}

// FIXED: Clean up sphere around player's entire body (centered at torso)
function tickNearbyCleanup(player) {
  const st = getState(player);
  const dimId = player.dimension.id;
  const dim = player.dimension;

  const loc = player.location;
  // FIXED: Center at torso/chest height (middle of player hitbox)
  // Player is ~1.8 blocks tall, so center is at +0.9
  const px = Math.floor(loc.x);
  const py = Math.floor(loc.y + 0.9); // Center of player body
  const pz = Math.floor(loc.z);

  const r = CFG.nearbyCleanupRadius;
  const radiusSquared = r * r;
  
  const coords = [];
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        // Validate actual distance from player center
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq <= radiusSquared) {
          coords.push({ x: px + dx, y: py + dy, z: pz + dz });
        }
      }
    }
  }

  let used = 0;
  while (used < CFG.nearbyCleanupBudgetPerTickPerPlayer && coords.length > 0) {
    const idx = st.cleanupIndex % coords.length;
    st.cleanupIndex++;

    const c = coords[idx];
    const k = keyOf(dimId, c.x, c.y, c.z);
    
    if (!runtime.fakes.has(k)) {
      used++;
      continue;
    }

    const data = runtime.fakes.get(k);
    if (!data) {
      used++;
      continue;
    }

    const b = safeGetBlock(dim, c);
    if (!b) {
      used++;
      continue;
    }

    const restorePerm = stringToPerm(data.o);
    if (b.permutation.type.id === data.f) {
      safeSetPermutation(b, restorePerm);
    }

    runtime.fakes.delete(k);
    markDirty();
    used++;
  }

  if (used > 0) scheduleSave();
}

function tickPlayerSpawn(player) {
  if (!isUnderground(player)) return;

  const dimId = player.dimension.id;
  if (dimId === "minecraft:the_end") return;

  const orePool = getOrePoolForDimension(dimId);
  if (!orePool || orePool.length === 0) return;

  const st = getState(player);
  const t = nowTick();
  if (t < st.nextRegen) return;
  st.nextRegen = t + CFG.regenEveryTicks;

  const lookBlock = getLookTargetBlock(player);
  if (!lookBlock) return;

  for (let i = 0; i < CFG.checksPerTickPerPlayer; i++) {
    if (Math.random() >= CFG.spawnChance) continue;
    const pos = pickNearbyAroundLook(lookBlock);
    const fakeId = pickRandom(orePool);
    trySpawnFakeAt(player.dimension, dimId, pos.x, pos.y, pos.z, fakeId);
  }
}

function processFakeExpirations(budget) {
  if (budget <= 0) return;
  const t = nowTick();
  let used = 0;

  for (const [k, v] of runtime.fakes) {
    if (used >= budget) break;
    if ((v.e | 0) > t) continue;

    const parsed = parseKey(k);
    if (!parsed) {
      runtime.fakes.delete(k);
      markDirty();
      used++;
      continue;
    }

    const dim = world.getDimension(parsed.dimId);
    const block = safeGetBlock(dim, { x: parsed.x, y: parsed.y, z: parsed.z });
    if (!block) {
      v.pending = true;
      used++;
      continue;
    }

    const restorePerm = stringToPerm(v.o);
    if (block.permutation.type.id === v.f) {
      safeSetPermutation(block, restorePerm);
    }

    runtime.fakes.delete(k);
    markDirty();
    used++;
  }

  if (used > 0) scheduleSave();
}

// FIXED: Proper pending restore handling for reload scenarios
function processPendingRestores(budget) {
  if (budget <= 0) return;
  let used = 0;

  for (const [k, v] of runtime.fakes) {
    if (used >= budget) break;
    if (!v.pending) continue;

    const parsed = parseKey(k);
    if (!parsed) {
      runtime.fakes.delete(k);
      markDirty();
      used++;
      continue;
    }

    const dim = world.getDimension(parsed.dimId);
    const block = safeGetBlock(dim, { x: parsed.x, y: parsed.y, z: parsed.z });
    if (!block) {
      used++;
      continue;
    }

    // Check if block is still a fake ore (not already mined)
    const currentTypeId = block.permutation.type.id;
    
    // If it's not the fake ore anymore, someone mined it - remove from tracking
    if (currentTypeId !== v.f) {
      runtime.fakes.delete(k);
      markDirty();
      used++;
      continue;
    }

    // If expired, restore immediately
    if ((v.e | 0) <= nowTick()) {
      const restorePerm = stringToPerm(v.o);
      safeSetPermutation(block, restorePerm);
      runtime.fakes.delete(k);
      markDirty();
      used++;
      continue;
    }

    // Mark as no longer pending
    v.pending = false;
    used++;
  }

  if (used > 0) scheduleSave();
}

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  const block = ev.block;
  if (!block) return;

  const dimId = block.dimension.id;
  const loc = block.location;
  const k = keyOf(dimId, loc.x | 0, loc.y | 0, loc.z | 0);

  const data = runtime.fakes.get(k);
  if (!data) return;

  ev.cancel = true;

  const restorePerm = stringToPerm(data.o);
  safeSetPermutation(block, restorePerm);

  runtime.fakes.delete(k);
  saveSoon();

  try {
    ev.player?.sendMessage("§cThis block was a ghost block for anti-xray. You can't mine it.");
  } catch {}
});

function cleanupDeadPlayers() {
  const alive = new Set();
  try {
    for (const p of world.getAllPlayers()) alive.add(p.id);
  } catch {}
  for (const id of perPlayer.keys()) {
    if (!alive.has(id)) perPlayer.delete(id);
  }
}

function mainTick() {
  // Wait until data is loaded before processing
  if (!runtime.loaded) return;

  const players = world.getAllPlayers();

  for (const p of players){
  if (isOp(player)) return
  tickNearbyCleanup(p);
   tickLookRevert(p);
   tickPlayerSpawn(p);
   }

  processFakeExpirations(CFG.globalExpireBudget);
  processPendingRestores(CFG.globalPendingBudget);

  if ((nowTick() % 200) === 0) cleanupDeadPlayers();
}

// Load data on startup
loadFromWorld();

system.runInterval(() => {
  try {
    mainTick();
  } catch (err) {
    // Silent error handling
  }
}, 1);
