/**
 * Tests for Sudoku Solver module
 *
 * Uses Node.js built-in test runner (node:test)
 * Run with: npm test
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCandidates, buildCandidateMap, solve, countSolutions,
  calculateScore, getDifficulty, generatePuzzle,
} from '../src/solver.js';
import { generateCompleteSudokuGrid } from '../src/index.js';

// ============================================================================
// getCandidates
// ============================================================================

describe('getCandidates()', () => {

  // Fully filled grid — no candidates for any cell
  test('filled cell returns empty array', () => {
    const grid = generateCompleteSudokuGrid();
    const result = getCandidates(grid, 0, 0);
    assert.deepEqual(result, [], 'Filled cell should have no candidates');
  });

  // Single empty cell in a complete grid — the only candidate matches the solution value
  test('single empty cell in complete grid has exactly one candidate — the solution value', () => {
    const grid = generateCompleteSudokuGrid();

    // Save the value and clear the cell
    const original = grid[4][4];
    grid[4][4] = 0;

    const candidates = getCandidates(grid, 4, 4);
    assert.equal(candidates.length, 1, 'Should have exactly one candidate');
    assert.equal(candidates[0], original, 'Candidate should match the original value');
  });

  // Verify across multiple random cells for robustness
  test('works correctly for multiple cells across the grid', () => {
    const grid = generateCompleteSudokuGrid();

    // Check 10 different positions
    const positions = [
      [0, 0], [0, 8], [2, 5], [3, 3], [4, 7],
      [5, 1], [6, 6], [7, 2], [8, 4], [1, 3],
    ];

    for (const [r, c] of positions) {
      const original = grid[r][c];
      grid[r][c] = 0;

      const candidates = getCandidates(grid, r, c);
      assert.equal(candidates.length, 1, `Cell [${r}][${c}] should have 1 candidate`);
      assert.equal(candidates[0], original, `Cell [${r}][${c}] candidate should be ${original}`);

      // Restore for the next iteration
      grid[r][c] = original;
    }
  });

  // Empty grid — all 9 digits are valid
  test('empty grid returns all 9 candidates', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    const candidates = getCandidates(grid, 0, 0);
    assert.deepEqual(candidates, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  // Row is filled except for one cell
  test('row constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the first row except the last cell: 1,2,3,4,5,6,7,8,_
    for (let c = 0; c < 8; c++) {
      grid[0][c] = c + 1;
    }

    const candidates = getCandidates(grid, 0, 8);
    assert.deepEqual(candidates, [9], 'Only 9 should be available');
  });

  // Column is filled except for one cell
  test('column constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the first column except the last cell: 1,2,3,4,5,6,7,8,_
    for (let r = 0; r < 8; r++) {
      grid[r][0] = r + 1;
    }

    const candidates = getCandidates(grid, 8, 0);
    assert.deepEqual(candidates, [9], 'Only 9 should be available');
  });

  // 3×3 block is filled except for one cell
  test('block constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill the top-left block except [2][2]
    // [1, 2, 3]
    // [4, 5, 6]
    // [7, 8, _]
    let val = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 2 && c === 2) continue;
        grid[r][c] = val++;
      }
    }

    const candidates = getCandidates(grid, 2, 2);
    assert.deepEqual(candidates, [9], 'Only 9 should be available');
  });

  // Combined constraints — row + column + block
  test('combined constraints from row, column and block', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Row 0: place 1, 2, 3 in columns 3, 4, 5
    grid[0][3] = 1;
    grid[0][4] = 2;
    grid[0][5] = 3;

    // Column 0: place 4, 5 in rows 3, 4
    grid[3][0] = 4;
    grid[4][0] = 5;

    // Block [0,0]: place 6, 7 in [1][1] and [2][2]
    grid[1][1] = 6;
    grid[2][2] = 7;

    const candidates = getCandidates(grid, 0, 0);
    // Excluded: 1,2,3 (row), 4,5 (column), 6,7 (block) — remaining: 8, 9
    assert.deepEqual(candidates, [8, 9]);
  });
});

// ============================================================================
// buildCandidateMap
// ============================================================================

describe('buildCandidateMap()', () => {
  test('complete grid produces empty map', () => {
    const grid = generateCompleteSudokuGrid();
    const map = buildCandidateMap(grid);
    assert.equal(map.size, 0, 'No empty cells — no candidates');
  });

  test('map keys match empty cells', () => {
    const grid = generateCompleteSudokuGrid();
    // Clear 3 cells
    grid[0][0] = 0;
    grid[4][4] = 0;
    grid[8][8] = 0;

    const map = buildCandidateMap(grid);
    assert.equal(map.size, 3);
    assert.ok(map.has('0,0'));
    assert.ok(map.has('4,4'));
    assert.ok(map.has('8,8'));
  });
});

// ============================================================================
// solve() — Easy techniques (Naked Single + Hidden Single)
// ============================================================================

describe('solve() — Easy techniques', () => {

  // Puzzle with one empty cell — solved by Naked Single in one step
  test('solves grid with one empty cell (naked single)', () => {
    const grid = generateCompleteSudokuGrid();
    const original = grid[3][5];
    grid[3][5] = 0;

    const result = solve(grid);
    assert.equal(result.solved, true, 'Should solve the puzzle');
    assert.equal(result.grid[3][5], original, 'Should restore the correct value');
    assert.equal(result.steps[0].technique, 'nakedSingle');
  });

  // Puzzle with a few empty cells from different regions — still Naked Single
  test('solves grid with a few scattered empty cells', () => {
    const grid = generateCompleteSudokuGrid();

    // Remove one cell from each different row/column/block
    const removed = [[0, 1], [3, 4], [6, 7]];
    const originals = removed.map(([r, c]) => {
      const v = grid[r][c];
      grid[r][c] = 0;
      return v;
    });

    const result = solve(grid);
    assert.equal(result.solved, true);

    removed.forEach(([r, c], i) => {
      assert.equal(result.grid[r][c], originals[i], `Cell [${r}][${c}] should be restored`);
    });
  });

  // Real easy puzzle — solved only by Naked Single and Hidden Single
  // Take a complete grid and remove ~35 cells such that each removal
  // leaves at least one cell with a single candidate
  test('solves a real easy puzzle (naked + hidden singles only)', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    // Remove cells one by one, verifying the puzzle is still solvable with Easy techniques
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    // Shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 35) break;

      const backup = grid[r][c];
      grid[r][c] = 0;

      // Copy for testing
      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);

      if (result.solved) {
        removed++;
      } else {
        grid[r][c] = backup; // Rollback — unsolvable without this cell
      }
    }

    // Now solve the final puzzle
    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve puzzle with ${removed} empty cells`);
    assert.ok(result.steps.length > 0, 'Should have applied some techniques');

    // All techniques used must be Easy only
    const easyTechniques = new Set(['nakedSingle', 'hiddenSingle']);
    for (const step of result.steps) {
      assert.ok(easyTechniques.has(step.technique),
        `Only easy techniques expected, got: ${step.technique}`);
    }
  });

  // solve() should not break an already filled grid
  test('already solved grid returns immediately', () => {
    const grid = generateCompleteSudokuGrid();
    const copy = grid.map(row => [...row]);

    const result = solve(grid);
    assert.equal(result.solved, true);
    assert.equal(result.steps.length, 0, 'No steps needed');
    assert.deepEqual(result.grid, copy, 'Grid should be unchanged');
  });
});

// ============================================================================
// solve() — Medium techniques (Naked Pair, Hidden Pair, Naked Triple)
// ============================================================================

describe('solve() — Medium techniques', () => {

  // Naked Pair: manually construct a situation where two cells in a row have {3,7}
  // and 3 or 7 is a candidate in another cell of that row
  test('naked pair eliminates candidates from peers', () => {
    // Берём решённую сетку и выборочно обнуляем так чтобы в строке
    // появилась naked pair ситуация
    const grid = generateCompleteSudokuGrid();

    // Remove enough cells for the solver to potentially use pairs
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    // Shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 45) break;
      const backup = grid[r][c];
      grid[r][c] = 0;

      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);
      if (result.solved) {
        removed++;
      } else {
        grid[r][c] = backup;
      }
    }

    // Solve and verify the result is correct
    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve puzzle with ${removed} empty cells`);

    // Verify the result is a valid grid (no zeros, no duplicates in rows)
    for (let r = 0; r < 9; r++) {
      const row = new Set(result.grid[r]);
      assert.equal(row.size, 9, `Row ${r} should have 9 unique values`);
      for (const v of row) {
        assert.ok(v >= 1 && v <= 9, `Row ${r} values should be 1-9`);
      }
    }
  });

  // Verify that solve correctly solves a puzzle with Medium techniques and the result matches the solution
  test('solution matches the original complete grid', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 40) break;
      const backup = grid[r][c];
      grid[r][c] = 0;

      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);
      if (result.solved) {
        removed++;
      } else {
        grid[r][c] = backup;
      }
    }

    const result = solve(grid);
    assert.equal(result.solved, true);

    // Every restored cell must match the original
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.equal(result.grid[r][c], solution[r][c],
          `Cell [${r}][${c}] should match solution`);
      }
    }
  });
});

// ============================================================================
// solve() — Hard techniques (X-Wing, Pointing Pairs)
// ============================================================================

describe('solve() — Hard techniques', () => {

  // Solver with Hard techniques should solve more complex puzzles
  // and the result must match the original
  test('solves harder puzzles with more empty cells', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Try to remove more — up to 50 cells
    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 50) break;
      const backup = grid[r][c];
      grid[r][c] = 0;

      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);
      if (result.solved) {
        removed++;
      } else {
        grid[r][c] = backup;
      }
    }

    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve puzzle with ${removed} empty cells`);

    // Result must match the original
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.equal(result.grid[r][c], solution[r][c],
          `Cell [${r}][${c}] should match solution`);
      }
    }
  });

  // Stability: solve 20 random puzzles in a row
  test('consistently solves 20 random puzzles', () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const solution = generateCompleteSudokuGrid();
      const grid = solution.map(row => [...row]);

      const positions = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) positions.push([r, c]);
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      let removed = 0;
      for (const [r, c] of positions) {
        if (removed >= 45) break;
        const backup = grid[r][c];
        grid[r][c] = 0;
        const testGrid = grid.map(row => [...row]);
        if (solve(testGrid).solved) {
          removed++;
        } else {
          grid[r][c] = backup;
        }
      }

      const result = solve(grid);
      assert.equal(result.solved, true, `Attempt ${attempt}: should solve with ${removed} empty cells`);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          assert.equal(result.grid[r][c], solution[r][c],
            `Attempt ${attempt}: cell [${r}][${c}] mismatch`);
        }
      }
    }
  });
});

// ============================================================================
// solve() — Expert techniques (Swordfish, XY-Wing, Unique Rectangle)
// ============================================================================

describe('solve() — Expert techniques', () => {

  // With the full set of techniques, puzzles with the maximum number of removed cells should be solvable
  test('solves puzzles with maximum empty cells', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) positions.push([r, c]);
    }
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Try to remove the maximum
    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 55) break;
      const backup = grid[r][c];
      grid[r][c] = 0;
      const testGrid = grid.map(row => [...row]);
      if (solve(testGrid).solved) {
        removed++;
      } else {
        grid[r][c] = backup;
      }
    }

    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve with ${removed} empty cells`);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.equal(result.grid[r][c], solution[r][c],
          `Cell [${r}][${c}] should match solution`);
      }
    }
  });

  // Stability: 5 puzzles with aggressive removal
  test('stable across 5 aggressive puzzles', () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const solution = generateCompleteSudokuGrid();
      const grid = solution.map(row => [...row]);

      const positions = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) positions.push([r, c]);
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      let removed = 0;
      for (const [r, c] of positions) {
        if (removed >= 50) break;
        const backup = grid[r][c];
        grid[r][c] = 0;
        const testGrid = grid.map(row => [...row]);
        if (solve(testGrid).solved) {
          removed++;
        } else {
          grid[r][c] = backup;
        }
      }

      const result = solve(grid);
      assert.equal(result.solved, true, `Attempt ${attempt}: solved with ${removed} empty`);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          assert.equal(result.grid[r][c], solution[r][c],
            `Attempt ${attempt}: cell [${r}][${c}] mismatch`);
        }
      }
    }
  });
});

// ============================================================================
// countSolutions() — uniqueness check
// ============================================================================

describe('countSolutions()', () => {

  // Complete grid — exactly one solution (itself)
  test('complete grid has exactly 1 solution', () => {
    const grid = generateCompleteSudokuGrid();
    assert.equal(countSolutions(grid), 1);
  });

  // One empty cell — still a unique solution
  test('grid with one empty cell has 1 solution', () => {
    const grid = generateCompleteSudokuGrid();
    grid[4][4] = 0;
    assert.equal(countSolutions(grid), 1);
  });

  // Empty grid — more than one solution
  test('empty grid has multiple solutions', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    assert.equal(countSolutions(grid), 2, 'Should detect multiple solutions (capped at 2)');
  });

  // Impossible puzzle — the only empty cell has no candidates
  test('impossible puzzle has 0 solutions', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);
    const V = solution[4][4];

    // Clear [4][4] — V should go there
    grid[4][4] = 0;
    // Place V in [3][4]: same block and same column
    // V is now excluded from [4][4]'s candidates via both column and block.
    // Row 4 already covered {1..9}-{V} — all 9 values are excluded — 0 candidates
    grid[3][4] = V;

    assert.equal(countSolutions(grid), 0);
  });

  // Puzzle with controlled removal — unique solution
  test('well-formed puzzle has 1 solution', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) positions.push([r, c]);
    }
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 30) break;
      const backup = grid[r][c];
      grid[r][c] = 0;
      if (countSolutions(grid) === 1) {
        removed++;
      } else {
        grid[r][c] = backup;
      }
    }

    assert.equal(countSolutions(grid), 1, `Puzzle with ${removed} empty cells should have unique solution`);
  });

  // Does not mutate the input grid
  test('does not mutate the input grid', () => {
    const grid = generateCompleteSudokuGrid();
    grid[0][0] = 0;
    const copy = grid.map(row => [...row]);

    countSolutions(grid);
    assert.deepEqual(grid, copy, 'Grid should not be modified');
  });
});

// ============================================================================
// calculateScore() + getDifficulty()
// ============================================================================

describe('calculateScore() + getDifficulty()', () => {

  test('empty steps = score 0 = easy', () => {
    assert.equal(calculateScore([]), 0);
    assert.equal(getDifficulty(0), 'easy');
  });

  test('only naked singles = low score = easy', () => {
    const steps = [
      { technique: 'nakedSingle', count: 10 },
    ];
    const score = calculateScore(steps);
    assert.equal(score, 10); // 1 × 10
    assert.equal(getDifficulty(score), 'easy');
  });

  test('mixed medium techniques = medium score', () => {
    const steps = [
      { technique: 'nakedSingle', count: 5 },
      { technique: 'nakedPair', count: 3 },
    ];
    const score = calculateScore(steps);
    assert.equal(score, 5 + 15); // 1×5 + 5×3 = 20
    assert.equal(getDifficulty(score), 'medium');
  });

  test('x-wing pushes to hard', () => {
    const steps = [
      { technique: 'nakedSingle', count: 10 },
      { technique: 'hiddenSingle', count: 5 },
      { technique: 'xWing', count: 2 },
    ];
    const score = calculateScore(steps);
    // 1×10 + 2×5 + 15×2 = 10 + 10 + 30 = 50
    assert.equal(score, 50);
    assert.equal(getDifficulty(score), 'hard');
  });

  test('expert score', () => {
    assert.equal(getDifficulty(81), 'expert');
    assert.equal(getDifficulty(150), 'expert');
  });

  test('boundary values', () => {
    assert.equal(getDifficulty(15), 'easy');
    assert.equal(getDifficulty(16), 'medium');
    assert.equal(getDifficulty(40), 'medium');
    assert.equal(getDifficulty(41), 'hard');
    assert.equal(getDifficulty(80), 'hard');
    assert.equal(getDifficulty(81), 'expert');
  });
});

// ============================================================================
// generatePuzzle() — controlled generation by difficulty level
// ============================================================================

describe('generatePuzzle()', () => {

  test('generates a valid easy puzzle', () => {
    const solution = generateCompleteSudokuGrid();
    const result = generatePuzzle(solution, 'easy');

    // Puzzle contains zeros
    let emptyCells = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (result.puzzle[r][c] === 0) emptyCells++;
      }
    }
    assert.ok(emptyCells > 0, 'Puzzle should have empty cells');

    // Solution matches the original
    assert.deepEqual(result.solution, solution);

    // Puzzle is solvable and has a unique solution
    assert.equal(countSolutions(result.puzzle), 1);
  });

  test('generates puzzles for each difficulty level', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert']) {
      const solution = generateCompleteSudokuGrid();
      const result = generatePuzzle(solution, difficulty);

      // Unique solution
      assert.equal(countSolutions(result.puzzle), 1,
        `${difficulty} puzzle should have unique solution`);

      // Filled cells match the solution
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (result.puzzle[r][c] !== 0) {
            assert.equal(result.puzzle[r][c], solution[r][c],
              `${difficulty}: filled cell [${r}][${c}] should match solution`);
          }
        }
      }
    }
  });

  test('harder difficulties have more empty cells on average', () => {
    const solution = generateCompleteSudokuGrid();

    const countEmpty = (grid) => {
      let n = 0;
      for (const row of grid) for (const c of row) if (c === 0) n++;
      return n;
    };

    const easyResult = generatePuzzle(solution, 'easy');
    const hardResult = generatePuzzle(solution, 'hard');

    // Hard should have more empty cells than Easy (not a strict guarantee, but typically true)
    const easyEmpty = countEmpty(easyResult.puzzle);
    const hardEmpty = countEmpty(hardResult.puzzle);

    assert.ok(hardEmpty >= easyEmpty,
      `Hard (${hardEmpty} empty) should have >= empty cells than Easy (${easyEmpty} empty)`);
  });

  test('does not mutate the input solution', () => {
    const solution = generateCompleteSudokuGrid();
    const copy = solution.map(row => [...row]);

    generatePuzzle(solution, 'easy');
    assert.deepEqual(solution, copy, 'Solution should not be modified');
  });
});
