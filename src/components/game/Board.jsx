import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameContext } from '@/lib/game-context'
import * as THREE from 'three'
import Piece from './Piece'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

function Square({ position, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[SQUARE_SIZE, 0.1, SQUARE_SIZE]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function Board() {
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
    }
  };
  
  const { pieces, playerColor, opponentPieces, gamePhase, GAME_PHASES } = safeContext;
  
  // Debug the values we're using
  console.log("Board using:", {
    piecesLength: pieces.length,
    opponentPiecesLength: opponentPieces.length,
    playerColor,
    gamePhase
  });
  
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

  // Gentle floating animation 
  useFrame(({ clock }) => {
    if (boardRef.current) {
      boardRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  // Determine which pieces to render based on game phase
  const piecesToRender = useMemo(() => {
    try {
      // Start with player pieces
      let visiblePieces = pieces.map(piece => ({
        ...piece,
        color: playerColor
      }));
      
      // Add opponent pieces if in playing or game over phase
      if (gamePhase === GAME_PHASES.PLAYING || gamePhase === GAME_PHASES.GAME_OVER) {
        const visibleOpponentPieces = opponentPieces.map(piece => ({
          ...piece,
          color: playerColor === 'white' ? 'black' : 'white'
        }));
        
        visiblePieces = [...visiblePieces, ...visibleOpponentPieces];
      }
      
      return visiblePieces;
    } catch (error) {
      console.error("Error preparing pieces to render:", error);
      return [];
    }
  }, [pieces, opponentPieces, playerColor, gamePhase, GAME_PHASES]);

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
          return (
            <mesh key={`${row}-${col}`} position={position} receiveShadow>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial color={isLight ? '#f0d9b5' : '#b58863'} />
            </mesh>
          );
        })
      )}

      {/* Render pieces - use a conditional to ensure piecesToRender is an array */}
      {Array.isArray(piecesToRender) && piecesToRender.map((piece, index) => {
        if (!piece) return null;
        
        return (
          <Piece
            key={`${piece.id || index}-${piece.position ? `${piece.position.row}-${piece.position.col}` : 'hand'}`}
            type={piece.type || 'pawn'}
            color={piece.color || 'white'}
            value={piece.value || 0}
            position={
              piece.position 
                ? [piece.position.col - 2, 0.6, piece.position.row - 2] 
                : [0, 0, 0]
            }
            scale={[0.8, 0.8, 0.8]}
            visible={!!piece.position}
          />
        );
      })}
    </group>
  );
} 