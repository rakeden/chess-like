import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameContext } from '@/lib/game-context'
import * as THREE from 'three'
import Piece from './Piece'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

function Square({ position, color, row, col, isHovered }) {
  // Add a subtle glow effect when hovered during preparation
  const glowRef = useRef();
  
  // Add animation for the glow
  useFrame(({ clock }) => {
    if (glowRef.current && isHovered) {
      glowRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.05);
    }
  });
  
  return (
    <group>
      <mesh 
        position={position} 
        receiveShadow
        userData={{ isCell: true, row, col }}
      >
        <boxGeometry args={[SQUARE_SIZE, 0.1, SQUARE_SIZE]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Add highlight effect for valid drop zones */}
      {isHovered && (
        <mesh 
          ref={glowRef}
          position={[position[0], position[1] + 0.06, position[2]]}
          userData={{ isCell: true, row, col }}
        >
          <boxGeometry args={[SQUARE_SIZE * 1.05, 0.01, SQUARE_SIZE * 1.05]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

export default function Board() {
  const { scene, raycaster, camera, gl } = useThree();
  const [hoveredCell, setHoveredCell] = useState(null);
  
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

  // Add raycasting to detect hovered cells during preparation
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.PREPARATION) return;
    
    const canvas = gl.domElement;
    
    const handleMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      const cellIntersect = intersects.find(intersect => 
        intersect.object.userData && intersect.object.userData.isCell
      );
      
      if (cellIntersect) {
        const { row, col } = cellIntersect.object.userData;
        setHoveredCell({ row, col });
      } else {
        setHoveredCell(null);
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gamePhase, GAME_PHASES.PREPARATION, gl, raycaster, scene, camera]);
  
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
          const isHovered = hoveredCell && 
            hoveredCell.row === row && 
            hoveredCell.col === col && 
            gamePhase === GAME_PHASES.PREPARATION;
          
          return (
            <Square
              key={`${row}-${col}`}
              position={position}
              color={isLight ? '#f0d9b5' : '#b58863'}
              row={row}
              col={col}
              isHovered={isHovered}
            />
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