import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { fenToBoard } from '@/lib/stockfish-utils';
import Square from './Square';
import Piece from './Piece';

// Extend the PIXI components
extend({ Container, Graphics });

const BOARD_SIZE = 5;
const SQUARE_SIZE = 80;

// Helper function to map row/col to 2D position
const mapPositionToBoard = (row, col) => {
  return [(col * SQUARE_SIZE), (row * SQUARE_SIZE)];
};

const Board = forwardRef(({ 
  fen,
  playerColor = 'white',
  onPieceDragStart,
  onPieceDragEnd,
  onPiecePlaced,
  squareSize = SQUARE_SIZE,
  pieceTextures,
  containerDimensions
}, ref) => {
  const boardRef = useRef();
  const { app } = useApplication();
  const [boardPosition, setBoardPosition] = useState({ x: 0, y: 0 });
  const [boardOffset, setBoardOffset] = useState(0);
  
  // Expose the board ref to parent component
  React.useImperativeHandle(ref, () => boardRef.current);
  
  // Parse FEN and create pieces
  const { pieces = [] } = fenToBoard(fen || '5/5/5/5/5 w - - 0 1');
  
  // Calculate board dimensions
  const boardDimension = BOARD_SIZE * squareSize;

  // Update board position when container dimensions change
  useEffect(() => {
    if (!containerDimensions) return;

    const centerX = (containerDimensions.width / 2) - (boardDimension / 2);
    const centerY = (containerDimensions.height / 2) - (boardDimension / 2);
    setBoardPosition({ x: centerX, y: centerY });
  }, [containerDimensions, boardDimension]);
  
  // Gentle floating animation for the board using useTick
  useTick((delta) => {
    const offset = Math.sin(Date.now() * 0.001) * 5;
    setBoardOffset(offset);
  });
  
  // Draw the floor/background
  const drawFloor = React.useCallback(g => {
    g.clear();
    g.fill(0xe2e8f0);
    g.rect(-100, -100, boardDimension + 200, boardDimension + 200);
  }, [boardDimension]);
  
  // Handle piece being placed from the board
  const handlePiecePlaced = (data) => {
    if (onPiecePlaced) {
      onPiecePlaced(data);
    }
  };
  
  return (
    <pixiContainer 
      ref={boardRef}
      position={[boardPosition.x, boardPosition.y + boardOffset]}
      pivot={[0, 0]}
      scale={playerColor === 'black' ? [-1, -1] : [1, 1]}
    >
      {/* Draw the floor/background */}
      <pixiGraphics draw={drawFloor} />
      
      {/* Board cells */}
      {Array.from({ length: BOARD_SIZE }).map((_, row) =>
        Array.from({ length: BOARD_SIZE }).map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          const position = mapPositionToBoard(row, col);
          
          return (
            <Square
              key={`${row}-${col}`}
              position={position}
              color={isLight ? 0xFFFFFF : 0x8B8B8B}
              row={row}
              col={col}
              size={squareSize}
            />
          );
        })
      )}
      
      {/* Pieces */}
      {pieces.length > 0 && pieces.map((piece) => {
        if (!piece?.position) return null;
        
        const piecePosition = mapPositionToBoard(piece.position.row, piece.position.col);
        const isDraggable = piece.color === playerColor;
        
        return (
          <Piece
            key={piece.id}
            piece={piece}
            x={piecePosition[0]}
            y={piecePosition[1]}
            draggable={isDraggable}
            onDragStart={onPieceDragStart}
            onDragEnd={onPieceDragEnd}
            pieceTextures={pieceTextures}
          />
        );
      })}
    </pixiContainer>
  );
});

Board.displayName = 'Board';

export default Board; 