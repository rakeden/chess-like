import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameContext, PIECE_VALUES } from '@/lib/game-context';
import Piece from './Piece';
import * as THREE from 'three';

const PIECE_SPACING = 0.8;
const ROW_HEIGHT = 0.8;

export default function PieceBench({ registerDraggable, isDragging, draggingPiece, onDragStart, onDragEnd }) {
  const { 
    availablePieces, 
    playerColor, 
    placePiece,
    selectedPiecesValue,
    currentMaxValue,
    pausePreparation,
    resumePreparation,
    isPreparationPaused
  } = useGameContext();
  
  const { scene, camera, gl } = useThree();
  const groupRef = useRef();
  const pieceRefs = useRef({});
  
  const [hoveredPiece, setHoveredPiece] = useState(null);
  
  // Filter pieces to only show player's color and exclude kings
  const playerPieces = useMemo(() => {
    return availablePieces.filter(piece => 
      piece.color === playerColor && piece.type !== 'king'
    );
  }, [availablePieces, playerColor]);
  
  // Group pieces by type for display
  const groupedPieces = useMemo(() => {
    const groups = {};
    // Remove king from the list of piece types
    const pieceTypes = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
    
    pieceTypes.forEach(type => {
      groups[type] = playerPieces.filter(piece => piece.type === type);
    });
    
    return groups;
  }, [playerPieces]);
  
  // Get one representative piece per type with count
  const pieceTypesWithCount = useMemo(() => {
    const result = [];
    
    Object.entries(groupedPieces).forEach(([type, pieces]) => {
      if (pieces.length > 0) {
        // Take the first piece of this type as representative
        result.push({
          ...pieces[0],
          count: pieces.length,
          // Store all piece IDs of this type for reference
          allPieceIds: pieces.map(p => p.id)
        });
      }
    });
    
    return result;
  }, [groupedPieces]);
  
  // Calculate positions for each piece type
  const piecePositions = useMemo(() => {
    const positions = {};
    const pieceTypes = Object.keys(groupedPieces).filter(type => groupedPieces[type].length > 0);
    
    // Center pieces within 5 units (board width)
    const availableWidth = 5; // Board width
    const totalSpacing = (pieceTypes.length - 1) * PIECE_SPACING;
    const startX = -((availableWidth - PIECE_SPACING) / 2);
    
    pieceTypesWithCount.forEach((piece, index) => {
      positions[piece.id] = [
        startX + (index * PIECE_SPACING),
        -0.05, // Position pieces on top of the surface (surface at -0.05)
        0
      ];
    });
    
    return positions;
  }, [pieceTypesWithCount, groupedPieces]);
  
  // Register piece function with DragControlWrapper
  const registerPiece = (id, ref) => {
    if (ref) {
      pieceRefs.current[id] = ref;
      
      // Add additional userData for drag controls
      if (ref.userData) {
        ref.userData.selectionPiece = true;
        
        // Find the piece type data
        const pieceType = pieceTypesWithCount.find(p => p.id === id);
        if (pieceType) {
          // Store data needed during drag operations
          ref.userData.pieceData = {
            id: pieceType.allPieceIds[0],
            type: pieceType.type,
            color: pieceType.color,
            value: pieceType.value
          };
        }
      }
      
      // Register with DragControlWrapper if available
      if (registerDraggable) {
        registerDraggable(id, ref, 'selection');
      }
    }
  };

  return (
    <group ref={groupRef} position={[0, -0.2, -2.5]}>
      {/* Simple surface underneath the pieces */}
      <group>
        {/* Main surface */}
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[5, 0.05, 1]} />
          <meshStandardMaterial 
            color="#334155" 
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
      </group>
      
      {/* Title for the selection area */}
      <Html
        position={[0, 0.3, 0]}
        center
        sprite
        transform
        scale={0.3}
        style={{
          color: 'white',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0,0,0,0.7)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        Available Pieces
      </Html>
      
      {/* Show one piece per type with count */}
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
            
            {/* Show available count */}
            <Html
              position={[0, -0.3, 0]}
              center
              sprite
              transform
              scale={0.25}
              style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'bold',
                pointerEvents: 'none'
              }}
            >
              {piece.count}
            </Html>
          </group>
        );
      })}
      
      {/* Show preparation pause status */}
      {isPreparationPaused && (
        <Html position={[0, 0, 0]} center>
          <div style={{ 
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Placing piece...
          </div>
        </Html>
      )}
    </group>
  );
} 