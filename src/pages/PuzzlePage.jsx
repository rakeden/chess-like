import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameContext, GAME_PHASES } from '@/lib/game-context';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Board from '@/components/game/Board';
import ThreeDPieceSelection from '@/components/game/ThreeDPieceSelection';
import { PlayerTurnCard } from '@/components/game/PlayerTurnCard';
import { PreparationTimer } from '@/components/game/PreparationTimer';
import { GamePhaseIndicator } from '@/components/game/GamePhaseIndicator';
import stockfishUtils from '@/lib/stockfish-utils';
import { getPuzzleById } from '@/lib/puzzles';

export default function PuzzlePage() {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const { 
    gamePhase, 
    GAME_PHASES, 
    playerColor,
    currentTurn,
    pieces,
    opponentPieces,
    board,
    startPuzzle,
    resetGame,
    setIsWhitesTurn,
    setGamePhase,
    syncBoardWithFen,
    fen
  } = useGameContext();
  
  const [currentFEN, setCurrentFEN] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFEN, setShowFEN] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);
  const controlsRef = useRef(null);
  
  // Load the puzzle when component mounts or puzzleId changes
  useEffect(() => {
    if (puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      if (puzzle) {
        setPuzzleData(puzzle);
        startPuzzle(puzzle);
      } else {
        console.error(`Puzzle with ID ${puzzleId} not found`);
        navigate('/puzzles');
      }
    }
  }, [puzzleId, startPuzzle, navigate]);
  
  // Generate and update FEN when the board changes
  useEffect(() => {
    if (board && pieces) {
      const fen = stockfishUtils.boardToFEN(
        board, 
        pieces, 
        opponentPieces, 
        playerColor === 'white' ? 'w' : 'b'
      );
      setCurrentFEN(fen);
    }
  }, [board, pieces, opponentPieces, playerColor]);
  
  // Copy FEN to clipboard
  const copyFEN = () => {
    navigator.clipboard.writeText(currentFEN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Handle game over or returning to puzzle selection
  const handleBackToPuzzles = () => {
    resetGame();
    navigate('/puzzles');
  };

  // Handle game over view
  if (gamePhase === GAME_PHASES.GAME_OVER) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="bg-card p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold mb-4">Game Over</h2>
          <p className="mb-4">The puzzle has ended.</p>
          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => {
                if (puzzleData) {
                  startPuzzle(puzzleData);
                }
              }}
            >
              Try Again
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="w-full"
              onClick={handleBackToPuzzles}
            >
              Back to Puzzles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      {/* Display player's turn if in playing phase, otherwise preparation timer */}
      {gamePhase === GAME_PHASES.PLAYING ? (
        <PlayerTurnCard />
      ) : (
        <PreparationTimer />
      )}
      
      {/* Game phase indicator */}
      <GamePhaseIndicator />
      
      {/* Show a game status message */}
      {gamePhase === GAME_PHASES.PLAYING && currentTurn !== playerColor && (
        <div className="absolute top-20 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
          Opponent's turn
        </div>
      )}
      
      {/* FEN notation button in preparation phase */}
      {gamePhase === GAME_PHASES.PREPARATION && (
        <div className="absolute top-20 right-4 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm"
                variant="outline"
                className="h-8 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setShowFEN(!showFEN)}
              >
                {showFEN ? 'Hide FEN' : 'Show FEN'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show/hide the FEN notation</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Only show FEN when button is clicked */}
          {showFEN && (
            <div className="mt-2 bg-black/50 text-white p-2 rounded-md flex items-center">
              <div className="mr-2 font-mono text-xs truncate max-w-[250px]">
                {currentFEN}
              </div>
              <Button 
                size="sm"
                variant="ghost"
                className="h-6 ml-auto text-xs"
                onClick={copyFEN}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Back to puzzles button */}
      <div className="absolute top-20 left-4 z-10">
        <Button 
          size="sm"
          variant="outline"
          className="h-8 bg-black/50 text-white hover:bg-black/70"
          onClick={handleBackToPuzzles}
        >
          Back to Puzzles
        </Button>
      </div>
      
      {/* Set a padding-bottom to make space for the piece selection card */}
      <div className="w-full h-full pb-24">
        <Canvas 
          camera={{ 
            position: [0, 4, 8], 
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          shadows
        >
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableRotate={!isDraggingPiece}
            enableZoom={!isDraggingPiece}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={6}
            maxDistance={12}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            // Limit horizontal rotation
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            // Target point (center of the board)
            target={[0, 0, 0]}
          />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          
          {/* Move the board up by adjusting its position */}
          <group position={[0, 0, 0]}>
            <Board />
          </group>
          
          {/* Position the piece selection at the bottom with a clear separation */}
          {gamePhase === GAME_PHASES.PREPARATION && (
            <group position={[0, 0.4, 6]}>
              <ThreeDPieceSelection onDragStart={() => setIsDraggingPiece(true)} onDragEnd={() => setIsDraggingPiece(false)} />
            </group>
          )}
        </Canvas>
      </div>
    </div>
  );
} 