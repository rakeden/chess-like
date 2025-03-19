import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameContext, PIECE_VALUES } from '@/lib/game-context';
import Piece from './Piece';
import * as THREE from 'three';

const PIECE_SPACING = 1.5;
const ROW_HEIGHT = 1.2;

export default function ThreeDPieceSelection() {
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
  const piecesRef = useRef([]);
  
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [draggedPieceData, setDraggedPieceData] = useState(null);
  const [activeDragObject, setActiveDragObject] = useState(null);
  const [startDragPosition, setStartDragPosition] = useState(null);
  
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
    
    let offsetX = -((pieceTypes.length - 1) * PIECE_SPACING) / 2;
    
    pieceTypesWithCount.forEach((piece, index) => {
      positions[piece.id] = [
        offsetX + index * PIECE_SPACING,
        -ROW_HEIGHT,
        0
      ];
    });
    
    return positions;
  }, [pieceTypesWithCount, groupedPieces]);

  // Handle drag start
  const handleDragStart = (event, pieceId) => {
    // Find the piece type that was clicked
    const pieceType = pieceTypesWithCount.find(p => p.id === pieceId);
    
    if (pieceType && pieceType.count > 0) {
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
      
      // Navigate up to find the parent group that contains the piece
      let current = event.object;
      while (current && !current.userData.pieceId) {
        current = current.parent;
      }
      
      // Store reference to the group containing the piece for dragging
      if (current) {
        setActiveDragObject(current);
        setStartDragPosition([...piecePositions[pieceId]]);
      }
      
      // Pause preparation timer while dragging
      pausePreparation();
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event) => {
    if (!draggingPiece || !draggedPieceData || !activeDragObject) {
      resumePreparation();
      return;
    }
    
    // Get the position of the dropped piece in 3D space
    const position = activeDragObject.position.clone();
    
    // Project the 3D position onto the board
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, -1, 0); // Look downward to find the board
    raycaster.set(position, direction);
    
    // Find board cells
    const boardCells = [];
    scene.traverse((object) => {
      if (object.userData && object.userData.isCell) {
        boardCells.push(object);
      }
    });
    
    // Check for intersection with board cells
    const intersects = raycaster.intersectObjects(boardCells, true);
    
    if (intersects.length > 0) {
      // Get the first intersection
      const intersection = intersects[0];
      const cellData = intersection.object.userData;
      
      // Place the piece if it's a valid cell
      if (cellData.row !== undefined && cellData.col !== undefined) {
        placePiece(draggingPiece, { 
          row: cellData.row, 
          col: cellData.col 
        });
      }
    }
    
    // Reset the piece position
    if (activeDragObject && startDragPosition) {
      activeDragObject.position.set(
        startDragPosition[0],
        startDragPosition[1],
        startDragPosition[2]
      );
    }
    
    // Reset dragging state and resume timer
    setDraggingPiece(null);
    setDraggedPieceData(null);
    setActiveDragObject(null);
    setStartDragPosition(null);
    resumePreparation();
  };

  // Set up pointer events for dragging
  useEffect(() => {
    if (!groupRef.current || !gl) return;
    
    const canvas = gl.domElement;
    
    // Handle hover effects
    const handlePointerMove = (event) => {
      // Convert mouse coordinates to normalized device coordinates
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // If dragging, update the position of the dragged piece
      if (draggingPiece && activeDragObject) {
        // Create a plane at the camera's near plane parallel to the view
        const planeZ = -4; // Same Z as our group
        const mouseRaycaster = new THREE.Raycaster();
        mouseRaycaster.setFromCamera({ x, y }, camera);
        
        // Create a plane to intersect with
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
        const targetPosition = new THREE.Vector3();
        
        // Find the intersection point of the ray with the plane
        mouseRaycaster.ray.intersectPlane(plane, targetPosition);
        
        // Update the position of the dragged object
        activeDragObject.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
        return;
      }
      
      // Only proceed with hover effects when not dragging
      if (draggingPiece) return;
      
      // Update raycaster with mouse position
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, camera);
      
      // Find intersections with objects
      const intersects = raycaster.intersectObjects(piecesRef.current, true);
      
      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        let current = hoveredObject;
        
        // Walk up the parent chain to find our group
        while (current && !current.userData.pieceId) {
          current = current.parent;
        }
        
        if (current && current.userData.pieceId) {
          setHoveredPiece(current.userData.pieceId);
          canvas.style.cursor = 'grab';
        } else {
          setHoveredPiece(null);
          canvas.style.cursor = 'auto';
        }
      } else {
        setHoveredPiece(null);
        canvas.style.cursor = 'auto';
      }
    };
    
    canvas.addEventListener('pointermove', handlePointerMove);
    
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [camera, draggingPiece, activeDragObject, gl, piecesRef]);
  
  // Update refs when pieces change
  useEffect(() => {
    piecesRef.current = [];
  }, [pieceTypesWithCount]);
  
  return (
    <group ref={groupRef} position={[0, 0, -4]}>
      {/* Show one piece per type with count */}
      {pieceTypesWithCount.map((piece) => {
        const position = piecePositions[piece.id] || [0, 0, 0];
        
        return (
          <group 
            key={piece.id}
            position={position}
            userData={{ 
              pieceId: piece.id,
              pieceType: piece.type,
              pieceColor: piece.color
            }}
            ref={(el) => {
              if (el) piecesRef.current.push(el);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!draggingPiece) {
                handleDragStart(e, piece.id);
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (!draggingPiece) {
                handleDragStart(e, piece.id);
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (draggingPiece) {
                handleDragEnd(e);
              }
            }}
            onPointerMissed={() => {
              if (draggingPiece) {
                handleDragEnd({});
              }
            }}
          >
            <Piece
              type={piece.type}
              color={piece.color}
              value={piece.value}
              scale={[0.7, 0.7, 0.7]}
              visible={true}
            />
            
            {/* Show glow effect when hovered */}
            {hoveredPiece === piece.id && !draggingPiece && (
              <mesh position={[0, 0.1, 0]}>
                <circleGeometry args={[0.5, 16]} />
                <meshBasicMaterial 
                  color={0xffff00}
                  transparent={true}
                  opacity={0.5}
                />
              </mesh>
            )}
            
            {/* Show point value and count below the piece using HTML */}
            <Html position={[0, -0.5, 0]} center>
              <div style={{ 
                color: 'white', 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div>{piece.value} pts</div>
                <div>x{piece.count}</div>
              </div>
            </Html>
          </group>
        );
      })}
      
      {/* Render the piece being dragged as a duplicate */}
      {draggingPiece && draggedPieceData && activeDragObject && (
        <group position={activeDragObject.position.toArray()}>
          <Piece
            type={draggedPieceData.type}
            color={draggedPieceData.color}
            value={draggedPieceData.value}
            scale={[0.7, 0.7, 0.7]}
            visible={true}
          />
        </group>
      )}
      
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