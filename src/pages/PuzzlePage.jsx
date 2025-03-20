import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Board from '@/components/game/Board';
import PieceBench from '@/components/game/PieceBench';

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

// Camera and lighting setup as a separate component
const SceneSetup = ({ children, isDraggingPiece }) => {
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
        enablePan={!isDraggingPiece}
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
  const [showFEN, setShowFEN] = useState(false);
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);
  
  // Mock data for testing - replace with props or context
  const mockFEN = '5/5/5/5/5 w - - 0 1';
  const mockPlayerColor = 'white';
  
  const handleBackToPuzzles = () => {
    navigate('/puzzles');
  };

  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      {/* FEN display */}
      <FenDisplay 
        currentFEN={mockFEN}
        showFEN={showFEN}
        setShowFEN={setShowFEN}
      />
      
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
          <group position={[0, 0, 0]}>
            <Board 
              fen={mockFEN}
              playerColor={mockPlayerColor}
              onPieceDragStart={() => setIsDraggingPiece(true)}
              onPieceDragEnd={() => setIsDraggingPiece(false)}
            />
          </group>
          
          <group position={[0, 0.4, 6]}>
            <PieceBench 
              onPieceDragStart={() => setIsDraggingPiece(true)}
              onPieceDragEnd={() => setIsDraggingPiece(false)}
            />
          </group>
        </SceneSetup>
      </div>
    </div>
  );
} 