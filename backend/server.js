// server.js
// Express backend for CFG Derivation Generator

const express = require('express');
const cors = require('cors');
const { parseGrammar } = require('./grammarParser');
const { leftmostDerivation, rightmostDerivation, buildParseTree } = require('./derivation');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------------------------
// POST /api/derive
// Body: { grammar: string, input: string, startSymbol: string }
// Returns: { leftmost, rightmost, parseTree }
// -----------------------------------------------
app.post('/api/derive', (req, res) => {
  const { grammar, input, startSymbol } = req.body;

  // Basic validation
  if (!grammar || input === undefined || !startSymbol) {
    return res.status(400).json({ error: 'Missing required fields: grammar, input, startSymbol' });
  }

  // 1. Parse grammar
  let rules;
  try {
    rules = parseGrammar(grammar);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse grammar: ' + err.message });
  }

  if (Object.keys(rules).length === 0) {
    return res.status(400).json({ error: 'No valid rules found. Check grammar format.' });
  }

  if (!(startSymbol in rules)) {
    return res.status(400).json({ error: `Start symbol "${startSymbol}" not found in grammar.` });
  }

  const targetString = input.trim();

  // 2. Run leftmost derivation
  const lmResult = leftmostDerivation(rules, startSymbol, targetString);

  // 3. Run rightmost derivation
  const rmResult = rightmostDerivation(rules, startSymbol, targetString);

  // 4. Build parse tree (using leftmost derivation path)
  let parseTree = null;
  if (lmResult.success) {
    parseTree = buildParseTree(rules, startSymbol, targetString);
  }

  // 5. Send response
  res.json({
    leftmost: lmResult.success
      ? { success: true, steps: lmResult.steps }
      : { success: false, message: 'String cannot be derived (leftmost)' },

    rightmost: rmResult.success
      ? { success: true, steps: rmResult.steps }
      : { success: false, message: 'String cannot be derived (rightmost)' },

    parseTree: parseTree || null,

    grammarRules: rules  // send back parsed rules for display
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'CFG Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
