import { GameLevelConfig, TileItem } from '../types/game';

// Check if a move is valid (tile at tileIdx is adjacent to empty spot at emptyIdx)
export function isValidSlide(tileIdx: number, emptyIdx: number, cols: number, rows?: number): boolean {
  const actualRows = rows || cols;
  const tileRow = Math.floor(tileIdx / cols);
  const tileCol = tileIdx % cols;
  const emptyRow = Math.floor(emptyIdx / cols);
  const emptyCol = emptyIdx % cols;

  const isAdjacentRow = Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol;
  const isAdjacentCol = Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow;

  return isAdjacentRow || isAdjacentCol;
}

// Get all valid tile indices that can slide into empty spot
export function getMovableTileIndices(emptyIdx: number, cols: number, rows?: number): number[] {
  const actualRows = rows || cols;
  const emptyRow = Math.floor(emptyIdx / cols);
  const emptyCol = emptyIdx % cols;
  const valid: number[] = [];

  if (emptyRow > 0) valid.push((emptyRow - 1) * cols + emptyCol); // UP
  if (emptyRow < actualRows - 1) valid.push((emptyRow + 1) * cols + emptyCol); // DOWN
  if (emptyCol > 0) valid.push(emptyRow * cols + (emptyCol - 1)); // LEFT
  if (emptyCol < cols - 1) valid.push(emptyRow * cols + (emptyCol + 1)); // RIGHT

  return valid;
}

// Generate solved board state for level
export function createSolvedBoard(level: GameLevelConfig): TileItem[] {
  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;
  const totalCells = cols * rows;
  const board: TileItem[] = [];

  // Fill target numbers 1..targetNumbersCount first, then empty space or filler numbers
  for (let i = 0; i < totalCells; i++) {
    const tileNum = i < level.targetNumbersCount ? i + 1 : 0; // 0 represents empty cell
    board.push({
      id: `tile-${i}-${tileNum}`,
      value: tileNum,
      correctIndex: tileNum > 0 ? tileNum - 1 : totalCells - 1,
      isTargetNumber: tileNum >= 1 && tileNum <= level.targetNumbersCount,
    });
  }

  return board;
}

// Generate solvable shuffled board by walking random valid moves from solved state
export function generateSolvableBoard(level: GameLevelConfig, shuffleSteps = 60): TileItem[] {
  const board = createSolvedBoard(level);
  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;
  let emptyIdx = board.findIndex((t) => t.value === 0);

  // Perform random slides from solved state to guarantee solvability
  let lastMovedIdx = -1;
  const steps = Math.max(shuffleSteps, cols * rows * 12);

  for (let i = 0; i < steps; i++) {
    const movables = getMovableTileIndices(emptyIdx, cols, rows).filter((idx) => idx !== lastMovedIdx);
    if (movables.length === 0) continue;

    const chosenIdx = movables[Math.floor(Math.random() * movables.length)];
    // Swap chosen tile with empty cell
    [board[chosenIdx], board[emptyIdx]] = [board[emptyIdx], board[chosenIdx]];
    lastMovedIdx = emptyIdx;
    emptyIdx = chosenIdx;
  }

  // If already solved by coincidence, swap one valid move
  if (checkVictoryCondition(board, level.targetNumbersCount)) {
    const movables = getMovableTileIndices(emptyIdx, cols, rows);
    if (movables.length > 0) {
      const chosenIdx = movables[0];
      [board[chosenIdx], board[emptyIdx]] = [board[emptyIdx], board[chosenIdx]];
    }
  }

  return board;
}

// Check if victory condition is satisfied (target numbers 1..K are at indices 0..K-1)
export function checkVictoryCondition(board: TileItem[], targetNumbersCount: number): boolean {
  for (let num = 1; num <= targetNumbersCount; num++) {
    const expectedIndex = num - 1;
    if (board[expectedIndex]?.value !== num) {
      return false;
    }
  }
  return true;
}

// Calculate completion progress percentage (0 - 100%)
export function calculateProgressPercentage(board: TileItem[], targetNumbersCount: number): number {
  let correctlyPlaced = 0;
  for (let num = 1; num <= targetNumbersCount; num++) {
    const expectedIndex = num - 1;
    if (board[expectedIndex]?.value === num) {
      correctlyPlaced++;
    }
  }
  return Math.round((correctlyPlaced / targetNumbersCount) * 100);
}

// Calculate stars earned based on moves and time taken
export function calculateStarsAndScore(
  level: GameLevelConfig,
  moves: number,
  timeSeconds: number
): { stars: number; score: number } {
  // Base score
  const levelBonus = level.id * 1000;
  const timeBonus = Math.max(0, (level.targetTimeSeconds - timeSeconds) * 10);
  const moveBonus = Math.max(0, (level.minMovesFor3Stars * 2 - moves) * 15);

  const score = levelBonus + timeBonus + moveBonus;

  // Stars criteria
  let stars = 1;
  if (moves <= level.minMovesFor3Stars * 1.3 && timeSeconds <= level.targetTimeSeconds * 1.2) {
    stars = 3;
  } else if (moves <= level.minMovesFor3Stars * 2 && timeSeconds <= level.targetTimeSeconds * 2) {
    stars = 2;
  }

  return { stars, score };
}

// Find hint (which tile should be moved next towards target spot)
export function findHintTileIndex(board: TileItem[], level: GameLevelConfig): number | null {
  const emptyIdx = board.findIndex((t) => t.value === 0);
  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;
  const movables = getMovableTileIndices(emptyIdx, cols, rows);

  // Find first target number 1..K that is not in its correct spot
  for (let num = 1; num <= level.targetNumbersCount; num++) {
    const expectedIdx = num - 1;
    if (board[expectedIdx]?.value !== num) {
      // Find where this target number currently is
      const currentIdx = board.findIndex((t) => t.value === num);
      if (currentIdx !== -1) {
        // If currentIdx is already adjacent to empty spot, moving it might be helpful
        if (movables.includes(currentIdx)) {
          return currentIdx;
        }
      }
    }
  }

  // Fallback: pick any movable target tile
  const movableTarget = movables.find((idx) => board[idx].value > 0 && board[idx].value <= level.targetNumbersCount);
  return movableTarget !== undefined ? movableTarget : movables[0] || null;
}

// Parse board string back to TileItem array for multiplayer sync
export function parseBoardString(boardJson: string, level: GameLevelConfig): TileItem[] {
  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;
  const totalCells = cols * rows;

  try {
    const values: number[] = JSON.parse(boardJson);
    return values.map((val, idx) => ({
      id: `tile-mp-${idx}-${val}`,
      value: val,
      correctIndex: val > 0 ? val - 1 : totalCells - 1,
      isTargetNumber: val >= 1 && val <= level.targetNumbersCount,
    }));
  } catch {
    return createSolvedBoard(level);
  }
}
