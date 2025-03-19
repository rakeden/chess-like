import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const Square = ({ position = [0, 0, 0], color = 'white', size = 1, row, col, isHovered = false }) => {
  const meshRef = useRef();
  
  // Set the cell layer and userData on mount
  useEffect(() => {
    if (meshRef.current) {
      // Set the mesh to layer 1 for raycasting
      meshRef.current.layers.enable(1);
      
      // Update userData for cell identification
      meshRef.current.userData = {
        isCell: true,
        row,
        col
      };
    }
  }, [row, col]);
  
  return (
    <mesh 
      position={position} 
      receiveShadow
      ref={meshRef}
    >
      <boxGeometry args={[size, 0.1, size]} />
      <meshStandardMaterial 
        color={isHovered ? '#5d98ff' : color} 
        roughness={0.5} 
        metalness={0.2}
      />
    </mesh>
  )
}

export default Square; 