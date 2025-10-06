import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * HtmlEmbedPage
 * Embeds an /assets HTML file in an iframe with:
 * - Dynamic height auto-resize using same-origin content measurement
 * - Width-constrained scale-to-fit for narrow viewports to avoid cropping
 * - Cross-origin fallback using postMessage handshake if direct access fails
 *
 * The component will never clip content. It grows height to fit the embedded
 * page and uses CSS transform scale only when the viewport is smaller
 * than the embedded artboard width.
 *
 * Props:
 * - src: string - path to the HTML file under /assets (public directory)
 * - title: string - iframe accessible title
 * - headerOffset: number - pixels reserved for fixed header height (affects available viewport)
 * - initialScaleMin: number - minimum scale applied when fitting to small screens
 * - sandbox: string - sandbox attributes for the iframe
 */
// PUBLIC_INTERFACE
export default function HtmlEmbedPage({
  src,
  title,
  headerOffset = 64,
  initialScaleMin = 0.5,
  sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms',
}) {
  const iframeRef = useRef(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [artboard, setArtboard] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  const computedTitle = title || `Embedded: ${src}`;

  const containerStyle = useMemo(
    () => ({
      background: '#f9fafb',
    }),
    []
  );

  // Build classNames to use app-level CSS utilities
  const iframeClassName = 'iframe-fluid';
  const shellClassName = 'embed-shell';

  // Try detecting artboard size from embedded document
  const detectArtboardSize = useCallback((doc) => {
    // 1) meta tags
    const metaDataSize =
      doc.querySelector('meta[name="data-artboard-size"]') ||
      doc.querySelector('meta[name="artboard-size"]') ||
      null;

    if (metaDataSize) {
      const c = (metaDataSize.getAttribute('content') || '').trim();
      // format: width=375,height=812
      const match = c.match(/width\s*=\s*(\d+)\s*,\s*height\s*=\s*(\d+)/i);
      if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
      }
      // alt format: 375x812
      const match2 = c.match(/(\d+)\s*x\s*(\d+)/i);
      if (match2) {
        return { width: parseInt(match2[1], 10), height: parseInt(match2[2], 10) };
      }
    }

    // 2) known containers
    const artboardEl =
      doc.getElementById('artboard') ||
      doc.querySelector('.artboard') ||
      doc.querySelector('[role="group"][aria-label*="Artboard"]');

    if (artboardEl) {
      const style = doc.defaultView.getComputedStyle(artboardEl);
      const w = parseFloat(style.width) || artboardEl.offsetWidth || artboardEl.scrollWidth;
      const h = parseFloat(style.height) || artboardEl.offsetHeight || artboardEl.scrollHeight;
      if (w && h) return { width: Math.round(w), height: Math.round(h) };
    }

    // 3) mobile hints: presence of iOS status bar elements indicate 375x812 common frames
    const hasStatusBar =
      !!doc.querySelector('.status-bar') ||
      !!doc.querySelector('[aria-label*="Status bar" i]') ||
      !!doc.querySelector('[role="status"]');
    if (hasStatusBar) return { width: 375, height: 812 };

    // 4) desktop default fallback
    return { width: 1440, height: 1024 };
  }, []);

  const measureContent = useCallback(
    (doc) => {
      try {
        const body = doc?.body;
        const html = doc?.documentElement;
        if (!body || !html) return;

        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        const width = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth
        );

        setContentSize({ width, height });
        const ab = detectArtboardSize(doc);
        setArtboard(ab);
      } catch {
        // ignore
      }
    },
    [detectArtboardSize]
  );

  // Apply dynamic height to iframe and compute scale-to-fit if viewport is narrower than artboard width
  const resizeIframe = useCallback(() => {
    const node = iframeRef.current;
    if (!node) return;

    const viewportWidth = node.parentElement ? node.parentElement.clientWidth : window.innerWidth;
    const availableWidth = Math.max(320, viewportWidth);

    const isNarrow = artboard.width > 0 && availableWidth < artboard.width;
    const fitScale = isNarrow ? Math.max(initialScaleMin, availableWidth / artboard.width) : 1;
    setScale(fitScale);

    // Height logic: use measured content height; when scaled, we need scaled height so wrapper doesn't crop
    const contentHeight = contentSize.height || window.innerHeight;
    const scaledHeight = Math.ceil(contentHeight * fitScale);

    // We set the iframe element height to scaled content so no cropping
    node.style.height = `${scaledHeight}px`;
  }, [artboard.width, contentSize.height, initialScaleMin]);

  // Attach resize observer to embedded content for same-origin case
  const attachObservers = useCallback(
    (doc) => {
      if (!doc) return;
      try {
        measureContent(doc);

        // Auto-inject viewport meta if missing
        const head = doc.querySelector('head');
        const hasViewport = doc.querySelector('meta[name="viewport"]');
        if (!hasViewport && head) {
          const meta = doc.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
          head.appendChild(meta);
        }

        const ro = new doc.defaultView.ResizeObserver(() => {
          measureContent(doc);
          // resize outer iframe height after any change
          requestAnimationFrame(resizeIframe);
        });
        ro.observe(doc.documentElement);
        ro.observe(doc.body);

        // Also listen to load events of images
        const imgs = doc.images || [];
        for (const img of imgs) {
          img.addEventListener('load', () => {
            measureContent(doc);
            requestAnimationFrame(resizeIframe);
          });
        }
      } catch {
        // cross-origin or blocked; rely on postMessage fallback
      }
    },
    [measureContent, resizeIframe]
  );

  // Handle load event to attach observers and measure content
  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentWindow?.document;
      if (!doc) return;
      attachObservers(doc);
      // initial pass
      requestAnimationFrame(() => {
        measureContent(doc);
        resizeIframe();
      });
    } catch {
      // Same-origin policy might block; trigger postMessage handshake
      try {
        iframe.contentWindow?.postMessage({ type: 'request-size' }, '*');
      } catch {
        // noop
      }
    }
  }, [attachObservers, measureContent, resizeIframe]);

  // Listen for postMessage fallback
  useEffect(() => {
    const onMessage = (e) => {
      if (!e?.data || typeof e.data !== 'object') return;
      const { type, payload } = e.data;
      if (type === 'embedded-size' && payload) {
        const { width, height, artboardWidth, artboardHeight } = payload;
        if (width && height) setContentSize({ width, height });
        if (artboardWidth && artboardHeight) setArtboard({ width: artboardWidth, height: artboardHeight });
        requestAnimationFrame(resizeIframe);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [resizeIframe]);

  // Recompute on viewport resize
  useEffect(() => {
    const onResize = () => resizeIframe();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resizeIframe]);

  // Update when metrics change
  useEffect(() => {
    resizeIframe();
  }, [contentSize.height, artboard.width, resizeIframe]);

  // Wrapper styles to apply transform scaling without cropping
  const wrapperStyle = useMemo(() => {
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: scale !== 1 && artboard.width ? `${artboard.width}px` : '100%',
      // height of wrapper is controlled by the iframe element itself
    };
  }, [scale, artboard.width]);

  return (
    <section className={shellClassName} aria-label="Embedded design preview" style={containerStyle}>
      <div className="scaled-wrapper" style={wrapperStyle}>
        <iframe
          ref={iframeRef}
          className={iframeClassName}
          title={computedTitle}
          src={src}
          style={{ border: '0', display: 'block', width: '100%' }}
          // keep same-origin and scripts so styles and measurement work
          sandbox={sandbox}
          onLoad={handleLoad}
        />
      </div>
    </section>
  );
}

HtmlEmbedPage.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
  headerOffset: PropTypes.number,
  initialScaleMin: PropTypes.number,
  sandbox: PropTypes.string,
};
