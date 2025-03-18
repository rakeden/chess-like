import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameProvider, useGameContext, GAME_PHASES } from '@/lib/game-context'
import { TooltipProvider } from "@/components/ui/tooltip"
import Layout from '@/components/layout/Layout'
import PuzzleGame from '@/components/game/PuzzleGame'
import PuzzleSelection from '@/components/game/PuzzleSelection'
import { getRandomPuzzle } from '@/lib/puzzles'

function GameContent() {
  const { 
    gamePhase, 
    GAME_PHASES, 
    startPuzzle,
    currentPuzzle,
    resetGame
  } = useGameContext();
  
  // Determine what to render based on game phase
  let content;
  
  switch (gamePhase) {
    case GAME_PHASES.PREPARATION:
    case GAME_PHASES.PLAYING:
      content = <PuzzleGame puzzleData={currentPuzzle} />;
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
                onClick={() => startPuzzle(getRandomPuzzle())}
              >
                Play Again
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="w-full"
                onClick={() => resetGame()}
              >
                Back to Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      );
      break;
      
    default: // MENU phase
      content = <PuzzleSelection />;
  }
  
  return content;
}

export default function App() {
  return (
    <GameProvider>
      <TooltipProvider>
        <Layout>
          <GameContent />
        </Layout>
      </TooltipProvider>
    </GameProvider>
  )
}
