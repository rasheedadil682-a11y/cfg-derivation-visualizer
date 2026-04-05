# CFG Derivation & Parse Tree Generator

A web application that generates **leftmost derivation**, **rightmost derivation**, and a **parse tree** for a given Context-Free Grammar (CFG) and input string.

---

## 📁 Project Structure

```
cfg-project/
├── backend/
│   ├── server.js          ← Express API server
│   ├── grammarParser.js   ← Parses grammar text into JS object
│   ├── derivation.js      ← Leftmost, rightmost derivation + parse tree logic
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js         ← Main React component (all UI)
│   │   ├── ParseTree.js   ← Parse tree renderer (nested HTML)
│   │   └── index.js       ← React entry point
│   └── package.json
│
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** version 14 or higher  
- **npm** (comes with Node.js)

Check by running:
```bash
node --version
npm --version
```

---

## 🚀 How to Run

### Step 1 — Start the Backend

```bash
cd cfg-project/backend
npm install
npm start
```

You should see:
```
Backend server running on http://localhost:5000
```

### Step 2 — Start the Frontend (open a NEW terminal)

```bash
cd cfg-project/frontend
npm install
npm start
```

The browser will open automatically at **http://localhost:3000**

---

## 🧪 Sample Inputs

### Example 1: aⁿbⁿ Grammar
```
Grammar:
S -> aSb | ab

Start Symbol: S
Input String: aaabbb
```

### Example 2: Two-part grammar
```
Grammar:
S -> AB
A -> aA | a
B -> bB | b

Start Symbol: S
Input String: aab
```

### Example 3: Arithmetic Expressions
```
Grammar:
E -> E+T | T
T -> T*F | F
F -> id

Start Symbol: E
Input String: id+id*id
```

### Example 4: Palindrome
```
Grammar:
S -> aSa | bSb | a | b

Start Symbol: S
Input String: aba
```

---

## 📐 Grammar Format Rules

- Each production on its **own line**
- Use `->` to separate LHS from RHS
- Use `|` to separate alternatives
- **Uppercase letters** = Non-terminals (e.g., `S`, `A`, `E`)
- **Lowercase letters/symbols** = Terminals (e.g., `a`, `b`, `id`)
- For epsilon: use `ε` or `eps`

**Example:**
```
S -> AB | a
A -> aA | a
B -> b
```

---

## 🔌 API Reference

### `POST /api/derive`

**Request Body:**
```json
{
  "grammar": "S -> AB\nA -> aA | a\nB -> bB | b",
  "input": "aab",
  "startSymbol": "S"
}
```

**Response:**
```json
{
  "leftmost": {
    "success": true,
    "steps": ["S", "AB", "aAB", "aaB", "aab"]
  },
  "rightmost": {
    "success": true,
    "steps": ["S", "AB", "Ab", "aAb", "aab"]
  },
  "parseTree": {
    "value": "S",
    "children": [...]
  },
  "grammarRules": { "S": [["A","B"]], "A": [...], "B": [...] }
}
```

---

## 🧠 How It Works

1. **Grammar Parser** (`grammarParser.js`): Reads text line by line, splits on `->` and `|`, builds a rules object.

2. **Leftmost Derivation** (`derivation.js`): BFS — at each step, always expands the **leftmost** non-terminal. Prunes paths where terminal prefix exceeds target length.

3. **Rightmost Derivation** (`derivation.js`): BFS — at each step, always expands the **rightmost** non-terminal.

4. **Parse Tree** (`derivation.js`): DFS — replays leftmost derivation while building a `{ value, children }` tree.

5. **Frontend** (`App.js` + `ParseTree.js`): React app with simple inline styles. Sends POST request to backend, displays derivation steps as a numbered list, and renders parse tree as nested HTML boxes.

---

## 🛑 Known Limitations

- Works best for **non-ambiguous grammars** (ambiguous grammars may show only one valid derivation)
- Very **long strings** or **highly recursive grammars** may time out (maxSteps = 500)
- Multi-character non-terminals must be space-separated in productions (e.g., `S -> AB` works, `S -> Expr` also works if space-separated)

---

## 📦 Submission

To zip the project:
```bash
zip -r cfg-project.zip cfg-project/
```

---
# cfg-derivation-visualizer
