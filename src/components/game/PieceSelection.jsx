import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameContext, GAME_PHASES } from '@/lib/game-context';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { generateAvailablePieces, calculatePieceValue, getPieceSymbol } from '@/lib/piece-utils';

function DraggablePiece({ piece, count, index }) {
  const id = `${piece.type}-${index}-${piece.color}`;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: {
      piece
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center justify-between p-2 border rounded-md mb-1 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
          piece.color === 'white' ? 'bg-white text-black border border-gray-300' : 'bg-black text-white'
        }`}>
          <span className="text-2xl">{getPieceSymbol(piece.type, piece.color)}</span>
        </div>
        <span className="capitalize">{piece.type}</span>
      </div>
      <Badge variant="secondary">
        {calculatePieceValue(piece.type)} pts
      </Badge>
      {count > 1 && (
        <Badge variant="outline" className="ml-2">
          ×{count}
        </Badge>
      )}
    </div>
  );
}

export function PieceSelection() {
  const { 
    playerColor,
    usedPoints, 
    pointLimit,
    selectedPieces,
    gamePhase
  } = useGameContext();
  
  // Only show in preparation phase
  if (gamePhase !== GAME_PHASES.PREPARATION) {
    return null;
  }
  
  // Generate all available pieces
  const allPieces = useMemo(() => 
    generateAvailablePieces(playerColor), 
    [playerColor]
  );
  
  // Count what's already on the board
  const usedPieces = useMemo(() => {
    const counts = {};
    
    Object.values(selectedPieces).forEach(piece => {
      const { type } = piece;
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  }, [selectedPieces]);
  
  // Group pieces by type and count them
  const groupedPieces = useMemo(() => {
    const groups = {};
    
    allPieces.forEach(piece => {
      if (!groups[piece.type]) {
        groups[piece.type] = {
          piece,
          totalCount: 0
        };
      }
      groups[piece.type].totalCount++;
    });
    
    return Object.entries(groups).map(([type, group]) => ({
      piece: group.piece,
      totalCount: group.totalCount,
      availableCount: group.totalCount - (usedPieces[type] || 0)
    }));
  }, [allPieces, usedPieces]);
  
  return (
    <Card className="w-64 overflow-auto shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Available Pieces</CardTitle>
        <div className="flex justify-between items-center text-sm">
          <Badge 
            variant={usedPoints > pointLimit ? "destructive" : "outline"}
            className="font-mono"
          >
            {usedPoints} / {pointLimit} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-15rem)] overflow-y-auto">
        <div className="space-y-1">
          {groupedPieces.map(({ piece, totalCount, availableCount }, index) => (
            availableCount > 0 && (
              <DraggablePiece 
                key={`${piece.type}-${index}`}
                piece={piece}
                count={availableCount}
                index={index}
              />
            )
          ))}
        </div>
        
        {/* Display when no pieces are available */}
        {groupedPieces.every(({ availableCount }) => availableCount === 0) && (
          <div className="py-4 text-center text-muted-foreground">
            All pieces have been placed
          </div>
        )}
      </CardContent>
    </Card>
  );
} 