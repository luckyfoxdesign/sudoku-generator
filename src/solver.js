/**
 * Solver module for Sudoku Generator
 *
 * Sudoku solving techniques — from simple to advanced.
 * Used for puzzle difficulty assessment and controlled generation.
 *
 * @license MIT
 */

// ============================================================================
// CANDIDATES — the foundation of the solver
// ============================================================================

/**
 * Returns the list of valid digits for a cell.
 * Checks the row, column, and 3×3 block for occupied values.
 *
 * @param {number[][]} grid - 9×9 grid, where 0 = empty cell
 * @param {number} row - Row (0-8)
 * @param {number} col - Column (0-8)
 * @returns {number[]} Array of valid digits (1-9)
 */
export function getCandidates(grid, row, col) {
  // Filled cell — no candidates
  if (grid[row][col] !== 0) return [];

  const used = new Set();

  // Row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] !== 0) used.add(grid[row][c]);
  }

  // Column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] !== 0) used.add(grid[r][col]);
  }

  // 3×3 block
  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      if (grid[r][c] !== 0) used.add(grid[r][c]);
    }
  }

  // Everything not used is valid
  const candidates = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) candidates.push(n);
  }
  return candidates;
}

// ============================================================================
// CANDIDATE MAP — candidates for the entire grid at once
// ============================================================================

/**
 * Builds a candidate map for all empty cells in the grid.
 * Key — "row,col", value — Set of valid digits.
 *
 * @param {number[][]} grid - Сетка 9×9
 * @returns {Map<string, Set<number>>}
 */
export function buildCandidateMap(grid) {
  const map = new Map();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        map.set(`${r},${c}`, new Set(getCandidates(grid, r, c)));
      }
    }
  }
  return map;
}

/**
 * Removes a candidate from all empty cells in the same row, column, and 3×3 block.
 * Called after a cell receives a value.
 *
 * @param {Map<string, Set<number>>} candidateMap
 * @param {number} row
 * @param {number} col
 * @param {number} value - Value to remove from peer candidates
 */
function eliminateFromPeers(candidateMap, row, col, value) {
  // Row
  for (let c = 0; c < 9; c++) {
    const key = `${row},${c}`;
    const set = candidateMap.get(key);
    if (set) set.delete(value);
  }

  // Column
  for (let r = 0; r < 9; r++) {
    const key = `${r},${col}`;
    const set = candidateMap.get(key);
    if (set) set.delete(value);
  }

  // 3×3 block
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      const key = `${r},${c}`;
      const set = candidateMap.get(key);
      if (set) set.delete(value);
    }
  }
}

/**
 * Places a value in a cell, removes it from the candidate map
 * and cleans up candidates from peers.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @param {number} row
 * @param {number} col
 * @param {number} value
 */
function placeValue(grid, candidateMap, row, col, value) {
  grid[row][col] = value;
  candidateMap.delete(`${row},${col}`);
  eliminateFromPeers(candidateMap, row, col, value);
}

// ============================================================================
// SOLVING TECHNIQUES — Easy
// ============================================================================

/**
 * Naked Single — exactly one candidate remains in the cell.
 * The simplest technique: if a cell has only one option — place it.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of values placed in one pass
 */
function nakedSingle(grid, candidateMap) {
  let placed = 0;

  for (const [key, candidates] of candidateMap) {
    if (candidates.size === 1) {
      const [row, col] = key.split(',').map(Number);
      const value = [...candidates][0];
      placeValue(grid, candidateMap, row, col, value);
      placed++;
    }
  }

  return placed;
}

/**
 * Hidden Single — a digit appears as a candidate in only one cell of a region.
 * Checks rows, columns, and 3×3 blocks.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of values placed in one pass
 */
function hiddenSingle(grid, candidateMap) {
  let placed = 0;

  // Check each region: 9 rows, 9 columns, 9 blocks
  const regions = getAllRegions();

  for (const region of regions) {
    // For each digit 1-9, count how many cells in the region have it as a candidate
    for (let num = 1; num <= 9; num++) {
      let found = null;
      let count = 0;

      for (const [r, c] of region) {
        const key = `${r},${c}`;
        const set = candidateMap.get(key);
        if (set && set.has(num)) {
          found = { r, c, key };
          count++;
          if (count > 1) break;
        }
      }

      // Digit appears in exactly one cell of the region — place it
      if (count === 1) {
        placeValue(grid, candidateMap, found.r, found.c, num);
        placed++;
      }
    }
  }

  return placed;
}

