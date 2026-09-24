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
try {
 for(const [query,label] of [['','Pausar'],['?modo=tela','Pausar'],['?modo=leitura','Reproduzir']]) {
  const {sessionId,targetId}=await createPage(client,{width:1366,height:768});
  const run=async expression=>(await client.send('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
  await client.send('Page.navigate',{url:'http://127.0.0.1:4173/'+query},sessionId);
  await wait(700);
  if(await run('document.querySelector("[data-play]").getAttribute("aria-label")')!==label) throw Error('Startup '+query);
  await wait(2300);
  const frame=await run('document.querySelector(".frame:not([inert])").dataset.frame');
  if(frame!==(label==='Pausar'?'2':'1')) throw Error('Advance '+query);
  console.log('PASS '+(query||'default')+' startup and advance');
  await client.send('Target.closeTarget',{targetId});
 }
} finally {socket.close();}
