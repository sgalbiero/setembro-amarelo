import { finishFrame, motionPreference, playFrame, stopFrame } from "./animations.js";

const root = document.documentElement;
const experience = document.querySelector(".experience");
const frames = [...document.querySelectorAll("[data-frame]")];
const frameByNumber = new Map(frames.map((frame) => [Number(frame.dataset.frame), frame]));
const advanceControl = document.querySelector(".advance-control");

root.classList.add("js-ready");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

let activeNumber = 1;
let navigationInProgress = false;
let suppressAdvanceClickUntil = 0;

function preferredBehavior() {
  return motionPreference.matches ? "auto" : "smooth";
}

function updateIntroLock(number) {
  root.classList.toggle("intro-locked", number === 1 && !motionPreference.matches);
}

function activateFrame(number, restart = true) {
  const nextFrame = frameByNumber.get(number);
  if (!nextFrame) return;

  frames.forEach((frame) => {
    if (frame !== nextFrame) stopFrame(frame);
  });

  activeNumber = number;
  updateIntroLock(number);

  if (restart) {
    playFrame(nextFrame, {
      onIntroComplete: () => navigateTo(2),
    });
  } else {
    nextFrame.classList.add("is-active");
  }
}

function navigateTo(number, behavior = preferredBehavior()) {
  const nextFrame = frameByNumber.get(number);
  if (!nextFrame) return;

  navigationInProgress = true;
  activateFrame(number, true);
  experience.scrollTo({ top: nextFrame.offsetTop, behavior });
  window.setTimeout(() => {
    navigationInProgress = false;
  }, behavior === "smooth" ? 650 : 0);
}

frames.forEach((frame) => {
  frame.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, select, textarea, [role='button']")) return;

    const number = Number(frame.dataset.frame);
    if (number === 1) {
      finishFrame(frame);
      navigateTo(2);
      return;
    }

    finishFrame(frame);
  });
});

document.querySelectorAll("[data-go]").forEach((control) => {
  if (control === advanceControl) return;

  control.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo(Number(control.dataset.go));
  });
});

advanceControl.addEventListener("click", (event) => {
  event.preventDefault();
  if (performance.now() < suppressAdvanceClickUntil) return;
  navigateTo(3);
});

advanceControl.addEventListener("keydown", (event) => {
  if (event.key !== " ") return;
  event.preventDefault();
  navigateTo(3);
});

let dragStartY = 0;
let dragPointerId = null;
let dragDistance = 0;

advanceControl.addEventListener("pointerdown", (event) => {
  dragPointerId = event.pointerId;
  dragStartY = event.clientY;
  dragDistance = 0;
  advanceControl.classList.add("is-dragging");
  advanceControl.setPointerCapture(event.pointerId);
});

advanceControl.addEventListener("pointermove", (event) => {
  if (event.pointerId !== dragPointerId) return;

  dragDistance = Math.min(0, Math.max(-52, event.clientY - dragStartY));
  advanceControl.style.setProperty("--drag-y", `${dragDistance}px`);

  if (dragDistance <= -30) {
    suppressAdvanceClickUntil = performance.now() + 600;
    dragPointerId = null;
    advanceControl.classList.remove("is-dragging");
    advanceControl.style.removeProperty("--drag-y");
    navigateTo(3);
  }
});

function releaseDrag(event) {
  if (event.pointerId !== dragPointerId) return;
  const releaseDistance = Math.min(dragDistance, event.clientY - dragStartY);
  dragPointerId = null;
  advanceControl.classList.remove("is-dragging");
  advanceControl.style.removeProperty("--drag-y");

  // Some browsers coalesce pointermove events during a quick flick. Checking
  // the release point keeps the 30 px gesture reliable in that case too.
  if (releaseDistance <= -30) {
    suppressAdvanceClickUntil = performance.now() + 600;
    navigateTo(3);
  }
}

advanceControl.addEventListener("pointerup", releaseDrag);
advanceControl.addEventListener("pointercancel", releaseDrag);

const observer = new IntersectionObserver(
  (entries) => {
    if (navigationInProgress || root.classList.contains("intro-locked")) return;

    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible || visible.intersectionRatio < 0.62) return;

    const number = Number(visible.target.dataset.frame);
    if (number !== activeNumber) {
      // The first frame locks scrolling while its intro plays. When it becomes
      // visible during a manual upward scroll, align it before enabling that
      // lock; otherwise the page can be frozen between frames 1 and 2.
      if (number === 1) {
        experience.scrollTo({ top: visible.target.offsetTop, behavior: "auto" });
      }

      activateFrame(number, true);
    }
  },
  { root: experience, threshold: [0.62, 0.75] },
);

frames.forEach((frame) => observer.observe(frame));

motionPreference.addEventListener("change", () => {
  if (motionPreference.matches && activeNumber === 1) {
    finishFrame(frameByNumber.get(1));
    navigateTo(2, "auto");
    return;
  }

  activateFrame(activeNumber, true);
});

experience.scrollTo({ top: 0, behavior: "auto" });
activateFrame(1, true);
