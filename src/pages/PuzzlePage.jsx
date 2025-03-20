import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameContext, GAME_PHASES } from '@/lib/game-context';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Board from '@/components/game/Board';
import PieceBench from '@/components/game/PieceBench';
import { PlayerTurnCard } from '@/components/game/PlayerTurnCard';
import { PreparationTimer } from '@/components/game/PreparationTimer';
import { GamePhaseIndicator } from '@/components/game/GamePhaseIndicator';
import { getPuzzleById } from '@/lib/puzzles';
import { DragControls } from '@react-three/drei';
import * as THREE from 'three';

// Separated component for FEN display
const FenDisplay = ({ currentFEN, showFEN, setShowFEN }) => {
  const [copied, setCopied] = useState(false);
  
  const copyFEN = () => {
    navigator.clipboard.writeText(currentFEN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div className="absolute top-20 right-4 z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm"
            variant="outline"
            className="h-8 bg-black/50 text-white hover:bg-black/70"
            onClick={() => setShowFEN(!showFEN)}
          >
            {showFEN ? 'Hide FEN' : 'Show FEN'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Show/hide the FEN notation</p>
        </TooltipContent>
      </Tooltip>
      
      {showFEN && (
        <div className="mt-2 bg-black/50 text-white p-2 rounded-md flex items-center">
          <div className="mr-2 font-mono text-xs truncate max-w-[250px]">
            {currentFEN}
          </div>
          <Button 
            size="sm"
            variant="ghost"
            className="h-6 ml-auto text-xs"
            onClick={copyFEN}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      )}
    </div>
  );
};

// Game over screen as a separate component
const GameOverScreen = ({ onTryAgain, onBackToPuzzles }) => (
  <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
    <div className="bg-card p-6 rounded-lg shadow-md max-w-md">
      <h2 className="text-2xl font-bold mb-4">Game Over</h2>
      <p className="mb-4">The puzzle has ended.</p>
      <div className="flex flex-col gap-3">
        <Button 
          size="lg" 
          className="w-full"
          onClick={onTryAgain}
        >
          Try Again
        </Button>
        <Button 
          variant="outline"
          size="lg" 
          className="w-full"
          onClick={onBackToPuzzles}
        >
          Back to Puzzles
        </Button>
      </div>
    </div>
  </div>
);

// Unified Drag Control component that wraps both Board and PieceBench
const DragControlWrapper = ({ children }) => {
  const { 
    gamePhase, 
    GAME_PHASES, 
    playerColor,
    placePiece,
    movePiece,
    pausePreparation,
    resumePreparation
  } = useGameContext();
  
  const { camera, gl, scene } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [draggedPieceData, setDraggedPieceData] = useState(null);
  const draggableRefs = useRef({});
  
  // Register draggable refs from children components
  const registerDraggable = (id, ref, type = 'board') => {
    if (ref) {
      draggableRefs.current[id] = { ref, type };
    }
  };
  
  // Get all draggable objects
  const draggableObjects = Object.values(draggableRefs.current)
    .filter(item => 
      item.ref && 
      item.ref.userData && 
      item.ref.userData.pieceColor === playerColor &&
      (gamePhase === GAME_PHASES.PREPARATION || gamePhase === GAME_PHASES.PLAYING)
    )
    .map(item => item.ref);
  
  // Handle dragstart event
  const handleDragStart = (e) => {
    const obj = e.object;
    document.body.style.cursor = 'grabbing';
    setIsDragging(true);
    
    if (obj.userData.selectionPiece) {
      // This is a piece from the selection area
      const pieceData = obj.userData.pieceData;
      if (pieceData) {
        setDraggingPiece(pieceData.id);
        setDraggedPieceData(pieceData);
        pausePreparation();
      }
    } else {
      // This is a piece from the board
      setDraggingPiece(obj.userData.pieceId);
    }
  };
  
  // Handle drag event to lock the y-position based on where it came from
  const handleDrag = (e) => {
    if (e.object) {
      // Use consistent Y position for all dragged objects
      e.object.position.y = 0.1;
      
      // Apply tilt effect while dragging
      e.object.rotation.y = THREE.MathUtils.degToRad(5);
    }
  };
  
  // Handle dragend event
  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    setIsDragging(false);
    const obj = e.object;
    
    // Reset rotation when drag ends
    obj.rotation.y = 0;
    
    if (!draggingPiece) {
      if (draggedPieceData) resumePreparation();
      return;
    }
    
    // Use raycasting to find what's under the piece
    const raycaster = new THREE.Raycaster();
    
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
      
      // Check if cell data is valid
      if (cellData.row !== undefined && cellData.col !== undefined) {
        if (obj.userData.selectionPiece && gamePhase === GAME_PHASES.PREPARATION) {
          // Place a new piece from selection to board
          placePiece(draggingPiece, { 
            row: cellData.row, 
            col: cellData.col 
          });
        } else if (gamePhase === GAME_PHASES.PLAYING) {
          // Move an existing piece on the board
          movePiece(draggingPiece, { 
            row: cellData.row, 
            col: cellData.col 
          });
        }
      }
    } else {
      // If dropped outside the board, reset position
      // The actual reset logic will be handled by the respective components
    }
    
    // Reset dragging state
    setDraggingPiece(null);
    setDraggedPieceData(null);
    if (gamePhase === GAME_PHASES.PREPARATION) {
      resumePreparation();
    }
  };
  
  return (
    <group>
      {/* DragControls for all pieces */}
      {draggableObjects.length > 0 && (
        <DragControls
          transformGroup
          args={[draggableObjects, camera, gl.domElement]}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      )}
      
      {/* Render children with register function */}
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          registerDraggable, 
          isDragging,
          draggingPiece 
        })
      )}
    </group>
  );
};

