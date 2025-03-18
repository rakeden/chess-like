import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Toaster } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GameProvider } from '@/lib/game-context'
import Board from '@/components/game/Board'
import './App.css'

function Game() {
  return (
    <div className="w-full aspect-square max-w-3xl">
      <Canvas camera={{ position: [0, 5, 5], fov: 50 }}>
        <Board />
      </Canvas>
    </div>
  )
}

function App() {
  const [gameState, setGameState] = useState('menu') // menu, game, gameOver

  return (
    <GameProvider>
      <div className="w-full min-h-screen bg-background text-foreground">
        <Toaster />
        
        <header className="p-4 border-b">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-center">Chess-like</h1>
          </div>
        </header>

        <main className="container mx-auto p-4 flex-1 flex items-center justify-center">
          {gameState === 'menu' && (
            <Card className="w-[350px]">
              <CardHeader>
                <CardTitle>Welcome to Chess-like</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setGameState('game')}
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
          )}

          {gameState === 'game' && <Game />}
        </main>
      </div>
    </GameProvider>
  )
}

export default App
