import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GameProvider, useGameContext, GAME_PHASES } from '@/lib/game-context'
import Layout from '@/components/layout/Layout'
import Board from '@/components/game/Board'
import ThreeDPieceSelection from '@/components/game/ThreeDPieceSelection'
import { PieceSelection } from '@/components/game/PieceSelection'
import { PlayerTurnCard } from '@/components/game/PlayerTurnCard'
import { PreparationTimer } from '@/components/game/PreparationTimer'
import { GamePhaseIndicator } from '@/components/game/GamePhaseIndicator'
import { DndContext } from '@dnd-kit/core'
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

function GameContent() {
  const { 
    gamePhase, 
    GAME_PHASES, 
    startPuzzle, 
    playerColor,
    currentTurn,
    pieces,
    opponentPieces
  } = useGameContext();
  
  // Debug logging
  console.log("GameContent rendering:", {
    gamePhase,
    playerColor,
    currentTurn,
    pieces: pieces?.length,
    opponentPieces: opponentPieces?.length
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

  // Determine what to render based on game phase
  let content;
  
  switch (gamePhase) {
    case GAME_PHASES.PREPARATION:
    case GAME_PHASES.PLAYING:
      content = (
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
      break;
      
    case GAME_PHASES.GAME_OVER:
      content = (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Card className="w-[350px] mx-4">
            <CardHeader>
              <CardTitle>Game Over</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>The game has ended.</p>
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => startPuzzle()}
              >
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
      break;
      
    default: // MENU phase
      content = <Menu />;
  }
  
  return content;
}

function Menu() {
  const { startPuzzle } = useGameContext();
  
  console.log("Menu component rendered, startPuzzle function:", startPuzzle);
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-[350px] mx-4">
        <CardHeader>
          <CardTitle>Welcome to Chess-like</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => {
              console.log("Start Puzzle button clicked");
              startPuzzle();
            }}
          >
            Start Puzzle
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full">
                How to Play
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Game Rules</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Chess-like is a roguelike autobattler based on chess mechanics:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Play on a 5x5 chessboard</li>
                  <li>You have 60 seconds to place your pieces</li>
                  <li>Select pieces within value constraints</li>
                  <li>Battle against AI-controlled pieces</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <DndContext>
        <Layout>
          <GameContent />
        </Layout>
      </DndContext>
    </GameProvider>
  )
}
