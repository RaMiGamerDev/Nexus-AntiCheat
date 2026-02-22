import { world, system } from "@minecraft/server"
import { isOp, ban, mute, unban, unmute, kick, op, deop, help, checkPassword } from "../utility/utility.js";
import { v } from "../main.js";
import { config } from "../config.js";

const utilityConfig = config.staff.utility;

world.beforeEvents.chatSend.subscribe((ev) => {
    const { message, sender } = ev;

    const arg = message.match(/"([^"]+)"|\S+/g)?.map(s => s.replace(/"/g, '')) || [];
    if (!v()) return
    if (arg[0]?.startsWith(utilityConfig.prefix) && isOp(sender)) {
        switch (arg[0].replace(utilityConfig.prefix,"")) {
            case "ban":
                ban({ name: arg[1], reason: arg[2], duration: arg[3], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "kick":
                kick({ name: arg[1], reason: arg[2], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "mute":
                mute({ name: arg[1], reason: arg[2], duration: arg[3], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "unmute":
                unmute({ name: arg[1], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "unban":
                unban({ name: arg[1], by: sender.name}, sender)
                ev.cancel = true
                break;

            case "op":
                op({ name: arg[1], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "deop":
                deop({ name: arg[1], by: sender.name }, sender)
                ev.cancel = true
                break;

            case "help":
                help(sender)
                ev.cancel = true
                break;

            default:
                sender.sendMessage(`§8[§uNexus§8] §cunknown command!`)
                break;
        }
    } else if (
        arg[0]?.startsWith(utilityConfig.prefix) &&
        arg[0].replace(utilityConfig.prefix,"") == "auth"
    ) {
        checkPassword({ pass: arg[1] }, sender)
        ev.cancel = true
    }
});