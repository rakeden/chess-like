import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export default function Piece({ type, color, position }) {
  const ref = useRef()
  // We'll load actual piece models later, for now using placeholder geometry
  return (
    <mesh ref={ref} position={position}>
      {/* Placeholder piece geometry */}
      <cylinderGeometry args={[0.3, 0.3, 0.6]} />
      <meshStandardMaterial color={color === 'white' ? '#f8fafc' : '#1e293b'} />
    </mesh>
  )
} 