import React from 'react';
import { extend, useApplication, useTick } from '@pixi/react';
import { Sprite } from 'pixi.js';
import { getPieceKey } from '@/utils/pieceTextures';

// Extend Sprite for use in JSX
extend({ Sprite });

const Piece = React.forwardRef(({ piece, x, y, scale = 1, draggable = true, onDragStart, onDragEnd, pieceTextures }, ref) => {
  const { app } = useApplication();
  
  // Get the texture key for this piece
  const textureKey = getPieceKey(piece);
  const texture = pieceTextures?.[textureKey];

  if (!texture) {
    console.warn(`No texture found for piece: ${textureKey}`);
    return null;
  }

  // Event handlers for dragging
  const handleDragStart = (event) => {
    if (!draggable) return;
    const sprite = event.currentTarget;
    sprite.alpha = 0.5;
    sprite.dragging = true;
    sprite.eventData = event.data;
    if (onDragStart) onDragStart(event);
  };

  const handleDragEnd = (event) => {
    if (!draggable) return;
    const sprite = event.currentTarget;
    sprite.alpha = 1;
    sprite.dragging = false;
    sprite.eventData = null;
    if (onDragEnd) onDragEnd(event);
  };

  const handleDragMove = (event) => {
    if (!draggable) return;
    const sprite = event.currentTarget;
    if (sprite.dragging) {
      const newPosition = sprite.eventData.getLocalPosition(sprite.parent);
      sprite.x = newPosition.x;
      sprite.y = newPosition.y;
    }
  };

  return (
    <pixiSprite
      ref={ref}
      texture={texture}
      x={x}
      y={y}
      anchor={0.5}
      scale={scale}
      interactive={draggable}
      pointerdown={handleDragStart}
      pointerup={handleDragEnd}
      pointerupoutside={handleDragEnd}
      pointermove={handleDragMove}
    />
  );
});

Piece.displayName = 'Piece';

export default Piece; 