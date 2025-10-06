(() => {
  const root = document.getElementById('about-root');
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
    const sidePadding = parseFloat(getComputedStyle(root).paddingLeft) + parseFloat(getComputedStyle(root).paddingRight);
    const vw = Math.max(320, window.innerWidth - sidePadding);
    const baseWidth = 1333;
    const scale = Math.max(0.5, Math.min(1, vw / baseWidth));
    artboard.style.transform = `scale(${scale})`;
    artboard.style.transformOrigin = 'top left';

    // Adjust container height so page can scroll as needed
    const baseHeight = 998;
    root.style.minHeight = `${baseHeight * scale + 48}px`;
  }

  // Run on load and on resize
  scaleArtboard();
  window.addEventListener('resize', scaleArtboard);
})();
