import React, { useState, useEffect, useRef } from "react";

// PUBLIC_INTERFACE
/** ClassicMineSweeper Main Container
 * Renders the minefield grid, game status, restart button, flag count, and timer in an aligned, clean layout.
 * Light theme colors: primary (#4CAF50), secondary (#FFC107), accent (#F44336)
 */
function ClassicMineSweeper({
  rows = 9,
  cols = 9,
  minesCount = 10
}) {
  // Game states: 'ready', 'playing', 'won', 'lost'
  const [gameState, setGameState] = useState("ready");
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flags, setFlags] = useState(0);
  const [flaggedCells, setFlaggedCells] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef(null);

  // Runs once at the start or when game resets
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line
  }, []);

  // Timer Effect: only runs while game is "playing"
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setElapsed((secs) => secs + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // PUBLIC_INTERFACE
  function resetGame() {
    const newGrid = generateGrid(rows, cols, minesCount);
    setGrid(newGrid);
    setRevealed(Array(rows).fill().map(() => Array(cols).fill(false)));
    setFlags(0);
    setFlaggedCells(new Set());
    setElapsed(0);
    setGameState("ready");
  }

  // PUBLIC_INTERFACE
  function startGameIfNeeded() {
    if (gameState === "ready") setGameState("playing");
  }

  // PUBLIC_INTERFACE
  function handleCellClick(row, col) {
    if (gameState === "lost" || gameState === "won") return;
    startGameIfNeeded();
    // If flagged, ignore click
    if (flaggedCells.has(flatCellIndex(row, col))) return;
    // If already revealed, ignore
    if (revealed[row][col]) return;
    if (grid[row][col].mine) {
      revealAllMines();
      setGameState("lost");
    } else {
      const newRevealed = revealed.map((arr) => arr.slice());
      floodReveal(row, col, newRevealed);
      setRevealed(newRevealed);
      // Win check
      if (checkWin(newRevealed)) {
        revealAllMines(true);
        setGameState("won");
      }
    }
  }

  // PUBLIC_INTERFACE
  function handleCellRightClick(e, row, col) {
    e.preventDefault();
    if (gameState === "lost" || gameState === "won") return;
    startGameIfNeeded();
    const fIdx = flatCellIndex(row, col);
    const nextFlagged = new Set(flaggedCells);
    const isFlagged = flaggedCells.has(fIdx);

    // Don't allow flagging revealed cells
    if (revealed[row][col]) return;

    if (isFlagged) {
      nextFlagged.delete(fIdx);
      setFlags((x) => x - 1);
    } else if (flags < minesCount) {
      nextFlagged.add(fIdx);
      setFlags((x) => x + 1);
    }
    setFlaggedCells(nextFlagged);
  }

  // Flood reveal for empty cells
  function floodReveal(r, c, revealMap) {
    if (
      r < 0 || r >= rows ||
      c < 0 || c >= cols ||
      revealMap[r][c] ||
      grid[r][c].mine ||
      flaggedCells.has(flatCellIndex(r, c))
    ) {
      return;
    }
    revealMap[r][c] = true;
    if (grid[r][c].adjacent === 0) {
      // Reveal neighbours if empty
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!(dr === 0 && dc === 0)) {
            floodReveal(r + dr, c + dc, revealMap);
          }
        }
      }
    }
  }

  function revealAllMines(win = false) {
    setRevealed((old) =>
      old.map((rowArr, r) =>
        rowArr.map(
          (cell, c) => cell || (grid[r][c].mine && (win || !cell))
        )
      )
    );
  }

  function checkWin(revealMap) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c].mine && !revealMap[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  // Helpers for grid generation and cell referencing
  function flatCellIndex(r, c) {
    return r * cols + c;
  }

  function generateGrid(rows, cols, mines) {
    const total = rows * cols;
    const grid = Array(rows)
      .fill()
      .map(() => Array(cols).fill(null));
    // Place mines
    const cells = Array(total)
      .fill(0)
      .map((_, idx) => idx);
    shuffle(cells);
    for (let i = 0; i < mines; i++) {
      const idx = cells[i];
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      grid[r][c] = { mine: true, adjacent: 0 };
    }
    // Fill non-mines and compute adjacent
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] && grid[r][c].mine) continue;
        let adj = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              grid[nr][nc] &&
              grid[nr][nc].mine
            ) {
              adj++;
            }
          }
        }
        grid[r][c] = { mine: false, adjacent: adj };
      }
    }
    return grid;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function renderStatus() {
    let statusMsg = "";
    if (gameState === "lost") statusMsg = "💥 Game Over!";
    else if (gameState === "won") statusMsg = "🎉 You Win!";
    else if (gameState === "ready") statusMsg = "Click a cell to begin...";
    return (
      <div className={`cms-status ${gameState}`}>
        {statusMsg}
      </div>
    );
  }

  function renderCell(r, c) {
    const cell = grid[r][c];
    const isFlagged = flaggedCells.has(flatCellIndex(r, c));
    const isRevealed = revealed[r][c];
    let cellContent = "";
    let cellClass = "cms-cell";
    if (isRevealed) {
      cellClass += " revealed";
      if (cell.mine) {
        cellContent = <span className="cms-mine">&#128163;</span>;
        cellClass += " mine";
      } else if (cell.adjacent > 0) {
        cellContent = (
          <span className={`cms-num cms-num-${cell.adjacent}`}>
            {cell.adjacent}
          </span>
        );
      }
    } else if (isFlagged) {
      cellContent = <span className="cms-flag">&#9873;</span>;
      cellClass += " flagged";
    }

    return (
      <button
        className={cellClass}
        key={`${r}-${c}`}
        tabIndex={0}
        aria-label={`Cell ${r + 1},${c + 1}${
          isFlagged
            ? " (flagged)"
            : isRevealed && cell.mine
            ? " (mine)"
            : isRevealed && cell.adjacent > 0
            ? ` (${cell.adjacent})`
            : ""
        }`}
        onClick={() => handleCellClick(r, c)}
        onContextMenu={(e) => handleCellRightClick(e, r, c)}
        disabled={gameState === "lost" || gameState === "won"}
      >
        {cellContent}
      </button>
    );
  }

  function renderGrid() {
    if (grid.length === 0) return null;
    return (
      <div
        className="cms-grid"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((_, c) => renderCell(r, c))
        )}
      </div>
    );
  }

  // Visually balanced header bar (not the old 'header') - new layout with timer, flag count, and restart, centered.
  function renderTopBar() {
    return (
      <div className="cms-topbar">
        <div className="cms-topbar-section">
          <span className="cms-flag-icon" title="Flags remaining" />
          <span className="cms-flag-count">{minesCount - flags}</span>
        </div>
        <button
          className="cms-restart-btn"
          onClick={resetGame}
          title="Restart Game"
          aria-label="Restart Game"
        >
          {gameState === "lost"
            ? "😢"
            : gameState === "won"
            ? "😎"
            : "🙂"}{" "}
          Restart
        </button>
        <div className="cms-topbar-section">
          <span className="cms-time-label" title="Time Elapsed">&#9200;</span>
          <span className="cms-time">{elapsed}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-main-container">
      {renderTopBar()}
      {renderStatus()}
      {renderGrid()}
    </div>
  );
}

export default ClassicMineSweeper;
