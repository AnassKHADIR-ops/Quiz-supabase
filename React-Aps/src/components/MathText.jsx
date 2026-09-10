import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const MAX_KATEX_CACHE = 1000;
const katexCache = new Map();

function getOrRenderKatex(math, displayMode) {
  const cacheKey = (displayMode ? "D:" : "I:") + math;
  if (katexCache.has(cacheKey)) {
    const cached = katexCache.get(cacheKey);
    // Refresh LRU position
    katexCache.delete(cacheKey);
    katexCache.set(cacheKey, cached);
    return cached;
  }

  let html;
  try {
    html = katex.renderToString(math, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    html = null;
  }

  if (katexCache.size >= MAX_KATEX_CACHE) {
    const oldestKey = katexCache.keys().next().value;
    katexCache.delete(oldestKey);
  }
  katexCache.set(cacheKey, html);

  return html;
}

/**
 * Renders a string that may contain a mix of plain text and LaTeX.
 * Use $$...$$ for block (display) math and $...$ for inline math.
 * Uses native katex.renderToString directly with LRU in-memory caching and React.memo.
 */
export const MathText = React.memo(function MathText({ text }) {
  if (text == null) return null;
  const str = typeof text === "string" ? text : String(text);
  if (!str.trim()) return null;

  const renderKatex = (math, displayMode) => {
    const html = getOrRenderKatex(math, displayMode);
    if (html != null) {
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <code>{displayMode ? `$$${math}$$` : `$${math}$`}</code>;
  };

  try {
    const blocks = str.split(/\$\$(.+?)\$\$/gs);
    return (
      <span>
        {blocks.map((block, i) => {
          if (i % 2 === 1) {
            return (
              <div key={i} className="math-block" style={{ margin: "8px 0", textAlign: "center" }}>
                {renderKatex(block, true)}
              </div>
            );
          }
          const inlines = block.split(/\$(.+?)\$/g);
          return (
            <span key={i}>
              {inlines.map((segment, j) => {
                if (j % 2 === 1) {
                  return (
                    <span key={j} className="math-inline">
                      {renderKatex(segment, false)}
                    </span>
                  );
                }
                return segment;
              })}
            </span>
          );
        })}
      </span>
    );
  } catch {
    return <span>{str}</span>;
  }
});

export default MathText;
