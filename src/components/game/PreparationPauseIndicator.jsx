import React from 'react';
import { Html } from '@react-three/drei';

export default function PreparationPauseIndicator() {
  return (
    <Html position={[0, 0, 0]} center>
      <div style={{ 
        color: 'white', 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        Placing piece...
      </div>
    </Html>
  );
} 