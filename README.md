# Sudoku Generator

A lightweight Sudoku puzzle generator that creates complete solutions and playable puzzles using a backtracking algorithm. Works in browser and Node.js environments.

[![npm version](https://img.shields.io/npm/v/@luckyfoxdesign/sudoku-generator)](https://www.npmjs.com/package/@luckyfoxdesign/sudoku-generator) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎲 Generates randomized, valid Sudoku puzzles and solutions
- 🧩 Creates playable puzzles with ~50% cells removed
- ⚡ Fast generation using backtracking algorithm
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
import { generateSudokuGrid, generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

// Generate a puzzle (with empty cells marked as 0)
const puzzle = generateSudokuGrid();
console.log(puzzle);
// [[5, 0, 4, 6, 0, 8, 9, 0, 2],
//  [6, 7, 0, 1, 9, 0, 3, 4, 0],
//  ...]

// Generate a complete solution (all cells filled)
const solution = generateCompleteSudokuGrid();
console.log(solution);
// [[5, 3, 4, 6, 7, 8, 9, 1, 2],
//  [6, 7, 2, 1, 9, 5, 3, 4, 8],
//  ...]
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
    // Generate a puzzle
    const puzzle = Sudoku.generateSudokuGrid();
    console.log(puzzle);
    
    // Generate a complete solution
    const solution = Sudoku.generateCompleteSudokuGrid();
    console.log(solution);
  </script>
</body>
</html>
```

### React / Vue / Svelte

```javascript
import { generateSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

function SudokuGame() {
  const [grid, setGrid] = useState(generateSudokuGrid());
  
  return (
    <div>
      {grid.map((row, i) => (
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
import { generateSudokuGrid, generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

const puzzle = generateSudokuGrid();
const solution = generateCompleteSudokuGrid();
```

### Node.js (CommonJS)

```javascript
const { generateSudokuGrid, generateCompleteSudokuGrid } = require('@luckyfoxdesign/sudoku-generator');

const puzzle = generateSudokuGrid();
const solution = generateCompleteSudokuGrid();
```

## API

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

### Cell Removal Strategy

When generating puzzles:
- **~50% of cells** are randomly removed
- **Columns 0, 3, and 6** (first column of each 3×3 block) are **never removed**
- This ensures structural integrity and solvability

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

The generator uses a **backtracking algorithm** to fill the grid:

1. **Generate Complete Solution:**
   - Start with an empty 9×9 grid
   - For each cell (left to right, top to bottom):
     - Try a random number from 1-9
     - Check if it's valid (no duplicates in row, column, or 3×3 block)
     - If valid, move to next cell
     - If no valid number exists, backtrack to previous cell
   - Repeat until the entire grid is filled

2. **Create Puzzle (optional):**
   - Remove approximately 50% of cells randomly
   - Preserve columns 0, 3, and 6 for structure
   - Empty cells are marked as 0

This ensures every generated grid is a complete, valid Sudoku solution, and every puzzle is solvable.

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
import { generateSudokuGrid, generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

const puzzle = generateSudokuGrid();        // For player to solve
const solution = generateCompleteSudokuGrid(); // For validation
```

### Puzzle Books / Print
```javascript
import { generateCompleteSudokuGrid } from '@luckyfoxdesign/sudoku-generator';

// Generate 100 unique puzzles
for (let i = 0; i < 100; i++) {
  const puzzle = generateSudokuGrid();
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
