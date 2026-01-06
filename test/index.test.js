/**
 * Test suite for Sudoku Generator
 * 
 * Uses Node.js built-in test runner (node:test)
 * Run with: npm test
 * 
 * @author Lucky Fox Design
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateSudokuGrid, 
  generateCompleteSudokuGrid,
  generateSudokuGridWithMetadata 
} from '../src/index.js';

// ============================================================================
// PUZZLE GENERATION TESTS (with empty cells)
// ============================================================================

describe('generateSudokuGrid() - Puzzle', () => {
  test('should return a 9x9 grid', () => {
    const grid = generateSudokuGrid();
    
    assert.equal(grid.length, 9, 'Grid should have 9 rows');
    grid.forEach((row, i) => {
      assert.equal(row.length, 9, `Row ${i} should have 9 columns`);
    });
  });

  test('should contain only numbers from 0 to 9 (0 = empty)', () => {
    const grid = generateSudokuGrid();
    
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        assert.ok(
          cell >= 0 && cell <= 9,
          `Cell [${i}][${j}] should be between 0-9, got ${cell}`
        );
      });
    });
  });

  test('should have some empty cells (0)', () => {
    const grid = generateSudokuGrid();
    let emptyCount = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell === 0) emptyCount++;
      });
    });
    
    assert.ok(emptyCount > 0, 'Puzzle should have at least some empty cells');
    assert.ok(emptyCount < 81, 'Puzzle should not be completely empty');
  });

  test('should preserve columns 0, 3, 6 (never empty)', () => {
    const grid = generateSudokuGrid();
    
    for (let row = 0; row < 9; row++) {
      assert.notEqual(grid[row][0], 0, `Cell [${row}][0] should not be empty`);
      assert.notEqual(grid[row][3], 0, `Cell [${row}][3] should not be empty`);
      assert.notEqual(grid[row][6], 0, `Cell [${row}][6] should not be empty`);
    }
  });

  test('should generate different puzzles on each call', () => {
    const grid1 = generateSudokuGrid();
    const grid2 = generateSudokuGrid();
    
    const str1 = JSON.stringify(grid1);
    const str2 = JSON.stringify(grid2);
    
    assert.notEqual(str1, str2, 'Each call should generate a unique puzzle');
  });
});

// ============================================================================
// COMPLETE SOLUTION TESTS (no empty cells)
// ============================================================================

describe('generateCompleteSudokuGrid() - Complete Solution', () => {
  test('should return a 9x9 grid', () => {
    const grid = generateCompleteSudokuGrid();
    
    assert.equal(grid.length, 9, 'Grid should have 9 rows');
    grid.forEach((row, i) => {
      assert.equal(row.length, 9, `Row ${i} should have 9 columns`);
    });
  });

  test('should contain only numbers from 1 to 9 (no zeros)', () => {
    const grid = generateCompleteSudokuGrid();
    
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        assert.ok(
          cell >= 1 && cell <= 9,
          `Cell [${i}][${j}] should be between 1-9, got ${cell}`
        );
      });
    });
  });

  test('should have no empty cells', () => {
    const grid = generateCompleteSudokuGrid();
    let emptyCount = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell === 0) emptyCount++;
      });
    });
    
    assert.equal(emptyCount, 0, 'Complete solution should have no empty cells');
  });

  test('should generate different solutions on each call', () => {
    const grid1 = generateCompleteSudokuGrid();
    const grid2 = generateCompleteSudokuGrid();
    
    const str1 = JSON.stringify(grid1);
    const str2 = JSON.stringify(grid2);
    
    assert.notEqual(str1, str2, 'Each call should generate a unique solution');
  });
});

// ============================================================================
// METADATA TESTS
// ============================================================================

describe('generateSudokuGridWithMetadata()', () => {
  test('should return a 9x9 grid with metadata objects', () => {
    const grid = generateSudokuGridWithMetadata();
    
    assert.equal(grid.length, 9, 'Grid should have 9 rows');
    
    grid.forEach((row, i) => {
      assert.equal(row.length, 9, `Row ${i} should have 9 columns`);
      
      row.forEach((cell, j) => {
        assert.ok(
          typeof cell === 'object',
          `Cell [${i}][${j}] should be an object`
        );
        assert.ok(
          'chosenValue' in cell,
          `Cell [${i}][${j}] should have chosenValue property`
        );
        assert.ok(
          'removedValues' in cell,
          `Cell [${i}][${j}] should have removedValues property`
        );
        assert.ok(
          'gameSet' in cell,
          `Cell [${i}][${j}] should have gameSet property`
        );
      });
    });
  });

  test('should have valid chosenValues (0-9)', () => {
    const grid = generateSudokuGridWithMetadata();
    
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        assert.ok(
          cell.chosenValue >= 0 && cell.chosenValue <= 9,
          `Cell [${i}][${j}] chosenValue should be between 0-9, got ${cell.chosenValue}`
        );
      });
    });
  });

  test('should have some empty cells in metadata', () => {
    const grid = generateSudokuGridWithMetadata();
    let emptyCount = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.chosenValue === 0) emptyCount++;
      });
    });
    
    assert.ok(emptyCount > 0, 'Metadata should reflect some empty cells');
  });
});

// ============================================================================
// SUDOKU RULES VALIDATION TESTS (for complete solutions)
// ============================================================================

describe('Sudoku Rules Validation - Complete Solution', () => {
  /**
   * Checks if a row contains all unique numbers from 1-9
   * @param {number[]} row - Array of 9 numbers
   * @returns {boolean} True if row is valid
   */
  function isValidRow(row) {
    const seen = new Set();
    for (const num of row) {
      if (num < 1 || num > 9 || seen.has(num)) {
        return false;
      }
      seen.add(num);
    }
    return seen.size === 9;
  }

  /**
   * Checks if a column contains all unique numbers from 1-9
   * @param {number[][]} grid - 9x9 Sudoku grid
   * @param {number} colIndex - Column index (0-8)
   * @returns {boolean} True if column is valid
   */
  function isValidColumn(grid, colIndex) {
    const column = grid.map(row => row[colIndex]);
    return isValidRow(column);
  }

  /**
   * Checks if a 3x3 block contains all unique numbers from 1-9
   * @param {number[][]} grid - 9x9 Sudoku grid
   * @param {number} blockRow - Block row index (0, 3, or 6)
   * @param {number} blockCol - Block column index (0, 3, or 6)
   * @returns {boolean} True if block is valid
   */
  function isValidBlock(grid, blockRow, blockCol) {
    const seen = new Set();
    for (let i = blockRow; i < blockRow + 3; i++) {
      for (let j = blockCol; j < blockCol + 3; j++) {
        const num = grid[i][j];
        if (num < 1 || num > 9 || seen.has(num)) {
          return false;
        }
        seen.add(num);
      }
    }
    return seen.size === 9;
  }

  test('complete solution should have valid rows', () => {
    const grid = generateCompleteSudokuGrid();
    
    grid.forEach((row, i) => {
      assert.ok(isValidRow(row), `Row ${i} should contain unique numbers 1-9`);
    });
  });

  test('complete solution should have valid columns', () => {
    const grid = generateCompleteSudokuGrid();
    
    for (let col = 0; col < 9; col++) {
      assert.ok(
        isValidColumn(grid, col),
        `Column ${col} should contain unique numbers 1-9`
      );
    }
  });

  test('complete solution should have valid 3x3 blocks', () => {
    const grid = generateCompleteSudokuGrid();
    
    for (let blockRow = 0; blockRow < 9; blockRow += 3) {
      for (let blockCol = 0; blockCol < 9; blockCol += 3) {
        assert.ok(
          isValidBlock(grid, blockRow, blockCol),
          `Block at [${blockRow}][${blockCol}] should contain unique numbers 1-9`
        );
      }
    }
  });

  test('complete solution should pass all Sudoku rules', () => {
    const grid = generateCompleteSudokuGrid();
    
    // Check all rows
    for (let i = 0; i < 9; i++) {
      assert.ok(isValidRow(grid[i]), `Row ${i} should be valid`);
    }
    
    // Check all columns
    for (let col = 0; col < 9; col++) {
      assert.ok(isValidColumn(grid, col), `Column ${col} should be valid`);
    }
    
    // Check all 3x3 blocks
    for (let blockRow = 0; blockRow < 9; blockRow += 3) {
      for (let blockCol = 0; blockCol < 9; blockCol += 3) {
        assert.ok(
          isValidBlock(grid, blockRow, blockCol),
          `Block at [${blockRow}][${blockCol}] should be valid`
        );
      }
    }
  });
});

