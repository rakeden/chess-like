import { createContext, useContext, useState } from 'react'

const GameContext = createContext({})

export function GameProvider({ children }) {
  const [pieces, setPieces] = useState([])
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [stage, setStage] = useState(1)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [gamePhase, setGamePhase] = useState('selection') // selection, playing, gameOver

  const value = {
    pieces,
    setPieces,
    selectedPiece,
    setSelectedPiece,
    stage,
    setStage,
    playerTurn,
    setPlayerTurn,
    gamePhase,
    setGamePhase,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
} 