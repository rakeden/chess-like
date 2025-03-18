import { useMemo } from 'react';
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  useDraggable,
  closestCenter 
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGameContext, PIECE_VALUES } from '@/lib/game-context';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// Component to display an individual draggable piece
const DraggablePiece = ({ piece }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: piece.id,
    data: { piece }
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-card border hover:bg-accent p-3 rounded-lg inline-flex flex-col items-center justify-center w-12 h-16 m-1"
    >
      <span className="text-2xl mb-1">{getPieceSymbol(piece.type)}</span>
      <span className="text-xs">{piece.value}</span>
    </div>
  );
};

// Utility function to get chess piece symbol
function getPieceSymbol(type) {
  const symbols = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  };
  return symbols[type] || '?';
}

export function PieceSelection() {
  const { 
    availablePieces,
    selectedPieces,
    selectedPiecesValue,
    currentMaxValue,
    placePiece
  } = useGameContext();

  // Calculate percentage of points used
  const pointsPercentage = useMemo(() => {
    return Math.min(100, (selectedPiecesValue / currentMaxValue) * 100);
  }, [selectedPiecesValue, currentMaxValue]);

  // Group available pieces by type for display
  const groupedPieces = useMemo(() => {
    return availablePieces.reduce((grouped, piece) => {
      const type = piece.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(piece);
      return grouped;
    }, {});
  }, [availablePieces]);

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Handle the end of a drag operation
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // Check if we have valid data
    if (!active || !over) return;
    
    // Get piece ID from the active element
    const pieceId = active.id;
    
    // Get drop target cell coordinates
    const overIdMatch = over.id.match(/cell-(\d+)-(\d+)/);
    if (overIdMatch) {
      const row = parseInt(overIdMatch[1], 10);
      const col = parseInt(overIdMatch[2], 10);
      
      // Place the piece on the board
      placePiece(pieceId, { row, col });
    }
  };

  // Order pieces by value for display
  const pieceTypes = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];

  return (
    <Card className="absolute bottom-4 left-4 right-4 p-2 z-10">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Points: {selectedPiecesValue}/{currentMaxValue}</span>
          <span className={`text-sm ${pointsPercentage >= 100 ? 'text-destructive font-bold' : ''}`}>
            {pointsPercentage >= 100 ? 'Max Reached!' : `${Math.round(pointsPercentage)}%`}
          </span>
        </div>
        
        <Progress value={pointsPercentage} className="h-1 mb-3" />
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-wrap items-center justify-center gap-1">
            {pieceTypes.map(type => (
              groupedPieces[type]?.map(piece => (
                <DraggablePiece 
                  key={piece.id}
                  piece={piece}
                />
              ))
            ))}
          </div>
          
          {selectedPieces.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Selected Pieces</span>
                <span className="text-xs text-muted-foreground">{selectedPieces.length} pieces</span>
              </div>
              <div className="flex flex-wrap items-center justify-center">
                {selectedPieces.map(piece => (
                  <div 
                    key={piece.id} 
                    className="bg-accent/30 p-2 rounded-md inline-flex flex-col items-center justify-center w-10 h-14 m-1"
                  >
                    <span className="text-xl">{getPieceSymbol(piece.type)}</span>
                    <span className="text-xs">{piece.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DndContext>
      </CardContent>
    </Card>
  );
} 