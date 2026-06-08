/**
 * Typing effect — animates a cycling typewriter effect.
 * Designed to be used with TypingEffect.astro via define:vars.
 */
export function startTyping(
  id: string,
  words: string[],
  typeSpeed: number,
  deleteSpeed: number,
  pauseAfterType: number,
  pauseAfterDelete: number,
): void {
  const root = document.getElementById(id);
  if (!root) return;
  const textEl = root.querySelector('.typing-text') as HTMLElement | null;

  // Lock the element width to the widest word so the layout never shifts
  const measurer = document.createElement('span');
  measurer.setAttribute('aria-hidden', 'true');
  measurer.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;pointer-events:none;';
  const cs = getComputedStyle(root);
  measurer.style.font = cs.font;
  measurer.style.letterSpacing = cs.letterSpacing;
  document.body.appendChild(measurer);

  let maxWidth = 0;
  for (const word of words) {
    measurer.textContent = word + '|'; // include cursor character in measurement
    maxWidth = Math.max(maxWidth, measurer.offsetWidth);
  }
  document.body.removeChild(measurer);
  root.style.minWidth = maxWidth + 'px';

  let wordIndex = 0;
  let charIndex = 0; // start empty — cursor only, then type the first word
  let isDeleting = false;

  function tick() {
    const current = words[wordIndex];

    if (isDeleting) {
      charIndex--;
      if (textEl) textEl.textContent = current.slice(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(tick, pauseAfterDelete);
        return;
      }
      setTimeout(tick, deleteSpeed);
    } else {
      charIndex++;
      if (textEl) textEl.textContent = current.slice(0, charIndex);

      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(tick, pauseAfterType);
        return;
      }
      setTimeout(tick, typeSpeed);
    }
  }

  // Show the blinking cursor briefly, then begin typing the first word
  setTimeout(tick, pauseAfterDelete);
}