import { useGameContext, GAME_PHASES } from '@/lib/game-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function PlayerTurnCard() {
  const { 
    playerColor, 
    setPlayerTurn, 
    gamePhase,
    goToMenu
  } = useGameContext();
  
  // Function to toggle player color (for testing purposes)
  const toggleColor = () => {
    setPlayerTurn(playerColor === 'white' ? 'black' : 'white');
  };
  
  // Get the symbol for the king based on player color
  const kingSymbol = playerColor === 'white' ? '♔' : '♚';
  
  // Change display based on game phase
  const phaseText = gamePhase === GAME_PHASES.PLAYING ? 'Your Turn' : 'Place Your Pieces';
  
  return (
    <Card className="absolute top-4 left-4 z-10 overflow-hidden">
      <div 
        className={`w-full h-1 ${
          playerColor === 'white' ? 'bg-white' : 'bg-black'
        }`}
      />
      <CardContent className="p-4 flex items-center gap-3">
        <div 
          className={`flex items-center justify-center rounded-full 
            ${playerColor === 'white' ? 'bg-white text-black' : 'bg-black text-white'} 
            w-12 h-12 text-2xl font-bold`}
        >
          {kingSymbol}
        </div>
        <div>
          <h3 className="font-bold text-lg">{phaseText}</h3>
          <p className="text-sm text-muted-foreground capitalize">{playerColor} Pieces</p>
        </div>
        
        {/* Action buttons */}
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={goToMenu}
            title="Back to Menu"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {/* Toggle button for testing */}
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={toggleColor}
            title="Switch Color"
          >
            <span className="text-xs font-bold">
              {playerColor === 'white' ? '⚫' : '⚪'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 