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
  Progress, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Component to display an individual draggable piece
const DraggablePiece = ({ piece, isOver }) => {
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
      className={`
        flex items-center justify-between p-2 mb-2 rounded-md border
        ${isOver ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 flex items-center justify-center text-xl mr-2">
          {getPieceSymbol(piece.type)}
        </div>
        <div>
          <p className="font-medium capitalize">{piece.type}</p>
          <p className="text-xs text-muted-foreground">Value: {piece.value}</p>
        </div>
      </div>
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="absolute bottom-4 right-4 z-10">
          Select Pieces
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Select Your Pieces</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span>Points Used: {selectedPiecesValue}/{currentMaxValue}</span>
            <span className={pointsPercentage >= 100 ? 'text-destructive' : ''}>
              {pointsPercentage >= 100 ? 'Max Reached!' : `${Math.round(pointsPercentage)}%`}
            </span>
          </div>
          <Progress value={pointsPercentage} className="h-2" />
        </div>

        <div className="mt-6 space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <h3 className="text-lg font-medium">Available Pieces</h3>
            <div className="space-y-4">
              {Object.entries(groupedPieces).map(([type, pieces]) => (
                <Card key={type}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-md capitalize">{type}s</CardTitle>
                    <CardDescription>Value: {PIECE_VALUES[type]} points each</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    {pieces.map(piece => (
                      <DraggablePiece 
                        key={piece.id}
                        piece={piece}
                        isOver={false}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPieces.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Selected Pieces</h3>
                <Card>
                  <CardContent className="py-4">
                    {selectedPieces.map(piece => (
                      <div key={piece.id} className="flex items-center p-2 mb-2 rounded-md border">
                        <div className="w-8 h-8 flex items-center justify-center text-xl mr-2">
                          {getPieceSymbol(piece.type)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{piece.type}</p>
                          <p className="text-xs text-muted-foreground">Value: {piece.value}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </DndContext>
        </div>
      </SheetContent>
    </Sheet>
  );
} 