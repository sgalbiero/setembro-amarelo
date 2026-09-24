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
for (const width of [1920,1366]) {
 const {sessionId,targetId}=await createPage(client,{width,height:width===1920?1080:768});
 await client.send('Page.navigate',{url:'http://127.0.0.1:4173/'},sessionId);
 await wait(1600);
 const {result}=await client.send('Runtime.evaluate',{expression:'[...document.querySelectorAll(".hello-writing path")].every(p=>getComputedStyle(p).strokeDasharray==="none" && getComputedStyle(p).opacity==="1")',returnByValue:true},sessionId);
 if(!result.value) throw Error('Incomplete hello '+width);
 const {data}=await client.send('Page.captureScreenshot',{format:'png'},sessionId);
 await writeFile('docs/screenshots/hello-fixed-'+width+'.png',Buffer.from(data,'base64'));
 console.log('PASS complete strokes '+width);
 await client.send('Target.closeTarget',{targetId});
}
socket.close();
