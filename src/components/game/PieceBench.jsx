import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { DragControls } from '@react-three/drei';
import { Html } from '@react-three/drei';
import Piece from './Piece';
import PieceBenchSurface from './PieceBenchSurface';
import * as THREE from 'three';

const PIECE_SPACING = 0.8;

// Mock piece data - replace with props in production
const MOCK_PIECES = [
  { id: 'pawn1', type: 'pawn', value: 1 },
  { id: 'knight1', type: 'knight', value: 3 },
  { id: 'bishop1', type: 'bishop', value: 3 },
  { id: 'rook1', type: 'rook', value: 5 },
  { id: 'queen1', type: 'queen', value: 9 }
];

// Individual draggable piece component
const DraggablePiece = ({ 
  piece, 
  position, 
  playerColor, 
  isAffordable,
  onDragStart,
  onDragEnd,
  onPiecePlaced,
  onPositionUpdate
}) => {
  const { camera, gl, scene } = useThree();
  const pieceRef = useRef();
  const meshRef = useRef();
  const pieceInstanceRef = useRef();

  const handleDragStart = (e) => {
    document.body.style.cursor = 'grabbing';
    onDragStart?.();
  };

  const handleDrag = (e) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(5);
    }
  };

  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    onDragEnd?.();
    
    if (meshRef.current) {
      // Reset rotation
      meshRef.current.rotation.y = 0;
      
      // Use raycasting to find if piece was dropped on board
      const raycaster = new THREE.Raycaster();
      raycaster.layers.set(1); // Only check layer 1 (board cells)
      
      const origin = new THREE.Vector3(
        meshRef.current.position.x,
        meshRef.current.position.y + 1,
        meshRef.current.position.z
      );
      const direction = new THREE.Vector3(0, -1, 0);
      raycaster.set(origin, direction);
      
      const intersects = raycaster.intersectObjects(
        scene.children,
        true
      ).filter(hit => hit.object.userData?.isCell);
      
      if (intersects.length > 0) {
        const cellData = intersects[0].object.userData;
        if (cellData.row !== undefined && cellData.col !== undefined) {
          // Notify parent of placement attempt
          const wasPlaced = onPiecePlaced?.({
            pieceId: piece.id,
            pieceType: piece.type,
            value: piece.value,
            to: {
              row: cellData.row,
              col: cellData.col
            }
          });
          
          // If placement was unsuccessful, return to initial position
          if (!wasPlaced && pieceInstanceRef.current?.returnToPosition) {
            pieceInstanceRef.current.returnToPosition();
          }
        } else {
          // Invalid cell data, return to position
          pieceInstanceRef.current?.returnToPosition();
        }
      } else {
        // No valid intersection, return to position
        pieceInstanceRef.current?.returnToPosition();
      }
    }
  };

  // Handle position updates from the piece
  const handleReturnToPosition = (pos) => {
    if (meshRef.current) {
      meshRef.current.position.set(0, 0, 0);
      onPositionUpdate?.(piece.id, pos);
    }
  };

  return (
    <group ref={pieceRef} position={position}>
      <DragControls
        args={[meshRef.current ? [meshRef.current] : [], camera, gl.domElement]}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <group 
          ref={meshRef}
          position={[0, 0, 0]}
        >
          <Piece
            ref={pieceInstanceRef}
            type={piece.type}
            color={playerColor}
            scale={[12, 12, 12]}
            position={[0, 0, 0]}
            isDisabled={!isAffordable}
            isInteractive={isAffordable}
            onReturnToPosition={handleReturnToPosition}
          />
          
          {/* Show piece value */}
          <Html
            position={[0, -0.3, 0]}
            center
            sprite
            transform
            scale={0.25}
            style={{
              background: isAffordable ? 'rgba(0,0,0,0.8)' : 'rgba(255,0,0,0.8)',
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
      </DragControls>
    </group>
  );
};

export default function PieceBench({ 
  playerColor = 'white',
  onPieceDragStart,
  onPieceDragEnd,
  onPiecePlaced,
  remainingPoints = 20
}) {
  const [piecePositions, setPiecePositions] = useState({});
  
  // Initialize positions for pieces
  useEffect(() => {
    const positions = {};
    const availableWidth = 5; // Board width
    const startX = -((availableWidth - PIECE_SPACING) / 2);
    
    MOCK_PIECES.forEach((piece, index) => {
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
  }, []);

  const handlePositionUpdate = (pieceId, newPosition) => {
    setPiecePositions(prev => ({
      ...prev,
      [pieceId]: newPosition
    }));
  };

  return (
    <group position={[0, -0.2, -2.5]}>
      <PieceBenchSurface title={`Available Pieces (${remainingPoints} points remaining)`} />
      
      {/* Render all piece types */}
      {MOCK_PIECES.map((piece) => {
        const position = piecePositions[piece.id] || [0, 0, 0];
        const isAffordable = piece.value <= remainingPoints;
        
        return (
          <DraggablePiece
            key={piece.id}
            piece={piece}
            position={position}
            playerColor={playerColor}
            isAffordable={isAffordable}
            onDragStart={onPieceDragStart}
            onDragEnd={onPieceDragEnd}
            onPiecePlaced={onPiecePlaced}
            onPositionUpdate={handlePositionUpdate}
          />
        );
      })}
    </group>
  );
} 