import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameContext, GAME_PHASES } from '@/lib/game-context'
import Board from './Board'
import ThreeDPieceSelection from './ThreeDPieceSelection'
import { PieceSelection } from './PieceSelection'
import { PlayerTurnCard } from './PlayerTurnCard'
import { PreparationTimer } from './PreparationTimer'
import { GamePhaseIndicator } from './GamePhaseIndicator'
import { useDroppable } from '@dnd-kit/core'

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
    opponentPieces
  } = useGameContext();
  
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
      
      {/* Set a padding-bottom to make space for the piece selection card */}
      <div className="w-full h-full pb-24">
        <Canvas camera={{ position: [0, 5, 5], fov: 50 }}>
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={10}
          />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          <Board />
          
          {/* Add the 3D piece selection component during preparation phase */}
          {gamePhase === GAME_PHASES.PREPARATION && <ThreeDPieceSelection />}
        </Canvas>
        
        {/* Overlay for dnd-kit droppable areas */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {droppableCells}
          </div>
        </div>
      </div>
      
      {/* Keep the 2D UI piece selection during preparation phase as backup/alternative */}
      {gamePhase === GAME_PHASES.PREPARATION && <PieceSelection />}
    </div>
  );
} 