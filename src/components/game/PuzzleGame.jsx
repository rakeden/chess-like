import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameContext, GAME_PHASES } from '@/lib/game-context'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import Board from './Board'
import ThreeDPieceSelection from './ThreeDPieceSelection'
import { PlayerTurnCard } from './PlayerTurnCard'
import { PreparationTimer } from './PreparationTimer'
import { GamePhaseIndicator } from './GamePhaseIndicator'
import { useDroppable } from '@dnd-kit/core'
import stockfishUtils from '@/lib/stockfish-utils'

// Droppable cell component for the overlay
const DroppableCell = ({ row, col }) => {
  const { setNodeRef } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col }
  })

  return (
    <div 
      ref={setNodeRef}
      style={{
        position: 'absolute',
        width: `${100/5}%`,
        height: `${100/5}%`,
        top: `${(row/5) * 100}%`,
        left: `${(col/5) * 100}%`,
        zIndex: 10,
      }}
    />
  )
}

export default function PuzzleGame({ puzzleData }) {
  const { 
    gamePhase, 
    GAME_PHASES, 
    playerColor,
    currentTurn,
    pieces,
    opponentPieces,
    board
  } = useGameContext();
  
  const [currentFEN, setCurrentFEN] = useState(puzzleData?.fen || '');
  const [copied, setCopied] = useState(false);
  const [showFEN, setShowFEN] = useState(false);
  
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
  
  // Debug logging
  console.log("PuzzleGame rendering:", {
    gamePhase,
    playerColor,
    currentTurn,
    pieces: pieces?.length,
    opponentPieces: opponentPieces?.length,
    puzzleData
  });
  
  // Create droppable cells for the overlay
  const droppableCells = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      droppableCells.push(
        <DroppableCell 
          key={`droppable-${row}-${col}`}
          row={row}
          col={col}
        />
      )
    }
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
      
      {/* Set a padding-bottom to make space for the piece selection card */}
      <div className="w-full h-full pb-24">
        <Canvas camera={{ position: [0, 5, 6], fov: 40 }}>
          <OrbitControls
            enablePan={false}
            enableRotate={true}
            minPolarAngle={Math.PI / 4.5}
            maxPolarAngle={Math.PI / 3.5}
            enableZoom={true}
            minDistance={5}
            maxDistance={10}
            rotateSpeed={0.5}
            // Disable rotation around Y axis (vertical axis)
            minAzimuthAngle={-Math.PI / 36}
            maxAzimuthAngle={Math.PI / 36}
          />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          
          {/* Move the board up by adjusting its position */}
          <group position={[0, 0.5, 0]}>
            <Board />
          </group>
          
          {/* Position the piece selection at the bottom with a clear separation */}
          {gamePhase === GAME_PHASES.PREPARATION && (
            <group position={[0, -2.5, 1]}>
              <ThreeDPieceSelection />
            </group>
          )}
        </Canvas>
        
        {/* Overlay for dnd-kit droppable areas */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {droppableCells}
          </div>
        </div>
      </div>
    </div>
  );
} 