import { useGameContext } from '@/lib/game-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

export function PreparationTimer() {
  const { 
    preparationTimeLeft, 
    finishPreparation, 
    GAME_PHASES, 
    gamePhase,
    isPreparationPaused,
    pausePreparation,
    resumePreparation
  } = useGameContext();
  
  // Calculate progress percentage
  const timePercentage = (preparationTimeLeft / 60) * 100;
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine color class based on time remaining
  const getColorClass = () => {
    if (preparationTimeLeft > 30) return 'bg-green-500';
    if (preparationTimeLeft > 10) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Only show during preparation phase
  if (gamePhase !== GAME_PHASES.PREPARATION) {
    return null;
  }
  
  return (
    <Card className="absolute top-4 right-4 z-10 w-64">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">
            {isPreparationPaused ? 'Paused' : 'Preparation Phase'}
          </h3>
          <span className={`text-xl font-mono font-bold ${isPreparationPaused ? 'text-amber-500' : ''}`}>
            {formatTime(preparationTimeLeft)}
          </span>
        </div>
        
        <Progress 
          value={timePercentage} 
          className="h-2 mb-4"
          indicatorClassName={isPreparationPaused ? 'bg-amber-500' : getColorClass()}
        />
        
        <p className="text-sm text-muted-foreground mb-3">
          {isPreparationPaused 
            ? 'Timer paused while placing piece.' 
            : 'Place your pieces on the board before the timer ends.'}
        </p>
        
        <Button 
          onClick={finishPreparation}
          className="w-full"
          disabled={isPreparationPaused}
        >
          Ready
        </Button>
      </CardContent>
    </Card>
  );
} 