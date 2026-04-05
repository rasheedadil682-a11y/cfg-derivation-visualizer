// ParseTree.js
// Renders a parse tree as nested HTML lists
// Input: { value: "S", children: [...] }

import React from 'react';

// Styles defined as JS objects (no extra CSS file needed)
const styles = {
  treeContainer: {
    fontFamily: 'monospace',
    fontSize: '14px',
    overflowX: 'auto',
  },
  nodeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 8px',
  },
  nodeBox: {
    padding: '4px 10px',
    border: '2px solid #333',
    borderRadius: '6px',
    fontWeight: 'bold',
    marginBottom: '0px',
    whiteSpace: 'nowrap',
  },
  ntNode: {
    backgroundColor: '#dbeafe',  // blue - non-terminal
    borderColor: '#2563eb',
    color: '#1e3a8a',
  },
  tNode: {
    backgroundColor: '#dcfce7',  // green - terminal
    borderColor: '#16a34a',
    color: '#14532d',
  },
  epsilonNode: {
    backgroundColor: '#fef9c3',  // yellow - epsilon
    borderColor: '#ca8a04',
    color: '#713f12',
  },
  childrenRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: '20px',
  },
  connector: {
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '1px',
    height: '20px',
    backgroundColor: '#666',
  },
};

// Determine if a symbol is an uppercase letter (non-terminal)
function looksLikeNT(symbol) {
  return /^[A-Z][A-Z0-9']*$/.test(symbol);
}

// Recursive tree node renderer
function TreeNode({ node }) {
  if (!node) return null;

  const isTerminal = node.children.length === 0 && !looksLikeNT(node.value);
  const isEpsilon = node.value === 'ε';
  const isNT = looksLikeNT(node.value) || (!isTerminal && !isEpsilon);

  let nodeStyle = { ...styles.nodeBox };
  if (isEpsilon) {
    nodeStyle = { ...nodeStyle, ...styles.epsilonNode };
  } else if (isTerminal) {
    nodeStyle = { ...nodeStyle, ...styles.tNode };
  } else {
    nodeStyle = { ...nodeStyle, ...styles.ntNode };
  }

  return (
    <div style={styles.nodeWrapper}>
      {/* The node itself */}
      <div style={nodeStyle}>{node.value}</div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div style={{ position: 'relative' }}>
          {/* Vertical line from parent down */}
          <div style={styles.connector}></div>
          <div style={styles.childrenRow}>
            {node.children.map((child, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main export
function ParseTree({ tree }) {
  if (!tree) {
    return <p style={{ color: '#999' }}>No parse tree available.</p>;
  }

  return (
    <div style={styles.treeContainer}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TreeNode node={tree} />
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        <span style={{ ...styles.nodeBox, ...styles.ntNode, display: 'inline-block', marginRight: '8px' }}>NT</span> Non-terminal &nbsp;
        <span style={{ ...styles.nodeBox, ...styles.tNode, display: 'inline-block', marginRight: '8px' }}>t</span> Terminal &nbsp;
        <span style={{ ...styles.nodeBox, ...styles.epsilonNode, display: 'inline-block' }}>ε</span> Epsilon
      </div>
    </div>
  );
}

export default ParseTree;
