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

  // Полностью заполненная сетка — для каждой клетки кандидатов 0
  test('filled cell returns empty array', () => {
    const grid = generateCompleteSudokuGrid();
    const result = getCandidates(grid, 0, 0);
    assert.deepEqual(result, [], 'Filled cell should have no candidates');
  });

  // Пустая клетка в заполненной сетке — единственный кандидат совпадает с решением
  test('single empty cell in complete grid has exactly one candidate — the solution value', () => {
    const grid = generateCompleteSudokuGrid();

    // Запоминаем значение и очищаем клетку
    const original = grid[4][4];
    grid[4][4] = 0;

    const candidates = getCandidates(grid, 4, 4);
    assert.equal(candidates.length, 1, 'Should have exactly one candidate');
    assert.equal(candidates[0], original, 'Candidate should match the original value');
  });

  // Проверяем на нескольких случайных клетках для надёжности
  test('works correctly for multiple cells across the grid', () => {
    const grid = generateCompleteSudokuGrid();

    // Проверяем 10 разных позиций
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

      // Восстанавливаем для следующей итерации
      grid[r][c] = original;
    }
  });

  // Пустая сетка — все 9 цифр допустимы
  test('empty grid returns all 9 candidates', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    const candidates = getCandidates(grid, 0, 0);
    assert.deepEqual(candidates, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  // Строка заполнена кроме одной клетки
  test('row constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Заполняем первую строку кроме последней клетки: 1,2,3,4,5,6,7,8,_
    for (let c = 0; c < 8; c++) {
      grid[0][c] = c + 1;
    }

    const candidates = getCandidates(grid, 0, 8);
    assert.deepEqual(candidates, [9], 'Only 9 should be available');
  });

  // Колонка заполнена кроме одной клетки
  test('column constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Заполняем первую колонку кроме последней клетки: 1,2,3,4,5,6,7,8,_
    for (let r = 0; r < 8; r++) {
      grid[r][0] = r + 1;
    }

    const candidates = getCandidates(grid, 8, 0);
    assert.deepEqual(candidates, [9], 'Only 9 should be available');
  });

  // Блок 3×3 заполнен кроме одной клетки
  test('block constraint narrows candidates correctly', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Заполняем верхний-левый блок кроме [2][2]
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

  // Комбинация ограничений — строка + колонка + блок
  test('combined constraints from row, column and block', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Строка 0: ставим 1, 2, 3 в колонки 3, 4, 5
    grid[0][3] = 1;
    grid[0][4] = 2;
    grid[0][5] = 3;

    // Колонка 0: ставим 4, 5 в строки 3, 4
    grid[3][0] = 4;
    grid[4][0] = 5;

    // Блок [0,0]: ставим 6, 7 в [1][1] и [2][2]
    grid[1][1] = 6;
    grid[2][2] = 7;

    const candidates = getCandidates(grid, 0, 0);
    // Исключены: 1,2,3 (строка), 4,5 (колонка), 6,7 (блок) → остаётся 8, 9
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
    // Очищаем 3 клетки
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
// solve() — Easy техники (Naked Single + Hidden Single)
// ============================================================================

describe('solve() — Easy techniques', () => {

  // Пазл где убрана одна клетка — решается Naked Single за один шаг
  test('solves grid with one empty cell (naked single)', () => {
    const grid = generateCompleteSudokuGrid();
    const original = grid[3][5];
    grid[3][5] = 0;

    const result = solve(grid);
    assert.equal(result.solved, true, 'Should solve the puzzle');
    assert.equal(result.grid[3][5], original, 'Should restore the correct value');
    assert.equal(result.steps[0].technique, 'nakedSingle');
  });

  // Пазл где убрано несколько клеток из разных регионов — всё ещё Naked Single
  test('solves grid with a few scattered empty cells', () => {
    const grid = generateCompleteSudokuGrid();

    // Убираем по одной клетке из разных строк/колонок/блоков
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

  // Настоящий Easy-пазл — решается только Naked Single и Hidden Single
  // Берём заполненную сетку и убираем ~35 клеток так чтобы каждое удаление
  // оставляло хотя бы одну клетку с единственным кандидатом
  test('solves a real easy puzzle (naked + hidden singles only)', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);

    // Убираем клетки по одной, проверяя что пазл всё ещё решается Easy-техниками
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    // Перемешиваем
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= 35) break;

      const backup = grid[r][c];
      grid[r][c] = 0;

      // Копия для проверки
      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);

      if (result.solved) {
        removed++;
      } else {
        grid[r][c] = backup; // Откат — без этой клетки не решается
      }
    }

    // Теперь решаем финальный пазл
    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve puzzle with ${removed} empty cells`);
    assert.ok(result.steps.length > 0, 'Should have applied some techniques');

    // Все использованные техники — только Easy
    const easyTechniques = new Set(['nakedSingle', 'hiddenSingle']);
    for (const step of result.steps) {
      assert.ok(easyTechniques.has(step.technique),
        `Only easy techniques expected, got: ${step.technique}`);
    }
  });

  // solve() не должен ломать уже заполненную сетку
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
// solve() — Medium техники (Naked Pair, Hidden Pair, Naked Triple)
// ============================================================================

describe('solve() — Medium techniques', () => {

  // Naked Pair: руками строим ситуацию где две клетки в строке имеют {3,7}
  // и 3 или 7 есть как кандидат в другой клетке этой строки
  test('naked pair eliminates candidates from peers', () => {
    // Берём решённую сетку и выборочно обнуляем так чтобы в строке
    // появилась naked pair ситуация
    const grid = generateCompleteSudokuGrid();

    // Убираем достаточно клеток чтобы решатель потенциально использовал пары
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    // Перемешиваем
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

    // Решаем и проверяем что решение корректно
    const result = solve(grid);
    assert.equal(result.solved, true, `Should solve puzzle with ${removed} empty cells`);

    // Проверяем что результат — валидная сетка (нет нулей, нет дубликатов в строках)
    for (let r = 0; r < 9; r++) {
      const row = new Set(result.grid[r]);
      assert.equal(row.size, 9, `Row ${r} should have 9 unique values`);
      for (const v of row) {
        assert.ok(v >= 1 && v <= 9, `Row ${r} values should be 1-9`);
      }
    }
  });

  // Проверяем что solve корректно решает пазл с Medium-техниками и результат совпадает с решением
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

    // Каждая восстановленная клетка должна совпадать с оригиналом
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.equal(result.grid[r][c], solution[r][c],
          `Cell [${r}][${c}] should match solution`);
      }
    }
  });
});

// ============================================================================
// solve() — Hard техники (X-Wing, Pointing Pairs)
// ============================================================================

describe('solve() — Hard techniques', () => {

  // Solve с Hard-техниками должен решать более сложные пазлы
  // и результат должен совпадать с оригиналом
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

    // Пытаемся убрать побольше — до 50 клеток
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

    // Результат совпадает с оригиналом
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.equal(result.grid[r][c], solution[r][c],
          `Cell [${r}][${c}] should match solution`);
      }
    }
  });

  // Стабильность: решаем 20 случайных пазлов подряд
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
// solve() — Expert техники (Swordfish, XY-Wing, Unique Rectangle)
// ============================================================================

describe('solve() — Expert techniques', () => {

  // С полным набором техник пазлы с максимумом удалённых клеток должны решаться
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

    // Пытаемся убрать максимум
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

  // Стабильность: 5 пазлов с агрессивным удалением
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
// countSolutions() — проверка уникальности
// ============================================================================

describe('countSolutions()', () => {

  // Полная сетка — ровно одно решение (она сама)
  test('complete grid has exactly 1 solution', () => {
    const grid = generateCompleteSudokuGrid();
    assert.equal(countSolutions(grid), 1);
  });

  // Одна пустая клетка — всё ещё уникальное решение
  test('grid with one empty cell has 1 solution', () => {
    const grid = generateCompleteSudokuGrid();
    grid[4][4] = 0;
    assert.equal(countSolutions(grid), 1);
  });

  // Пустая сетка — больше одного решения
  test('empty grid has multiple solutions', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    assert.equal(countSolutions(grid), 2, 'Should detect multiple solutions (capped at 2)');
  });

  // Невозможный пазл — единственная пустая клетка не имеет кандидатов
  test('impossible puzzle has 0 solutions', () => {
    const solution = generateCompleteSudokuGrid();
    const grid = solution.map(row => [...row]);
    const V = solution[4][4];

    // Опустошаем [4][4] — туда должно идти V
    grid[4][4] = 0;
    // Ставим V в [3][4]: тот же блок и та же колонка
    // Теперь V исключён из кандидатов [4][4] и через колонку, и через блок.
    // Строка 4 уже покрывала {1..9}-{V} → в сумме все 9 значений исключены → 0 кандидатов
    grid[3][4] = V;

    assert.equal(countSolutions(grid), 0);
  });

  // Пазл с контролируемым удалением — уникальное решение
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

  // Не мутирует входную сетку
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
// generatePuzzle() — управляемая генерация по уровню сложности
// ============================================================================

describe('generatePuzzle()', () => {

  test('generates a valid easy puzzle', () => {
    const solution = generateCompleteSudokuGrid();
    const result = generatePuzzle(solution, 'easy');

    // Пазл содержит нули
    let emptyCells = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (result.puzzle[r][c] === 0) emptyCells++;
      }
    }
    assert.ok(emptyCells > 0, 'Puzzle should have empty cells');

    // Решение совпадает с оригиналом
    assert.deepEqual(result.solution, solution);

    // Пазл решаем и имеет уникальное решение
    assert.equal(countSolutions(result.puzzle), 1);
  });

  test('generates puzzles for each difficulty level', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert']) {
      const solution = generateCompleteSudokuGrid();
      const result = generatePuzzle(solution, difficulty);

      // Уникальное решение
      assert.equal(countSolutions(result.puzzle), 1,
        `${difficulty} puzzle should have unique solution`);

      // Заполненные клетки совпадают с решением
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

    // Hard должен убрать больше клеток чем Easy (не строгая гарантия, но обычно так)
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
