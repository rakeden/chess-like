import { useRef, useMemo, useState, useEffect } from 'react';
import { useGameContext } from '@/lib/game-context';
import Piece from './Piece';
import PieceBenchSurface from './PieceBenchSurface';
import PreparationPauseIndicator from './PreparationPauseIndicator';
import { Html } from '@react-three/drei';

const PIECE_SPACING = 0.8;

export default function PieceBench({ registerDraggable, isDragging, draggingPiece }) {
  const { 
    availablePieces,
    remainingValue,
    isPreparationPaused,
    playerColor
  } = useGameContext();
  
  const pieceRefs = useRef({});
  const [piecePositions, setPiecePositions] = useState({});
  
  // Initialize positions for new pieces
  useEffect(() => {
    const positions = {};
    const availableWidth = 5; // Board width
    const startX = -((availableWidth - PIECE_SPACING) / 2);
    
    availablePieces.forEach((piece, index) => {
      // Only set initial position if not already set
      if (!piecePositions[piece.id]) {
        positions[piece.id] = [
          startX + (index * PIECE_SPACING),
          -0.05,
          0
        ];
      }
    });
    
    setPiecePositions(prev => ({
      ...prev,
      ...positions
    }));
  }, [availablePieces]);

  return (
    <group position={[0, -0.2, -2.5]}>
      <PieceBenchSurface title={`Available Pieces (${remainingValue} points remaining)`} />
      
      {/* Render all piece types */}
      {availablePieces.map((piece) => {
        const position = piecePositions[piece.id] || [0, 0, 0];
        const isBeingDragged = draggingPiece === piece.id;
        
        return (
          <group 
            key={piece.id}
            position={position}
          >
            <Piece
              type={piece.type}
              color={piece.color}
              scale={[12, 12, 12]}
              position={[0, 0, 0]}
              isBeingDragged={isBeingDragged}
              isDraggable={piece.isAffordable}
              isDisabled={!piece.isAffordable}
              isInteractive={piece.isAffordable}
              id={piece.id}
              ref={ref => {
                if (ref && piece.isAffordable) {
                  // Store ref locally
                  pieceRefs.current[piece.id] = ref;
                  
                  // Set up userData for dragging
                  ref.userData = {
                    pieceId: piece.id,
                    pieceType: piece.type,
                    pieceColor: playerColor,
                    selectionPiece: true,
                    pieceData: {
                      id: piece.id,
                      type: piece.type,
                      color: piece.color,
                      value: piece.value
                    },
                    onDragEnd: (x, y, z) => {
                      setPiecePositions(prev => ({
                        ...prev,
                        [piece.id]: [x, y, z]
                      }));
                    }
                  };
                  
                  // Register with drag controls
                  registerDraggable?.(piece.id, ref, 'selection');
                }
              }}
            />
            
            {/* Show piece value */}
            <Html
              position={[0, -0.3, 0]}
              center
              sprite
              transform
              scale={0.25}
              style={{
                background: piece.isAffordable ? 'rgba(0,0,0,0.8)' : 'rgba(255,0,0,0.8)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'bold',
                pointerEvents: 'none'
              }}
            >
              {piece.value}
            </Html>
          </group>
        );
      })}
      
      {isPreparationPaused && <PreparationPauseIndicator />}
    </group>
  );
} 