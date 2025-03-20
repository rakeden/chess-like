import React from 'react';
import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';

// Extend the Graphics component
extend({ Graphics });

const Square = ({ 
  position,
  color = 0xFFFFFF,
  row,
  col,
  size = 80
}) => {
  // Draw a square with a slightly rounded corner and border
  const draw = React.useCallback(g => {
    g.clear();
    
    // Fill with base color
    g.beginFill(color);
    
    // Add a subtle border
    g.lineStyle(1, 0x000000, 0.1);
    
    // Draw square with slightly rounded corners
    g.drawRoundedRect(0, 0, size, size, 2);
    g.endFill();
    
    // Store cell data for hit detection
    g.isCell = true;
    g.cellData = { row, col };
    
    // Add subtle cell coordinate indicators for debug purposes
    if (process.env.NODE_ENV === 'development') {
      g.lineStyle(0);
      g.beginFill(color === 0xFFFFFF ? 0x000000 : 0xFFFFFF, 0.1);
      g.drawCircle(size * 0.1, size * 0.1, 5);
      g.endFill();
    }
  }, [color, row, col, size]);

  return (
    <pixiGraphics
      draw={draw}
      position={position}
      interactive={true}
      cellData={{ row, col }}
    />
  );
};

export default Square; 