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
  const cs = getComputedStyle(root);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let maxWidth = 0;
  if (ctx) {
    ctx.font = cs.font;
    for (const word of words) {
      maxWidth = Math.max(maxWidth, ctx.measureText(word + '|').width);
    }
  }
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
