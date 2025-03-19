import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGameContext } from '@/lib/game-context'
import useRaycaster from '@/lib/useRaycaster'
import * as THREE from 'three'
import { boardToFEN } from '@/lib/stockfish-utils'
import Piece from './Piece'
import Square from './Square'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

// Helper function to get chess coordinate notation
const getChessCoordinate = (row, col) => {
  const letters = ['E', 'D', 'C', 'B', 'A']; // Reversed to have A at the bottom for white
  return `${letters[row]}${col + 1}`;
};

// Helper function to map row/col to 3D position
const mapPositionToBoard = (row, col) => {
  // Adjust position to center the piece on a square
  // For 5x5 board with 1x1 squares, we offset by 2 to center (0,0,0) on the middle
  // Use y=0.5 to ensure pieces sit correctly on the board surface
  return [col - 2, 0.5, row - 2];
};

export default function Board() {
  const { gl } = useThree();
  
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
  
  // Ref for the board
  const boardRef = useRef();
  
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
  
  // Gentle floating animation for the board
  useFrame(({ clock }) => {
    if (boardRef.current) {
      boardRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
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

  // Handle piece drag start
  const handlePieceDragStart = (pieceId) => {
    console.log("Piece drag started:", pieceId);
  };
  
  // Handle piece dragging
  const handlePieceDrag = (e, dragData) => {
  };
  
  // Log FEN updates for debugging
  useEffect(() => {
    if (currentFEN) {
      console.log("Board FEN updated:", currentFEN);
    }
  }, [currentFEN]);
  
  // Handle piece drop
  const handlePieceDrop = (e, dropData) => {
    if (!dropData || !dropData.cellData) {
      console.log("Board: Piece dropped outside the board");
      return;
    }
    
    const { cellData, pieceData } = dropData;
    console.log("Board: Piece dropped:", { 
      pieceId: pieceData.id, 
      row: cellData.row, 
      col: cellData.col 
    });
    
    if (gamePhase === GAME_PHASES.PREPARATION) {
      // In preparation phase, place the piece directly
      placePiece(pieceData.id, { row: cellData.row, col: cellData.col });
    } else if (gamePhase === GAME_PHASES.PLAYING) {
      // In playing phase, move the piece
      movePiece(pieceData.id, { row: cellData.row, col: cellData.col });
    }
  };

  return (
    <group ref={boardRef}>
      {/* Board base */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.2, 5.2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

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
                color={isLight ? '#f0d9b5' : '#b58863'}
                row={row}
                col={col}
                isHovered={isHovered}
                size={SQUARE_SIZE}
              />
              {/* Coordinate label */}
              <Html
                position={[position[0], 0.01, position[2]]}
                center
                sprite
                transform
                scale={0.15}
                style={{
                  color: isLight ? '#b58863' : '#f0d9b5',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  opacity: 0.8
                }}
              >
                {getChessCoordinate(row, col)}
              </Html>
            </group>
          );
        })
      )}

      {/* Render pieces - use a conditional to ensure piecesToRender is an array */}
      {Array.isArray(piecesToRender) && piecesToRender.map((piece, index) => {
        if (!piece) return null;
        
        // Check if this piece is hovered
        const isHovered = hoveredPiece && hoveredPiece.id === piece.id;
        
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
            scale={[0.8, 0.8, 0.8]}
            visible={!!piece.position}
            draggable={isDraggable}
            onDragStart={() => handlePieceDragStart(piece.id)}
            onDrag={handlePieceDrag}
            onDragEnd={handlePieceDrop}
          />
        );
      })}
    </group>
  );
} 