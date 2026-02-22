// default config
// 'enabled' is a boolean: true to activate the module, false to disable
const config = {
    modules: {
        combat: {
            reach: {
                enabled: true,
                // maximum reach distance in blocks
                max: 3.3,
                // internal cooldown (leave as is)
                cooldown: 100,
                // number of violations required before showing a flag (reduces false positives)
                count: 3,
                // maximum ping to skip the check (still cancels the hit silently)
                maxPing: 300
            },
            killaura: {
                enabled: true,
                // maximum angle difference to the target (180 means fully out of screen)
                max: 180,
                // minimum distance from the target to start checking (prevents false triggers at close range)
                distance: 1.5,
                // maximum ping to skip the check (still cancels the hit silently)
                maxPing: 300,
                // internal cooldown (don’t touch, system dependent)
                cooldown: 50,
                // minimal angle threshold for detecting perfect aim at the target center
                min: 0.01
            },
            autoClicker: {
                enabled: true,
                // maximum ping to skip the check (still cancels hits silently)
                maxPing: 300,
                // hits allowed per 0.5 seconds
                max: 8,
                // in ticks (1 second = 20 ticks), prevents cheater from hitting for X ticks
                disableCombatTimer: 100
            },
            breachSwap: {
                enabled: true,
                //cooldown for macing or breach swapping
                cooldown: 1000,
                //skip check if the pin is above this limit
                maxPing: 300,
                //if u have custom maces put them here
                maceItems: [
                  "minecraft:mace"
                ]
            }
        },
        visual: {
            xray: {
                // delay before fake ores disappear
                blockDelay: 60,
                // number of blocks loaded per tick (improves performance)
                blocksPerTick: 8,
                // radius around player to spawn fake ores
                radius: 3,
                // Y level where fake ores start appearing
                yLevel: 48,
                // regenerate ores every x ticks
                regenerateEvery: 10
            }
        },
        exploits: {
            illegalItems: {
                // how often the system checks player inventories
                interval: 10,
                // list of items considered illegal
                illegalItemsList: new Set([
                    "minecraft:command_block",
                    "minecraft:chain_command_block",
                    "minecraft:repeating_command_block",
                    "minecraft:command_block_minecart",
                    "minecraft:structure_block",
                    "minecraft:structure_void",
                    "minecraft:jigsaw",
                    "minecraft:barrier",
                    "minecraft:debug_stick",
                    "minecraft:knowledge_book",
                    "minecraft:light_block",
                    "minecraft:bedrock"
                ])
            },
            dupe: {
                enabled: true,
                // gets any container block from x block distance if the player is looking at one
                viewDistance: 7,
                // check every x ticks
                everyTick: 5
            }
        },
        world: {
            blockReach: {
                enabled: true,
                // maximum block interaction range
                max: 6.3,
                // maximum ping, still cancels the break/place action silently
                maxPing: 300
            },
            autoClicker: {
                enabled: true,
                // maximum blocks placed per 0.5 seconds
                max: 8,
                // maximum ping to skip the check
                maxPing: 300,
                // cooldown in ticks (prevents player from placing for X ticks)
                cooldown: 100
            }
        }
    },
    staff: {
        authority: {
            staffTag: "nexus:Opped",
            // password usage: <prefix>op <password>
            // recommended to use password since op method may change in future
            password: "hi"
        },
        utility: {
            // flag messages also appear in console if console output is enabled in server.properties
            notifyTag: "nexus:alert",
            // current version of the anti-cheat
            version: "§70§8.§70§8.§74§8-§ualpha",
            // the prefix of the anticheat
            prefix: ">>", 
            // old Database id
            oldDatabase: [],
            // new Database id
            dataBaseId: "nexus:database.v0.0.3",
            // this is the list of commands in the anticheat, don't touch it
            commands: [
                { cmd: "ban", usage: "<prefix>ban <playerName> <reason> <duration in hours>" },
                { cmd: "unban", usage: "<prefix>unban <playerName>" },
                { cmd: "mute", usage: "<prefix>mute <playerName> <reason> <duration in minutes>" },
                { cmd: "unmute", usage: "<prefix>unmute <playerName>" },
                { cmd: "kick", usage: "<prefix>kick <playerName> <reason>" },
                { cmd: "op", usage: "<prefix>op <playerName>" },
                { cmd: "deop", usage: "<prefix>deop <playerName>" },
                { cmd: "auth", usage: "<prefix>auth <password>" }
            ]
        }
    }
};
export { config };