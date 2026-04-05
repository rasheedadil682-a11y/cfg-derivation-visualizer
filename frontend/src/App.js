import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const EXAMPLES = [
  { name: 'aⁿbⁿ',       grammar: 'S -> aSb | ab',                            input: 'aaabbb',   start: 'S' },
  { name: 'Simple AB',  grammar: 'S -> AB\nA -> aA | a\nB -> bB | b',        input: 'aab',      start: 'S' },
  { name: 'Arithmetic', grammar: 'E -> E+T | T\nT -> T*F | F\nF -> id',      input: 'id+id*id', start: 'E' },
  { name: 'Palindrome', grammar: 'S -> aSa | bSb | a | b',                   input: 'aba',      start: 'S' },
];

/* ─────────────────────────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────────────────────────── */
function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const move = (e) => {
      const x = e.clientX, y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = x + 'px';
        dotRef.current.style.top  = y + 'px';
      }
      if (ringRef.current) {
        ringRef.current.style.left = x + 'px';
        ringRef.current.style.top  = y + 'px';
      }
      if (glowRef.current) {
        glowRef.current.style.left = x + 'px';
        glowRef.current.style.top  = y + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
      <div ref={glowRef} className="cursor-glow" />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────────────────────── */
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'ok') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
    }, 3200);
  }, []);

  return { toasts, push };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? 'leaving' : ''}`}>
          <span className="toast-icon">{t.type === 'ok' ? '✓' : '✕'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARSE TREE NODE
───────────────────────────────────────────────────────── */
function isNT(sym) { return /^[A-Z][A-Z0-9']*$/.test(sym); }

function TreeNode({ node, isRoot }) {
  if (!node) return null;
  const eps      = node.value === 'ε';
  const terminal = node.children.length === 0 && !isNT(node.value) && !eps;
  let cls = isRoot ? 'tn-box tn-root' : eps ? 'tn-box tn-eps' : terminal ? 'tn-box tn-t' : 'tn-box tn-nt';

  return (
    <div className="tn-wrap">
      <div className={cls}>{node.value}</div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="tn-line-down" />
          <div className="tn-children">
            {node.children.map((child, i) => (
              <div key={i} className="tn-child-col">
                <div className="tn-child-line" />
                <TreeNode node={child} isRoot={false} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ParseTreeView({ tree, treeRef }) {
  if (!tree) return <p className="no-tree">— parse tree unavailable —</p>;
  return (
    <>
      <div className="tree-scroll">
        <div className="tree-center" ref={treeRef}>
          <TreeNode node={tree} isRoot={true} />
        </div>
      </div>
      <div className="tree-legend">
        <div className="lg-item"><span className="lg-sw lg-nt">NT</span> Non-terminal</div>
        <div className="lg-item"><span className="lg-sw lg-t">t</span> Terminal</div>
        <div className="lg-item"><span className="lg-sw lg-eps">ε</span> Epsilon</div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   GRAMMAR DISPLAY
───────────────────────────────────────────────────────── */
function GrammarDisplay({ rules }) {
  if (!rules || !Object.keys(rules).length) return null;
  return (
    <div className="card grammar-card">
      <div className="card-head">
        <div className="card-title-row">
          <div className="title-bar tb-dm" />
          Parsed Grammar
        </div>
      </div>
      <div className="rule-grid">
        {Object.entries(rules).map(([lhs, prods]) => (
          <div key={lhs} className="rule-row">
            <span className="rule-lhs">{lhs}</span>
            <span className="rule-arrow">→</span>
            <span className="rule-rhs">{prods.map(p => p.join('')).join('  |  ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DERIVATION CARD  (step-by-step + autoplay + progress bar)
───────────────────────────────────────────────────────── */
function DerivationCard({ result, title, barClass }) {
  const ok     = result && result.success;
  const steps  = ok ? result.steps : [];
  const total  = steps.length;

  const [active, setActive] = useState(total > 0 ? total - 1 : 0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  // Reset when steps change
  useEffect(() => {
    setActive(total > 0 ? total - 1 : 0);
    setPlaying(false);
  }, [result]);

  // Auto-play ticker
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setActive(prev => {
          if (prev >= total - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, total]);

  const startPlay = () => {
    if (active >= total - 1) setActive(0);
    setPlaying(true);
  };
  const stopPlay = () => { setPlaying(false); };

  const pct = total > 1 ? (active / (total - 1)) * 100 : 100;

  const stepClass = (i) => {
    if (i === active) return 'step-item s-active';
    if (i < active)  return 'step-item s-past';
    if (i === total - 1 && active === total - 1) return 'step-item s-final';
    return 'step-item';
  };

  return (
    <div className="card deriv-card">
      <div className="card-head">
        <div className="card-title-row">
          <div className={`title-bar ${barClass}`} />
          {title}
        </div>
        {ok
          ? <span className="status-pill pill-ok">{total} steps</span>
          : <span className="status-pill pill-err">cannot derive</span>
        }
      </div>

      {ok && (
        <>
          {/* Progress bar */}
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {/* Controls */}
          <div className="deriv-controls">
            <button className="btn btn-sm" onClick={() => setActive(0)}>⏮ Reset</button>
            <button
              className="btn btn-sm"
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
            >‹ Prev</button>
            <button
              className="btn btn-sm"
              onClick={() => setActive(a => Math.min(total - 1, a + 1))}
              disabled={active === total - 1}
            >Next ›</button>
            {!playing
              ? <button className="btn btn-play" onClick={startPlay} disabled={total < 2}>▶ Play</button>
              : <button className="btn btn-play playing" onClick={stopPlay}>⏸ Pause</button>
            }
            <span className="step-counter">{active + 1} / {total}</span>
          </div>

          {/* Steps */}
          <ol className="step-list">
            {steps.map((step, i) => (
              <li
                key={i}
                className={i === total - 1 && active === total - 1
                  ? 'step-item s-active s-final'
                  : stepClass(i)
                }
                onClick={() => setActive(i)}
                style={{ cursor: 'pointer' }}
              >
                <span className="s-num">{i}</span>
                {i > 0 && <span className="s-arrow">⇒</span>}
                <span className="s-str">{step}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {!ok && result && (
        <p className="deriv-fail">{result.message}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARSE TREE CARD  (with Download PNG)
───────────────────────────────────────────────────────── */
function ParseTreeCard({ tree, toast }) {
  const treeRef = useRef(null);

  const downloadPNG = async () => {
    if (!treeRef.current) return;
    try {
      // Dynamically load html2canvas from CDN
      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const canvas = await window.html2canvas(treeRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'parse-tree.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('Parse tree downloaded!', 'ok');
    } catch {
      toast('Download failed. Try again.', 'err');
    }
  };

  return (
    <div className="card tree-card">
      <div className="card-head">
        <div className="card-title-row">
          <div className="title-bar tb-gd" />
          Parse Tree
        </div>
        {tree
          ? <span className="status-pill pill-ok">generated</span>
          : <span className="status-pill pill-err">unavailable</span>
        }
      </div>

      {tree && (
        <div className="tree-toolbar">
          <button className="btn btn-sm" onClick={downloadPNG}>⬇ Download PNG</button>
        </div>
      )}

      <ParseTreeView tree={tree} treeRef={treeRef} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────── */
export default function App() {
  const [grammar,  setGrammar]  = useState('S -> AB\nA -> aA | a\nB -> bB | b');
  const [inputStr, setInputStr] = useState('aab');
  const [startSym, setStartSym] = useState('S');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState(null);

  const { toasts, push: toast } = useToast();

  function loadExample(ex) {
    setGrammar(ex.grammar);
    setInputStr(ex.input);
    setStartSym(ex.start);
    setResult(null);
    setError('');
  }

  async function handleGenerate() {
    setError('');
    setResult(null);

    if (!grammar.trim())     { setError('Please enter grammar rules.'); return; }
    if (!startSym.trim())    { setError('Please enter a start symbol.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5001/api/derive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammar, input: inputStr, startSymbol: startSym.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Server error.');
        toast(data.error || 'Server error.', 'err');
        return;
      }

      setResult(data);

      const lmOk = data.leftmost?.success;
      const rmOk = data.rightmost?.success;
      if (lmOk && rmOk) toast('Derivations found successfully!', 'ok');
      else if (!lmOk && !rmOk) toast('String cannot be derived from this grammar.', 'err');
      else toast('Partial derivations found.', 'ok');

    } catch {
      const msg = 'Cannot reach backend — run: cd backend && npm start';
      setError(msg);
      toast(msg, 'err');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-root">
      {/* Atmosphere layers */}
      <div className="bg-grid" />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />

      <div className="app-wrap">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-badge">
            <span className="badge-dot" />
            Compiler Theory  ·  CS Assignment
          </div>
          <h1 className="app-title">CFG Derivation &amp;<br />Parse Tree Generator</h1>
          <p className="app-subtitle">
            Visualise leftmost &amp; rightmost derivations for any context-free grammar
          </p>
        </header>

        {/* ── Examples ── */}
        <div className="examples-bar">
          <span className="eg-label">Try</span>
          {EXAMPLES.map(ex => (
            <button key={ex.name} className="chip" onClick={() => loadExample(ex)}>{ex.name}</button>
          ))}
        </div>

        {/* ── Input Card ── */}
        <div className="card input-card">

          {/* Grammar rules */}
          <div className="field-grp">
            <div className="f-label">
              <div className="f-icon">G</div>
              Grammar Rules
            </div>
            <textarea
              className="grammar-ta"
              value={grammar}
              onChange={e => setGrammar(e.target.value)}
              placeholder={'S -> AB\nA -> aA | a\nB -> bB | b'}
              spellCheck={false}
            />
            <p className="f-hint">
              One rule per line · Use | to separate alternatives · Uppercase = non-terminals · Lowercase = terminals
            </p>
          </div>

          {/* Start sym + input + button */}
          <div className="field-grp">
            <div className="f-label">
              <div className="f-icon">I</div>
              Input
            </div>
            <div className="fields-row">
              <div className="field-item">
                <span className="f-label" style={{ marginBottom: 0, fontSize: '8px' }}>Start Symbol</span>
                <input
                  className="txt-in in-start"
                  value={startSym}
                  onChange={e => setStartSym(e.target.value)}
                  maxLength={5}
                  spellCheck={false}
                />
              </div>
              <div className="field-item">
                <span className="f-label" style={{ marginBottom: 0, fontSize: '8px' }}>Input String</span>
                <input
                  className="txt-in in-str"
                  value={inputStr}
                  onChange={e => setInputStr(e.target.value)}
                  placeholder="e.g. aabb"
                  spellCheck={false}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
                style={{ alignSelf: 'flex-end' }}
              >
                {loading ? '···' : '▶'}&nbsp;&nbsp;{loading ? 'Computing' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="error-box">
            <div className="err-icon">!</div>
            <p className="err-msg">{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="loading-box">
            <div className="spinner" />
            Computing derivations…
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="results-stack">
            <GrammarDisplay rules={result.grammarRules} />

            <DerivationCard
              result={result.leftmost}
              title="Leftmost Derivation"
              barClass="tb-or"
            />

            <DerivationCard
              result={result.rightmost}
              title="Rightmost Derivation"
              barClass="tb-am"
            />

            <ParseTreeCard tree={result.parseTree} toast={toast} />
          </div>
        )}

        <footer className="app-footer">CFG Derivation Generator · College Assignment</footer>
      </div>
    </div>
  );
}