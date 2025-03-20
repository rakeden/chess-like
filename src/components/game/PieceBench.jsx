import React, { useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js'; 
import { TextStyle } from 'pixi.js';
import Piece from './Piece';

// Extend the PIXI components
extend({ Container, Graphics, Text });

const PIECE_SPACING = 80;

// Mock piece data - replace with props in production
const MOCK_PIECES = [
  { id: 'pawn1', type: 'pawn', value: 1 },
  { id: 'knight1', type: 'knight', value: 3 },
  { id: 'bishop1', type: 'bishop', value: 3 },
  { id: 'rook1', type: 'rook', value: 5 },
  { id: 'queen1', type: 'queen', value: 9 }
];

// Bench surface drawing
const BenchSurface = ({ width, title }) => {
  // Draw the bench surface
  const drawBench = React.useCallback(g => {
    g.clear();
    
    // Draw background with slight gradient
    g.beginFill(0x333333, 0.8);
    g.drawRoundedRect(0, 0, width, 100, 10);
    g.endFill();
    
    // Draw highlight line
    g.lineStyle(2, 0x666666, 0.6);
    g.moveTo(10, 15);
    g.lineTo(width - 10, 15);
    g.endFill();
  }, [width]);
  
  // Text style for title
  const titleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: 'bold',
    fill: '#ffffff',
  });
  
  return (
    <>
      <pixiGraphics draw={drawBench} />
      <pixiText 
        text={title}
        style={titleStyle}
        position={[width / 2, 8]}
        anchor={[0.5, 0]}
      />
    </>
  );
};

// Individual piece component with value display
const BenchPiece = ({ 
  piece,
  position,
  playerColor,
  isAffordable,
  onDragStart,
  onDragEnd,
  onPiecePlaced,
  boardRef,
  squareSize
}) => {
  // Text style for value label
  const valueStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'bold',
    fill: isAffordable ? '#ffffff' : '#ff6666',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 1,
  });
  
  // Draw the value background
  const drawValueBg = React.useCallback(g => {
    g.clear();
    g.beginFill(isAffordable ? 0x000000 : 0xff0000, 0.7);
    g.drawRoundedRect(-15, -10, 30, 20, 5);
    g.endFill();
  }, [isAffordable]);
  
  return (
    <pixiContainer position={position}>
      <Piece
        id={piece.id}
        type={piece.type}
        color={playerColor}
        position={[0, 0]}
        isInteractive={isAffordable}
        isDisabled={!isAffordable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onPiecePlaced={(data) => onPiecePlaced({ ...data, value: piece.value })}
        boardRef={boardRef}
        squareSize={squareSize}
      />
      
      {/* Value display */}
      <pixiContainer position={[0, 30]}>
        <pixiGraphics draw={drawValueBg} />
        <pixiText
          text={piece.value.toString()}
          style={valueStyle}
          anchor={0.5}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default function PieceBench({ 
  playerColor = 'white',
  onPieceDragStart,
  onPieceDragEnd,
  onPiecePlaced,
  remainingPoints = 20,
  boardRef,
  squareSize = 80
}) {
  const [benchWidth, setBenchWidth] = useState(500);
  const [piecePositions, setPiecePositions] = useState({});
  
  // Handle window resize for responsive bench
  useEffect(() => {
    const handleResize = () => {
      setBenchWidth(Math.min(window.innerWidth * 0.8, 600));
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Initialize positions for pieces
  useEffect(() => {
    const positions = {};
    const totalPieces = MOCK_PIECES.length;
    const totalWidth = totalPieces * PIECE_SPACING;
    const startX = -totalWidth / 2 + PIECE_SPACING / 2;
    
    MOCK_PIECES.forEach((piece, index) => {
      positions[piece.id] = [
        startX + (index * PIECE_SPACING),
        0
      ];
    });
    
    setPiecePositions(positions);
  }, []);
  
  const title = `Available Pieces (${remainingPoints} points remaining)`;
  
  return (
    <pixiContainer 
      position={[window.innerWidth / 2, window.innerHeight - 150]}
      pivot={[benchWidth / 2, 0]}
    >
      <BenchSurface width={benchWidth} title={title} />
      
      {/* Render all piece types */}
      {MOCK_PIECES.map((piece) => {
        const position = piecePositions[piece.id] || [0, 30];
        const isAffordable = piece.value <= remainingPoints;
        
        return (
          <BenchPiece
            key={piece.id}
            piece={piece}
            position={position}
            playerColor={playerColor}
            isAffordable={isAffordable}
            onDragStart={onPieceDragStart}
            onDragEnd={onPieceDragEnd}
            onPiecePlaced={onPiecePlaced}
            boardRef={boardRef}
            squareSize={squareSize}
          />
        );
      })}
    </pixiContainer>
  );
} 