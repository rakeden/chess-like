import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import Square from './Square'
import Piece from './Piece'
import { fenToBoard } from '@/lib/stockfish-utils';

const BOARD_SIZE = 5
const SQUARE_SIZE = 1

// Helper function to map row/col to 3D position
const mapPositionToBoard = (row, col) => {
  return [col - 2, 0.1, row - 2];
};

export default function Board({ 
  fen,
  playerColor = 'white',
  isPreparationPhase = false,
  onPieceHover = () => {},
  onSquareHover = () => {},
  registerDraggable,
  isDragging,
  draggingPiece
}) {
  const boardRef = useRef();
  
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
              onHover={() => onSquareHover({ row, col })}
              size={SQUARE_SIZE}
            />
          );
        })
      )}

      {/* Render pieces */}
      {pieces.map((piece) => {
        if (!piece?.position) return null;
        
        const piecePosition = mapPositionToBoard(piece.position.row, piece.position.col);
        const isDraggable = isPreparationPhase && piece.color === playerColor;
        
        return (
          <Piece
            key={piece.id}
            id={piece.id}
            type={piece.type}
            color={piece.color}
            position={piecePosition}
            scale={[12, 12, 12]}
            onHover={() => onPieceHover(piece)}
            isInteractive={isDraggable}
            ref={ref => isDraggable && registerDraggable?.(piece.id, ref, 'board')}
          />
        );
      })}
    </group>
  );
} 