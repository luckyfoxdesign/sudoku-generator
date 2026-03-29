# Sudoku Generator

A lightweight Sudoku puzzle generator that creates complete solutions and playable puzzles with controlled difficulty. Works in browser and Node.js environments.

[![npm version](https://img.shields.io/npm/v/@luckyfoxdesign/sudoku-generator)](https://www.npmjs.com/package/@luckyfoxdesign/sudoku-generator) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎲 Generates randomized, valid Sudoku puzzles and solutions
- 🎯 Difficulty-based generation: easy, medium, hard, expert
- 🧩 Creates playable puzzles with controlled cell removal
- ⚡ Fast generation using backtracking + constraint solving
- 🌐 Works in browser and Node.js
- 📦 Zero dependencies
- 🔧 Multiple export formats (ESM, CommonJS, IIFE)
- ✅ Fully tested

## Installation

```bash
npm install @luckyfoxdesign/sudoku-generator
```

## Quick Start

```javascript
import { generateSudoku, generateSudokuGrid, generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

// Generate a puzzle with controlled difficulty
const { puzzle, solution, difficulty, score } = generateSudoku('hard');
console.log(difficulty); // 'hard'
console.log(score);      // 41-80
// puzzle: [[5, 0, 0, 6, 0, 0, 9, 0, 2], ...]  — zeros are empty cells
// solution: [[5, 3, 4, 6, 7, 8, 9, 1, 2], ...] — complete grid

// Or generate a simple puzzle (legacy API)
const simplePuzzle = generateSudokuGrid();
// [[5, 0, 4, 6, 0, 8, 9, 0, 2], ...]
```

## Usage

### Browser (CDN)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sudoku Generator</title>
</head>
<body>
  <script src="https://unpkg.com/@luckyfoxdesign/sudoku-generator/dist/index.global.js"></script>
  <script>
    // Generate a puzzle with difficulty
    const { puzzle, solution, difficulty } = Sudoku.generateSudoku('medium');
    console.log(difficulty); // 'medium'

    // Legacy API still works
    const simplePuzzle = Sudoku.generateSudokuGrid();
  </script>
</body>
</html>
```

### React / Vue / Svelte

```javascript
import { generateSudoku } from '@luckyfoxdesign/sudoku-generator';

function SudokuGame() {
  const [{ puzzle, solution }] = useState(() => generateSudoku('medium'));

  return (
    <div>
      {puzzle.map((row, i) => (
        <div key={i}>
          {row.map((cell, j) => (
            <span key={j}>
              {cell === 0 ? '_' : cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Node.js (ESM)

```javascript
import { generateSudoku, generateSudokuGrid, generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

const { puzzle, solution, difficulty, score } = generateSudoku('expert');
```

### Node.js (CommonJS)

```javascript
const { generateSudoku, generateSudokuGrid, generateCompleteSudokuGrid } = require('@luckyfoxdesign/sudoku-generator');

const { puzzle, solution, difficulty, score } = generateSudoku('hard');
```

## API

### `generateSudoku(difficulty?)`

Generates a Sudoku puzzle with controlled difficulty. Returns both the puzzle and solution together.

**Parameters:**
- `difficulty` — `'easy' | 'medium' | 'hard' | 'expert'` (default: `'easy'`)

**Returns:** `{ puzzle: number[][], solution: number[][], difficulty: string, score: number }`

| Difficulty | Score range | Description |
|------------|-------------|-------------|
| `easy`     | 0–15        | Solved by naked singles only |
| `medium`   | 16–40       | Requires hidden singles |
| `hard`     | 41–80       | Requires more advanced techniques |
| `expert`   | 81+         | Requires complex constraint solving |

**Example:**
```javascript
const { puzzle, solution, difficulty, score } = generateSudoku('hard');
console.log(difficulty); // 'hard'
console.log(score);      // e.g. 57
console.log(puzzle[0]);  // [5, 0, 0, 6, 0, 0, 9, 0, 2]
console.log(solution[0]); // [5, 3, 4, 6, 7, 8, 9, 1, 2]
```

---

### `generateSudokuGrid()`

Generates a playable Sudoku puzzle with some cells removed (marked as 0).
Approximately 50% of cells are removed, with first columns of each 3×3 block always filled.

**Returns:** `number[][]` - A 9×9 2D array where 0 = empty cell, 1-9 = filled cell

**Example:**
```javascript
const puzzle = generateSudokuGrid();
console.log(puzzle[0][0]); // 5 or 0 (empty)
console.log(puzzle[0][3]); // 7 (always filled - column 3 never empty)
```

### `generateCompleteSudokuGrid()`

Generates a complete Sudoku solution with all cells filled (no empty cells).

**Returns:** `number[][]` - A 9×9 2D array where each cell contains a number from 1-9

**Example:**
```javascript
const solution = generateCompleteSudokuGrid();
console.log(solution[0][0]); // 5 (always filled)
```

### `generateSudokuGridWithMetadata()`

Generates a Sudoku puzzle with metadata for each cell. Useful for advanced Sudoku solving/generation algorithms.

**Returns:** `Object[][]` - A 9×9 array of cell objects

**Cell Object Structure:**
```typescript
{
  chosenValue: number;      // The number in cell (0 = empty, 1-9 = filled)
  removedValues: number[];  // Values tried and rejected during generation
  gameSet: Set<number>;     // Available values for this cell
}
```

**Example:**
```javascript
const grid = generateSudokuGridWithMetadata();
console.log(grid[0][0].chosenValue);    // 5 or 0
console.log(grid[0][0].removedValues);  // [2, 7]
```

## Puzzle Generation Details

### Difficulty-based generation (`generateSudoku`)

Puzzles are generated by iteratively removing cells and scoring the result using a constraint-solving engine. The score is determined by the techniques required to solve the puzzle:

- **Naked singles** — only one candidate in a cell (low weight)
- **Hidden singles** — only one cell in a unit can hold a value (medium weight)
- **More advanced techniques** — pointing pairs, naked/hidden subsets, etc. (higher weights)

Cells are removed until the puzzle's score falls within the target difficulty range. If the target cannot be reached within a time limit, the closest available result is returned.

### Legacy cell removal strategy (`generateSudokuGrid`)

When generating puzzles with the legacy API:
- **~50% of cells** are randomly removed
- **Columns 0, 3, and 6** (first column of each 3×3 block) are **never removed**

### Example Grid Structure

```
[5] 0  4  [6] 0  8  [9] 0  2   ← Columns 0,3,6 always filled
[6] 7  0  [1] 9  0  [3] 4  0
[8] 0  9  [5] 0  2  [7] 0  6
[2] 0  0  [8] 0  7  [4] 0  0
...
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/luckyfoxdesign/sudoku-generator.git
cd sudoku-generator

# Install dependencies
npm install

# Build the project
npm run build
```

### Build

```bash
npm run build
```

This creates three files in `dist/`:
- `index.js` - ESM format for React/Vue/Svelte
- `index.cjs` - CommonJS format for Node.js
- `index.global.js` - IIFE format for browser `<script>` tags

### Testing

```bash
npm test
```

Tests cover:
- ✅ Puzzle generation (with empty cells)
- ✅ Difficulty-based generation (all 4 levels)
- ✅ Complete solution generation (no empty cells)
- ✅ Grid structure validation
- ✅ Sudoku rules (rows, columns, 3×3 blocks)
- ✅ Performance benchmarks
- ✅ Edge cases

## Publishing (for maintainers)

### Pre-publish Checklist

1. Run tests:
```bash
npm test
```

2. Build the project:
```bash
npm run build
```

3. Check what will be published:
```bash
npm pack --dry-run
```

### Publishing to NPM

1. Login to NPM:
```bash
npm login
```

2. Publish the package:
```bash
npm publish --access public
```

### Version Updates

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.0 → 1.1.0)
npm version minor

# Major (1.0.0 → 2.0.0)
npm version major

# Then publish
npm publish --access public
```

### Post-publish Verification

Check the package:
- NPM: https://www.npmjs.com/package/@luckyfoxdesign/sudoku-generator
- unpkg CDN: https://unpkg.com/@luckyfoxdesign/sudoku-generator/dist/index.global.js
- jsDelivr CDN: https://cdn.jsdelivr.net/npm/@luckyfoxdesign/sudoku-generator/dist/index.global.js

## How It Works

### Generation Algorithm

1. **Generate Complete Solution:**
   - Uses a backtracking algorithm on an empty 9×9 grid
   - Tries random numbers 1–9 per cell; backtracks on conflicts
   - Produces a guaranteed valid, fully filled solution

2. **Create Puzzle:**
   - **`generateSudoku(difficulty)`** — removes cells one by one, scores the result using a constraint solver, and stops when the score hits the target range
   - **`generateSudokuGrid()`** — removes ~50% of cells randomly, preserving columns 0, 3, and 6

3. **Difficulty Scoring:**
   - The solver applies human-like techniques (naked singles, hidden singles, pointing pairs, etc.)
   - Each technique has a weight; score = sum of (weight × applications)
   - Score determines difficulty: easy (0–15), medium (16–40), hard (41–80), expert (81+)

Every generated puzzle has a unique solution.

## Performance

- Single puzzle generation: **< 100ms**
- Single solution generation: **< 100ms**
- Average generation time: **~50ms**
- Tested up to 10,000+ generations without issues

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Node.js 18+

## Use Cases

### Game Development
```javascript
import { generateSudoku } from '@luckyfoxdesign/sudoku-generator';

// Puzzle and solution in one call, matched by difficulty
const { puzzle, solution, difficulty } = generateSudoku('medium');
// Use puzzle for the board, solution for validation
```

### Puzzle Books / Print
```javascript
import { generateSudoku } from '@luckyfoxdesign/sudoku-generator';

// Generate 100 hard puzzles
for (let i = 0; i < 100; i++) {
  const { puzzle } = generateSudoku('hard');
  printPuzzle(puzzle);
}
```

### Educational Tools
```javascript
import { generateSudokuGridWithMetadata } from '@luckyfoxdesign/sudoku-generator';

// Analyze generation process
const grid = generateSudokuGridWithMetadata();
grid.forEach(row => {
  row.forEach(cell => {
    console.log(`Value: ${cell.chosenValue}, Tried: ${cell.removedValues}`);
  });
});
```

## License

MIT © [Lucky Fox Design](https://luckyfox.design/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Links

- [GitHub Repository](https://github.com/luckyfoxdesign/sudoku-generator)
- [NPM Package](https://www.npmjs.com/package/@luckyfoxdesign/sudoku-generator)
- [Report Issues](https://github.com/luckyfoxdesign/sudoku-generator/issues)

## Author

**Lucky Fox Design**
- Website: https://luckyfox.design/
- Email: luckyfoxinthebox@gmail.com
- NPM: https://www.npmjs.com/~luckyfoxdesign
