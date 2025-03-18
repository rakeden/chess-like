import { useGameContext } from '@/lib/game-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PlayerTurnCard() {
  const { playerColor, setPlayerTurn } = useGameContext();
  
  // Function to toggle player color (for testing purposes)
  const toggleColor = () => {
    setPlayerTurn(playerColor === 'white' ? 'black' : 'white');
  };
  
  // Get the symbol for the king based on player color
  const kingSymbol = playerColor === 'white' ? '♔' : '♚';
  
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
          <h3 className="font-bold text-lg">Your Turn</h3>
          <p className="text-sm text-muted-foreground capitalize">{playerColor} Pieces</p>
        </div>
        
        {/* Toggle button - can be removed in production */}
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto" 
          onClick={toggleColor}
        >
          Switch
        </Button>
      </CardContent>
    </Card>
  );
} 