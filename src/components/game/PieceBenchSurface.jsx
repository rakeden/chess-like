import React from 'react';
import { Html } from '@react-three/drei';

export default function PieceBenchSurface({ title = 'Available Pieces' }) {
  return (
    <group>
      {/* Main surface */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[5, 0.05, 1]} />
        <meshStandardMaterial 
          color="#334155" 
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Title */}
      <Html
        position={[0, 0.3, 0]}
        center
        sprite
        transform
        scale={0.3}
        style={{
          color: 'white',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0,0,0,0.7)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        {title}
      </Html>
    </group>
  );
} 