/**
 * @luckyfoxdesign/sudoku-generator
 * Generates complete, valid 9x9 Sudoku grids using backtracking algorithm
 * 
 * @license MIT
 * @author Lucky Fox Design <luckyfoxinthebox@gmail.com>
 * @see https://github.com/luckyfoxdesign/sudoku-generator
 */

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generates a Sudoku puzzle grid with some cells removed (set to 0).
 * Returns a 2D array where 0 represents an empty cell, and 1-9 are filled cells.
 * Approximately 50% of cells are removed to create a solvable puzzle.
 *
 * @returns {number[][]} A 9x9 array with numbers 0-9 (0 = empty cell)
 *
 * @example
 * const grid = generateSudokuGrid();
 * console.log(grid[0][0]); // 5 or 0 (empty)
 */
export function generateSudokuGrid() {
  const fullGrid = generateSudokuGridWithMetadata();
  return fullGrid.map((row) => row.map((cell) => cell.chosenValue));
}

/**
 * Generates a complete 9x9 Sudoku solution grid without any empty cells.
 * Every cell contains a number from 1-9.
 *
 * @returns {number[][]} A 9x9 array where each cell contains a number from 1-9
 *
 * @example
 * const solution = generateCompleteSudokuGrid();
 * console.log(solution[0][0]); // 5 (always filled)
 */
export function generateCompleteSudokuGrid() {
  const gameGrid = generateEmptyGrid();
  for (let i = 0; i < 81; i++) {
    const currentRow = Math.floor(i / 9);
    const currentCol = i % 9;
    const state = selectValue(currentRow, currentCol, gameGrid);
    if (state === 0) {
      i -= 2;
      if (i < -1) i = -1;
    }
  }
  return gameGrid.map((row) => row.map((cell) => cell.chosenValue));
}

/**
 * Generates a Sudoku puzzle grid with metadata for each cell.
 * Each cell contains the chosen value (or 0 if removed), removed values, and available values set.
 * Useful for advanced Sudoku solving/generation algorithms.
 *
 * @returns {Object[][]} A 9x9 array of cell objects with metadata
 * @property {number} chosenValue - The number in the cell (0 = empty, 1-9 = filled)
 * @property {number[]} removedValues - Values that were tried and rejected during generation
 * @property {Set<number>} gameSet - Set of available values for this cell
 *
 * @example
 * const grid = generateSudokuGridWithMetadata();
 * console.log(grid[0][0].chosenValue); // 5 or 0
 * console.log(grid[0][0].removedValues); // [2, 7]
 */
export function generateSudokuGridWithMetadata() {
  const gameGrid = generateEmptyGrid();
  for (let i = 0; i < 81; i++) {
    const currentRow = Math.floor(i / 9);
    const currentCol = i % 9;
    const state = selectValue(currentRow, currentCol, gameGrid);
    if (state === 0) {
      i -= 2;
      if (i < -1) i = -1;
    }
  }
  removeValuesFromGrid(gameGrid);
  return gameGrid;
}

// ============================================================================
// GRID GENERATION
// ============================================================================

/**
 * Creates an empty 9x9 Sudoku grid with metadata structures.
 * Each cell is initialized with an empty value, no removed values, and a full set of 1-9.
 *
 * @returns {Object[][]} A 9x9 array of initialized cell objects
 */
function generateEmptyGrid() {
  const tempArray = [];
  for (let i = 0; i < 9; i++) {
    tempArray[i] = [];
    for (let j = 0; j < 9; j++) {
      tempArray[i][j] = {
        chosenValue: 0,
        removedValues: [],
        gameSet: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      };
    }
  }
  return tempArray;
}

/**
 * Generates a random boolean value (50% true, 50% false).
 * Used to randomly decide which cells to remove from the puzzle.
 *
 * @returns {boolean} Random true or false
 */
function getRandomBoolean() {
  return Math.random() < 0.5;
}

/**
 * Removes approximately 50% of values from the grid to create a puzzle.
 * Cells in columns 0, 3, and 6 (first column of each 3x3 block) are never removed.
 * This ensures the puzzle maintains some structure and solvability.
 *
 * @param {Object[][]} gameGrid - The complete Sudoku grid with metadata
 */
function removeValuesFromGrid(gameGrid) {
  for (let r = 0; r < gameGrid.length; r++) {
    for (let c = 0; c < gameGrid[r].length; c++) {
      if (getRandomBoolean() && c % 3 !== 0) {
        gameGrid[r][c].chosenValue = 0;
      }
    }
  }
}

