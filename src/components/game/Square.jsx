import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const Square = ({ position, color, row, col, isHovered, size = 1 }) => {
  // Add references for animation
  const glowRef = useRef();
  const baseRef = useRef();
  
  // Add animation for the glow and hover effects
  useFrame(({ clock }) => {
    // Apply glow animation when hovered
    if (glowRef.current && isHovered) {
      // Pulsing scale effect
      glowRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.05);
      // Adjust opacity for a breathing effect
      glowRef.current.material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
    
    // Subtle hover effect on the base tile
    if (baseRef.current) {
      if (isHovered) {
        // Slightly elevate the hovered tile
        baseRef.current.position.y = 0.01;
      } else {
        // Return to normal position when not hovered
        baseRef.current.position.y = 0;
      }
    }
  });
  
  return (
    <group>
      {/* Base square mesh */}
      <mesh 
        ref={baseRef}
        position={position} 
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
      
      {/* Add highlight effect for hovered cells */}
      {isHovered && (
        <mesh 
          ref={glowRef}
          position={[position[0], position[1] + 0.03, position[2]]}
          userData={{ isCell: true, row, col }}
        >
          <boxGeometry args={[size * 1.05, 0.01, size * 1.05]} />
          <meshBasicMaterial 
            color={0x00ff00} 
            transparent 
            opacity={0.5} 
          />
        </mesh>
      )}
    </group>
  )
}

export default Square; 