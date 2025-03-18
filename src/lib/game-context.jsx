import { createContext, useContext, useState } from 'react'

// Define piece values
export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0 // King has no point value as it's required
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

const GameContext = createContext()

export function GameProvider({ children }) {
  const [stage, setStage] = useState(1)
  const [board, setBoard] = useState(createEmptyBoard())
  const [selectedPieces, setSelectedPieces] = useState([])
  // Default to white pieces for the player - will be set at game start
  const [playerColor, setPlayerColor] = useState('white')
  
  // Generate available pieces based on player color
  const generatePieces = (color) => [
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
  ]
  
  const [availablePieces, setAvailablePieces] = useState(generatePieces('white'))
  
  // Stage-specific piece value constraint
  const maxStageValues = {
    1: 15, // Stage 1: Max 15 points
    2: 20, // Stage 2: Max 20 points
    3: 25, // Stage 3: Max 25 points
  }
  
  const currentMaxValue = maxStageValues[stage] || maxStageValues[1]
  
  // Calculate total value of selected pieces
  const selectedPiecesValue = selectedPieces.reduce((sum, piece) => sum + piece.value, 0)
  
  // Set player color and reset game with new colored pieces
  const setPlayerTurn = (color) => {
    setPlayerColor(color);
    resetGame(color);
  }
  
  // Place a piece on the board
  const placePiece = (pieceId, position) => {
    if (!pieceId || !position) return
    
    const { row, col } = position
    // Copy the current board
    const newBoard = [...board]
    
    // Find the piece in available or selected pieces
    const piece = availablePieces.find(p => p.id === pieceId) || 
                 selectedPieces.find(p => p.id === pieceId)
    
    if (!piece) return
    
    // Remove from available pieces if it's there
    if (availablePieces.some(p => p.id === pieceId)) {
      setAvailablePieces(availablePieces.filter(p => p.id !== pieceId))
      setSelectedPieces([...selectedPieces, piece])
    }
    
    // Place on board
    newBoard[row][col] = piece
    setBoard(newBoard)
  }
  
  // Remove a piece from the board
  const removePiece = (position) => {
    if (!position) return
    
    const { row, col } = position
    // Copy the current board
    const newBoard = [...board]
    
    const piece = newBoard[row][col]
    if (!piece) return
    
    // Remove from board
    newBoard[row][col] = null
    setBoard(newBoard)
    
    // Return to available pieces
    setSelectedPieces(selectedPieces.filter(p => p.id !== piece.id))
    setAvailablePieces([...availablePieces, piece])
  }
  
  // Reset the game state with a specific color
  const resetGame = (color = playerColor) => {
    setBoard(createEmptyBoard())
    setSelectedPieces([])
    setAvailablePieces(generatePieces(color))
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
      resetGame
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