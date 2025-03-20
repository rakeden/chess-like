import React from 'react';
import { Html } from '@react-three/drei';

export default function PieceCount({ count, position = [0, -0.3, 0] }) {
  return (
    <Html
      position={position}
      center
      sprite
      transform
      scale={0.25}
      style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '3px 10px',
        borderRadius: '4px',
        color: 'white',
        fontWeight: 'bold',
        pointerEvents: 'none'
      }}
    >
      {count}
    </Html>
  );
} 