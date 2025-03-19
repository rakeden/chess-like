import { useRef } from 'react'

const Square = ({ position, color, row, col, isHovered, size = 1 }) => {
  const baseRef = useRef();
  
  return (
    <group>
      {/* Base square mesh */}
      <mesh 
        ref={baseRef}
        position={[position[0], position[1] + 0.025, position[2]]} 
        receiveShadow
        userData={{ isCell: true, row, col }}
      >
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial 
          color={color} 
          emissive={isHovered ? color : '#000000'} 
          emissiveIntensity={isHovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

export default Square; 