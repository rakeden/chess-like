import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Application, extend } from '@pixi/react';
import { Container } from 'pixi.js';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Board from '@/components/game/Board';
import PieceBench from '@/components/game/PieceBench';
import { loadPieceTextures } from '@/utils/pieceTextures';

// Extend the Container component for use in JSX
extend({ Container });

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

export default function PuzzlePage() {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const [showFEN, setShowFEN] = useState(false);
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);
  const [pieceTextures, setPieceTextures] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const boardRef = useRef(null);
  const containerRef = useRef(null);
  
  // Load piece textures when component mounts
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const textures = await loadPieceTextures();
        setPieceTextures(textures);
      } catch (error) {
        console.error('Failed to load piece textures:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTextures();
  }, []);
  
  // Mock data for testing - replace with props or context
  const mockFEN = 'r1k1r/1ppp1/5/5/2K2 w - - 0 1';  // Using puzzle-1 FEN
  const mockPlayerColor = 'white';
  const squareSize = 80;
  
  const handleBackToPuzzles = () => {
    navigate('/puzzles');
  };
  
  // Stage options for Pixi.js
  const stageOptions = {
    antialias: true,
    backgroundAlpha: 0,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-lg">Loading pieces...</div>
      </div>
    );
  }

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
      
      {/* 2D Game Scene using Pixi */}
      <div 
        ref={containerRef} 
        className="w-full h-full pb-24"
      >
        <Application 
          resizeTo={containerRef}
          options={stageOptions}
        >
          <Board 
            ref={boardRef}
            fen={mockFEN}
            playerColor={mockPlayerColor}
            onPieceDragStart={() => setIsDraggingPiece(true)}
            onPieceDragEnd={() => setIsDraggingPiece(false)}
            squareSize={squareSize}
            pieceTextures={pieceTextures}
            containerDimensions={dimensions}
          />
          <PieceBench 
            onPieceDragStart={() => setIsDraggingPiece(true)}
            onPieceDragEnd={() => setIsDraggingPiece(false)}
            boardRef={boardRef}
            squareSize={squareSize}
            pieceTextures={pieceTextures}
          />
        </Application>
      </div>
    </div>
  );
} 