// ============================================================================
// REGIONS — rows, columns, blocks as coordinate lists
// ============================================================================

/**
 * Returns all 27 Sudoku regions: 9 rows + 9 columns + 9 blocks.
 * Each region is an array of 9 [row, col] pairs.
 *
 * @returns {number[][][]}
 */
function getAllRegions() {
  const regions = [];

  // Rows
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) row.push([r, c]);
    regions.push(row);
  }

  // Columns
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) col.push([r, c]);
    regions.push(col);
  }

  // 3×3 blocks
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const block = [];
      for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) block.push([r, c]);
      }
      regions.push(block);
    }
  }

  return regions;
}

// ============================================================================
// SOLVING TECHNIQUES — Medium
// ============================================================================

/**
 * Naked Pair — two cells in the same region share exactly two identical candidates.
 * Those two digits can be eliminated from all other cells in the region.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function nakedPair(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // Collect cells in the region with exactly 2 candidates
    const pairs = [];
    for (const [r, c] of region) {
      const set = candidateMap.get(`${r},${c}`);
      if (set && set.size === 2) {
        pairs.push({ r, c, candidates: set });
      }
    }

    // Look for two cells with identical candidates
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = pairs[i];
        const b = pairs[j];

        // Compare sets
        if (a.candidates.size !== b.candidates.size) continue;
        let match = true;
        for (const v of a.candidates) {
          if (!b.candidates.has(v)) { match = false; break; }
        }
        if (!match) continue;

        // Found a pair — remove these digits from other cells in the region
        const pairValues = [...a.candidates];
        for (const [r, c] of region) {
          if ((r === a.r && c === a.c) || (r === b.r && c === b.c)) continue;
          const set = candidateMap.get(`${r},${c}`);
          if (!set) continue;
          for (const v of pairValues) {
            if (set.has(v)) {
              set.delete(v);
              eliminated++;
            }
          }
        }
      }
    }
  }

  return eliminated;
}

/**
 * Hidden Pair — two digits appear as candidates only in the same two cells of a region.
 * All other candidates in those two cells can be removed.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function hiddenPair(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // For each digit 1-9, collect which cells in the region have it as a candidate
    const numPositions = new Map();
    for (let num = 1; num <= 9; num++) {
      const positions = [];
      for (const [r, c] of region) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) positions.push(`${r},${c}`);
      }
      if (positions.length === 2) {
        numPositions.set(num, positions);
      }
    }

    // Look for two digits with identical positions
    const nums = [...numPositions.keys()];
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const posA = numPositions.get(nums[i]);
        const posB = numPositions.get(nums[j]);

        if (posA[0] !== posB[0] || posA[1] !== posB[1]) continue;

        // Found hidden pair — keep only these two digits in both cells
        const keepValues = new Set([nums[i], nums[j]]);
        for (const key of posA) {
          const set = candidateMap.get(key);
          if (!set) continue;
          for (const v of [...set]) {
            if (!keepValues.has(v)) {
              set.delete(v);
              eliminated++;
            }
          }
        }
      }
    }
  }

  return eliminated;
}

/**
 * Naked Triple — three cells in the same region collectively contain exactly three candidates.
 * Each cell has 2 or 3 candidates, and their union equals exactly 3 digits.
 * Those digits are eliminated from all other cells in the region.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function nakedTriple(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // Cells with 2 or 3 candidates
    const cells = [];
    for (const [r, c] of region) {
      const set = candidateMap.get(`${r},${c}`);
      if (set && set.size >= 2 && set.size <= 3) {
        cells.push({ r, c, candidates: set });
      }
    }

    // Iterate over triples
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        for (let k = j + 1; k < cells.length; k++) {
          // Union the candidates of three cells
          const union = new Set([
            ...cells[i].candidates,
            ...cells[j].candidates,
            ...cells[k].candidates,
          ]);

          if (union.size !== 3) continue;

          // Found a triple — remove these digits from other cells
          const tripleKeys = new Set([
            `${cells[i].r},${cells[i].c}`,
            `${cells[j].r},${cells[j].c}`,
            `${cells[k].r},${cells[k].c}`,
          ]);

          for (const [r, c] of region) {
            const key = `${r},${c}`;
            if (tripleKeys.has(key)) continue;
            const set = candidateMap.get(key);
            if (!set) continue;
            for (const v of union) {
              if (set.has(v)) {
                set.delete(v);
                eliminated++;
              }
            }
          }
        }
      }
    }
  }

  return eliminated;
}

// ============================================================================
// SOLVING TECHNIQUES — Hard
// ============================================================================

/**
 * X-Wing — a candidate digit appears in exactly two columns across two rows.
 * That digit can be eliminated from those columns in all other rows.
 * Works symmetrically: checks rows→columns and columns→rows.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function xWing(grid, candidateMap) {
  let eliminated = 0;

  for (let num = 1; num <= 9; num++) {
    // Rows → columns: find rows where num appears in exactly 2 columns
    const rowPositions = [];
    for (let r = 0; r < 9; r++) {
      const cols = [];
      for (let c = 0; c < 9; c++) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) cols.push(c);
      }
      if (cols.length === 2) rowPositions.push({ line: r, positions: cols });
    }

    // Look for two rows with the same columns
    for (let i = 0; i < rowPositions.length; i++) {
      for (let j = i + 1; j < rowPositions.length; j++) {
        const a = rowPositions[i];
        const b = rowPositions[j];
        if (a.positions[0] !== b.positions[0] || a.positions[1] !== b.positions[1]) continue;

        // X-Wing found — remove num from these columns in other rows
        for (const col of a.positions) {
          for (let r = 0; r < 9; r++) {
            if (r === a.line || r === b.line) continue;
            const set = candidateMap.get(`${r},${col}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }
      }
    }

    // Columns → rows: find columns where num appears in exactly 2 rows
    const colPositions = [];
    for (let c = 0; c < 9; c++) {
      const rows = [];
      for (let r = 0; r < 9; r++) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) rows.push(r);
      }
      if (rows.length === 2) colPositions.push({ line: c, positions: rows });
    }

    for (let i = 0; i < colPositions.length; i++) {
      for (let j = i + 1; j < colPositions.length; j++) {
        const a = colPositions[i];
        const b = colPositions[j];
        if (a.positions[0] !== b.positions[0] || a.positions[1] !== b.positions[1]) continue;

        // X-Wing found — remove num from these rows in other columns
        for (const row of a.positions) {
          for (let c = 0; c < 9; c++) {
            if (c === a.line || c === b.line) continue;
            const set = candidateMap.get(`${row},${c}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }
      }
    }
  }

  return eliminated;
}

/**
 * Pointing Pairs / Box-Line Reduction.
 *
 * Pointing Pairs: if a candidate within a 3×3 block is confined to a single
 * row or column — remove it from that row/column outside the block.
 *
 * Box-Line Reduction (reverse): if a candidate in a row/column only appears
 * within a single block — remove it from the block outside that row/column.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function pointingPairs(grid, candidateMap) {
  let eliminated = 0;

  // Pointing Pairs: for each block and each digit
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      for (let num = 1; num <= 9; num++) {
        const rows = new Set();
        const cols = new Set();

        // Where in the block does num appear as a candidate?
        for (let r = br; r < br + 3; r++) {
          for (let c = bc; c < bc + 3; c++) {
            const set = candidateMap.get(`${r},${c}`);
            if (set && set.has(num)) {
              rows.add(r);
              cols.add(c);
            }
          }
        }

        // All candidates for num are in one row — remove from that row outside the block
        if (rows.size === 1) {
          const row = [...rows][0];
          for (let c = 0; c < 9; c++) {
            if (c >= bc && c < bc + 3) continue; // Skip the block itself
            const set = candidateMap.get(`${row},${c}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }

        // All candidates for num are in one column — remove from that column outside the block
        if (cols.size === 1) {
          const col = [...cols][0];
          for (let r = 0; r < 9; r++) {
            if (r >= br && r < br + 3) continue;
            const set = candidateMap.get(`${r},${col}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }
      }
    }
  }

  // Box-Line Reduction: for each row and each digit
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const blocks = new Set();
      for (let c = 0; c < 9; c++) {
        const set = candidateMap.get(`${row},${c}`);
        if (set && set.has(num)) {
          blocks.add(Math.floor(c / 3));
        }
      }

      // All candidates for num in the row are in one block
      if (blocks.size === 1) {
        const bc = [...blocks][0] * 3;
        const br = Math.floor(row / 3) * 3;
        for (let r = br; r < br + 3; r++) {
          if (r === row) continue;
          for (let c = bc; c < bc + 3; c++) {
            const set = candidateMap.get(`${r},${c}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }
      }
    }
  }

  // Box-Line Reduction: for each column and each digit
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const blocks = new Set();
      for (let r = 0; r < 9; r++) {
        const set = candidateMap.get(`${r},${col}`);
        if (set && set.has(num)) {
          blocks.add(Math.floor(r / 3));
        }
      }

      if (blocks.size === 1) {
        const br = [...blocks][0] * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let c = bc; c < bc + 3; c++) {
          if (c === col) continue;
          for (let r = br; r < br + 3; r++) {
            const set = candidateMap.get(`${r},${c}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }
      }
    }
  }

  return eliminated;
}

// ============================================================================
// SOLVING TECHNIQUES — Expert
// ============================================================================

/**
 * Swordfish — an extension of X-Wing across three rows and three columns.
 * A candidate digit in three rows appears in only 2-3 columns,
 * and the union of those columns is exactly 3.
 * The digit can then be eliminated from those columns in all other rows.
 * Works symmetrically for columns→rows.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function swordfish(grid, candidateMap) {
  let eliminated = 0;

  for (let num = 1; num <= 9; num++) {
    // Rows → columns
    const rowData = [];
    for (let r = 0; r < 9; r++) {
      const cols = [];
      for (let c = 0; c < 9; c++) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) cols.push(c);
      }
      if (cols.length >= 2 && cols.length <= 3) {
        rowData.push({ line: r, positions: cols });
      }
    }

    for (let i = 0; i < rowData.length; i++) {
      for (let j = i + 1; j < rowData.length; j++) {
        for (let k = j + 1; k < rowData.length; k++) {
          const union = new Set([
            ...rowData[i].positions,
            ...rowData[j].positions,
            ...rowData[k].positions,
          ]);
          if (union.size !== 3) continue;

          // Swordfish found — remove num from these columns in other rows
          const lines = new Set([rowData[i].line, rowData[j].line, rowData[k].line]);
          for (const col of union) {
            for (let r = 0; r < 9; r++) {
              if (lines.has(r)) continue;
              const set = candidateMap.get(`${r},${col}`);
              if (set && set.has(num)) {
                set.delete(num);
                eliminated++;
              }
            }
          }
        }
      }
    }

    // Columns → rows
    const colData = [];
    for (let c = 0; c < 9; c++) {
      const rows = [];
      for (let r = 0; r < 9; r++) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) rows.push(r);
      }
      if (rows.length >= 2 && rows.length <= 3) {
        colData.push({ line: c, positions: rows });
      }
    }

    for (let i = 0; i < colData.length; i++) {
      for (let j = i + 1; j < colData.length; j++) {
        for (let k = j + 1; k < colData.length; k++) {
          const union = new Set([
            ...colData[i].positions,
            ...colData[j].positions,
            ...colData[k].positions,
          ]);
          if (union.size !== 3) continue;

          const lines = new Set([colData[i].line, colData[j].line, colData[k].line]);
          for (const row of union) {
            for (let c = 0; c < 9; c++) {
              if (lines.has(c)) continue;
              const set = candidateMap.get(`${row},${c}`);
              if (set && set.has(num)) {
                set.delete(num);
                eliminated++;
              }
            }
          }
        }
      }
    }
  }

  return eliminated;
}

/**
 * XY-Wing — three bi-value cells form an elimination chain.
 *
 * Pivot: cell with candidates {X, Y}
 * Wing1: peer of pivot with candidates {X, Z}
 * Wing2: peer of pivot with candidates {Y, Z}
 *
 * All cells that see both Wing1 and Wing2 cannot contain Z.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function xyWing(grid, candidateMap) {
  let eliminated = 0;

  // Collect all bi-value cells
  const biValueCells = [];
  for (const [key, set] of candidateMap) {
    if (set.size === 2) {
      const [r, c] = key.split(',').map(Number);
      biValueCells.push({ r, c, candidates: [...set] });
    }
  }

  for (const pivot of biValueCells) {
    const [x, y] = pivot.candidates;

    // Find wing1 (peer of pivot, candidates {X, Z}) and wing2 (peer of pivot, candidates {Y, Z})
    const pivotPeers = biValueCells.filter(cell =>
      cell !== pivot && arePeers(pivot.r, pivot.c, cell.r, cell.c)
    );

    for (const wing1 of pivotPeers) {
      // wing1 must contain X and not contain Y
      if (!wing1.candidates.includes(x) || wing1.candidates.includes(y)) continue;
      const z = wing1.candidates[0] === x ? wing1.candidates[1] : wing1.candidates[0];

      for (const wing2 of pivotPeers) {
        if (wing2 === wing1) continue;
        // wing2 must contain Y and Z
        if (!wing2.candidates.includes(y) || !wing2.candidates.includes(z)) continue;

        // XY-Wing found. Remove Z from cells that see both wing1 and wing2
        for (const [key, set] of candidateMap) {
          if (!set.has(z)) continue;
          const [r, c] = key.split(',').map(Number);
          if (r === wing1.r && c === wing1.c) continue;
          if (r === wing2.r && c === wing2.c) continue;
          if (r === pivot.r && c === pivot.c) continue;

          if (arePeers(r, c, wing1.r, wing1.c) && arePeers(r, c, wing2.r, wing2.c)) {
            set.delete(z);
            eliminated++;
          }
        }
      }
    }
  }

  return eliminated;
}

/**
 * Checks whether two cells are peers (in the same row, column, or block).
 *
 * @param {number} r1
 * @param {number} c1
 * @param {number} r2
 * @param {number} c2
 * @returns {boolean}
 */
