import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PuzzleEngine, GAME_PHASES, PIECE_VALUES } from './puzzle-engine'

const GameContext = createContext()

export { GAME_PHASES, PIECE_VALUES }  // Re-export these constants
export function GameProvider({ children }) {
  const [gameEngine] = useState(() => new PuzzleEngine());
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [isPreparationPaused, setIsPreparationPaused] = useState(false);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [moveSequence, setMoveSequence] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  
  // Update game state whenever it changes
  const updateGameState = useCallback(() => {
    setGameState(gameEngine.getState());
  }, [gameEngine]);
  
  // Reset game
  const resetGame = useCallback(() => {
    gameEngine.reset();
    setIsPreparationPaused(false);
    setMoveSequence([]);
    setCurrentMoveIndex(0);
    setAnimationInProgress(false);
    updateGameState();
  }, [gameEngine, updateGameState]);
  
  // Start puzzle
  const startPuzzle = useCallback((puzzleData) => {
    try {
      gameEngine.startPuzzle(puzzleData);
      setIsPreparationPaused(false);
      setMoveSequence([]);
      setCurrentMoveIndex(0);
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
      return true;
    }
    return false;
  }, [gameEngine, updateGameState]);
  
  // Finish preparation phase and start animations
  const finishPreparation = useCallback(async () => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      gameEngine.startPlaying();
      updateGameState();
      
      try {
        // Fetch move sequence from API
        // This would be a call to your actual API endpoint
        const moves = await fetchMovesFromAPI(gameEngine.getFEN());
        setMoveSequence(moves);
        setCurrentMoveIndex(0);
        startMoveAnimations();
      } catch (error) {
        console.error('Error fetching moves:', error);
      }
    }
  }, [gameEngine, gameState.gamePhase, updateGameState]);
  
  // Mock function to fetch moves from API - replace with actual implementation
  const fetchMovesFromAPI = async (fen) => {
    // This is a placeholder - implement your actual API call here
    console.log('Fetching moves for FEN:', fen);
    
    // Return mock data for now
    return [
      { from: { row: 0, col: 1 }, to: { row: 2, col: 0 } },
      { from: { row: 4, col: 3 }, to: { row: 3, col: 3 } },
      { from: { row: 2, col: 0 }, to: { row: 4, col: 1 } },
      // Add more moves as needed
    ];
  };
  
  // Function to start the animation sequence
  const startMoveAnimations = useCallback(() => {
    setAnimationInProgress(true);
    setCurrentMoveIndex(0);
  }, []);
  
  // Animation control functions
  const animateNextMove = useCallback(() => {
    if (currentMoveIndex < moveSequence.length) {
      const move = moveSequence[currentMoveIndex];
      
      // Apply move to the game state
      gameEngine.animateMove(move.from, move.to);
      updateGameState();
      
      // Move to next in sequence
      setCurrentMoveIndex(prev => prev + 1);
      
      return true;
    } else {
      // End of animation sequence
      setAnimationInProgress(false);
      gameEngine.gamePhase = GAME_PHASES.GAME_OVER;
      updateGameState();
      return false;
    }
  }, [currentMoveIndex, moveSequence, gameEngine, updateGameState]);
  
  // Pause/resume preparation timer
  const pausePreparation = useCallback(() => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      setIsPreparationPaused(true);
    }
  }, [gameState.gamePhase]);
  
  const resumePreparation = useCallback(() => {
    if (gameState.gamePhase === GAME_PHASES.PREPARATION) {
      setIsPreparationPaused(false);
    }
  }, [gameState.gamePhase]);
  
  // Animate moves at regular intervals during playing phase
  useEffect(() => {
    let animationTimer;
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING && animationInProgress) {
      animationTimer = setTimeout(() => {
        animateNextMove();
      }, 1500); // Delay between move animations (adjust as needed)
    }
    
    return () => {
      if (animationTimer) clearTimeout(animationTimer);
    };
  }, [gameState.gamePhase, animationInProgress, currentMoveIndex, animateNextMove]);

  return (
    <GameContext.Provider value={{
      // Game state
      ...gameState,
      GAME_PHASES,
      PIECE_VALUES,
      isPreparationPaused,
      animationInProgress,
      moveSequence,
      currentMoveIndex,
      
      // Actions
      resetGame,
      startPuzzle,
      placePiece,
      finishPreparation,
      pausePreparation,
      resumePreparation,
      animateNextMove,
      startMoveAnimations
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