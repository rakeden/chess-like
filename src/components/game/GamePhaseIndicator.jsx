import { useGameContext } from '@/lib/game-context';
import { Badge } from '@/components/ui/badge';

export function GamePhaseIndicator() {
  const { gamePhase, GAME_PHASES } = useGameContext();
  
  // Don't show during menu phase
  if (gamePhase === GAME_PHASES.MENU) {
    return null;
  }
  
  // Set variant and text based on game phase
  let variant = 'default';
  let text = '';
  
  switch (gamePhase) {
    case GAME_PHASES.PREPARATION:
      variant = 'outline';
      text = 'Preparation Phase';
      break;
    case GAME_PHASES.PLAYING:
      variant = 'secondary';
      text = 'Playing Phase';
      break;
    case GAME_PHASES.GAME_OVER:
      variant = 'destructive';
      text = 'Game Over';
      break;
    default:
      return null;
  }
  
  return (
    <Badge 
      variant={variant} 
      className="absolute top-4 left-4 z-10 text-sm px-3 py-1"
    >
      {text}
    </Badge>
  );
} 