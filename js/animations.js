export const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
export function stopFrame(frame) {
  frame.classList.remove('is-active', 'is-complete');
}
export function playFrame(frame) {
  stopFrame(frame);
  void frame.offsetWidth;
  frame.classList.add('is-active');
  if (motionPreference.matches) frame.classList.add('is-complete');
}
