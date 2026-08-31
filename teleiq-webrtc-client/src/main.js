import { Web } from "sip.js";
import "./style.css";
const { SimpleUser } = Web;
const $ = (id) => document.getElementById(id);
const wsUrl=$("wsUrl"),domain=$("domain"),username=$("username"),password=$("password"),destination=$("destination");
const connectBtn=$("connectBtn"),callBtn=$("callBtn"),muteBtn=$("muteBtn"),hangupBtn=$("hangupBtn"),disconnectBtn=$("disconnectBtn"),clearLogBtn=$("clearLogBtn"),remoteAudio=$("remoteAudio"),statusEl=$("status"),logEl=$("log");
let simpleUser; let muted=false;
function log(message,data){const t=new Date().toLocaleTimeString();let line=`[${t}] ${message}`;if(data!==undefined){try{line+=` ${typeof data==='string'?data:JSON.stringify(data,null,2)}`;}catch{line+=` ${String(data)}`;}}logEl.textContent+=line+"\n";logEl.scrollTop=logEl.scrollHeight;console.log(message,data??"");}
function setStatus(text){statusEl.textContent=text;log(`Status: ${text}`);}
function setButtons(connected=false,inCall=false){connectBtn.disabled=connected;disconnectBtn.disabled=!connected;callBtn.disabled=!connected||inCall;hangupBtn.disabled=!inCall;muteBtn.disabled=!inCall;}
function sipUri(v){return v.startsWith("sip:")?v:`sip:${v}@${domain.value.trim()}`;}
async function connectAndRegister(){try{const server=wsUrl.value.trim(),user=username.value.trim(),pass=password.value,sipDomain=domain.value.trim();if(!server||!user||!sipDomain)throw new Error("WebSocket URL, domain, and username are required.");const aor=`sip:${user}@${sipDomain}`;simpleUser=new SimpleUser(server,{aor,media:{constraints:{audio:true,video:false},remote:{audio:remoteAudio}},userAgentOptions:{authorizationUsername:user,authorizationPassword:pass,displayName:`TeleIQ Web ${user}`,logLevel:"debug"}});simpleUser.delegate={onServerConnect:()=>setStatus("WebSocket connected"),onServerDisconnect:(e)=>{setStatus("WebSocket disconnected");if(e)log("Disconnect error",e.message??String(e));setButtons(false,false);},onRegistered:()=>{setStatus(`Registered as ${aor}`);setButtons(true,false);},onUnregistered:()=>setStatus("Unregistered"),onCallCreated:()=>{setStatus("Call created");setButtons(true,true);},onCallAnswered:async()=>{setStatus("Call answered — speak now");setButtons(true,true);try{await remoteAudio.play();}catch(e){log("remoteAudio.play() blocked",e.message);}},onCallHangup:()=>{setStatus("Call ended");muted=false;muteBtn.textContent="Mute";setButtons(true,false);},onCallReceived:async()=>{log("Incoming call; auto-answering for POC");await simpleUser.answer();}};setStatus("Connecting...");await simpleUser.connect();setStatus("Registering...");await simpleUser.register();setButtons(true,false);setStatus(`Registered as ${aor}`);}catch(e){setStatus("Connection failed");log("Connect/Register failed",e?.stack??e?.message??String(e));setButtons(false,false);}}
async function startCall() {
  log("START VOICE BUTTON CLICKED");

  try {
    if (!simpleUser) {
      throw new Error("Connect first.");
    }

    log("Requesting microphone permission...");

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

    log("Microphone permission granted.");

    stream
      .getTracks()
      .forEach((track) => track.stop());

    const target =
      sipUri(destination.value.trim());

    log("Calling target:", target);

    setStatus(`Calling ${target}...`);

    await simpleUser.call(target);

    log("SIP INVITE sent");
  } catch (error) {
    setStatus("Call failed");

    log(
      "Call failed",
      error?.stack ??
        error?.message ??
        String(error)
    );
  }
}
async function toggleMute(){if(!simpleUser)return;try{if(muted){simpleUser.unmute();muted=false;muteBtn.textContent="Mute";setStatus("Call active");}else{simpleUser.mute();muted=true;muteBtn.textContent="Unmute";setStatus("Muted");}}catch(e){log("Mute failed",e?.message??String(e));}}
async function hangup(){if(simpleUser)try{await simpleUser.hangup();}catch(e){log("Hangup failed",e?.message??String(e));}}
async function disconnect(){if(!simpleUser)return;try{try{await simpleUser.unregister();}catch{}await simpleUser.disconnect();simpleUser=undefined;muted=false;muteBtn.textContent="Mute";setStatus("Disconnected");setButtons(false,false);}catch(e){log("Disconnect failed",e?.message??String(e));}}
connectBtn.addEventListener("click",connectAndRegister);callBtn.addEventListener("click",startCall);muteBtn.addEventListener("click",toggleMute);hangupBtn.addEventListener("click",hangup);disconnectBtn.addEventListener("click",disconnect);clearLogBtn.addEventListener("click",()=>logEl.textContent="");setButtons(false,false);log("TeleIQ WebRTC client loaded.");
