import { InlineMath, BlockMath } from "react-katex";

/**
 * Renders a string that may contain a mix of plain text and LaTeX.
 * Use $$...$$ for block (display) math and $...$ for inline math.
 */
function MathText({ text }) {
  if (text == null) return null;
  const str = typeof text === "string" ? text : String(text);
  if (!str.trim()) return null;

  try {
    // Split on $$...$$ first, then handle $...$ within remaining text segments
    const blockParts = str.split(/\$\$(.+?)\$\$/gs);

    return (
      <>
        {blockParts.map((part, i) => {
          if (i % 2 === 1) {
            // Odd indices are block math
            return (
              <BlockMath
                key={i}
                math={part}
                renderError={() => <code className="katex-fallback">$${part}$$</code>}
              />
            );
          }
          // Even indices: plain text possibly containing inline math $...$
          const inlineParts = part.split(/\$(.+?)\$/g);
          return (
            <span key={i}>
              {inlineParts.map((sub, j) =>
                j % 2 === 1 ? (
                  <InlineMath
                    key={j}
                    math={sub}
                    renderError={() => <code className="katex-fallback">${sub}$</code>}
                  />
                ) : (
                  sub
                )
              )}
            </span>
          );
        })}
      </>
    );
  } catch {
    return <span>{str}</span>;
  }
}

export default MathText;

