import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * HtmlEmbedPage
 * Renders a full static HTML page from /assets inside an iframe.
 * This preserves pixel-perfect rendering and avoids CSS/JS conflicts.
 *
 * Props:
 * - src: string - path to the HTML file under /assets (public directory)
 * - headerOffset: number - height of the fixed header to compute iframe height
 */
// PUBLIC_INTERFACE
export default function HtmlEmbedPage({ src, headerOffset = 64 }) {
  const iframeStyle = useMemo(
    () => ({
      width: '100%',
      height: `calc(100vh - ${headerOffset}px)`,
      border: 'none',
      background: '#f9fafb',
      display: 'block',
    }),
    [headerOffset]
  );

  return (
    <section aria-label="Embedded design preview" style={{ background: '#f9fafb' }}>
      <iframe
        title={src}
        src={src}
        style={iframeStyle}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </section>
  );
}

HtmlEmbedPage.propTypes = {
  src: PropTypes.string.isRequired,
  headerOffset: PropTypes.number,
};
