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
import { generateSudokuGrid, generateSudokuGridWithMetadata } from '../src/index.js';

// ============================================================================
// BASIC STRUCTURE TESTS
// ============================================================================

describe('generateSudokuGrid()', () => {
  test('should return a 9x9 grid', () => {
    const grid = generateSudokuGrid();
    
    assert.equal(grid.length, 9, 'Grid should have 9 rows');
    grid.forEach((row, i) => {
      assert.equal(row.length, 9, `Row ${i} should have 9 columns`);
    });
  });

  test('should contain only numbers from 1 to 9', () => {
    const grid = generateSudokuGrid();
    
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        assert.ok(
          cell >= 1 && cell <= 9,
          `Cell [${i}][${j}] should be between 1-9, got ${cell}`
        );
      });
    });
  });

  test('should generate different grids on each call', () => {
    const grid1 = generateSudokuGrid();
    const grid2 = generateSudokuGrid();
    
    // Convert to strings for comparison
    const str1 = JSON.stringify(grid1);
    const str2 = JSON.stringify(grid2);
    
    assert.notEqual(str1, str2, 'Each call should generate a unique grid');
  });
});

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

  test('should have valid chosenValues (1-9)', () => {
    const grid = generateSudokuGridWithMetadata();
    
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        assert.ok(
          cell.chosenValue >= 1 && cell.chosenValue <= 9,
          `Cell [${i}][${j}] chosenValue should be between 1-9, got ${cell.chosenValue}`
        );
      });
    });
  });
});

// ============================================================================
// SUDOKU RULES VALIDATION TESTS
// ============================================================================

describe('Sudoku Rules Validation', () => {
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

  test('should have valid rows (no duplicates)', () => {
    const grid = generateSudokuGrid();
    
    grid.forEach((row, i) => {
      assert.ok(isValidRow(row), `Row ${i} should contain unique numbers 1-9`);
    });
  });

  test('should have valid columns (no duplicates)', () => {
    const grid = generateSudokuGrid();
    
    for (let col = 0; col < 9; col++) {
      assert.ok(
        isValidColumn(grid, col),
        `Column ${col} should contain unique numbers 1-9`
      );
    }
  });

  test('should have valid 3x3 blocks (no duplicates)', () => {
    const grid = generateSudokuGrid();
    
    for (let blockRow = 0; blockRow < 9; blockRow += 3) {
      for (let blockCol = 0; blockCol < 9; blockCol += 3) {
        assert.ok(
          isValidBlock(grid, blockRow, blockCol),
          `Block at [${blockRow}][${blockCol}] should contain unique numbers 1-9`
        );
      }
    }
  });

  test('should generate a complete valid Sudoku', () => {
    const grid = generateSudokuGrid();
    
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
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  test('should generate a grid in reasonable time', () => {
    const start = performance.now();
    generateSudokuGrid();
    const end = performance.now();
    const duration = end - start;
    
    assert.ok(duration < 1000, `Generation should take < 1s, took ${duration.toFixed(2)}ms`);
  });

  test('should generate 10 grids consistently', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10; i++) {
      const grid = generateSudokuGrid();
      assert.equal(grid.length, 9, 'Each grid should be valid');
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
  test('should not throw errors during generation', () => {
    assert.doesNotThrow(() => {
      generateSudokuGrid();
    }, 'Should not throw any errors');
  });

  test('should handle multiple sequential generations', () => {
    const grids = [];
    
    for (let i = 0; i < 5; i++) {
      const grid = generateSudokuGrid();
      assert.equal(grid.length, 9, `Grid ${i} should be valid`);
      grids.push(JSON.stringify(grid));
    }
    
    // All grids should be unique
    const uniqueGrids = new Set(grids);
    assert.equal(
      uniqueGrids.size,
      5,
      'All generated grids should be unique'
    );
  });
});
