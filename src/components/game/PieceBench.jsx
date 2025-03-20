import { useRef, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameContext } from '@/lib/game-context';
import Piece from './Piece';
import PieceBenchSurface from './PieceBenchSurface';
import PieceCount from './PieceCount';
import PreparationPauseIndicator from './PreparationPauseIndicator';

const PIECE_SPACING = 0.8;

export default function PieceBench({ registerDraggable, isDragging, draggingPiece }) {
  const { 
    availablePieces, 
    playerColor,
    isPreparationPaused
  } = useGameContext();
  
  const pieceRefs = useRef({});
  const [hoveredPiece, setHoveredPiece] = useState(null);
  
  // Filter and group pieces by type
  const { pieceTypesWithCount, piecePositions } = useMemo(() => {
    // Filter out king and opponent pieces
    const playerPieces = availablePieces.filter(piece => 
      piece.color === playerColor && piece.type !== 'king'
    );

    // Group pieces by type
    const groupedPieces = playerPieces.reduce((acc, piece) => {
      if (!acc[piece.type]) {
        acc[piece.type] = [];
      }
      acc[piece.type].push(piece);
      return acc;
    }, {});

    // Create representative pieces with counts
    const typesWithCount = Object.entries(groupedPieces).map(([type, pieces]) => ({
      ...pieces[0],
      count: pieces.length,
      allPieceIds: pieces.map(p => p.id)
    }));

    // Calculate positions
    const positions = {};
    const availableWidth = 5; // Board width
    const startX = -((availableWidth - PIECE_SPACING) / 2);
    
    typesWithCount.forEach((piece, index) => {
      positions[piece.id] = [
        startX + (index * PIECE_SPACING),
        -0.05,
        0
      ];
    });

    return {
      pieceTypesWithCount: typesWithCount,
      piecePositions: positions
    };
  }, [availablePieces, playerColor]);

  // Register piece with drag controls
  const registerPiece = (id, ref) => {
    if (ref) {
      pieceRefs.current[id] = ref;
      
      if (ref.userData) {
        ref.userData.selectionPiece = true;
        
        const pieceType = pieceTypesWithCount.find(p => p.id === id);
        if (pieceType) {
          ref.userData.pieceData = {
            id: pieceType.allPieceIds[0],
            type: pieceType.type,
            color: pieceType.color,
            value: pieceType.value
          };
        }
      }
      
      if (registerDraggable) {
        registerDraggable(id, ref, 'selection');
      }
    }
  };

  return (
    <group position={[0, -0.2, -2.5]}>
      <PieceBenchSurface />
      
      {/* Render pieces */}
      {pieceTypesWithCount.map((piece) => {
        const position = piecePositions[piece.id] || [0, 0, 0];
        const isHovered = hoveredPiece === piece.id;
        const isBeingDragged = draggingPiece && piece.allPieceIds.includes(draggingPiece);
        
        return (
          <group 
            key={piece.id}
            position={position}
            userData={{ 
              pieceId: piece.id,
              pieceType: piece.type,
              pieceColor: piece.color
            }}
            onPointerOver={() => setHoveredPiece(piece.id)}
            onPointerOut={() => setHoveredPiece(null)}
          >
            <Piece
              type={piece.type}
              color={piece.color}
              value={piece.value}
              scale={[12, 12, 12]}
              visible={true}
              id={piece.id}
              position={position}
              registerPiece={registerPiece}
              isBeingDragged={isBeingDragged}
              isDraggable={true}
              isHovered={isHovered}
            />
            
            <PieceCount count={piece.count} />
          </group>
        );
      })}
      
      {isPreparationPaused && <PreparationPauseIndicator />}
    </group>
  );
} 