# Tests Documentation

## Running Tests

```bash
npm test
```

## Test Coverage

### Puzzle Generation Tests (with empty cells)
- ✅ Validates 9x9 grid dimensions
- ✅ Ensures cells contain numbers 0-9 (0 = empty)
- ✅ Verifies puzzles have empty cells
- ✅ Confirms columns 0, 3, 6 are never empty
- ✅ Checks randomization (different puzzles each call)

### Complete Solution Tests (no empty cells)
- ✅ Validates 9x9 grid dimensions
- ✅ Ensures all cells contain numbers 1-9
- ✅ Verifies no empty cells (0) exist
- ✅ Checks randomization (different solutions each call)

### Metadata Tests
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

## Test Results

```
✓ 25 tests passed
✓ 7 test suites
✓ 0 failures
```

## Functions Tested

- `generateSudokuGrid()` - Generates puzzles with empty cells
- `generateCompleteSudokuGrid()` - Generates complete solutions
- `generateSudokuGridWithMetadata()` - Generates with metadata

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