// ============================================================================
// PUZZLE VALIDATION TESTS (with empty cells)
// ============================================================================

describe('Puzzle Validation - Filled Cells Only', () => {
  /**
   * Validates filled cells in a row (ignoring zeros)
   * @param {number[]} row - Array of numbers including zeros
   * @returns {boolean} True if no duplicate non-zero numbers
   */
  function isValidPuzzleRow(row) {
    const seen = new Set();
    for (const num of row) {
      if (num === 0) continue; // Skip empty cells
      if (num < 1 || num > 9 || seen.has(num)) {
        return false;
      }
      seen.add(num);
    }
    return true;
  }

  test('puzzle should have no duplicate numbers in filled cells (rows)', () => {
    const grid = generateSudokuGrid();
    
    grid.forEach((row, i) => {
      assert.ok(
        isValidPuzzleRow(row),
        `Row ${i} should have no duplicate filled numbers`
      );
    });
  });

  test('puzzle should have no duplicate numbers in filled cells (columns)', () => {
    const grid = generateSudokuGrid();
    
    for (let col = 0; col < 9; col++) {
      const column = grid.map(row => row[col]);
      assert.ok(
        isValidPuzzleRow(column),
        `Column ${col} should have no duplicate filled numbers`
      );
    }
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  test('should generate a puzzle in reasonable time', () => {
    const start = performance.now();
    generateSudokuGrid();
    const end = performance.now();
    const duration = end - start;
    
    assert.ok(duration < 1000, `Generation should take < 1s, took ${duration.toFixed(2)}ms`);
  });

  test('should generate a complete solution in reasonable time', () => {
    const start = performance.now();
    generateCompleteSudokuGrid();
    const end = performance.now();
    const duration = end - start;
    
    assert.ok(duration < 1000, `Generation should take < 1s, took ${duration.toFixed(2)}ms`);
  });

  test('should generate 10 puzzles consistently', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10; i++) {
      const grid = generateSudokuGrid();
      assert.equal(grid.length, 9, 'Each puzzle should be valid');
    }
    
    const end = performance.now();
    const duration = end - start;
    const avgTime = duration / 10;
    
    assert.ok(
      avgTime < 200,
      `Average generation time should be < 200ms, got ${avgTime.toFixed(2)}ms`
    );
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  test('should not throw errors during puzzle generation', () => {
    assert.doesNotThrow(() => {
      generateSudokuGrid();
    }, 'Should not throw any errors');
  });

  test('should not throw errors during complete solution generation', () => {
    assert.doesNotThrow(() => {
      generateCompleteSudokuGrid();
    }, 'Should not throw any errors');
  });

  test('should handle multiple sequential puzzle generations', () => {
    const grids = [];
    
    for (let i = 0; i < 5; i++) {
      const grid = generateSudokuGrid();
      assert.equal(grid.length, 9, `Puzzle ${i} should be valid`);
      grids.push(JSON.stringify(grid));
    }
    
    // All grids should be unique
    const uniqueGrids = new Set(grids);
    assert.equal(
      uniqueGrids.size,
      5,
      'All generated puzzles should be unique'
    );
  });

  test('should handle multiple sequential solution generations', () => {
    const grids = [];
    
    for (let i = 0; i < 5; i++) {
      const grid = generateCompleteSudokuGrid();
      assert.equal(grid.length, 9, `Solution ${i} should be valid`);
      grids.push(JSON.stringify(grid));
    }
    
    // All grids should be unique
    const uniqueGrids = new Set(grids);
    assert.equal(
      uniqueGrids.size,
      5,
      'All generated solutions should be unique'
    );
  });
});
