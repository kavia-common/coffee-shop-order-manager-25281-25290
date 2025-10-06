(() => {
  const root = document.getElementById('feedback-root');
  const artboard = root?.querySelector('.artboard');
  if (!root || !artboard) return;

  // Add a CSS class when keyboard navigation begins
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('show-focus');
  });

  // PUBLIC_INTERFACE
  function scaleArtboard() {
    /**
     * Scales the fixed-size Figma artboard (1333px wide) to fit viewport while
     * maintaining pixel fidelity. Minimum scale clamped for small screens.
     */
    const cs = getComputedStyle(root);
    const sidePadding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const vw = Math.max(320, window.innerWidth - sidePadding);
    const baseWidth = 1333;
    const scale = Math.max(0.5, Math.min(1, vw / baseWidth));
    artboard.style.transform = `scale(${scale})`;
    artboard.style.transformOrigin = 'top left';

    // Adjust container min-height so page can scroll as needed
    const baseHeight = 998;
    root.style.minHeight = `${baseHeight * scale + 48}px`;
  }

  // Run on load and on resize
  scaleArtboard();
  window.addEventListener('resize', scaleArtboard);

  // PUBLIC_INTERFACE
  function verifyBoundingBoxes() {
    /**
     * Computes DOM bounding boxes (unscaled) by dividing by applied transform scale
     * and compares against the Figma JSON for critical nodes. Logs diffs to console.
     */
    try {
      const scaleMatch = artboard.style.transform.match(/scale\(([\\d.]+)\)/);
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

      const checks = [
        { sel: '.stripe', figma: { x: 0, y: 0, w: 1333, h: 8 }, name: 'Stripe 442:163' },
        { sel: '.studio-row', figma: { x: 112, y: 100, w: 1109, h: 24 }, name: 'Studio Row 442:156' },
        { sel: '.headline-logo', figma: { x: 112, y: 196, w: 1109, h: 122 }, name: 'Headline & Logo 442:151' },
        { sel: '.detail', figma: { x: 112, y: 414, w: 296, h: 154 }, name: 'Detail 442:137' },
        { sel: '.hero-figure', figma: { x: 625, y: 350, w: 576, h: 576 }, name: 'Hero 442:149' },
        { sel: '.created-by', figma: { x: 112, y: 902, w: 254, h: 24 }, name: 'Created by 442:133' }
      ];

      const diffs = [];
      for (const c of checks) {
        const el = document.querySelector(c.sel);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const abRect = artboard.getBoundingClientRect();
        const x = (rect.left - abRect.left) / scale;
        const y = (rect.top - abRect.top) / scale;
        const w = rect.width / scale;
        const h = rect.height / scale;

        const dx = Math.round(x - c.figma.x);
        const dy = Math.round(y - c.figma.y);
        const dw = Math.round(w - c.figma.w);
        const dh = Math.round(h - c.figma.h);
        diffs.push({ name: c.name, dx, dy, dw, dh });
      }
      console.table(diffs);
    } catch (e) {
      console.warn('verifyBoundingBoxes failed', e);
    }
  }

  // Expose for manual check
  window.verifyProductFeedbackScreen = verifyBoundingBoxes;

  // Auto run once after layout
  window.requestAnimationFrame(() => verifyBoundingBoxes());
})();
