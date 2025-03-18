import { useGameContext } from '@/lib/game-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

export function PreparationTimer() {
  const { 
    preparationTime,
    remainingTime,
    skipPreparationTimer,
    startPlaying,
    hasKing,
    usedPoints,
    pointLimit
  } = useGameContext();
  
  // Calculate percentage of time remaining
  const timePercent = Math.max(0, Math.min(100, (remainingTime / preparationTime) * 100));
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine the status of the preparation
  const isOverPoints = usedPoints > pointLimit;
  
  return (
    <Card className="absolute top-4 right-4 z-10 w-64 overflow-hidden">
      <div 
        className={`w-full h-1 ${
          timePercent > 75 ? 'bg-green-500' : 
          timePercent > 30 ? 'bg-yellow-500' : 
          'bg-red-500'
        }`}
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Preparation Phase</h3>
          <div className="flex items-center gap-1 text-sm font-mono">
            <Clock className="h-3 w-3" />
            <span>{formatTime(remainingTime)}</span>
          </div>
        </div>
        
        <Progress value={timePercent} className="h-2 mb-4" />
        
        <div className="space-y-2 mb-4">
          {/* Points used indicator */}
          <div className="flex items-center justify-between text-sm">
            <span>Points Used:</span>
            <span className={`font-mono ${isOverPoints ? 'text-red-500 font-bold' : ''}`}>
              {usedPoints} / {pointLimit}
            </span>
          </div>
          
          {/* King status indicator */}
          <div className="flex items-center justify-between text-sm">
            <span>King Placed:</span>
            <span className={`${hasKing ? 'text-green-500' : 'text-red-500'}`}>
              {hasKing ? '✓' : '✗'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={skipPreparationTimer}
          >
            Skip Timer
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={startPlaying}
            disabled={!hasKing || isOverPoints}
          >
            Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 