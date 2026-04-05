// derivation.js
// Implements leftmost and rightmost derivation using BFS
// Also builds a parse tree structure

// Check if a symbol is a non-terminal (exists as a key in rules)
function isNonTerminal(symbol, rules) {
  return symbol in rules;
}

// Get the string value of a sentential form (array of symbols)
// Ignores epsilon symbols
function formToString(form) {
  return form.filter(s => s !== 'ε').join('');
}

// -----------------------------------------------
// LEFTMOST DERIVATION
// Always expands the leftmost non-terminal first
// -----------------------------------------------
function leftmostDerivation(rules, startSymbol, targetString, maxSteps = 500) {
  // Each state: { form: [...symbols], steps: [...step descriptions], tree: treeNode }
  const startForm = [startSymbol];
  const startTree = { value: startSymbol, children: [] };

  const queue = [
    {
      form: startForm,
      steps: [startSymbol],
      treeNode: startTree
    }
  ];

  const visited = new Set();
  visited.add(startSymbol);

  while (queue.length > 0) {
    const { form, steps, treeNode } = queue.shift();

    const currentStr = formToString(form);

    // Pruning: if current string (terminals only) is longer than target, skip
    const terminalPart = form.filter(s => !isNonTerminal(s, rules) && s !== 'ε').join('');
    if (terminalPart.length > targetString.length) continue;

    // Check if fully derived (no non-terminals left)
    const allTerminal = form.every(s => !isNonTerminal(s, rules));
    if (allTerminal && currentStr === targetString) {
      return { success: true, steps, tree: startTree };
    }

    if (steps.length > maxSteps) continue;

    // Find leftmost non-terminal
    const ntIndex = form.findIndex(s => isNonTerminal(s, rules));
    if (ntIndex === -1) continue; // no non-terminal but string doesn't match

    const nt = form[ntIndex];

    // Try each production for this non-terminal
    for (const production of rules[nt]) {
      // Build new form by replacing nt at ntIndex with production
      const newForm = [
        ...form.slice(0, ntIndex),
        ...production,
        ...form.slice(ntIndex + 1)
      ];

      // Remove epsilons if other symbols exist
      const cleanForm = newForm.filter(s => s !== 'ε' || newForm.length === 1);

      const stateKey = cleanForm.join(',');
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const newStepStr = cleanForm.filter(s => s !== 'ε').join('') || 'ε';
      const newSteps = [...steps, newStepStr];

      // Build tree: find the corresponding node to expand
      // We track this by cloning the tree and expanding the leftmost NT leaf
      const newTree = cloneTree(startTree);
      expandLeftmostNT(newTree, nt, production);

      queue.push({
        form: cleanForm,
        steps: newSteps,
        treeNode: newTree
      });
    }
  }

  return { success: false, steps: [], tree: null };
}

// -----------------------------------------------
// RIGHTMOST DERIVATION
// Always expands the rightmost non-terminal first
// -----------------------------------------------
function rightmostDerivation(rules, startSymbol, targetString, maxSteps = 500) {
  const startForm = [startSymbol];

  const queue = [
    {
      form: startForm,
      steps: [startSymbol]
    }
  ];

  const visited = new Set();
  visited.add(startSymbol);

  while (queue.length > 0) {
    const { form, steps } = queue.shift();

    const currentStr = formToString(form);

    // Pruning
    const terminalPart = form.filter(s => !isNonTerminal(s, rules) && s !== 'ε').join('');
    if (terminalPart.length > targetString.length) continue;

    const allTerminal = form.every(s => !isNonTerminal(s, rules));
    if (allTerminal && currentStr === targetString) {
      return { success: true, steps };
    }

    if (steps.length > maxSteps) continue;

    // Find rightmost non-terminal
    let ntIndex = -1;
    for (let i = form.length - 1; i >= 0; i--) {
      if (isNonTerminal(form[i], rules)) {
        ntIndex = i;
        break;
      }
    }
    if (ntIndex === -1) continue;

    const nt = form[ntIndex];

    for (const production of rules[nt]) {
      const newForm = [
        ...form.slice(0, ntIndex),
        ...production,
        ...form.slice(ntIndex + 1)
      ];

      const cleanForm = newForm.filter(s => s !== 'ε' || newForm.length === 1);

      const stateKey = cleanForm.join(',');
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const newStepStr = cleanForm.filter(s => s !== 'ε').join('') || 'ε';
      const newSteps = [...steps, newStepStr];

      queue.push({ form: cleanForm, steps: newSteps });
    }
  }

  return { success: false, steps: [] };
}

// -----------------------------------------------
// PARSE TREE HELPERS
// -----------------------------------------------

// Deep clone a tree object
function cloneTree(node) {
  return {
    value: node.value,
    children: node.children.map(c => cloneTree(c))
  };
}

// Expand the leftmost non-terminal leaf in the tree
// Returns true if expansion was done
function expandLeftmostNT(node, nt, production, rules_ref) {
  // If this is a leaf node and matches nt
  if (node.value === nt && node.children.length === 0) {
    node.children = production.map(sym => ({ value: sym, children: [] }));
    return true;
  }
  // Recurse into children (left to right)
  for (const child of node.children) {
    if (expandLeftmostNT(child, nt, production)) return true;
  }
  return false;
}

// Build parse tree directly from leftmost derivation steps
// Replays the derivation step by step, tracking a flat list of leaf nodes
function buildParseTree(rules, startSymbol, targetString) {
  const root = { value: startSymbol, children: [] };
  // leaves = the current frontier of leaf nodes (mirrors the sentential form)
  const leaves = [root];

  const success = buildTreeDFS(rules, [startSymbol], leaves, targetString, 0, new Set());
  if (success) return root;
  return null;
}

function buildTreeDFS(rules, form, leaves, target, depth, visited) {
  if (depth > 300) return false;

  const currentStr = formToString(form);

  // Pruning: too many terminals already
  const terminals = form.filter(s => !isNonTerminal(s, rules) && s !== 'ε').join('');
  if (terminals.length > target.length) return false;

  // All terminal — check match
  const allTerminal = form.every(s => !isNonTerminal(s, rules));
  if (allTerminal) return currentStr === target;

  const stateKey = form.join(',');
  if (visited.has(stateKey)) return false;
  visited.add(stateKey);

  // Find leftmost non-terminal in form
  const ntIndex = form.findIndex(s => isNonTerminal(s, rules));
  if (ntIndex === -1) return false;

  const nt = form[ntIndex];
  const leafNode = leaves[ntIndex]; // the leaf node corresponding to this NT

  for (const production of rules[nt]) {
    // Expand leafNode with production children
    leafNode.children = production.map(sym => ({ value: sym, children: [] }));

    // Build new form and new leaves array
    const newForm = [
      ...form.slice(0, ntIndex),
      ...production,
      ...form.slice(ntIndex + 1)
    ].filter(s => s !== 'ε' || form.length === 1);

    const newLeaves = [
      ...leaves.slice(0, ntIndex),
      ...leafNode.children,
      ...leaves.slice(ntIndex + 1)
    ];

    const success = buildTreeDFS(rules, newForm, newLeaves, target, depth + 1, new Set(visited));
    if (success) return true;

    // Backtrack
    leafNode.children = [];
  }

  return false;
}

module.exports = { leftmostDerivation, rightmostDerivation, buildParseTree };
