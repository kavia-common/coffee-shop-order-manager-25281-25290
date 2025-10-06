(() => {
  const root = document.getElementById('onboarding-root');
  const artboard = root?.querySelector('.artboard');
  if (!root || !artboard) return;

  // Add a CSS class when keyboard navigation begins
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('show-focus');
  });

  // PUBLIC_INTERFACE
  function scaleArtboard() {
    /**
     * Scales the fixed-size Figma artboard (375px wide) to fit viewport while
     * maintaining pixel fidelity. Minimum scale clamped for small screens.
     */
    const cs = getComputedStyle(root);
    const sidePadding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const vw = Math.max(320, window.innerWidth - sidePadding);
    const baseWidth = 375;
    const scale = Math.max(0.5, Math.min(1.2, vw / baseWidth)); // allow slight upscale up to 1.2 to improve clarity on wide screens
    artboard.style.transform = `scale(${scale})`;
    artboard.style.transformOrigin = 'top left';

    // Adjust container min-height so page can scroll as needed
    const baseHeight = 812;
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

      const abRect = artboard.getBoundingClientRect();

      const checks = [
        { sel: '.image-onboarding', figma: { x: 0, y: 0, w: 375, h: 536 }, name: 'Image Onboarding 421:1222' },
        { sel: '.image-coffee', figma: { x: -47, y: -166, w: 468, h: 702 }, name: 'Image Coffee rect I421:1223;417:719' },
        { sel: '.bottom-container', figma: { x: 0, y: 452, w: 375, h: 360 }, name: 'Bottom Container 421:1224' },
        { sel: '.cta', figma: { x: 24, y: 702, w: 327, h: 56 }, name: 'Button 421:1226' },
        { sel: '.text-block', figma: { x: 24, y: 476, w: 327, h: 194 }, name: 'Text Block 421:1228' },
        { sel: '.home-indicator', figma: { x: 0, y: 778, w: 375, h: 34 }, name: 'Home Indicator 421:1231' },
        { sel: '.status-bar', figma: { x: 0, y: 0, w: 375, h: 44 }, name: 'Status Bar 421:1232' },
        // Additional granular checks
        { sel: '.status-left', figma: { x: 12, y: 12, w: 52, h: 21 }, name: 'Status Left Group I421:1232;417:346' },
        { sel: '.time-icon', figma: { x: 24, y: 16, w: 28, h: 12 }, name: 'Time Icon I421:1232;417:348' },
        { sel: '.status-right', figma: { x: 283.6667, y: 17.3307, w: 66.6614, h: 11.3360 }, name: 'Status Right Group I421:1232;417:330' },
      ];

      const diffs = [];
      for (const c of checks) {
        const el = document.querySelector(c.sel);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
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
      // eslint-disable-next-line no-console
      console.table(diffs);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('verifyBoundingBoxes failed', e);
    }
  }

  // Expose for manual check
  window.verifyOnboardingScreen421_1221 = verifyBoundingBoxes;

  // Auto run once after layout
  window.requestAnimationFrame(() => verifyBoundingBoxes());
})();
