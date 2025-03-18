import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Define piece values
export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0 // King has no point value as it's required
};

// Game phases
export const GAME_PHASES = {
  MENU: 'menu',
  PREPARATION: 'preparation',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver'
};

// Initial board state - 5x5 empty board
const createEmptyBoard = () => {
  const board = [];
  for (let i = 0; i < 5; i++) {
    board[i] = [];
    for (let j = 0; j < 5; j++) {
      board[i][j] = null;
    }
  }
  return board;
};

// Example puzzle with predefined opponent pieces
const examplePuzzle = {
  opponentPieces: [
    { id: 'rook-0-0-black', position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
    { id: 'king-0-2-black', position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
    { id: 'rook-0-4-black', position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
    { id: 'pawn-1-1-black', position: { row: 1, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
    { id: 'pawn-1-2-black', position: { row: 1, col: 2 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
    { id: 'pawn-1-3-black', position: { row: 1, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn }
  ],
  difficulty: 1,
  maxPlayerValue: 15
};

const GameContext = createContext()

export function GameProvider({ children }) {
  console.log("GameProvider initializing");
  
  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.MENU);
  const [stage, setStage] = useState(1);
  const [board, setBoard] = useState(createEmptyBoard());
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [opponentPieces, setOpponentPieces] = useState(examplePuzzle.opponentPieces);
  const [playerColor, setPlayerColor] = useState('white');
  const [currentTurn, setCurrentTurn] = useState('white');
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  
  // Generate available pieces based on player color
  const generatePieces = useCallback((color) => [
    { id: `king-1-${color}`, type: 'king', color, value: PIECE_VALUES.king },
    { id: `queen-1-${color}`, type: 'queen', color, value: PIECE_VALUES.queen },
    { id: `rook-1-${color}`, type: 'rook', color, value: PIECE_VALUES.rook },
    { id: `rook-2-${color}`, type: 'rook', color, value: PIECE_VALUES.rook },
    { id: `bishop-1-${color}`, type: 'bishop', color, value: PIECE_VALUES.bishop },
    { id: `bishop-2-${color}`, type: 'bishop', color, value: PIECE_VALUES.bishop },
    { id: `knight-1-${color}`, type: 'knight', color, value: PIECE_VALUES.knight },
    { id: `knight-2-${color}`, type: 'knight', color, value: PIECE_VALUES.knight },
    { id: `pawn-1-${color}`, type: 'pawn', color, value: PIECE_VALUES.pawn },
    { id: `pawn-2-${color}`, type: 'pawn', color, value: PIECE_VALUES.pawn },
    { id: `pawn-3-${color}`, type: 'pawn', color, value: PIECE_VALUES.pawn },
    { id: `pawn-4-${color}`, type: 'pawn', color, value: PIECE_VALUES.pawn },
    { id: `pawn-5-${color}`, type: 'pawn', color, value: PIECE_VALUES.pawn },
  ], []);
  
  const [availablePieces, setAvailablePieces] = useState(() => generatePieces('white'));
  
  // Stage-specific piece value constraint
  const maxStageValues = {
    1: 15, // Stage 1: Max 15 points
    2: 20, // Stage 2: Max 20 points
    3: 25, // Stage 3: Max 25 points
  }
  
  const currentMaxValue = currentPuzzle?.maxPlayerValue || maxStageValues[stage] || maxStageValues[1]
  
  // Calculate total value of selected pieces
  const selectedPiecesValue = selectedPieces.reduce((sum, piece) => sum + piece.value, 0)
  
  // Set player color and reset game with new colored pieces
  const setPlayerTurn = (color) => {
    setPlayerColor(color);
    resetGame(color);
  }

  // Preparation phase timer
  useEffect(() => {
    let timer;
    if (timerActive && gamePhase === GAME_PHASES.PREPARATION && preparationTimeLeft > 0) {
      timer = setInterval(() => {
        setPreparationTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (preparationTimeLeft === 0 && gamePhase === GAME_PHASES.PREPARATION) {
      // Time's up - transition to playing phase
      setGamePhase(GAME_PHASES.PLAYING);
      setCurrentTurn(playerColor === 'white' ? 'white' : 'black'); // Player with white goes first
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, preparationTimeLeft, gamePhase, playerColor]);
  
  // Start a new puzzle game
  const startPuzzle = useCallback((puzzleData = examplePuzzle) => {
    console.log("Starting puzzle with data:", puzzleData);
    
    // Reset the board
    const newBoard = createEmptyBoard();
    
    // Set the player color (default to white for puzzles)
    const color = 'white';
    setPlayerColor(color);
    
    // Store opponent pieces directly in state
    setOpponentPieces(puzzleData.opponentPieces || []);
    
    console.log("Setting opponent pieces:", puzzleData.opponentPieces);
    
    // Place opponent pieces on the board
    puzzleData.opponentPieces.forEach(piece => {
      const { position, type, color } = piece;
      const pieceId = piece.id || `${type}-${position.row}-${position.col}-${color}`;
      newBoard[position.row][position.col] = { 
        id: pieceId, 
        type, 
        color, 
        value: PIECE_VALUES[type] || 0 
      };
    });
    
    // Set up the board with opponent pieces
    setBoard(newBoard);
    
    // Reset player's pieces
    setPieces([]);
    setSelectedPieces([]);
    setAvailablePieces(generatePieces(color));
    
    // Set the current puzzle
    setCurrentPuzzle(puzzleData);
    
    // Start preparation phase
    setGamePhase(GAME_PHASES.PREPARATION);
    setPreparationTimeLeft(60); // Reset to 60 seconds
    setTimerActive(true);
  }, []);
  
  // Finish preparation and start the game
  const finishPreparation = () => {
    if (gamePhase === GAME_PHASES.PREPARATION) {
      setTimerActive(false);
      setGamePhase(GAME_PHASES.PLAYING);
      setCurrentTurn(playerColor === 'white' ? 'white' : 'black');
    }
  };
  
  // Place a piece on the board
  const placePiece = (pieceId, position) => {
    if (!pieceId || !position) {
      console.warn("placePiece called with invalid pieceId or position", { pieceId, position });
      return;
    }
    
    const { row, col } = position;
    
    // Validate row and col
    if (row === undefined || col === undefined || row < 0 || row >= 5 || col < 0 || col >= 5) {
      console.warn("placePiece called with out-of-bounds position", { row, col });
      return;
    }
    
    // Only allow placement in preparation phase or if it's player's turn in playing phase
    if (gamePhase !== GAME_PHASES.PREPARATION && 
        (gamePhase !== GAME_PHASES.PLAYING || currentTurn !== playerColor)) {
      console.warn("placePiece: Not allowed in current game phase or turn", { gamePhase, currentTurn, playerColor });
      return;
    }
    
    try {
      // Don't allow placing on a cell that already has a piece
      if (board[row][col] !== null) {
        console.warn("placePiece: Cell already occupied", { row, col, occupiedBy: board[row][col] });
        return;
      }
      
      // Copy the current board
      const newBoard = JSON.parse(JSON.stringify(board));
      
      // Find the piece in available or selected pieces
      const piece = availablePieces.find(p => p.id === pieceId) || 
                   selectedPieces.find(p => p.id === pieceId);
      
      if (!piece) {
        console.warn("placePiece: Piece not found", { pieceId });
        return;
      }
      
      console.log("Placing piece", { piece, position });
      
      // Remove from available pieces if it's there
      if (availablePieces.some(p => p.id === pieceId)) {
        setAvailablePieces(availablePieces.filter(p => p.id !== pieceId));
        setSelectedPieces([...selectedPieces, piece]);
      }
      
      // Add piece to player's pieces array with position
      const updatedPiece = { ...piece, position: { row, col } };
      setPieces(currentPieces => [...currentPieces.filter(p => p.id !== piece.id), updatedPiece]);
      
      // Place on board
      newBoard[row][col] = piece;
      setBoard(newBoard);
    } catch (error) {
      console.error("Error in placePiece:", error);
    }
  }
  
  // Remove a piece from the board
  const removePiece = (position) => {
    if (!position) {
      console.warn("removePiece called with invalid position", { position });
      return;
    }
    
    const { row, col } = position;
    
    // Validate row and col
    if (row === undefined || col === undefined || row < 0 || row >= 5 || col < 0 || col >= 5) {
      console.warn("removePiece called with out-of-bounds position", { row, col });
      return;
    }
    
    // Only allow removal in preparation phase or if it's player's turn in playing phase
    if (gamePhase !== GAME_PHASES.PREPARATION && 
        (gamePhase !== GAME_PHASES.PLAYING || currentTurn !== playerColor)) {
      console.warn("removePiece: Not allowed in current game phase or turn", { gamePhase, currentTurn, playerColor });
      return;
    }
    
    try {
      // Copy the current board
      const newBoard = JSON.parse(JSON.stringify(board));
      
      const piece = newBoard[row][col];
      if (!piece) {
        console.warn("removePiece: No piece at position", { row, col });
        return;
      }
      
      // Only allow removing player's own pieces
      if (piece.color !== playerColor) {
        console.warn("removePiece: Cannot remove opponent's piece", { pieceColor: piece.color, playerColor });
        return;
      }
      
      console.log("Removing piece", { piece, position });
      
      // Remove from board
      newBoard[row][col] = null;
      setBoard(newBoard);
      
      // Remove from player's pieces array
      setPieces(currentPieces => currentPieces.filter(p => 
        !p.position || p.position.row !== row || p.position.col !== col
      ));
      
      // Return to available pieces
      setSelectedPieces(selectedPieces.filter(p => p.id !== piece.id));
      setAvailablePieces([...availablePieces, piece]);
    } catch (error) {
      console.error("Error in removePiece:", error);
    }
  }
  
  // Make a move (from one position to another)
  const movePiece = (fromPosition, toPosition) => {
    if (!fromPosition || !toPosition) return;
    
    // Only allow moves in playing phase and if it's player's turn
    if (gamePhase !== GAME_PHASES.PLAYING || currentTurn !== playerColor) {
      return;
    }
    
    const { row: fromRow, col: fromCol } = fromPosition;
    const { row: toRow, col: toCol } = toPosition;
    
    // Copy the current board
    const newBoard = [...board];
    
    const piece = newBoard[fromRow][fromCol];
    
    // Check if there's a piece to move and it belongs to the current player
    if (!piece || piece.color !== playerColor) return;
    
    // Check if the destination is empty or has an opponent's piece
    const targetPiece = newBoard[toRow][toCol];
    if (targetPiece && targetPiece.color === playerColor) return;
    
    // Capture logic would go here
    if (targetPiece) {
      // It's an opponent's piece - capture it
      console.log(`Captured ${targetPiece.type}`);
    }
    
    // Move the piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    setBoard(newBoard);
    
    // Update the pieces array with the new position
    setPieces(currentPieces => {
      const updatedPieces = currentPieces.map(p => {
        if (p.position && p.position.row === fromRow && p.position.col === fromCol) {
          return { ...p, position: { row: toRow, col: toCol } };
        }
        return p;
      });
      return updatedPieces;
    });
    
    // Switch turns
    setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
  };
  
  // Reset the game state with a specific color
  const resetGame = (color = playerColor) => {
    setBoard(createEmptyBoard())
    setSelectedPieces([])
    setPieces([])
    setOpponentPieces([])
    setAvailablePieces(generatePieces(color))
    setCurrentPuzzle(null)
    setGamePhase(GAME_PHASES.MENU)
    setPreparationTimeLeft(60)
    setTimerActive(false)
    setCurrentTurn('white')
  }

  return (
    <GameContext.Provider value={{
      stage,
      setStage,
      board,
      availablePieces,
      selectedPieces,
      selectedPiecesValue,
      currentMaxValue,
      playerColor,
      setPlayerTurn,
      placePiece,
      removePiece,
      movePiece,
      resetGame,
      gamePhase,
      setGamePhase,
      preparationTimeLeft,
      timerActive,
      setTimerActive,
      currentTurn, 
      startPuzzle,
      finishPreparation,
      GAME_PHASES,
      pieces,
      opponentPieces,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameContext() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
} 