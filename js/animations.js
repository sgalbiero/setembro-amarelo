const timers = new WeakMap();

export const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function clearFrameTimer(frame) {
  const timer = timers.get(frame);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(frame);
  }
}

export function finishFrame(frame) {
  clearFrameTimer(frame);
  frame.classList.add("is-active", "is-complete");
}

export function stopFrame(frame) {
  clearFrameTimer(frame);
  frame.classList.remove("is-active");
}

export function playFrame(frame, { onIntroComplete } = {}) {
  clearFrameTimer(frame);
  frame.classList.remove("is-active", "is-complete");

  // Force a style flush so revisiting a frame reliably restarts its CSS animations.
  void frame.offsetWidth;
  frame.classList.add("is-active");

  if (motionPreference.matches) {
    finishFrame(frame);
    if (frame.dataset.frame === "1" && onIntroComplete) {
      window.requestAnimationFrame(onIntroComplete);
    }
    return;
  }

  const number = frame.dataset.frame;
  const duration = number === "1" ? 3000 : number === "2" ? 2800 : 1400;
  const timer = window.setTimeout(() => {
    timers.delete(frame);
    if (number === "1" && onIntroComplete) {
      onIntroComplete();
    } else {
      frame.classList.add("is-complete");
    }
  }, duration);

  timers.set(frame, timer);
}