function arePeers(r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) return false;
  // Same row
  if (r1 === r2) return true;
  // Same column
  if (c1 === c2) return true;
  // Same block
  if (Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
      Math.floor(c1 / 3) === Math.floor(c2 / 3)) return true;
  return false;
}

/**
 * Unique Rectangle (Type 1) — uses the uniqueness constraint of the puzzle.
 *
 * If 4 cells form a rectangle spanning two blocks,
 * and 3 of them share the same candidates {A, B},
 * while the 4th has {A, B, ...}, then A and B can be removed from the 4th cell.
 * (Otherwise the puzzle would have two solutions — a deadly pattern.)
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Number of eliminated candidates
 */
function uniqueRectangle(grid, candidateMap) {
  let eliminated = 0;

  // Collect cells with exactly 2 candidates
  const biValueCells = [];
  for (const [key, set] of candidateMap) {
    if (set.size === 2) {
      const [r, c] = key.split(',').map(Number);
      biValueCells.push({ r, c, candidates: [...set].sort((a, b) => a - b) });
    }
  }

  // Find pairs with identical candidates in the same row
  for (let i = 0; i < biValueCells.length; i++) {
    for (let j = i + 1; j < biValueCells.length; j++) {
      const a = biValueCells[i];
      const b = biValueCells[j];

      if (a.candidates[0] !== b.candidates[0] || a.candidates[1] !== b.candidates[1]) continue;
      if (a.r !== b.r) continue; // Must be in the same row

      // Columns must be in different blocks
      if (Math.floor(a.c / 3) === Math.floor(b.c / 3)) continue;

      const [val1, val2] = a.candidates;

      // Look for two more cells: same column pair, different row, same block range
      for (let r2 = 0; r2 < 9; r2++) {
        if (r2 === a.r) continue;
        // Rows must be in different blocks
        if (Math.floor(r2 / 3) === Math.floor(a.r / 3)) continue;

        const key1 = `${r2},${a.c}`;
        const key2 = `${r2},${b.c}`;
        const set1 = candidateMap.get(key1);
        const set2 = candidateMap.get(key2);

        if (!set1 || !set2) continue;
        if (!set1.has(val1) || !set1.has(val2)) continue;
        if (!set2.has(val1) || !set2.has(val2)) continue;

        // Type 1: one lower cell has exactly {A, B}, the other has more
        // Remove A and B from the one with more candidates
        if (set1.size === 2 && set2.size > 2) {
          set2.delete(val1);
          set2.delete(val2);
          eliminated += 2;
        } else if (set2.size === 2 && set1.size > 2) {
          set1.delete(val1);
          set1.delete(val2);
          eliminated += 2;
        }
      }
    }
  }

  return eliminated;
}

