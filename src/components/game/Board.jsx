import { useRef, useEffect, useMemo, useState } from 'react'
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

// Helper function to map row/col to 3D position
const mapPositionToBoard = (row, col) => {
  // Adjust position to center the piece on a square
  // For 5x5 board with 1x1 squares, we offset by 2 to center (0,0,0) on the middle
  // Use y=0.1 to ensure pieces sit correctly on the board surface at ground level
  return [col - 2, 0.1, row - 2];
};

export default function Board({ registerDraggable, isDragging, draggingPiece }) {
  const { gl, scene, camera } = useThree();
  const boardRef = useRef();
  const pieceRefs = useRef({});
  
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

  // Register a piece ref with the parent DragControlWrapper
  const registerPiece = (id, ref) => {
    if (ref) {
      pieceRefs.current[id] = ref;
      
      // If registerDraggable function was provided by DragControlWrapper,
      // use it to register this piece for dragging
      if (registerDraggable && ref.userData && ref.userData.pieceColor === playerColor) {
        registerDraggable(id, ref, 'board');
      }
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
        
        // Check if this piece is being dragged
        const isBeingDragged = draggingPiece === piece.id;
        
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
            isBeingDragged={isBeingDragged}
            isDraggable={isDraggable}
            isHovered={isHovered}
          />
        );
      })}
    </group>
  );
} 