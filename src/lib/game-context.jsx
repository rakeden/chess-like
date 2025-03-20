import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PuzzleEngine, GAME_PHASES, PIECE_VALUES } from './puzzle-engine'

const GameContext = createContext()

export { GAME_PHASES, PIECE_VALUES }  // Re-export these constants
export function GameProvider({ children }) {
  const [gameEngine] = useState(() => new PuzzleEngine());
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [isPreparationPaused, setIsPreparationPaused] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  
  // Update game state whenever it changes
  const updateGameState = useCallback(() => {
    setGameState(gameEngine.getState());
  }, [gameEngine]);
  
  // Reset game
  const resetGame = useCallback(() => {
    gameEngine.reset();
    setPreparationTimeLeft(60);
    setTimerActive(false);
    setIsPreparationPaused(false);
    setPuzzleSolved(false);
    updateGameState();
  }, [gameEngine, updateGameState]);
  
  // Start puzzle
  const startPuzzle = useCallback((puzzleData) => {
    try {
      gameEngine.startPuzzle(puzzleData);
      setPreparationTimeLeft(60);
      setTimerActive(true);
      setIsPreparationPaused(false);
      setPuzzleSolved(false);
      updateGameState();
    } catch (error) {
      console.error('Error starting puzzle:', error);
      resetGame();
    }
  }, [gameEngine, updateGameState, resetGame]);
  
  // Place piece during preparation
  const placePiece = useCallback((piece, position) => {
    if (gameEngine.placePiece(piece, position)) {
      updateGameState();
    }
  }, [gameEngine, updateGameState]);
  
  // Move piece during gameplay
  const movePiece = useCallback((fromPosition, toPosition) => {
    // Check if this move solves the puzzle
    const isSolution = gameEngine.checkSolution(fromPosition, toPosition);
    
    // Execute the move
    if (gameEngine.movePiece(fromPosition, toPosition)) {
      // If the move is a solution, mark the puzzle as solved
      if (isSolution) {
        setPuzzleSolved(true);
        gameEngine.gamePhase = GAME_PHASES.GAME_OVER;
      }
      
      updateGameState();
      return true;
    }
    return false;
  }, [gameEngine, updateGameState]);
  
  // Finish preparation phase
  const finishPreparation = useCallback(() => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      gameEngine.startPlaying();
      setTimerActive(false);
      updateGameState();
    }
  }, [gameEngine, gameState.gamePhase, updateGameState]);
  
  // Pause/resume preparation timer
  const pausePreparation = useCallback(() => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      setIsPreparationPaused(true);
      setTimerActive(false);
    }
  }, [gameState.gamePhase]);
  
  const resumePreparation = useCallback(() => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      setIsPreparationPaused(false);
      setTimerActive(true);
    }
  }, [gameState.gamePhase]);
  
  // Handle preparation timer
  useEffect(() => {
    let timer;
    if (timerActive && gameState.gamePhase === GAME_PHASES.PREPARATION && preparationTimeLeft > 0 && !isPreparationPaused) {
      timer = setInterval(() => {
        setPreparationTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (preparationTimeLeft === 0 && gameState.gamePhase === GAME_PHASES.PREPARATION) {
      finishPreparation();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, preparationTimeLeft, gameState.gamePhase, isPreparationPaused, finishPreparation]);
  
  // Auto-move opponent pieces in playing phase
  useEffect(() => {
    let timeoutId;
    
    const makeOpponentMove = async () => {
      if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentTurn !== gameState.playerColor) {
        const bestMove = await gameEngine.getBestMove();
        if (bestMove) {
          gameEngine.movePiece(bestMove.from, bestMove.to);
          updateGameState();
        }
      }
    };
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentTurn !== gameState.playerColor) {
      timeoutId = setTimeout(makeOpponentMove, 1000); // Add delay for better UX
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameEngine, gameState, updateGameState]);

  return (
    <GameContext.Provider value={{
      // Game state
      ...gameState,
      GAME_PHASES,
      PIECE_VALUES,
      preparationTimeLeft,
      timerActive,
      isPreparationPaused,
      puzzleSolved,
      
      // Actions
      resetGame,
      startPuzzle,
      placePiece,
      movePiece,
      finishPreparation,
      pausePreparation,
      resumePreparation
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