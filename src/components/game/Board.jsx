import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DragControls } from '@react-three/drei'
import * as THREE from 'three'
import Square from './Square'
import Piece from './Piece'
import { fenToBoard } from '@/lib/stockfish-utils';

const BOARD_SIZE = 5
const SQUARE_SIZE = 1

// Helper function to map row/col to 3D position
const mapPositionToBoard = (row, col) => {
  return [col - 2, 0.1, row - 2];
};

const Board = function Board({ 
  fen,
  playerColor = 'white',
  onPieceDragStart,
  onPieceDragEnd,
  onPiecePlaced
}) {
  const boardRef = useRef();
  const draggableRefs = useRef({});
  const { camera, gl, scene } = useThree();
  
  // Parse FEN and create pieces
  const pieces = useMemo(() => {
    const { pieces } = fenToBoard(fen || '5/5/5/5/5 w - - 0 1');
    return pieces;
  }, [fen]);
  
  // Rotate board if player is black
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.rotation.y = playerColor === 'black' ? Math.PI : 0;
    }
  }, [playerColor]);
  
  // Gentle floating animation for the board
  useFrame(({ clock }) => {
    if (boardRef.current) {
      boardRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    }
  });

  // Handle drag events
  const handleDragStart = (e) => {
    document.body.style.cursor = 'grabbing';
    onPieceDragStart?.();
  };

  const handleDrag = (e) => {
    if (e.object) {
      e.object.position.y = 0.1;
      e.object.rotation.y = THREE.MathUtils.degToRad(5);
    }
  };

  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    onPieceDragEnd?.();
    const obj = e.object;
    
    // Reset rotation
    obj.rotation.y = 0;
    
    // Use raycasting to find the target square
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1); // Only check layer 1 (board cells)
    
    const origin = new THREE.Vector3(
      obj.position.x,
      obj.position.y + 1,
      obj.position.z
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
        onPiecePlaced?.({
          pieceId: obj.userData.pieceId,
          pieceType: obj.userData.pieceType,
          from: {
            row: obj.userData.row,
            col: obj.userData.col
          },
          to: {
            row: cellData.row,
            col: cellData.col
          }
        });
      }
    }
  };

  // Get draggable pieces
  const draggableObjects = Object.values(draggableRefs.current)
    .filter(item => item.ref?.userData?.pieceColor === playerColor)
    .map(item => item.ref);

  return (
    <group ref={boardRef}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Board cells */}
      {Array.from({ length: BOARD_SIZE }).map((_, row) =>
        Array.from({ length: BOARD_SIZE }).map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          const position = mapPositionToBoard(row, col);
          
          return (
            <Square
              key={`${row}-${col}`}
              position={position}
              color={isLight ? '#FFFFFF' : '#8B8B8B'}
              row={row}
              col={col}
              size={SQUARE_SIZE}
            />
          );
        })
      )}

      {/* Draggable pieces */}
      <DragControls
        args={[draggableObjects, camera, gl.domElement]}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {/* Render pieces */}
        {pieces.map((piece) => {
          if (!piece?.position) return null;
          
          const piecePosition = mapPositionToBoard(piece.position.row, piece.position.col);
          const isDraggable = piece.color === playerColor;
          
          return (
            <group
              key={piece.id}
              position={piecePosition}
              ref={ref => {
                if (isDraggable && ref) {
                  ref.userData = {
                    pieceId: piece.id,
                    pieceType: piece.type,
                    pieceColor: piece.color,
                    row: piece.position.row,
                    col: piece.position.col
                  };
                  draggableRefs.current[piece.id] = { ref };
                }
              }}
            >
              <Piece
                id={piece.id}
                type={piece.type}
                color={piece.color}
                position={[0, 0, 0]}
                scale={[12, 12, 12]}
                isInteractive={isDraggable}
              />
            </group>
          );
        })}
      </DragControls>
    </group>
  );
};

export default Board; 