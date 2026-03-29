/**
 * Solver module for Sudoku Generator
 *
 * Техники решения судоку — от простых к продвинутым.
 * Используется для определения сложности пазла и контролируемой генерации.
 *
 * @license MIT
 */

// ============================================================================
// CANDIDATES — фундамент решателя
// ============================================================================

/**
 * Возвращает список допустимых цифр для клетки.
 * Проверяет строку, колонку и блок 3×3 — всё что не занято.
 *
 * @param {number[][]} grid - Сетка 9×9, где 0 = пустая клетка
 * @param {number} row - Строка (0-8)
 * @param {number} col - Колонка (0-8)
 * @returns {number[]} Массив допустимых цифр (1-9)
 */
export function getCandidates(grid, row, col) {
  // Заполненная клетка — кандидатов нет
  if (grid[row][col] !== 0) return [];

  const used = new Set();

  // Строка
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] !== 0) used.add(grid[row][c]);
  }

  // Колонка
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] !== 0) used.add(grid[r][col]);
  }

  // Блок 3×3
  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      if (grid[r][c] !== 0) used.add(grid[r][c]);
    }
  }

  // Всё что не использовано — допустимо
  const candidates = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) candidates.push(n);
  }
  return candidates;
}

// ============================================================================
// КАРТА КАНДИДАТОВ — кандидаты для всей сетки разом
// ============================================================================

/**
 * Строит карту кандидатов для всех пустых клеток сетки.
 * Ключ — "row,col", значение — Set допустимых цифр.
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
 * Убирает кандидата из всех пустых клеток в строке, колонке и блоке 3×3.
 * Вызывается после того как клетка получила значение.
 *
 * @param {Map<string, Set<number>>} candidateMap
 * @param {number} row
 * @param {number} col
 * @param {number} value - Значение, которое нужно убрать из кандидатов соседей
 */
function eliminateFromPeers(candidateMap, row, col, value) {
  // Строка
  for (let c = 0; c < 9; c++) {
    const key = `${row},${c}`;
    const set = candidateMap.get(key);
    if (set) set.delete(value);
  }

  // Колонка
  for (let r = 0; r < 9; r++) {
    const key = `${r},${col}`;
    const set = candidateMap.get(key);
    if (set) set.delete(value);
  }

  // Блок 3×3
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
 * Ставит значение в клетку, убирает её из карты кандидатов
 * и чистит кандидатов у соседей.
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
// ТЕХНИКИ РЕШЕНИЯ — Easy
// ============================================================================

/**
 * Naked Single — в клетке остался ровно один кандидат.
 * Самая простая техника: если у клетки единственный вариант — ставим его.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество поставленных значений за один проход
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
 * Hidden Single — цифра встречается как кандидат только в одной клетке региона.
 * Проверяет строки, колонки и блоки 3×3.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество поставленных значений за один проход
 */
function hiddenSingle(grid, candidateMap) {
  let placed = 0;

  // Проверяем каждый регион: 9 строк, 9 колонок, 9 блоков
  const regions = getAllRegions();

  for (const region of regions) {
    // Для каждой цифры 1-9 ищем: в скольких клетках региона она кандидат?
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

      // Цифра встречается ровно в одной клетке региона — ставим
      if (count === 1) {
        placeValue(grid, candidateMap, found.r, found.c, num);
        placed++;
      }
    }
  }

  return placed;
}

// ============================================================================
// РЕГИОНЫ — строки, колонки, блоки как списки координат
// ============================================================================

/**
 * Возвращает все 27 регионов судоку: 9 строк + 9 колонок + 9 блоков.
 * Каждый регион — массив из 9 пар [row, col].
 *
 * @returns {number[][][]}
 */
function getAllRegions() {
  const regions = [];

  // Строки
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) row.push([r, c]);
    regions.push(row);
  }

  // Колонки
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) col.push([r, c]);
    regions.push(col);
  }

  // Блоки 3×3
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
// ТЕХНИКИ РЕШЕНИЯ — Medium
// ============================================================================

