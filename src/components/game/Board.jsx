import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, DragControls } from '@react-three/drei'
import { useGameContext } from '@/lib/game-context'
import useRaycaster from '@/lib/useRaycaster'
import * as THREE from 'three'
import { boardToFEN } from '@/lib/stockfish-utils'
import Piece from './Piece'
import Square from './Square'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

// Helper function to map row/col to 3D position
const mapPositionToBoard = (row, col) => {
  // Adjust position to center the piece on a square
  // For 5x5 board with 1x1 squares, we offset by 2 to center (0,0,0) on the middle
  // Use y=0.1 to ensure pieces sit correctly on the board surface at ground level
  return [col - 2, 0.1, row - 2];
};

export default function Board() {
  const { gl, scene, camera } = useThree();
  const boardRef = useRef();
  const pieceRefs = useRef({});
  const [activeDragPiece, setActiveDragPiece] = useState(null);
  
  // Get data from context
  const context = useGameContext();
  
  // Create a safe context with fallbacks
  const safeContext = {
    pieces: Array.isArray(context?.pieces) ? context.pieces : [],
    playerColor: context?.playerColor || 'white',
    opponentPieces: Array.isArray(context?.opponentPieces) ? context.opponentPieces : [],
    gamePhase: context?.gamePhase || 'menu',
    GAME_PHASES: context?.GAME_PHASES || {
      MENU: 'menu',
      PREPARATION: 'preparation',
      PLAYING: 'playing',
      GAME_OVER: 'gameOver'
    },
    selectPiece: context?.selectPiece || (() => {}),
    selectCell: context?.selectCell || (() => {}),
    movePiece: context?.movePiece || (() => {}),
    placePiece: context?.placePiece || (() => {}),
    currentFEN: context?.currentFEN || ''
  };
  
  const { 
    pieces, 
    playerColor, 
    opponentPieces, 
    gamePhase, 
    GAME_PHASES,
    selectPiece,
    selectCell,
    movePiece,
    placePiece,
    currentFEN
  } = safeContext;
  
  // Use the raycaster hook to detect hovering over pieces and cells
  const { hoveredCell, hoveredPiece } = useRaycaster({
    types: ['cell', 'piece'],
    gamePhase,
    allowedPhases: [GAME_PHASES.PREPARATION, GAME_PHASES.PLAYING]
  });
  
  // Log when hoveredPiece changes
  useEffect(() => {
    if (hoveredPiece) {
      console.log('Board - Hovering piece:', hoveredPiece);
    }
  }, [hoveredPiece]);
  
  // Rotate board if player is black
  useEffect(() => {
    if (boardRef.current) {
      if (playerColor === 'black') {
        boardRef.current.rotation.y = Math.PI;
      } else {
        boardRef.current.rotation.y = 0;
      }
    }
  }, [playerColor]);
  
  // Gentle floating animation for the board - reduced amplitude
  useFrame(({ clock }) => {
    if (boardRef.current) {
      boardRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    }
  });
  
  // Combine player and opponent pieces
  const piecesToRender = useMemo(() => {
    const allPieces = [...(pieces || [])];
    
    // Only show opponent pieces during PLAYING or GAME_OVER phases
    if (gamePhase === GAME_PHASES.PLAYING || gamePhase === GAME_PHASES.GAME_OVER) {
      allPieces.push(...(opponentPieces || []));
    }
    
    return allPieces;
  }, [pieces, opponentPieces, gamePhase, GAME_PHASES.PLAYING, GAME_PHASES.GAME_OVER]);

  // Set up drag controls after render
  useEffect(() => {
    // Only create draggable controls for player pieces
    const draggablePieces = Object.values(pieceRefs.current).filter(ref => 
      ref && ref.userData && 
      ref.userData.pieceColor === playerColor &&
      (gamePhase === GAME_PHASES.PREPARATION || gamePhase === GAME_PHASES.PLAYING)
    );
    
    if (draggablePieces.length > 0 && camera && gl) {
      // Create the controls instance - this approach won't work
      // We'll add a declarative DragControls in the render method instead
    }
  }, [camera, gl, scene, gamePhase, playerColor, placePiece, movePiece, piecesToRender]);

  // Handle dragstart event
  const handleDragStart = (e) => {
    const obj = e.object;
    setActiveDragPiece(obj.userData.pieceId);
    document.body.style.cursor = 'grabbing';
  };

  // Handle drag event
  const handleDrag = (e) => {
    if (e.object) {
      e.object.position.y = 0.1; // Lock the y-position
    }
  };

  // Handle dragend event
  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    const obj = e.object;
    const pieceId = obj.userData.pieceId;
    
    // Use raycasting to find the cell under the piece
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1); // Use layer 1 for board cells
    
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
      
      // Calculate the center position of the cell
      const centerX = cellData.col - 2;
      const centerZ = cellData.row - 2;
      
      // Snap the piece to the center of the cell
      obj.position.set(centerX, 0.1, centerZ);
      
      if (gamePhase === GAME_PHASES.PREPARATION) {
        // In preparation phase, place the piece
        placePiece(pieceId, { row: cellData.row, col: cellData.col });
      } else if (gamePhase === GAME_PHASES.PLAYING) {
        // In playing phase, move the piece
        movePiece(pieceId, { row: cellData.row, col: cellData.col });
      }
    } else {
      // If dropped outside the board, move back to original position
      const piece = piecesToRender.find(p => p.id === pieceId);
      if (piece && piece.position) {
        const originalPosition = mapPositionToBoard(piece.position.row, piece.position.col);
        obj.position.set(originalPosition[0], originalPosition[1], originalPosition[2]);
      }
    }
    
    setActiveDragPiece(null);
  };

  // Get the draggable objects for DragControls
  const draggableObjects = useMemo(() => {
    return Object.values(pieceRefs.current).filter(ref => 
      ref && ref.userData && 
      ref.userData.pieceColor === playerColor &&
      (gamePhase === GAME_PHASES.PREPARATION || gamePhase === GAME_PHASES.PLAYING)
    );
  }, [playerColor, gamePhase]);

  // Register a piece ref
  const registerPiece = (id, ref) => {
    if (ref) {
      pieceRefs.current[id] = ref;
    }
  };

  return (
    <group ref={boardRef}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Segmented Axes with Labels */}
      <group>
        {/* X-axis segments (red) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <group key={`x-segment-${i}`}>
            <mesh position={[i, 0, 0]}>
              <boxGeometry args={[1, 0.02, 0.02]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <Html position={[i, -0.2, 0]} center>
              <div style={{ color: 'red', fontSize: '8px' }}>{i}</div>
            </Html>
          </group>
        ))}
        
        {/* Y-axis segments (green) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <group key={`y-segment-${i}`}>
            <mesh position={[0, i, 0]}>
              <boxGeometry args={[0.02, 1, 0.02]} />
              <meshStandardMaterial color="green" />
            </mesh>
            <Html position={[-0.2, i, 0]} center>
              <div style={{ color: 'green', fontSize: '8px' }}>{i}</div>
            </Html>
          </group>
        ))}
        
        {/* Z-axis segments (blue) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <group key={`z-segment-${i}`}>
            <mesh position={[0, 0, i]}>
              <boxGeometry args={[0.02, 0.02, 1]} />
              <meshStandardMaterial color="blue" />
            </mesh>
            <Html position={[0, -0.2, i]} center>
              <div style={{ color: 'blue', fontSize: '8px' }}>{i}</div>
            </Html>
          </group>
        ))}
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

      {/* Board cells */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          const position = [col - 2, 0, row - 2];
          
          // Check if this cell is hovered
          const isHovered = hoveredCell && 
            hoveredCell.row === row && 
            hoveredCell.col === col && 
            (gamePhase === GAME_PHASES.PREPARATION || gamePhase === GAME_PHASES.PLAYING);
          
          return (
            <group key={`${row}-${col}`}>
              <Square
                position={position}
                color={isLight ? '#FFFFFF' : '#8B8B8B'}
                row={row}
                col={col}
                isHovered={isHovered}
                size={SQUARE_SIZE}
              />
            </group>
          );
        })
      )}

      {/* Render pieces */}
      {Array.isArray(piecesToRender) && piecesToRender.map((piece, index) => {
        if (!piece) return null;
        
        // Check if this piece is hovered
        const isHovered = hoveredPiece && hoveredPiece.id === piece.id;
        
        // Debug hover state
        if (isHovered) {
          console.log(`Board rendering piece ${piece.id} as hovered`);
        }
        
        // Only player pieces should be draggable
        const isDraggable = piece.color === playerColor && 
                          (gamePhase === GAME_PHASES.PREPARATION || gamePhase === GAME_PHASES.PLAYING);
        
        // Use the mapping function to get the position
        const piecePosition = piece.position 
          ? mapPositionToBoard(piece.position.row, piece.position.col)
          : [0, 0, 0];
        
        return (
          <Piece
            key={`${piece.id || index}-${piece.position ? `${piece.position.row}-${piece.position.col}` : 'hand'}`}
            id={piece.id || `piece-${index}`}
            type={piece.type || 'pawn'}
            color={piece.color || 'white'}
            value={piece.value || 0}
            position={piecePosition}
            scale={[12, 12, 12]}
            visible={!!piece.position}
            registerPiece={registerPiece}
            isBeingDragged={activeDragPiece === piece.id}
            isDraggable={isDraggable}
            isHovered={isHovered}
          />
        );
      })}
    </group>
  );
} 