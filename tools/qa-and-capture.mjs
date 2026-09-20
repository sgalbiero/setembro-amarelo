import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEBUG_URL = "http://127.0.0.1:9222";
const SITE_URL = "http://127.0.0.1:4173/";
const OUTPUT_DIR = path.resolve("docs/screenshots");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

async function navigate(client, sessionId) {
  await client.send("Page.navigate", { url: SITE_URL }, sessionId);
  await wait(500);
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId);
  return result.result.value;
}

async function screenshot(client, sessionId, filename, clip) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: Boolean(clip),
    ...(clip ? { clip } : {}),
  }, sessionId);
  await writeFile(path.join(OUTPUT_DIR, filename), Buffer.from(result.data, "base64"));
}

async function closePage(client, targetId) {
  await client.send("Target.closeTarget", { targetId });
}

await mkdir(OUTPUT_DIR, { recursive: true });
const { client, socket } = await connect();

try {
  const mobile = await createPage(client, { width: 390, height: 844 });
  await navigate(client, mobile.sessionId);
  await wait(800);
  await screenshot(client, mobile.sessionId, "quadro-1-mobile.png");

  // Wait for the automatic transition and for the full ribbon/copy sequence.
  // Documentation screenshots should show the completed frame, not an
  // intermediate animation state.
  await wait(5200);
  await screenshot(client, mobile.sessionId, "quadro-2-mobile.png");

  await evaluate(client, mobile.sessionId, "document.querySelector('.advance-control').click(); true");
  await wait(1600);
  await screenshot(client, mobile.sessionId, "quadro-3-mobile.png");

  const touchResult = await evaluate(client, mobile.sessionId, `(() => {
    document.querySelector('[data-go="2"]').click();
    return true;
  })()`);
  await wait(1800);
  const arrowRect = await evaluate(client, mobile.sessionId, `(() => {
    const r = document.querySelector('.advance-control').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: arrowRect.x, y: arrowRect.y }],
  }, mobile.sessionId);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: arrowRect.x, y: arrowRect.y - 38 }],
  }, mobile.sessionId);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }, mobile.sessionId);
  await wait(750);
  const dragDestination = await evaluate(client, mobile.sessionId, "document.querySelector('.frame.is-active')?.id");
  await closePage(client, mobile.targetId);

  const tallMobile = await createPage(client, { width: 430, height: 932 });
  await navigate(client, tallMobile.sessionId);
  await wait(4100);
  await evaluate(client, tallMobile.sessionId, "document.querySelector('.advance-control').click(); true");
  await wait(1600);
  const tallMobileHopeLayout = await evaluate(client, tallMobile.sessionId, `(() => {
    const heading = document.querySelector('#quadro-3 h2');
    const rect = heading.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      right: Math.round(innerWidth - rect.right),
      fontSize: getComputedStyle(heading).fontSize,
      lines: heading.innerText.split('\\n').length,
    };
  })()`);
  await screenshot(client, tallMobile.sessionId, "quadro-3-430x932.png");
  await closePage(client, tallMobile.targetId);

  const desktop = await createPage(client, { width: 1440, height: 900, reducedMotion: true });
  await navigate(client, desktop.sessionId);
  await wait(300);
  await evaluate(client, desktop.sessionId, `(() => {
    const experience = document.querySelector('.experience');
    document.documentElement.classList.remove('js-ready', 'intro-locked');
    experience.style.height = 'auto';
    experience.style.overflow = 'visible';
    experience.style.scrollSnapType = 'none';
    return true;
  })()`);
  const desktopHeight = await evaluate(client, desktop.sessionId, "document.documentElement.scrollHeight");
  await screenshot(client, desktop.sessionId, "visao-geral-desktop.png", {
    x: 0,
    y: 0,
    width: 1440,
    height: desktopHeight,
    scale: 1,
  });
  await closePage(client, desktop.targetId);

  const desktopReturn = await createPage(client, { width: 1440, height: 900 });
  await navigate(client, desktopReturn.sessionId);
  await wait(3700);
  await evaluate(client, desktopReturn.sessionId, `(() => {
    const experience = document.querySelector('.experience');
    experience.scrollTop = experience.clientHeight * 0.36;
    return true;
  })()`);
  await wait(200);
  const desktopManualReturn = await evaluate(client, desktopReturn.sessionId, `(() => {
    const experience = document.querySelector('.experience');
    return {
      active: document.querySelector('.frame.is-active')?.id,
      introLocked: document.documentElement.classList.contains('intro-locked'),
      scrollTop: Math.round(experience.scrollTop),
    };
  })()`);
  await closePage(client, desktopReturn.targetId);

  if (desktopManualReturn.active !== 'quadro-1' || desktopManualReturn.scrollTop !== 0) {
    throw new Error(`Desktop manual return did not align frame 1: ${JSON.stringify(desktopManualReturn)}`);
  }

  const reduced = await createPage(client, { width: 390, height: 844, reducedMotion: true });
  await navigate(client, reduced.sessionId);
  await wait(300);
  const reducedResult = await evaluate(client, reduced.sessionId, `(() => ({
    active: document.querySelector('.frame.is-active')?.id,
    introLocked: document.documentElement.classList.contains('intro-locked'),
    leaves: getComputedStyle(document.querySelector('.falling-leaves')).display,
    ribbonReveal: getComputedStyle(document.querySelector('.ribbon')).clipPath
  }))()`);
  await closePage(client, reduced.targetId);

  const noScript = await createPage(client, { width: 390, height: 844, javascript: false });
  await navigate(client, noScript.sessionId);
  const noScriptResult = await evaluate(client, noScript.sessionId, `(() => ({
    jsClass: document.documentElement.classList.contains('js-ready'),
    frameCount: document.querySelectorAll('.frame').length,
    scrollHeight: document.querySelector('.experience').scrollHeight,
    viewportHeight: document.querySelector('.experience').clientHeight,
    phones: [...document.querySelectorAll('a[href^="tel:"]')].map((link) => link.getAttribute('href')),
    visibleHeadings: [...document.querySelectorAll('h1,h2')].every((heading) => getComputedStyle(heading).opacity !== '0')
  }))()`);
  await closePage(client, noScript.targetId);

  const zoomed = await createPage(client, { width: 390, height: 844, reducedMotion: true });
  await navigate(client, zoomed.sessionId);
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 }, zoomed.sessionId);
  await wait(200);
  const zoomResult = await evaluate(client, zoomed.sessionId, `(() => ({
    scale: visualViewport.scale,
    visualViewport: [visualViewport.width, visualViewport.height],
    layoutViewport: [innerWidth, innerHeight],
    phoneLinksVisible: [...document.querySelectorAll('#quadro-2 .support-links a')].every((link) => {
      const rect = link.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }),
    documentScrollable: document.querySelector('.experience').scrollHeight > visualViewport.height
  }))()`);
  await closePage(client, zoomed.targetId);

  console.log(JSON.stringify({
    screenshots: [
      "quadro-1-mobile.png",
      "quadro-2-mobile.png",
      "quadro-3-mobile.png",
      "quadro-3-430x932.png",
      "visao-geral-desktop.png",
    ],
    dragDestination,
    desktopManualReturn,
    tallMobileHopeLayout,
    reducedMotion: reducedResult,
    noJavaScript: noScriptResult,
    zoom200: zoomResult,
    touchSetup: touchResult,
  }, null, 2));
} finally {
  socket.close();
}