/**
 * Selects and places a valid value in the specified cell using backtracking.
 * Tries random values from the cell's available set until a valid placement is found.
 *
 * @param {number} currentRow - Row index (0-8)
 * @param {number} currentCol - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid with metadata
 * @returns {number} 0 if no valid value found (backtrack needed), 1 if successful
 */
function selectValue(currentRow, currentCol, gameGrid) {
  while (true) {
    if (isCellSetEmpty(currentRow, currentCol, gameGrid)) {
      restoreSet(currentRow, currentCol, gameGrid);
      return 0;
    }

    const selectedNumber = getRandomValue(currentRow, currentCol, gameGrid);
    if (
      !isInRow(selectedNumber, currentRow, currentCol, gameGrid) &&
      !isInColumn(selectedNumber, currentRow, currentCol, gameGrid) &&
      !isInBlock(selectedNumber, currentRow, currentCol, gameGrid)
    ) {
      return 1;
    }
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Checks if a value already exists in the same row (before current column).
 *
 * @param {number} currentValue - Value to check (1-9)
 * @param {number} currentRow - Row index (0-8)
 * @param {number} currentCol - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 * @returns {boolean} True if value exists in row, false otherwise
 */
function isInRow(currentValue, currentRow, currentCol, gameGrid) {
  for (let i = 0; i < currentCol; i++) {
    if (gameGrid[currentRow][i].chosenValue === currentValue) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a value already exists in the same column (before current row).
 *
 * @param {number} currentValue - Value to check (1-9)
 * @param {number} currentRow - Row index (0-8)
 * @param {number} currentCol - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 * @returns {boolean} True if value exists in column, false otherwise
 */
function isInColumn(currentValue, currentRow, currentCol, gameGrid) {
  for (let i = 0; i < currentRow; i++) {
    if (gameGrid[i][currentCol].chosenValue === currentValue) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a value already exists in the same 3x3 block (before current position).
 *
 * @param {number} currentValue - Value to check (1-9)
 * @param {number} currentRow - Row index (0-8)
 * @param {number} currentCol - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 * @returns {boolean} True if value exists in block, false otherwise
 */
function isInBlock(currentValue, currentRow, currentCol, gameGrid) {
  const rows = getBlockRange(currentRow);
  const columns = getBlockRange(currentCol);

  for (const r of rows) {
    for (const c of columns) {
      if (r > currentRow || (r === currentRow && c >= currentCol)) {
        continue;
      }
      if (gameGrid[r][c].chosenValue === currentValue) return true;
    }
  }
  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns the 3x3 block range for a given row or column index.
 * Sudoku grids are divided into nine 3x3 blocks.
 *
 * @param {number} value - Row or column index (0-8)
 * @returns {number[]} Array of three indices representing the block range
 *
 * @example
 * getBlockRange(0); // [0, 1, 2]
 * getBlockRange(4); // [3, 4, 5]
 * getBlockRange(8); // [6, 7, 8]
 */
function getBlockRange(value) {
  if (value >= 0 && value <= 2) {
    return [0, 1, 2];
  } else if (value >= 3 && value <= 5) {
    return [3, 4, 5];
  } else {
    return [6, 7, 8];
  }
}

/**
 * Selects a random value from the cell's available set and updates the cell state.
 * Removes the chosen value from the available set and adds it to removed values.
 *
 * @param {number} currentRow - Row index (0-8)
 * @param {number} currentCol - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 * @returns {number} The randomly selected value (1-9)
 */
function getRandomValue(currentRow, currentCol, gameGrid) {
  const values = [...gameGrid[currentRow][currentCol].gameSet];
  const randomIndex = Math.floor(Math.random() * values.length);
  const chosenValue = values[randomIndex];

  gameGrid[currentRow][currentCol].gameSet.delete(chosenValue);
  gameGrid[currentRow][currentCol].removedValues.push(chosenValue);
  gameGrid[currentRow][currentCol].chosenValue = chosenValue;

  return chosenValue;
}

/**
 * Restores the cell's available value set by adding back all removed values.
 * Resets the cell to an empty state for backtracking.
 *
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 */
function restoreSet(row, col, gameGrid) {
  gameGrid[row][col].removedValues.forEach((e) => {
    gameGrid[row][col].gameSet.add(e);
  });
  gameGrid[row][col].removedValues.length = 0;
  gameGrid[row][col].chosenValue = 0;
}

/**
 * Checks if a cell has exhausted all possible values.
 * A cell is empty when all 9 values have been tried and removed.
 *
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {Object[][]} gameGrid - The game grid
 * @returns {boolean} True if cell has no available values left
 */
function isCellSetEmpty(row, col, gameGrid) {
  return (
    gameGrid[row][col].gameSet.size === 0 &&
    gameGrid[row][col].removedValues.length === 9
  );
}
