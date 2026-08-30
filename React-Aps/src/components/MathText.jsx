import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders a string that may contain a mix of plain text and LaTeX.
 * Use $$...$$ for block (display) math and $...$ for inline math.
 * Uses native katex.renderToString directly without fragile React wrappers.
 */
export function MathText({ text }) {
  if (text == null) return null;
  const str = typeof text === "string" ? text : String(text);
  if (!str.trim()) return null;

  const renderKatex = (math, displayMode) => {
    try {
      const html = katex.renderToString(math, {
        displayMode,
        throwOnError: false,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (err) {
      return <code>{displayMode ? `$$${math}$$` : `$${math}$`}</code>;
    }
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
}

export default MathText;
