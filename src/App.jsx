import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GameProvider } from '@/lib/game-context'
import Layout from '@/components/layout/Layout'
import Board from '@/components/game/Board'
import { PieceSelection } from '@/components/game/PieceSelection'
import { DndContext } from '@dnd-kit/core'

function Game() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      <Canvas camera={{ position: [0, 5, 5], fov: 50 }}>
        <Board />
      </Canvas>
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
