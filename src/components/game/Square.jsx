import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

const Square = ({ position = [0, 0, 0], color = 'white', size = 1, row, col, isHovered = false }) => {
  const meshRef = useRef();
  
  // Helper function to get chess coordinate notation
  const getChessCoordinate = (row, col) => {
    const letters = ['E', 'D', 'C', 'B', 'A']; // Reversed to have A at the bottom for white
    return `${letters[row]}${col + 1}`;
  };
  
  // Set the cell layer and userData on mount
  useEffect(() => {
    if (meshRef.current) {
      // Set the mesh to layer 1 for raycasting
      meshRef.current.layers.enable(1);
      
      // Update userData for cell identification
      meshRef.current.userData = {
        isCell: true,
        row,
        col,
        type: 'cell'
      };
    }
  }, [row, col]);
  
  // Determine the label color based on square color
  const labelColor = color === '#FFFFFF' || color === 'white' ? '#8B8B8B' : '#f0d9b5';
  
  return (
    <group position={position}>
      <mesh 
        receiveShadow
        ref={meshRef}
      >
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial 
          color={isHovered ? '#5d98ff' : color} 
          roughness={0.5} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Coordinate label using Three.js Text */}
      <Text
        position={[-size/2 + 0.05, 0.051, size/2 - 0.15]} // Position at the left corner, slightly above surface
        fontSize={0.08}
        color={labelColor}
        anchorX="left"
        anchorY="top"
        depthTest={false}
        renderOrder={1}
        rotation={[-Math.PI/2, 0, 0]} // Rotate to be flat on the square
      >
        {getChessCoordinate(row, col)}
      </Text>
    </group>
  )
}

export default Square; 