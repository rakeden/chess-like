import { useRef, useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Chessboard from './Chessboard'

const Scene = () => {
  const sceneRef = useRef()
  const { camera } = useThree()
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 6, 6) // Adjusted for better view of the board
    camera.lookAt(0, 0, 0)
    
    console.log("Scene mounted, camera setup complete")
  }, [camera])

  return (
    <group ref={sceneRef}>
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        target={[0, 0, 1]}
        mouseButtons={{
          LEFT: THREE.MOUSE.NONE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />
      <ambientLight intensity={0.3} />
      <spotLight 
        position={[0, 15, 0]} 
        intensity={0.7} 
        angle={0.5}
        penumbra={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[5, 8, 5]} intensity={0.5} castShadow />
      
      {/* Instructions text */}
      <Suspense fallback={null}>
        <group position={[0, 4, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[10, 1]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      </Suspense>
      
      {/* Unified Chessboard component */}
      <Suspense fallback={null}>
        <Chessboard boardSize={5} />
      </Suspense>
    </group>
  )
}

export default Scene 