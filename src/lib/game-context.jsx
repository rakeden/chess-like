import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculatePieceValue } from './piece-utils';
import { toast } from 'sonner';

// Define piece values
export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0 // King has no point value as it's required
};

// Define game phases
export const GAME_PHASES = {
  MENU: 'menu',
  PREPARATION: 'preparation',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
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

// Example pre-defined positions for opponent (for puzzles)
const OPPONENT_POSITIONS = {
  puzzle1: [
    { id: 'king-1-black', type: 'king', color: 'black', position: { row: 0, col: 2 } },
    { id: 'queen-1-black', type: 'queen', color: 'black', position: { row: 0, col: 1 } },
    { id: 'rook-1-black', type: 'rook', color: 'black', position: { row: 0, col: 0 } },
    { id: 'rook-2-black', type: 'rook', color: 'black', position: { row: 0, col: 4 } },
    { id: 'pawn-1-black', type: 'pawn', color: 'black', position: { row: 1, col: 0 } },
    { id: 'pawn-2-black', type: 'pawn', color: 'black', position: { row: 1, col: 1 } },
    { id: 'pawn-3-black', type: 'pawn', color: 'black', position: { row: 1, col: 2 } },
    { id: 'pawn-4-black', type: 'pawn', color: 'black', position: { row: 1, col: 3 } },
    { id: 'pawn-5-black', type: 'pawn', color: 'black', position: { row: 1, col: 4 } },
  ]
};

// Creating the context
const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export function GameProvider({ children }) {
  // Game phase state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.MENU);
  
  // Player turn state (white/black)
  const [playerColor, setPlayerColor] = useState('white');
  
  // Point system
  const [pointLimit, setPointLimit] = useState(39); // Default points limit
  const [selectedPieces, setSelectedPieces] = useState({});
  
  // Board state
  const [boardState, setBoardState] = useState({});
  
  // Preparation timer (in seconds)
  const [preparationTime, setPreparationTime] = useState(180); // 3 minutes
  const [remainingTime, setRemainingTime] = useState(preparationTime);
  const [timerActive, setTimerActive] = useState(false);
  
  // Puzzle mode
  const [isPuzzleMode, setIsPuzzleMode] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  
  // Calculate used points
  const usedPoints = Object.values(selectedPieces).reduce((total, piece) => {
    return total + calculatePieceValue(piece.type);
  }, 0);
  
  // Check if king is placed
  const hasKing = Object.values(selectedPieces).some(piece => piece.type === 'king');
  
  // Start a new game
  const startNewGame = useCallback((puzzleMode = false) => {
    // Reset the game state
    setBoardState({});
    setSelectedPieces({});
    setRemainingTime(preparationTime);
    
    // Randomly assign player color
    const randomColor = Math.random() > 0.5 ? 'white' : 'black';
    setPlayerColor(randomColor);
    
    // Set puzzle mode
    setIsPuzzleMode(puzzleMode);
    
    // If puzzle mode, load puzzle data
    if (puzzleMode) {
      // This would be replaced with actual puzzle data
      setPuzzleData({
        // Sample puzzle data
        opponentPieces: {
          'a1': { type: 'rook', color: randomColor === 'white' ? 'black' : 'white' },
          'e1': { type: 'king', color: randomColor === 'white' ? 'black' : 'white' },
          // More pieces would be defined here
        }
      });
    } else {
      setPuzzleData(null);
    }
    
    // Set game phase to preparation
    setGamePhase(GAME_PHASES.PREPARATION);
    
    // Start the timer
    setTimerActive(true);
  }, [preparationTime]);
  
  // Start actual gameplay after preparation
  const startPlaying = useCallback(() => {
    // Check if king is placed
    if (!hasKing) {
      toast.error("You must place your king before starting the game!");
      return;
    }
    
    // Check if points are within limit
    if (usedPoints > pointLimit) {
      toast.error(`You've used ${usedPoints} points, which exceeds the limit of ${pointLimit}!`);
      return;
    }
    
    // Stop timer
    setTimerActive(false);
    
    // Set game phase to playing
    setGamePhase(GAME_PHASES.PLAYING);
    
    toast.success("Game started! Make your first move.");
  }, [hasKing, pointLimit, usedPoints]);
  
  // Skip preparation timer
  const skipPreparationTimer = useCallback(() => {
    setRemainingTime(0);
    setTimerActive(false);
    
    // If king is not placed, we don't start the game yet
    if (!hasKing) {
      toast.warning("Timer skipped. Place your king to start the game.");
    } else if (usedPoints > pointLimit) {
      toast.warning(`Timer skipped. Remove pieces to get under the ${pointLimit} point limit.`);
    } else {
      startPlaying();
    }
  }, [hasKing, pointLimit, usedPoints, startPlaying]);
  
  // Go back to menu
  const goToMenu = useCallback(() => {
    setGamePhase(GAME_PHASES.MENU);
    setTimerActive(false);
  }, []);
  
  // Timer effect
  useEffect(() => {
    let interval;
    
    if (timerActive && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerActive(false);
            
            // Auto-start game if conditions are met
            if (hasKing && usedPoints <= pointLimit) {
              startPlaying();
            } else {
              // Notify why game can't start
              if (!hasKing) {
                toast.error("Time's up! You must place your king before starting the game.");
              } else if (usedPoints > pointLimit) {
                toast.error(`Time's up! You've used ${usedPoints} points, which exceeds the limit of ${pointLimit}.`);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, remainingTime, hasKing, usedPoints, pointLimit, startPlaying]);
  
  // Handle adding a piece to the board
  const addPiece = useCallback((cellId, piece) => {
    setSelectedPieces(prev => ({
      ...prev,
      [cellId]: { ...piece }
    }));
  }, []);
  
  // Handle removing a piece from the board
  const removePiece = useCallback((cellId) => {
    setSelectedPieces(prev => {
      const newPieces = { ...prev };
      delete newPieces[cellId];
      return newPieces;
    });
  }, []);
  
  // Set the player turn
  const setPlayerTurn = useCallback((color) => {
    setPlayerColor(color);
  }, []);
  
  // The context value that will be provided
  const value = {
    gamePhase,
    setGamePhase,
    playerColor,
    setPlayerTurn,
    startNewGame,
    startPlaying,
    skipPreparationTimer,
    goToMenu,
    pointLimit,
    setPointLimit,
    usedPoints,
    hasKing,
    selectedPieces,
    addPiece,
    removePiece,
    boardState,
    setBoardState,
    preparationTime,
    setPreparationTime,
    remainingTime,
    isPuzzleMode,
    puzzleData
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
} 