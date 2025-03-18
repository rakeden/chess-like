import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layout } from '@/components/layout/Layout'
import { GameProvider, useGameContext, GAME_PHASES } from '@/lib/game-context'
import { DndContext } from '@dnd-kit/core'
import { Board } from '@/components/game/Board'
import { PieceSelection } from '@/components/game/PieceSelection'
import { PlayerTurnCard } from '@/components/game/PlayerTurnCard'
import { PreparationTimer } from '@/components/game/PreparationTimer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Toaster } from 'sonner'

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

// The Game component that manages the actual game
function Game() {
  const { 
    gamePhase, 
    playerColor,
    selectedPieces,
    addPiece
  } = useGameContext();
  
  // Handle piece drop onto the board
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // If not dropped on a droppable, do nothing
    if (!active || !over) return;
    
    // Add piece to the board at the dropped position
    const piece = active.data.current.piece;
    addPiece(over.id, piece);
  };
  
  // Determine which row player can place pieces in during preparation
  const getDroppableCells = () => {
    if (gamePhase !== GAME_PHASES.PREPARATION) return [];
    
    // In preparation phase, player can only place on their side
    const playerRowsStart = playerColor === 'white' ? 3 : 0;
    const playerRowsEnd = playerColor === 'white' ? 4 : 1;
    
    const droppableCells = [];
    for (let i = 0; i < 5; i++) {
      for (let j = playerRowsStart; j <= playerRowsEnd; j++) {
        const cellId = String.fromCharCode(97 + i) + (5 - j);
        
        // Only add if cell is not already occupied
        if (!selectedPieces[cellId]) {
          droppableCells.push(cellId);
        }
      }
    }
    
    return droppableCells;
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        {/* Player turn indicator */}
        <PlayerTurnCard />
        
        {/* Preparation timer - only shown during preparation phase */}
        {gamePhase === GAME_PHASES.PREPARATION && <PreparationTimer />}
        
        {/* Game board */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
          <div className="order-2 md:order-1 flex-1 flex justify-center">
            <Board droppableCells={getDroppableCells()} />
          </div>
          
          {/* Piece selection - only shown during preparation phase */}
          {gamePhase === GAME_PHASES.PREPARATION && (
            <div className="order-1 md:order-2">
              <PieceSelection />
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}

// The menu component displayed before starting the game
function Menu() {
  const { startNewGame } = useGameContext();
  const [showRules, setShowRules] = useState(false);
  
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg mx-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Chessy</CardTitle>
          <CardDescription className="text-center">
            A simplified chess-like game with customizable pieces
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => startNewGame()}
            >
              Play Game
            </Button>
            
            <Button 
              size="lg" 
              className="w-full" 
              variant="outline"
              onClick={() => startNewGame(true)}
            >
              Puzzle Mode
            </Button>
            
            <Dialog open={showRules} onOpenChange={setShowRules}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full" variant="secondary">
                  How to Play
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Game Rules</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <section>
                    <h3 className="font-semibold text-lg">Preparation Phase</h3>
                    <p className="text-muted-foreground">
                      You have 3 minutes to place your pieces on the board. Each piece has a point value:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Pawn: 1 point</li>
                      <li>Knight: 3 points</li>
                      <li>Bishop: 3 points</li>
                      <li>Rook: 5 points</li>
                      <li>Queen: 9 points</li>
                      <li>King: 4 points (required)</li>
                    </ul>
                    <p className="mt-2">
                      You must place pieces worth no more than 39 points and must include a King.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-semibold text-lg">Movement Rules</h3>
                    <p className="text-muted-foreground">
                      Pieces move according to standard chess rules:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>King: One square in any direction</li>
                      <li>Queen: Any number of squares diagonally, horizontally, or vertically</li>
                      <li>Rook: Any number of squares horizontally or vertically</li>
                      <li>Bishop: Any number of squares diagonally</li>
                      <li>Knight: L-shape (2 squares in one direction, then 1 square perpendicular)</li>
                      <li>Pawn: One square forward, captures diagonally</li>
                    </ul>
                  </section>
                  <section>
                    <h3 className="font-semibold text-lg">Winning the Game</h3>
                    <p className="text-muted-foreground">
                      Capture your opponent's King to win the game!
                    </p>
                  </section>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowRules(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Move pieces by dragging and dropping. Capture opponent pieces by moving onto their square.
        </CardFooter>
      </Card>
    </div>
  );
}

// Component to render either the menu or the game based on the current phase
function GameContent() {
  const { gamePhase } = useGameContext();
  
  switch (gamePhase) {
    case GAME_PHASES.PLAYING:
    case GAME_PHASES.PREPARATION:
      return <Game />;
    case GAME_PHASES.MENU:
    default:
      return <Menu />;
  }
}

// Main App component
export default function App() {
  return (
    <GameProvider>
      <Layout>
        <GameContent />
        <Toaster position="top-center" />
      </Layout>
    </GameProvider>
  )
}