// ============================================================================
// SOLVER — technique loop from simple to advanced
// ============================================================================

/**
 * Techniques in order of application.
 * name — for logging and scoring, fn — the technique itself, weight — scoring weight.
 * type: 'place' sets values, 'eliminate' removes candidates.
 */
const TECHNIQUES = [
  { name: 'nakedSingle',      fn: nakedSingle,      weight: 1,  type: 'place' },
  { name: 'hiddenSingle',     fn: hiddenSingle,     weight: 2,  type: 'place' },
  { name: 'nakedPair',        fn: nakedPair,        weight: 5,  type: 'eliminate' },
  { name: 'hiddenPair',       fn: hiddenPair,       weight: 7,  type: 'eliminate' },
  { name: 'nakedTriple',      fn: nakedTriple,      weight: 8,  type: 'eliminate' },
  { name: 'pointingPairs',    fn: pointingPairs,    weight: 6,  type: 'eliminate' },
  { name: 'xWing',            fn: xWing,            weight: 15, type: 'eliminate' },
  { name: 'swordfish',        fn: swordfish,        weight: 20, type: 'eliminate' },
  { name: 'xyWing',           fn: xyWing,           weight: 18, type: 'eliminate' },
  { name: 'uniqueRectangle',  fn: uniqueRectangle,  weight: 20, type: 'eliminate' },
];

