import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GameProvider } from '@/lib/game-context'
import Layout from '@/components/layout/Layout'
import Board from '@/components/game/Board'
import { PieceSelection } from '@/components/game/PieceSelection'
import { PlayerTurnCard } from '@/components/game/PlayerTurnCard'
import { DndContext } from '@dnd-kit/core'
import { useGameContext } from '@/lib/game-context'
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

function Game() {
  const { setPlayerTurn } = useGameContext();
  
  // Randomly assign player's color at the start of the game
  useEffect(() => {
    // 50% chance to be white or black
    const randomColor = Math.random() < 0.5 ? 'white' : 'black';
    setPlayerTurn(randomColor);
  }, [setPlayerTurn]);
  
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
      {/* Display player's turn */}
      <PlayerTurnCard />
      
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
          <Board />
        </Canvas>
        
        {/* Overlay for dnd-kit droppable areas */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {droppableCells}
          </div>
        </div>
      </div>
      
      {/* Piece selection at the bottom */}
      <PieceSelection />
    </div>
  )
}

function Menu({ onStartGame }) {
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
            onClick={onStartGame}
          >
            Puzzle Mode
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
                  <li>Progress through 3 stages</li>
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
  const [gameState, setGameState] = useState('menu')

  return (
    <GameProvider>
      <DndContext>
        <Layout>
          {gameState === 'menu' && <Menu onStartGame={() => setGameState('game')} />}
          {gameState === 'game' && <Game />}
        </Layout>
      </DndContext>
    </GameProvider>
  )
}