/**
 * Naked Pair — две клетки одного региона имеют одинаковые два кандидата.
 * Эти два числа можно исключить из всех остальных клеток региона.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function nakedPair(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // Собираем клетки региона с ровно 2 кандидатами
    const pairs = [];
    for (const [r, c] of region) {
      const set = candidateMap.get(`${r},${c}`);
      if (set && set.size === 2) {
        pairs.push({ r, c, candidates: set });
      }
    }

    // Ищем две клетки с одинаковыми кандидатами
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = pairs[i];
        const b = pairs[j];

        // Сравниваем множества
        if (a.candidates.size !== b.candidates.size) continue;
        let match = true;
        for (const v of a.candidates) {
          if (!b.candidates.has(v)) { match = false; break; }
        }
        if (!match) continue;

        // Нашли пару — убираем эти числа из остальных клеток региона
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
 * Hidden Pair — две цифры встречаются как кандидаты только в двух одних и тех же клетках региона.
 * Все остальные кандидаты из этих двух клеток можно убрать.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function hiddenPair(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // Для каждой цифры 1-9 собираем в каких клетках региона она кандидат
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

    // Ищем две цифры с одинаковыми позициями
    const nums = [...numPositions.keys()];
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const posA = numPositions.get(nums[i]);
        const posB = numPositions.get(nums[j]);

        if (posA[0] !== posB[0] || posA[1] !== posB[1]) continue;

        // Нашли hidden pair — оставляем только эти две цифры в обеих клетках
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
 * Naked Triple — три клетки одного региона содержат в сумме ровно три кандидата.
 * Каждая клетка имеет 2 или 3 кандидата, объединение = 3 числа.
 * Эти числа исключаются из остальных клеток региона.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function nakedTriple(grid, candidateMap) {
  let eliminated = 0;
  const regions = getAllRegions();

  for (const region of regions) {
    // Клетки с 2 или 3 кандидатами
    const cells = [];
    for (const [r, c] of region) {
      const set = candidateMap.get(`${r},${c}`);
      if (set && set.size >= 2 && set.size <= 3) {
        cells.push({ r, c, candidates: set });
      }
    }

    // Перебираем тройки
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        for (let k = j + 1; k < cells.length; k++) {
          // Объединяем кандидатов трёх клеток
          const union = new Set([
            ...cells[i].candidates,
            ...cells[j].candidates,
            ...cells[k].candidates,
          ]);

          if (union.size !== 3) continue;

          // Нашли тройку — убираем эти числа из остальных клеток
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
// ТЕХНИКИ РЕШЕНИЯ — Hard
// ============================================================================

/**
 * X-Wing — цифра-кандидат в двух строках встречается ровно в двух одинаковых колонках.
 * Можно исключить эту цифру из этих колонок во всех остальных строках.
 * Работает симметрично: проверяем и строки→колонки, и колонки→строки.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function xWing(grid, candidateMap) {
  let eliminated = 0;

  for (let num = 1; num <= 9; num++) {
    // Строки → колонки: ищем строки где num встречается ровно в 2 колонках
    const rowPositions = [];
    for (let r = 0; r < 9; r++) {
      const cols = [];
      for (let c = 0; c < 9; c++) {
        const set = candidateMap.get(`${r},${c}`);
        if (set && set.has(num)) cols.push(c);
      }
      if (cols.length === 2) rowPositions.push({ line: r, positions: cols });
    }

    // Ищем две строки с одинаковыми колонками
    for (let i = 0; i < rowPositions.length; i++) {
      for (let j = i + 1; j < rowPositions.length; j++) {
        const a = rowPositions[i];
        const b = rowPositions[j];
        if (a.positions[0] !== b.positions[0] || a.positions[1] !== b.positions[1]) continue;

        // X-Wing найден — убираем num из этих колонок в остальных строках
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

    // Колонки → строки: ищем колонки где num встречается ровно в 2 строках
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

        // X-Wing найден — убираем num из этих строк в остальных колонках
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
 * Pointing Pairs: если кандидат внутри блока 3×3 сосредоточен только в одной
 * строке или колонке → убираем его из этой строки/колонки за пределами блока.
 *
 * Box-Line Reduction (обратное): если кандидат в строке/колонке встречается
 * только внутри одного блока → убираем его из блока за пределами этой строки/колонки.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function pointingPairs(grid, candidateMap) {
  let eliminated = 0;

  // Pointing Pairs: для каждого блока и каждой цифры
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      for (let num = 1; num <= 9; num++) {
        const rows = new Set();
        const cols = new Set();

        // Где в блоке встречается num как кандидат?
        for (let r = br; r < br + 3; r++) {
          for (let c = bc; c < bc + 3; c++) {
            const set = candidateMap.get(`${r},${c}`);
            if (set && set.has(num)) {
              rows.add(r);
              cols.add(c);
            }
          }
        }

        // Все кандидаты num в одной строке — убираем из строки за пределами блока
        if (rows.size === 1) {
          const row = [...rows][0];
          for (let c = 0; c < 9; c++) {
            if (c >= bc && c < bc + 3) continue; // Пропускаем сам блок
            const set = candidateMap.get(`${row},${c}`);
            if (set && set.has(num)) {
              set.delete(num);
              eliminated++;
            }
          }
        }

        // Все кандидаты num в одной колонке — убираем из колонки за пределами блока
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

  // Box-Line Reduction: для каждой строки и каждой цифры
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const blocks = new Set();
      for (let c = 0; c < 9; c++) {
        const set = candidateMap.get(`${row},${c}`);
        if (set && set.has(num)) {
          blocks.add(Math.floor(c / 3));
        }
      }

      // Все кандидаты num в строке лежат в одном блоке
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

  // Box-Line Reduction: для каждой колонки и каждой цифры
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
// ТЕХНИКИ РЕШЕНИЯ — Expert
// ============================================================================

/**
 * Swordfish — расширение X-Wing на три строки и три колонки.
 * Цифра-кандидат в трёх строках встречается только в 2-3 колонках,
 * и объединение этих колонок = ровно 3.
 * Тогда можно исключить эту цифру из этих колонок во всех остальных строках.
 * Работает симметрично для колонок→строки.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function swordfish(grid, candidateMap) {
  let eliminated = 0;

  for (let num = 1; num <= 9; num++) {
    // Строки → колонки
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

          // Swordfish найден — убираем num из этих колонок в остальных строках
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

    // Колонки → строки
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
 * XY-Wing — три клетки с двумя кандидатами каждая образуют цепочку исключений.
 *
 * Pivot: клетка с кандидатами {X, Y}
 * Wing1: клетка-пир pivot с кандидатами {X, Z}
 * Wing2: клетка-пир pivot с кандидатами {Y, Z}
 *
 * Все клетки которые видят и Wing1, и Wing2 — не могут содержать Z.
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function xyWing(grid, candidateMap) {
  let eliminated = 0;

  // Собираем все клетки с ровно 2 кандидатами
  const biValueCells = [];
  for (const [key, set] of candidateMap) {
    if (set.size === 2) {
      const [r, c] = key.split(',').map(Number);
      biValueCells.push({ r, c, candidates: [...set] });
    }
  }

  for (const pivot of biValueCells) {
    const [x, y] = pivot.candidates;

    // Ищем wing1 (пир pivot, кандидаты {X, Z}) и wing2 (пир pivot, кандидаты {Y, Z})
    const pivotPeers = biValueCells.filter(cell =>
      cell !== pivot && arePeers(pivot.r, pivot.c, cell.r, cell.c)
    );

    for (const wing1 of pivotPeers) {
      // wing1 должен содержать X и не содержать Y
      if (!wing1.candidates.includes(x) || wing1.candidates.includes(y)) continue;
      const z = wing1.candidates[0] === x ? wing1.candidates[1] : wing1.candidates[0];

      for (const wing2 of pivotPeers) {
        if (wing2 === wing1) continue;
        // wing2 должен содержать Y и Z
        if (!wing2.candidates.includes(y) || !wing2.candidates.includes(z)) continue;

        // Нашли XY-Wing. Убираем Z из клеток которые видят и wing1, и wing2
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
 * Проверяет являются ли две клетки пирами (в одной строке, колонке или блоке).
 *
 * @param {number} r1
 * @param {number} c1
 * @param {number} r2
 * @param {number} c2
 * @returns {boolean}
 */