/**
 * Solves the puzzle using techniques from simple to advanced.
 * On any progress — restarts from the simplest technique.
 * Stops when the puzzle is solved or no technique makes progress.
 *
 * Mutates the input grid.
 *
 * @param {number[][]} grid - Сетка 9×9 (0 = пустая клетка)
 * @returns {{ solved: boolean, steps: Array<{technique: string, count: number}>, grid: number[][] }}
 */
export function solve(grid) {
  const candidateMap = buildCandidateMap(grid);
  const steps = [];

  while (candidateMap.size > 0) {
    let progress = false;

    for (const technique of TECHNIQUES) {
      const count = technique.fn(grid, candidateMap);
      if (count > 0) {
        steps.push({ technique: technique.name, count });
        progress = true;
        break; // Restart from the simplest technique
      }
    }

    // No technique made progress — stop
    if (!progress) break;
  }

  return {
    solved: candidateMap.size === 0,
    steps,
    grid,
  };
}

// ============================================================================
// UNIQUENESS CHECK — backtracking solver
// ============================================================================

/**
 * Counts the number of puzzle solutions via backtracking.
 * Stops as soon as a second solution is found — no need to count further.
 *
 * @param {number[][]} grid - 9×9 grid (0 = empty cell). Not mutated.
 * @returns {number} 0 (invalid), 1 (unique), 2 (ambiguous — 2+)
 */