// Camera and lighting setup as a separate component
const SceneSetup = ({ children, isDraggingPiece }) => {
  const controlsRef = useRef(null);
  
  return (
    <Canvas 
      camera={{ 
        position: [0, 4, 8],
        fov: 45,
        near: 0.1,
        far: 1000
      }}
      shadows
    >
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableRotate={!isDraggingPiece}
        enableZoom={!isDraggingPiece}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={8}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
        target={[0, 0, 0]}
      />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[3, 8, 4]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-2, 3, -2]}
        intensity={0.3}
        castShadow={false}
      />
      {children}
    </Canvas>
  );
};

export default function PuzzlePage() {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const { 
    gamePhase, 
    GAME_PHASES, 
    playerColor,
    currentTurn,
    pieces,
    board,
    startPuzzle,
    resetGame
  } = useGameContext();
  
  const [showFEN, setShowFEN] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);
  
  // Load the puzzle when component mounts or puzzleId changes
  useEffect(() => {
    const loadPuzzle = () => {
      if (puzzleId) {
        const puzzle = getPuzzleById(puzzleId);
        if (puzzle) {
          setPuzzleData(puzzle);
          startPuzzle(puzzle);
        } else {
          navigate('/puzzles');
        }
      }
    };
    
    loadPuzzle();
  }, [puzzleId, startPuzzle, navigate]);
  
  // Handler functions
  const handleBackToPuzzles = () => {
    resetGame();
    navigate('/puzzles');
  };
  
  const handleTryAgain = () => {
    if (puzzleData) {
      startPuzzle(puzzleData);
    }
  };
  
  // Render game over screen if in GAME_OVER phase
  if (gamePhase === GAME_PHASES.GAME_OVER) {
    return (
      <GameOverScreen 
        onTryAgain={handleTryAgain}
        onBackToPuzzles={handleBackToPuzzles}
      />
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      {/* Top UI components */}
      {gamePhase === GAME_PHASES.PLAYING ? <PlayerTurnCard /> : <PreparationTimer />}
      <GamePhaseIndicator />
      
      {/* Show opponent's turn message when relevant */}
      {gamePhase === GAME_PHASES.PLAYING && currentTurn !== playerColor && (
        <div className="absolute top-20 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
          Opponent's turn
        </div>
      )}
      
      {/* FEN display (only in preparation phase) */}
      {gamePhase === GAME_PHASES.PREPARATION && puzzleData && (
        <FenDisplay 
          currentFEN={puzzleData.fen}
          showFEN={showFEN}
          setShowFEN={setShowFEN}
        />
      )}
      
      {/* Back button */}
      <div className="absolute top-20 left-4 z-10">
        <Button 
          size="sm"
          variant="outline"
          className="h-8 bg-black/50 text-white hover:bg-black/70"
          onClick={handleBackToPuzzles}
        >
          Back to Puzzles
        </Button>
      </div>
      
      {/* 3D Scene */}
      <div className="w-full h-full pb-24">
        <SceneSetup isDraggingPiece={isDraggingPiece}>
          <DragControlWrapper>
            <group position={[0, 0, 0]}>
              <Board 
                fen={puzzleData?.fen}
                playerColor={playerColor}
                isPreparationPhase={gamePhase === GAME_PHASES.PREPARATION}
              />
            </group>
            
            {gamePhase === GAME_PHASES.PREPARATION && (
              <group position={[0, 0.4, 6]}>
                <PieceBench 
                  maxValue={puzzleData?.maxPlayerValue || 0}
                  onDragStart={() => setIsDraggingPiece(true)} 
                  onDragEnd={() => setIsDraggingPiece(false)} 
                />
              </group>
            )}
          </DragControlWrapper>
        </SceneSetup>
      </div>
    </div>
  );
} 