function arePeers(r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) return false;
  // Одна строка
  if (r1 === r2) return true;
  // Одна колонка
  if (c1 === c2) return true;
  // Один блок
  if (Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
      Math.floor(c1 / 3) === Math.floor(c2 / 3)) return true;
  return false;
}

/**
 * Unique Rectangle (Type 1) — использует условие уникальности решения.
 *
 * Если 4 клетки образуют прямоугольник в двух блоках,
 * и 3 из них имеют одинаковые кандидаты {A, B},
 * а 4-я имеет {A, B, ...}, то A и B можно исключить из 4-й клетки.
 * (Иначе у пазла было бы два решения — deadly pattern.)
 *
 * @param {number[][]} grid
 * @param {Map<string, Set<number>>} candidateMap
 * @returns {number} Количество исключённых кандидатов
 */
function uniqueRectangle(grid, candidateMap) {
  let eliminated = 0;

  // Собираем клетки с ровно 2 кандидатами
  const biValueCells = [];
  for (const [key, set] of candidateMap) {
    if (set.size === 2) {
      const [r, c] = key.split(',').map(Number);
      biValueCells.push({ r, c, candidates: [...set].sort((a, b) => a - b) });
    }
  }

  // Ищем пары с одинаковыми кандидатами в одной строке
  for (let i = 0; i < biValueCells.length; i++) {
    for (let j = i + 1; j < biValueCells.length; j++) {
      const a = biValueCells[i];
      const b = biValueCells[j];

      if (a.candidates[0] !== b.candidates[0] || a.candidates[1] !== b.candidates[1]) continue;
      if (a.r !== b.r) continue; // Должны быть в одной строке

      // Колонки должны быть в разных блоках
      if (Math.floor(a.c / 3) === Math.floor(b.c / 3)) continue;

      const [val1, val2] = a.candidates;

      // Ищем ещё две клетки: та же пара колонок, другая строка, тот же набор блоков
      for (let r2 = 0; r2 < 9; r2++) {
        if (r2 === a.r) continue;
        // Строки должны быть в разных блоках
        if (Math.floor(r2 / 3) === Math.floor(a.r / 3)) continue;

        const key1 = `${r2},${a.c}`;
        const key2 = `${r2},${b.c}`;
        const set1 = candidateMap.get(key1);
        const set2 = candidateMap.get(key2);

        if (!set1 || !set2) continue;
        if (!set1.has(val1) || !set1.has(val2)) continue;
        if (!set2.has(val1) || !set2.has(val2)) continue;

        // Type 1: одна из нижних клеток имеет ровно {A, B}, другая имеет больше
        // Из той что имеет больше — убираем A и B
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
// РЕШАТЕЛЬ — цикл техник от простой к сложной
// ============================================================================

/**
 * Техники в порядке применения.
 * name — для логирования и скоринга, fn — сама техника, weight — вес для скоринга.
 * type: 'place' ставит значения, 'eliminate' убирает кандидатов.
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
 * Решает пазл техниками от простой к сложной.
 * При первом прогрессе — начинает заново с простейшей.
 * Останавливается когда пазл решён или ни одна техника не даёт прогресса.
 *
 * Мутирует переданную сетку.
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
        break; // Начинаем заново с простейшей
      }
    }

    // Ни одна техника не дала прогресса — стоп
    if (!progress) break;
  }

  return {
    solved: candidateMap.size === 0,
    steps,
    grid,
  };
}

// ============================================================================
// ПРОВЕРКА УНИКАЛЬНОСТИ — backtracking-решатель
// ============================================================================

/**
 * Считает количество решений пазла через backtracking.
 * Останавливается как только нашёл второе решение — дальше считать не нужно.
 *
 * @param {number[][]} grid - Сетка 9×9 (0 = пустая клетка). Не мутируется.
 * @returns {number} 0 (невалидный), 1 (уникальное), 2 (неоднозначный — 2+)
 */
export function countSolutions(grid) {
  // Работаем с копией
  const g = grid.map(row => [...row]);
  let count = 0;

  function backtrack(pos) {
    if (count >= 2) return; // Досрочный выход

    // Ищем следующую пустую клетку
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
// СКОРИНГ СЛОЖНОСТИ
// ============================================================================

/**
 * Диапазоны скоринга → уровни сложности.
 * Калибруются по результатам реальных тестов.
 */
const DIFFICULTY_RANGES = {
  easy:   { min: 0,  max: 15 },
  medium: { min: 16, max: 40 },
  hard:   { min: 41, max: 80 },
  expert: { min: 81, max: Infinity },
};

/**
 * Считает скор сложности по шагам решения.
 * Скор = сумма (вес техники × количество применений).
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
 * Определяет уровень сложности по скору.
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
// УПРАВЛЯЕМОЕ УДАЛЕНИЕ КЛЕТОК
// ============================================================================

/**
 * Генерирует пазл заданной сложности.
 *
 * Алгоритм:
 * 1. Берёт полностью заполненную сетку (solution)
 * 2. Итеративно убирает по одной клетке
 * 3. После каждого удаления: проверка уникальности + прогон через решатель
 * 4. Если уникальность нарушена или сложность вышла за диапазон → откат
 * 5. Продолжает пока не достигнут целевой скоринг
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

  // Все позиции, перемешанные случайно
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) positions.push([r, c]);
  }
  shuffle(positions);

  const locked = new Set(); // Клетки которые нельзя удалять
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

      // Проверка уникальности
      if (countSolutions(grid) !== 1) {
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      // Прогон через решатель
      const testGrid = grid.map(row => [...row]);
      const result = solve(testGrid);

      if (!result.solved) {
        // Решатель не справился — слишком сложно для текущих техник
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      const score = calculateScore(result.steps);
      const difficulty = getDifficulty(score);

      // Сохраняем лучший результат в целевом диапазоне
      if (score >= range.min && score <= range.max) {
        bestResult = {
          puzzle: grid.map(row => [...row]),
          solution: solution.map(row => [...row]),
          difficulty,
          score,
          steps: result.steps,
        };
      }

      // Перестреляли — скор выше целевого диапазона → откат
      if (score > range.max) {
        grid[r][c] = backup;
        locked.add(key);
        continue;
      }

      found = true;
      break;
    }

    // Ничего не удалось удалить — выход
    if (!found) break;
  }

  // Если не нашли идеальный — берём текущее состояние
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