export function countSolutions(grid) {
  // Work on a copy
  const g = grid.map(row => [...row]);
  let count = 0;

  function backtrack(pos) {
    if (count >= 2) return; // Early exit

    // Find the next empty cell
    while (pos < 81 && g[Math.floor(pos / 9)][pos % 9] !== 0) {
      pos++;
    }

    if (pos === 81) {
      count++;
      return;
    }

    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const candidates = getCandidates(g, row, col);

    for (const num of candidates) {
      g[row][col] = num;
      backtrack(pos + 1);
      if (count >= 2) return;
    }

    g[row][col] = 0;
  }

  backtrack(0);
  return count;
}

// ============================================================================
// DIFFICULTY SCORING
// ============================================================================

/**
 * Scoring ranges → difficulty levels.
 * Calibrated based on real test results.
 */
const DIFFICULTY_RANGES = {
  easy:   { min: 0,  max: 15 },
  medium: { min: 16, max: 40 },
  hard:   { min: 41, max: 80 },
  expert: { min: 81, max: Infinity },
};

/**
 * Calculates the difficulty score from the solving steps.
 * Score = sum of (technique weight × number of applications).
 *
 * @param {Array<{technique: string, count: number}>} steps
 * @returns {number}
 */
export function calculateScore(steps) {
  let score = 0;
  const weightMap = {};
  for (const t of TECHNIQUES) weightMap[t.name] = t.weight;

  for (const step of steps) {
    score += (weightMap[step.technique] || 0) * step.count;
  }
  return score;
}

