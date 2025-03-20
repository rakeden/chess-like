import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const Scene = () => {
  const sceneRef = useRef()

  useFrame(() => {
    // Animation code can go here
  })

  return (
    <group ref={sceneRef}>
      {/* Scene objects will go here */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </group>
  )
}

export default Scene 