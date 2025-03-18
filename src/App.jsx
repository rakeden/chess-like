import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // menu, game, gameOver

  return (
    <div className="w-full h-screen flex flex-col">
      <header className="p-4 text-center">
        <h1 className="text-4xl font-bold">Chess-like</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        {gameState === 'menu' && (
          <div className="text-center">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-xl hover:bg-blue-700"
              onClick={() => setGameState('game')}
            >
              Puzzle Mode
            </button>
          </div>
        )}

        {gameState === 'game' && (
          <div className="w-full h-full">
            <Canvas>
              {/* 3D game components will go here */}
            </Canvas>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