/**
 * Determines the difficulty level from the score.
 *
 * @param {number} score
 * @returns {'easy' | 'medium' | 'hard' | 'expert'}
 */
export function getDifficulty(score) {
  if (score <= DIFFICULTY_RANGES.easy.max) return 'easy';
  if (score <= DIFFICULTY_RANGES.medium.max) return 'medium';
  if (score <= DIFFICULTY_RANGES.hard.max) return 'hard';
  return 'expert';
}

// ============================================================================
// CONTROLLED CELL REMOVAL
// ============================================================================

/**
 * Generates a puzzle of the specified difficulty.
 *
 * Algorithm:
 * 1. Takes a fully filled grid (solution)
 * 2. Iteratively removes one cell at a time
 * 3. After each removal: uniqueness check + solver pass
 * 4. If uniqueness is violated or difficulty exceeds the range — rollback
 * 5. Continues until the target score range is reached
 *
 * @param {number[][]} solution - Полностью заполненная валидная сетка
 * @param {'easy' | 'medium' | 'hard' | 'expert'} targetDifficulty
 * @param {object} [options]
 * @param {number} [options.maxAttempts=200] - Максимум попыток удаления
 * @returns {{ puzzle: number[][], solution: number[][], difficulty: string, score: number, steps: Array }}
 */
export function generatePuzzle(solution, targetDifficulty, options = {}) {
  const { maxAttempts = 200 } = options;
  const range = DIFFICULTY_RANGES[targetDifficulty];
  const grid = solution.map(row => [...row]);

  // All positions, randomly shuffled
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) positions.push([r, c]);
  }
  shuffle(positions);

  const locked = new Set(); // Cells that cannot be removed
  let bestResult = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Ищем следующую клетку для удаления
    let found = false;
    for (let i = 0; i < positions.length; i++) {
      const [r, c] = positions[i];
      const key = `${r},${c}`;

      if (grid[r][c] === 0 || locked.has(key)) continue;

      const backup = grid[r][c];
      grid[r][c] = 0;

      // Uniqueness check
      if (countSolutions(grid) !== 1) {
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      // Solver pass
      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);

      if (!result.solved) {
        // Solver failed — too complex for current techniques
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      const score = calculateScore(result.steps);
      const difficulty = getDifficulty(score);

      // Save the best result within the target range
      if (score >= range.min && score <= range.max) {
        bestResult = {
          puzzle: grid.map(row => [...row]),
          solution: solution.map(row => [...row]),
          difficulty,
          score,
          steps: result.steps,
        };
      }

      // Overshot — score exceeds the target range — rollback
      if (score > range.max) {
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      found = true;
      break;
    }

    // Nothing could be removed — exit
    if (!found) break;
  }

  // If no ideal result found — use the current state
  if (!bestResult) {
    const testGrid = grid.map(row => [...row]);
    const result = solve(testGrid);
    const score = calculateScore(result.steps);
    bestResult = {
      puzzle: grid.map(row => [...row]),
      solution: solution.map(row => [...row]),
      difficulty: getDifficulty(score),
      score,
      steps: result.steps,
    };
  }

  return bestResult;
}

/**
 * Fisher-Yates shuffle
 * @param {any[]} arr
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
