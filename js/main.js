import { motionPreference, playFrame, stopFrame } from './animations.js';

const root = document.documentElement;
const frames = [...document.querySelectorAll('[data-frame]')];
const mode = new URLSearchParams(location.search).get('modo');
const screenMode = mode === 'tela';
const durations = [1500, 8000, 12000, 8000];
const entranceDurations = [1000, 2800, 1400, 900];
const toggle = document.querySelector('[data-play]');
const status = document.querySelector('[data-status]');
let current = 0;
let playing = mode !== 'leitura';
let temporaryPause = false;
let advanceTimer;
let idleTimer;
let transitioning = false;
let keyboardFocus = false;

root.classList.add('js-ready', 'slideshow');
root.classList.toggle('screen-mode', screenMode);
function schedule() {
  clearTimeout(advanceTimer);
  const playbackLabel = playing ? 'Pausar' : 'Reproduzir';
  toggle.setAttribute('aria-label', playbackLabel);
  toggle.title = playbackLabel;
  toggle.classList.toggle('is-playing', playing);
  status.textContent = `${current + 1} / ${frames.length} · ${playing && !keyboardFocus ? 'Em reprodução' : 'Pausado'}`;
  root.classList.toggle('playback-paused', !playing || document.hidden || keyboardFocus);
  if (!playing || document.hidden || keyboardFocus) return;
  advanceTimer = setTimeout(() => show(current + 1), durations[current] + (motionPreference.matches ? 0 : entranceDurations[current]));
}
function show(index) {
  if (transitioning) return;
  const next = (index + frames.length) % frames.length;
  if (next === current) return;
  const previous = frames[current];
  const target = frames[next];
  if (previous.contains(document.activeElement)) toggle.focus({ preventScroll: true });
  previous.inert = true;
  previous.setAttribute('aria-hidden', 'true');
  previous.classList.add('is-leaving');
  current = next;
  target.inert = false;
  target.removeAttribute('aria-hidden');
  target.scrollTop = 0;
  playFrame(target);
  transitioning = true;
  setTimeout(() => {
    stopFrame(previous);
    previous.classList.remove('is-leaving');
    transitioning = false;
  }, motionPreference.matches ? 0 : 900);
  schedule();
}
function interaction() {
  clearTimeout(idleTimer);
  if (playing) { temporaryPause = true; playing = false; }
  if (temporaryPause && screenMode) {
    idleTimer = setTimeout(() => {
      if (keyboardFocus) return;
      temporaryPause = false;
      playing = true;
      schedule();
    }, 60000);
  }
  schedule();
}
document.querySelector('[data-prev]').addEventListener('click', () => { interaction(); show(current - 1); });
document.querySelector('[data-next]').addEventListener('click', () => { interaction(); show(current + 1); });
toggle.addEventListener('click', () => {
  clearTimeout(idleTimer);
  temporaryPause = false;
  keyboardFocus = false;
  playing = !playing;
  schedule();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') { keyboardFocus = true; schedule(); }
});
document.addEventListener('pointerdown', () => {
  if (keyboardFocus) { keyboardFocus = false; schedule(); }
});
document.addEventListener('focusout', () => setTimeout(() => {
  if (document.activeElement === document.body) {
    keyboardFocus = false;
    if (temporaryPause) interaction(); else schedule();
  }
}, 0));
// Only deliberate navigation pauses playback; touching the illustration does not.
document.addEventListener('visibilitychange', schedule);
motionPreference.addEventListener('change', () => { playFrame(frames[current]); schedule(); });
frames.forEach((frame, index) => {
  frame.inert = index !== 0;
  if (index !== 0) frame.setAttribute('aria-hidden', 'true');
});
playFrame(frames[0]);
schedule();
