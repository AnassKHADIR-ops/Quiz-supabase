/**
 * Utilitaires sécurisés de parsing et de synchronisation des contenus WordPress.
 * Remplace l'évaluation dynamique par code arbitraire (new Function / eval)
 * par un parseur de littéraux JS / JSON déterministe et sécurisé contre les injections XSS.
 */

/**
 * Décode les entités HTML courantes présentes dans les balises script de WordPress / Elementor.
 * Préserve les guillemets typographiques (’, ‘, “, ”) en Unicode afin de ne jamais couper
 * prématurément une chaîne JS délimitée par ' ou ".
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&nbsp;/g, " ");
}

/**
 * Analyse et désérialise un littéral JS (objets, tableaux, chaînes simples/doubles/backticks, nombres, booléens)
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
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\u00a0") {
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
      // Balises HTML injectées par WordPress wpautop (<br />, <p>, </p>) entre les tokens JS
      if (ch === "<") {
        const htmlTagMatch = decoded.slice(idx).match(/^<\/?(?:br|p)(?:\s[^>]*)?\/?>/i);
        if (htmlTagMatch) {
          idx += htmlTagMatch[0].length;
          continue;
        }
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
    if (ch === '"' || ch === "'" || ch === "`") {
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
      // Ignorer les virgules vides éventuelles (sparse arrays)
      if (idx < len && decoded[idx] === ",") {
        idx++;
        continue;
      }
      const beforeIdx = idx;
      const val = parseValue();
      if (idx === beforeIdx) {
        idx++;
        continue;
      }
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
      if (idx < len && decoded[idx] === ",") {
        idx++;
        continue;
      }
      const beforeIdx = idx;
      const key = parseIdentifierOrKey();
      skipWhitespaceAndComments();
      if (idx < len && decoded[idx] === ":") {
        idx++; // saute ':'
      } else if (idx === beforeIdx) {
        idx++;
        continue;
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
    if (ch === '"' || ch === "'" || ch === "`") return parseString();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();

    if (decoded.startsWith("true", idx) && !/[a-zA-Z0-9_$]/.test(decoded[idx + 4] || "")) {
      idx += 4;
      return true;
    }
    if (decoded.startsWith("false", idx) && !/[a-zA-Z0-9_$]/.test(decoded[idx + 5] || "")) {
      idx += 5;
      return false;
    }
    if (decoded.startsWith("null", idx) && !/[a-zA-Z0-9_$]/.test(decoded[idx + 4] || "")) {
      idx += 4;
      return null;
    }
    if (decoded.startsWith("undefined", idx) && !/[a-zA-Z0-9_$]/.test(decoded[idx + 9] || "")) {
      idx += 9;
      return null;
    }

    // Consomme un identifiant inconnu complet (évite de générer plusieurs null par caractère)
    if (/[a-zA-Z_$]/.test(ch)) {
      while (idx < len && /[a-zA-Z0-9_$.]/.test(decoded[idx])) idx++;
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
 * Ne capture que les assignations directes de littéraux tableau/objet (`= [` ou `= {`).
 */
export function extractJsVariable(htmlContent, varName) {
  if (!htmlContent || typeof htmlContent !== "string") return null;

  const regex = new RegExp(`(?:var|let|const|window\\.)\\s*\\b${varName}\\b\\s*=\\s*`, "gi");
  let match;

  while ((match = regex.exec(htmlContent)) !== null) {
    let pos = match.index + match[0].length;
    // Autoriser uniquement les espaces/commentaires/balises wpautop entre '=' et '[' ou '{'
    while (pos < htmlContent.length) {
      const ch = htmlContent[pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        pos++;
        continue;
      }
      if (ch === "<") {
        const tagMatch = htmlContent.slice(pos).match(/^<\/?(?:br|p)(?:\s[^>]*)?\/?>/i);
        if (tagMatch) {
          pos += tagMatch[0].length;
          continue;
        }
      }
      break;
    }

    const openChar = htmlContent[pos];
    if (openChar !== "[" && openChar !== "{") {
      continue;
    }

    const closeChar = openChar === "[" ? "]" : "}";
    let depth = 0;
    let inString = null;
    let inComment = false;
    let inSingleLineComment = false;

    for (let i = pos; i < htmlContent.length; i++) {
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
        if (ch === "\\") {
          i++;
          continue;
        }
        if (ch === inString) inString = null;
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
          const rawBlock = htmlContent.slice(pos, i + 1);
          const parsed = safeParseJsLiteral(rawBlock);
          if (parsed != null) return parsed;
          break;
        }
      }
    }
  }

  return null;
}
