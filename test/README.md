# Tests Documentation

## Running Tests

```bash
npm test
```

## Test Coverage

### `generateSudoku()` — Difficulty-based generation
- ✅ Returns puzzle, solution, difficulty string, and numeric score
- ✅ Defaults to easy difficulty
- ✅ Generates valid puzzles for all difficulty levels (easy, medium, hard, expert)
- ✅ Filled cells in puzzle match corresponding cells in solution
- ✅ Legacy API works alongside new API

### Puzzle Generation Tests (`generateSudokuGrid`)
- ✅ Validates 9x9 grid dimensions
- ✅ Ensures cells contain numbers 0-9 (0 = empty)
- ✅ Verifies puzzles have empty cells
- ✅ Confirms columns 0, 3, 6 are never empty
- ✅ Checks randomization (different puzzles each call)

### Complete Solution Tests (`generateCompleteSudokuGrid`)
- ✅ Validates 9x9 grid dimensions
- ✅ Ensures all cells contain numbers 1-9
- ✅ Verifies no empty cells (0) exist
- ✅ Checks randomization (different solutions each call)

### Metadata Tests (`generateSudokuGridWithMetadata`)
- ✅ Validates metadata object structure
- ✅ Checks chosenValue range (0-9)
- ✅ Verifies empty cells in metadata

### Sudoku Rules Validation (Complete Solutions)
- ✅ **Rows**: Each row contains unique numbers 1-9
- ✅ **Columns**: Each column contains unique numbers 1-9
- ✅ **3x3 Blocks**: Each block contains unique numbers 1-9
- ✅ **Complete validation**: All rules applied together

### Puzzle Validation (with empty cells)
- ✅ **Rows**: No duplicate filled numbers
- ✅ **Columns**: No duplicate filled numbers

### Performance Tests
- ✅ Puzzle generation < 1 second
- ✅ Solution generation < 1 second
- ✅ Average generation time < 200ms
- ✅ Consistent performance across multiple generations

### Edge Cases
- ✅ No errors during puzzle generation
- ✅ No errors during solution generation
- ✅ Handles sequential puzzle generations
- ✅ Handles sequential solution generations

---

### Solver: `getCandidates()`
- ✅ Filled cell returns empty array
- ✅ Single empty cell has exactly one candidate (the solution value)
- ✅ Works correctly for multiple cells across the grid
- ✅ Empty grid returns all 9 candidates
- ✅ Row, column, and block constraints narrow candidates correctly
- ✅ Combined constraints from row, column and block

### Solver: `buildCandidateMap()`
- ✅ Complete grid produces empty map
- ✅ Map keys match empty cells

### Solver: `solve()` — Easy techniques
- ✅ Solves grid with one empty cell (naked single)
- ✅ Solves grid with scattered empty cells
- ✅ Solves real easy puzzles (naked + hidden singles only)
- ✅ Already solved grid returns immediately

### Solver: `solve()` — Medium techniques
- ✅ Naked pair eliminates candidates from peers
- ✅ Solution matches the original complete grid

### Solver: `solve()` — Hard techniques
- ✅ Solves harder puzzles with more empty cells
- ✅ Consistently solves 20 random puzzles

### Solver: `solve()` — Expert techniques
- ✅ Solves puzzles with maximum empty cells
- ✅ Stable across 5 aggressive puzzles

### Solver: `countSolutions()`
- ✅ Complete grid has exactly 1 solution
- ✅ Grid with one empty cell has 1 solution
- ✅ Empty grid has multiple solutions
- ✅ Impossible puzzle has 0 solutions
- ✅ Well-formed puzzle has 1 solution
- ✅ Does not mutate the input grid

### Solver: `calculateScore()` + `getDifficulty()`
- ✅ Empty steps → score 0 → easy
- ✅ Only naked singles → low score → easy
- ✅ Mixed medium techniques → medium score
- ✅ X-wing pushes to hard
- ✅ Expert score
- ✅ Boundary values (15/16, 40/41, 80/81)

### Solver: `generatePuzzle()`
- ✅ Generates a valid easy puzzle
- ✅ Generates puzzles for each difficulty level
- ✅ Harder difficulties have more empty cells on average
- ✅ Does not mutate the input solution

## Test Results

```
✓ 65 tests passed
✓ 17 test suites
✓ 0 failures
```

## Functions Tested

- `generateSudoku(difficulty?)` — Difficulty-based puzzle + solution generation
- `generateSudokuGrid()` — Generates puzzles with empty cells (legacy)
- `generateCompleteSudokuGrid()` — Generates complete solutions
- `generateSudokuGridWithMetadata()` — Generates with cell metadata
- `getCandidates(grid, row, col)` — Returns valid candidates for a cell
- `buildCandidateMap(grid)` — Builds candidate map for all empty cells
- `solve(grid)` — Solves a puzzle using human-like techniques
- `countSolutions(grid)` — Counts the number of valid solutions
- `calculateScore(steps)` — Scores a puzzle by solving technique weights
- `getDifficulty(score)` — Maps score to difficulty label
- `generatePuzzle(solution, difficulty)` — Core difficulty-controlled generation

## Technology

- **Framework**: Node.js built-in test runner (`node:test`)
- **Assertions**: Node.js built-in assert (`node:assert/strict`)
- **No external dependencies** required

## Adding New Tests

1. Create test file in `test/` directory
2. Name it `*.test.js`
3. Import test utilities:
   ```javascript
   import { describe, test } from 'node:test';
   import assert from 'node:assert/strict';
   ```
4. Run `npm test`
