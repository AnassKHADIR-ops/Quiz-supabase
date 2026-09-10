/**
 * Utilitaires sécurisés de parsing et de synchronisation des contenus WordPress.
 * Remplace l'évaluation dynamique par code arbitraire (new Function / eval)
 * par un parseur de littéraux JS / JSON déterministe et sécurisé contre les injections XSS.
 */

/**
 * Décode les entités HTML courantes présentes dans les balises script de WordPress / Elementor.
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, " ");
}

/**
 * Analyse et désérialise un littéral JS (objets, tableaux, chaînes simples/doubles, nombres, booléens)
 * sans JAMAIS exécuter de code (aucun new Function ni eval).
 */
export function safeParseJsLiteral(codeStr) {
  if (!codeStr || typeof codeStr !== "string") return null;

  const decoded = decodeHtmlEntities(codeStr).trim().replace(/;$/, "").trim();
  if (!decoded) return null;

  // Tentative directe avec le parseur JSON natif
  try {
    return JSON.parse(decoded);
  } catch {}

  let idx = 0;
  const len = decoded.length;

  function skipWhitespaceAndComments() {
    while (idx < len) {
      const ch = decoded[idx];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        idx++;
        continue;
      }
      // Commentaire sur une ligne // ...
      if (ch === "/" && decoded[idx + 1] === "/") {
        idx += 2;
        while (idx < len && decoded[idx] !== "\n" && decoded[idx] !== "\r") {
          idx++;
        }
        continue;
      }
      // Commentaire multi-lignes /* ... */
      if (ch === "/" && decoded[idx + 1] === "*") {
        idx += 2;
        while (idx < len && !(decoded[idx] === "*" && decoded[idx + 1] === "/")) {
          idx++;
        }
        if (idx < len) idx += 2;
        continue;
      }
      break;
    }
  }

  function parseString() {
    const quote = decoded[idx];
    idx++; // passe le délimiteur de début
    let res = "";
    while (idx < len) {
      const ch = decoded[idx];
      if (ch === "\\") {
        idx++;
        if (idx >= len) break;
        const esc = decoded[idx];
        if (esc === "n") res += "\n";
        else if (esc === "r") res += "\r";
        else if (esc === "t") res += "\t";
        else if (esc === "b") res += "\b";
        else if (esc === "f") res += "\f";
        else if (esc === "u") {
          const hex = decoded.slice(idx + 1, idx + 5);
          res += String.fromCharCode(parseInt(hex, 16) || 0);
          idx += 4;
        } else {
          res += esc;
        }
        idx++;
      } else if (ch === quote) {
        idx++; // passe le délimiteur de fin
        return res;
      } else {
        res += ch;
        idx++;
      }
    }
    return res;
  }

  function parseIdentifierOrKey() {
    skipWhitespaceAndComments();
    const ch = decoded[idx];
    if (ch === '"' || ch === "'") {
      return parseString();
    }
    const start = idx;
    while (idx < len && /[a-zA-Z0-9_$\-]/.test(decoded[idx])) {
      idx++;
    }
    return decoded.slice(start, idx);
  }

  function parseNumber() {
    const start = idx;
    if (decoded[idx] === "-") idx++;
    while (idx < len && /[0-9]/.test(decoded[idx])) idx++;
    if (idx < len && decoded[idx] === ".") {
      idx++;
      while (idx < len && /[0-9]/.test(decoded[idx])) idx++;
    }
    if (idx < len && (decoded[idx] === "e" || decoded[idx] === "E")) {
      idx++;
      if (decoded[idx] === "+" || decoded[idx] === "-") idx++;
      while (idx < len && /[0-9]/.test(decoded[idx])) idx++;
    }
    const numStr = decoded.slice(start, idx);
    return Number(numStr);
  }

  function parseArray() {
    idx++; // saute '['
    const arr = [];
    while (idx < len) {
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === "]") {
        idx++; // fin du tableau
        return arr;
      }
      const val = parseValue();
      arr.push(val);
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === ",") {
        idx++;
      } else if (idx < len && decoded[idx] === "]") {
        idx++;
        return arr;
      } else {
        break;
      }
    }
    return arr;
  }

  function parseObject() {
    idx++; // saute '{'
    const obj = {};
    while (idx < len) {
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === "}") {
        idx++; // fin de l'objet
        return obj;
      }
      const key = parseIdentifierOrKey();
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === ":") {
        idx++; // saute ':'
      }
      const val = parseValue();
      if (key) {
        obj[key] = val;
      }
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === ",") {
        idx++;
      } else if (idx < len && decoded[idx] === "}") {
        idx++;
        return obj;
      } else {
        break;
      }
    }
    return obj;
  }

  function parseValue() {
    skipWhitespaceAndComments();
    if (idx >= len) return null;
    const ch = decoded[idx];

    if (ch === "{") return parseObject();
    if (ch === "[") return parseArray();
    if (ch === '"' || ch === "'") return parseString();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();

    if (decoded.startsWith("true", idx)) {
      idx += 4;
      return true;
    }
    if (decoded.startsWith("false", idx)) {
      idx += 5;
      return false;
    }
    if (decoded.startsWith("null", idx)) {
      idx += 4;
      return null;
    }
    if (decoded.startsWith("undefined", idx)) {
      idx += 9;
      return null;
    }

    // Protection contre boucle infinie
    idx++;
    return null;
  }

  try {
    skipWhitespaceAndComments();
    return parseValue();
  } catch (err) {
    console.warn("[wpSyncUtils] Erreur lors de l'analyse du littéral:", err);
    return null;
  }
}

export const safeEvalLiteral = safeParseJsLiteral;

/**
 * Extrait une variable JavaScript déclarée dans un bloc HTML / script
 * en utilisant un équilibrage de parenthèses/crochets et notre parseur sécurisé.
 */
export function extractJsVariable(htmlContent, varName) {
  if (!htmlContent || typeof htmlContent !== "string") return null;

  const regex = new RegExp(`(?:var|let|const|window\\.)\\s*\\b${varName}\\b\\s*=\\s*`, "i");
  const match = regex.exec(htmlContent);
  if (!match) return null;

  const openPos = match.index + match[0].length;
  const startChar = htmlContent.slice(openPos).search(/[\[{]/);
  if (startChar === -1) return null;

  const actualOpenPos = openPos + startChar;
  const openChar = htmlContent[actualOpenPos];
  const closeChar = openChar === "[" ? "]" : "}";

  let depth = 0;
  let inString = null;
  let inComment = false;
  let inSingleLineComment = false;

  for (let i = actualOpenPos; i < htmlContent.length; i++) {
    const ch = htmlContent[i];
    const prev = htmlContent[i - 1];

    if (inSingleLineComment) {
      if (ch === "\n" || ch === "\r") inSingleLineComment = false;
      continue;
    }

    if (inComment) {
      if (prev === "*" && ch === "/") inComment = false;
      continue;
    }

    if (inString) {
      if (ch === inString && prev !== "\\") inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "/" && htmlContent[i + 1] === "*") {
      inComment = true;
      i++;
      continue;
    }

    if (ch === "/" && htmlContent[i + 1] === "/") {
      inSingleLineComment = true;
      i++;
      continue;
    }

    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        const rawBlock = htmlContent.slice(actualOpenPos, i + 1);
        return safeParseJsLiteral(rawBlock);
      }
    }
  }

  return null;
}
