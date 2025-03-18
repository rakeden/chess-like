import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
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
    currentMaxValue
  } = useGameContext();
  
  const { scene, camera, raycaster, mouse, gl } = useThree();
  const groupRef = useRef();
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [dragPosition, setDragPosition] = useState([0, 0, 0]);
  
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
  
  // Move these handlers inside useEffect
  useEffect(() => {
    if (!groupRef.current || !gl) return;
    
    const canvas = gl.domElement;
    let isMouseDown = false;
    
    // Handle pointer move to detect hovering over pieces
    const handlePointerMove = (event) => {
      // Convert mouse coordinates to normalized device coordinates
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update raycaster with mouse position
      raycaster.setFromCamera({ x, y }, camera);
      
      // If we're dragging a piece, update its position
      if (draggingPiece) {
        // Get a point in 3D space from the camera through the mouse position
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const targetPosition = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, targetPosition);
        
        // Update the drag position
        setDragPosition([targetPosition.x, targetPosition.y, -3]);
        return;
      }
      
      // Find intersections with piece meshes
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Check if we're hovering over a piece
      const hoveredObject = intersects.find(intersect => {
        // Walk up the parent chain to find the piece group
        let current = intersect.object;
        while (current && current !== scene) {
          // Check if this is one of our piece groups with userData.pieceId
          if (current.userData && current.userData.pieceId) {
            return true;
          }
          current = current.parent;
        }
        return false;
      });
      
      if (hoveredObject) {
        // Find the piece group with userData
        let current = hoveredObject.object;
        while (current && current !== scene) {
          if (current.userData && current.userData.pieceId) {
            setHoveredPiece(current.userData.pieceId);
            gl.domElement.style.cursor = 'grab';
            break;
          }
          current = current.parent;
        }
      } else {
        setHoveredPiece(null);
        gl.domElement.style.cursor = 'auto';
      }
    };
    
    // Handle mouse down to start dragging
    const handleMouseDown = (event) => {
      isMouseDown = true;
      
      if (hoveredPiece) {
        // Find the piece type that was clicked
        const hoveredPieceType = pieceTypesWithCount.find(p => p.id === hoveredPiece);
        
        if (hoveredPieceType && hoveredPieceType.count > 0) {
          // Get the first available piece ID of this type
          const availablePieceId = hoveredPieceType.allPieceIds[0];
          setDraggingPiece(availablePieceId);
          gl.domElement.style.cursor = 'grabbing';
          
          // Set initial drag position
          const x = (event.clientX / window.innerWidth) * 2 - 1;
          const y = -(event.clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera({ x, y }, camera);
          
          const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const targetPosition = new THREE.Vector3();
          raycaster.ray.intersectPlane(planeZ, targetPosition);
          
          setDragPosition([targetPosition.x, targetPosition.y, -3]);
        }
      }
    };
    
    // Handle mouse up to stop dragging and potentially place a piece
    const handleMouseUp = (event) => {
      isMouseDown = false;
      
      if (draggingPiece) {
        // Convert mouse coordinates to normalized device coordinates
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster with mouse position
        raycaster.setFromCamera({ x, y }, camera);
        
        // Find intersections with board cells
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Check if we're dropping on a board cell
        const boardIntersect = intersects.find(intersect => {
          // Check if this is one of the board cells
          return intersect.object.userData && intersect.object.userData.isCell;
        });
        
        if (boardIntersect) {
          const { row, col } = boardIntersect.object.userData;
          placePiece(draggingPiece, { row, col });
        }
        
        // Reset dragging state
        setDraggingPiece(null);
        gl.domElement.style.cursor = hoveredPiece ? 'grab' : 'auto';
      }
    };
    
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hoveredPiece, draggingPiece, gl, raycaster, scene, camera, placePiece, pieceTypesWithCount]);
  
  return (
    <group ref={groupRef} position={[0, 0, -4]}>
      {/* Show one piece per type with count */}
      {pieceTypesWithCount.map((piece) => {
        const position = piecePositions[piece.id] || [0, 0, 0];
        
        return (
          <group 
            key={piece.id}
            position={position}
            userData={{ pieceId: piece.id }}
          >
            <Piece
              type={piece.type}
              color={piece.color}
              value={piece.value}
              scale={[0.7, 0.7, 0.7]}
              visible={true}
            />
            
            {/* Show glow effect when hovered */}
            {hoveredPiece === piece.id && (
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
      
      {/* Render the piece being dragged */}
      {draggingPiece && (
        <group position={dragPosition}>
          {playerPieces.map((piece) => {
            if (piece.id === draggingPiece) {
              return (
                <Piece
                  key={piece.id}
                  type={piece.type}
                  color={piece.color}
                  value={piece.value}
                  scale={[0.7, 0.7, 0.7]}
                  visible={true}
                />
              );
            }
            return null;
          })}
        </group>
      )}
    </group>
  );
} 