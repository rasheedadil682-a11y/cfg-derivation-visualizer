// grammarParser.js
// Parses grammar text into a JS object
// Input format:
//   S -> AB | a
//   A -> aA | a
//   B -> b

function parseGrammar(text) {
  const rules = {};

  const lines = text.trim().split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split on '->'
    const arrowIndex = trimmed.indexOf('->');
    if (arrowIndex === -1) continue;

    const lhs = trimmed.substring(0, arrowIndex).trim();
    const rhs = trimmed.substring(arrowIndex + 2).trim();

    if (!lhs) continue;

    // Split alternatives by '|'
    const alternatives = rhs.split('|').map(alt => alt.trim()).filter(alt => alt.length > 0);

    if (!rules[lhs]) {
      rules[lhs] = [];
    }

    for (const alt of alternatives) {
      // Each alternative is a sequence of symbols (split by spaces or char-by-char)
      // If the alt contains spaces, split by space; otherwise split each char
      let symbols;
      if (alt.includes(' ')) {
        symbols = alt.split(' ').filter(s => s.length > 0);
      } else {
        // Split character by character (e.g., "AB" -> ["A", "B"])
        // But handle multi-char non-terminals? Not needed for college assignment
        symbols = alt.split('');
      }

      // Handle epsilon
      if (symbols.length === 1 && (symbols[0] === 'ε' || symbols[0] === 'eps' || symbols[0] === 'epsilon')) {
        symbols = ['ε'];
      }

      rules[lhs].push(symbols);
    }
  }

  return rules;
}

module.exports = { parseGrammar };
