import { writeFile } from 'node:fs/promises';
const DEBUG_URL = 'http://127.0.0.1:9222';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function connect() {
  const { webSocketDebuggerUrl } = await fetch(`${DEBUG_URL}/json/version`).then((response) => response.json());
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return { client: new CdpClient(socket), socket };
}

async function createPage(client, { width, height, javascript = true, reducedMotion = false }) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  await client.send("Page.enable", {}, sessionId);
  await client.send("Page.bringToFront", {}, sessionId);
  await client.send("Network.enable", {}, sessionId);
  await client.send("Network.setCacheDisabled", {cacheDisabled:true}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 800,
  }, sessionId);
  await client.send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }],
  }, sessionId);
  if (!javascript) {
    await client.send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
  }
  return { sessionId, targetId };
}



const {client,socket}=await connect();
const {sessionId,targetId}=await createPage(client,{width:1920,height:1080});
const run=async expression=>(await client.send('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
const check=(v,label)=>{if(!v)throw Error(label);console.log('PASS '+label);};
await client.send('Page.navigate',{url:'http://127.0.0.1:4173/?modo=tela'},sessionId);
await wait(1800);
check(await run('document.querySelector(".frame:not([inert])").dataset.frame==="1"'),'intro initially visible');
await wait(1800);
check(await run('document.querySelector(".frame:not([inert])").dataset.frame==="2"'),'intro advances in three seconds');
await wait(1000);
await run('document.querySelector("[data-next]").click()');
await wait(1100);
check(await run('document.querySelector(".frame:not([inert])").dataset.frame==="3"'),'ipe is active');
await run('document.querySelector("[data-play]").click()');
await run('document.querySelector(".ipe-tree").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');
check(await run('document.querySelector("[data-play]").getAttribute("aria-label")==="Pausar"'),'touching ipe does not pause');
await client.send('Network.enable',{},sessionId);
await client.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},sessionId);
const layout=await run('(()=>{const b=document.querySelector("[data-play]").getBoundingClientRect();const s=document.querySelector("[data-status]").getBoundingClientRect();return {center:(b.left+b.right)/2,status:s.left,badge:document.querySelector(".support-global a").getBoundingClientRect().height}})()');
check(Math.abs(layout.center-960)<1 && layout.status>1100 && layout.badge===44,'centered controls, right status, compact badges');
await wait(17000);
check(await run('document.querySelector(".frame:not([inert])").dataset.frame==="4"'),'ipe advances while offline');
const {data}=await client.send('Page.captureScreenshot',{format:'png'},sessionId);
await writeFile('docs/screenshots/refinements-desktop.png',Buffer.from(data,'base64'));
await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
await wait(500);
check(await run('(()=>{const a=document.querySelector("[data-next]").getBoundingClientRect();const s=document.querySelector("[data-status]").getBoundingClientRect();return s.top>=a.bottom && document.body.scrollWidth<=innerWidth})()'),'mobile status does not overlap controls');
const mobile=await client.send('Page.captureScreenshot',{format:'png'},sessionId);
await writeFile('docs/screenshots/refinements-mobile.png',Buffer.from(mobile.data,'base64'));
await client.send('Target.closeTarget',{targetId});
socket.close();
