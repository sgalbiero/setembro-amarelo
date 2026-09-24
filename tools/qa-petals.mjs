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
await client.send('Page.navigate',{url:'http://127.0.0.1:4173/?modo=leitura'},sessionId);
await wait(500);
await run('document.querySelector("[data-next]").click()');
await wait(3000);
let shot=await client.send('Page.captureScreenshot',{format:'png'},sessionId);
await writeFile('docs/screenshots/ribbon-corrected.png',Buffer.from(shot.data,'base64'));
await run('document.querySelector("[data-next]").click()');
await wait(1000);
await run('document.querySelector("[data-next]").click()');
await wait(1000);
await run('document.querySelector("[data-play]").click()');
const before=await run('getComputedStyle(document.querySelector(".frame--support .falling-leaf")).transform');
await wait(1200);
const after=await run('getComputedStyle(document.querySelector(".frame--support .falling-leaf")).transform');
if(before===after) throw Error('Petals are not moving');
shot=await client.send('Page.captureScreenshot',{format:'png'},sessionId);
await writeFile('docs/screenshots/closing-petals.png',Buffer.from(shot.data,'base64'));
console.log('PASS petals moving in final frame');
await client.send('Target.closeTarget',{targetId});socket.close();
