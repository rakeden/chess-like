import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html, DragControls } from '@react-three/drei';
import { useGameContext, PIECE_VALUES } from '@/lib/game-context';
import Piece from './Piece';
import * as THREE from 'three';

const PIECE_SPACING = 0.8;
const ROW_HEIGHT = 0.8;

export default function ThreeDPieceSelection({ onDragStart, onDragEnd }) {
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
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [draggedPieceData, setDraggedPieceData] = useState(null);
  
  // Log when hoveredPiece changes
  useEffect(() => {
    if (hoveredPiece) {
      console.log('ThreeDPieceSelection - Hovering piece:', hoveredPiece);
    }
  }, [hoveredPiece]);
  
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
        -0.15, // Position pieces on top of the surface (surface at -0.25 + half height 0.1)
        0
      ];
    });
    
    return positions;
  }, [pieceTypesWithCount, groupedPieces]);
  
  // Register piece function
  const registerPiece = (id, ref) => {
    if (ref) {
      pieceRefs.current[id] = ref;
    }
  };
  
  // Get draggable objects for DragControls
  const draggableObjects = useMemo(() => {
    return Object.values(pieceRefs.current).filter(ref => ref);
  }, []);

  // Handle dragstart event
  const handleDragStart = (e) => {
    const obj = e.object;
    document.body.style.cursor = 'grabbing';
    
    // Find the piece type
    const pieceType = pieceTypesWithCount.find(p => p.id === obj.userData.pieceId);
    
    if (pieceType) {
      // Get the first available piece ID of this type
      const availablePieceId = pieceType.allPieceIds[0];
      setDraggingPiece(availablePieceId);
      
      // Store original piece data to use when placing
      setDraggedPieceData({
        id: availablePieceId,
        type: pieceType.type,
        color: pieceType.color,
        value: pieceType.value
      });
      
      // Pause preparation timer while dragging
      pausePreparation();
      
      // Call parent's onDragStart callback if provided
      if (onDragStart) {
        onDragStart();
      }
    }
  };
  
  // Handle drag event to lock the y-position
  const handleDrag = (e) => {
    if (e.object) {
      e.object.position.y = -0.15;
      // Apply 5 degree tilt around Y axis while dragging
      e.object.rotation.y = THREE.MathUtils.degToRad(5);
    }
  };
  
  // Handle dragend event
  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    const obj = e.object;
    
    // Reset rotation when drag ends
    obj.rotation.y = 0;
    
    if (!draggingPiece || !draggedPieceData) {
      resumePreparation();
      if (onDragEnd) onDragEnd();
      return;
    }
    
    // Use raycasting to find what's under the piece
    const raycaster = new THREE.Raycaster();
    
    // Cast ray down from the piece position
    const origin = new THREE.Vector3(
      obj.position.x,
      obj.position.y + 1,
      obj.position.z
    );
    const direction = new THREE.Vector3(0, -1, 0);
    raycaster.set(origin, direction);
    
    // Find intersections with board cells
    const intersects = raycaster.intersectObjects(
      scene.children,
      true
    ).filter(hit => hit.object.userData.isCell);
    
    if (intersects.length > 0) {
      const cellData = intersects[0].object.userData;
      
      // Place the piece if it's a valid cell
      if (cellData.row !== undefined && cellData.col !== undefined) {
        placePiece(draggingPiece, { 
          row: cellData.row, 
          col: cellData.col 
        });
      }
    } else {
      // Reset piece position
      const pieceType = pieceTypesWithCount.find(p => p.allPieceIds.includes(draggingPiece));
      if (pieceType && piecePositions[pieceType.id]) {
        const originalPos = piecePositions[pieceType.id];
        obj.position.set(originalPos[0], originalPos[1], originalPos[2]);
      }
    }
    
    // Reset dragging state and resume timer
    setDraggingPiece(null);
    setDraggedPieceData(null);
    resumePreparation();
    
    // Call parent's onDragEnd callback if provided
    if (onDragEnd) {
      onDragEnd();
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
      
      {/* Add declarative DragControls */}
      {draggableObjects.length > 0 && (
        <DragControls
          transformGroup
          args={[draggableObjects, camera, gl.domElement]}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      )}
      
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
        const isDragging = draggingPiece === piece.id;
        
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
              isBeingDragged={draggingPiece === piece.id}
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