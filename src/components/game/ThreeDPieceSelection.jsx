import { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html, DragControls } from '@react-three/drei';
import { useGameContext, PIECE_VALUES } from '@/lib/game-context';
import Piece from './Piece';
import * as THREE from 'three';

const PIECE_SPACING = 0.9;
const ROW_HEIGHT = 1.0;

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
  const handlePieceDragStart = (e, pieceId) => {
    // If a piece is already being dragged, don't allow dragging another
    if (draggingPiece) {
      return;
    }
    
    // Find the piece type that was clicked
    const pieceType = pieceTypesWithCount.find(p => p.id === pieceId);
    
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
      
      // Store the start position for resetting if needed
      setStartDragPosition(piecePositions[pieceId]);
      
      // Pause preparation timer while dragging
      pausePreparation();
      
      // Call parent's onDragStart callback if provided
      if (onDragStart) {
        onDragStart();
      }
    }
  };
  
  // Handle piece dragging
  const handlePieceDrag = (e, dragData) => {
    // This is handled by DragControls automatically
  };
  
  // Handle drag end
  const handlePieceDrop = (e, dropData) => {
    if (!draggingPiece || !draggedPieceData) {
      console.log("Drop rejected: No dragging piece data available");
      resumePreparation();
      if (onDragEnd) onDragEnd();
      return;
    }
    
    if (dropData && dropData.cellData) {
      const { cellData } = dropData;
      
      // Place the piece if it's a valid cell
      if (cellData.row !== undefined && cellData.col !== undefined) {
        console.log(`Placing piece ${draggingPiece} at row:${cellData.row}, col:${cellData.col}`);
        placePiece(draggingPiece, { 
          row: cellData.row, 
          col: cellData.col 
        });
      } else {
        console.warn("Invalid cell data in drop event:", cellData);
      }
    } else {
      console.log("Piece dropped outside board or no valid cell detected");
    }
    
    // Reset dragging state and resume timer
    setDraggingPiece(null);
    setDraggedPieceData(null);
    setActiveDragObject(null);
    setStartDragPosition(null);
    resumePreparation();
    
    // Call parent's onDragEnd callback if provided
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Set up pointer events for hover effects
  useEffect(() => {
    if (!groupRef.current || !gl) return;
    
    const canvas = gl.domElement;
    
    // Handle hover effects
    const handlePointerMove = (event) => {
      // Only proceed with hover effects when not dragging
      if (draggingPiece) return;
      
      // Convert mouse coordinates to normalized device coordinates
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update raycaster with mouse position
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, camera);
      
      // Find intersections with objects
      const intersects = raycaster.intersectObjects(piecesRef.current, true);
      
      if (intersects.length > 0) {
        // Sort intersections by distance, closest first
        intersects.sort((a, b) => a.distance - b.distance);
        
        // Take only the closest intersection
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
  }, [camera, draggingPiece, gl, piecesRef]);
  
  // Update refs when pieces change
  useEffect(() => {
    piecesRef.current = [];
  }, [pieceTypesWithCount]);
  
  return (
    <group ref={groupRef} position={[0, -0.2, -4]}>
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
          >
            <Piece
              type={piece.type}
              color={piece.color}
              value={piece.value}
              scale={[12, 12, 12]}
              visible={true}
              draggable={true}
              onDragStart={(e) => {
                handlePieceDragStart(e, piece.id);
              }}
              onDrag={handlePieceDrag}
              onDragEnd={handlePieceDrop}
              id={piece.id}
            />
            
            {/* Show available count */}
            <Html
              position={[0, -0.5, 0]}
              center
              sprite
              transform
              scale={0.2}
              style={{
                background: 'rgba(0,0,0,0.7)',
                padding: '2px 8px',
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