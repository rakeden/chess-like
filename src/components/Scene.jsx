import { useRef, useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import ChessPiece from './ChessPiece'

const Scene = () => {
  const sceneRef = useRef()
  const { camera } = useThree()
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 6, 6) // Adjusted for better view of the board
    camera.lookAt(0, 0, 0)
    
    console.log("Scene mounted, camera setup complete")
  }, [camera])

  // Generate chessboard squares
  const renderChessboard = () => {
    const squares = []
    const size = 0.95 // Size of each square (slightly smaller to create gaps)
    const gap = 0.05 // Gap between squares
    const fullSize = 1 // Full size including gap
    const boardSize = 5 // 5x5 chessboard
    const squareHeight = 0.15 // Height of each square
    const boardElevation = 0.1 // Elevation from the ground
    
    // Board base has been moved to main render function for shadow receiving
    
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const isWhite = (i + j) % 2 === 0
        const posX = (i - boardSize / 2 + 0.5) * fullSize
        const posZ = (j - boardSize / 2 + 0.5) * fullSize
        
        squares.push(
          <mesh 
            key={`${i}-${j}`} 
            position={[posX, -1 + squareHeight/2 + boardElevation, posZ]}
            receiveShadow
          >
            <boxGeometry args={[size, squareHeight, size]} />
            <meshStandardMaterial 
              color={isWhite ? '#f0d9b5' : '#b58863'} 
              metalness={0.1}
              roughness={isWhite ? 0.5 : 0.7}
            />
          </mesh>
        )
      }
    }
    return squares
  }

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
      
      {/* Chessboard */}
      {renderChessboard()}
      
      {/* Chess pieces */}
      <Suspense fallback={null}>
        {/* White pieces */}
        <ChessPiece type="King" position={[0, -0.85 + 0.1, 0]} color="white" />
        <ChessPiece type="Queen" position={[-1, -0.85 + 0.1, 0]} color="white" />
        <ChessPiece type="Bishop" position={[1, -0.85 + 0.1, 0]} color="white" />
        <ChessPiece type="Knight" position={[-2, -0.85 + 0.1, 0]} color="white" />
        <ChessPiece type="Rook" position={[2, -0.85 + 0.1, 0]} color="white" />
        
        {/* Black pieces */}
        <ChessPiece type="King" position={[0, -0.85 + 0.1, 2]} color="black" />
        <ChessPiece type="Queen" position={[0, -0.85 + 0.1, -2]} color="black" />
        <ChessPiece type="Pawn" position={[1, -0.85 + 0.1, -1]} color="black" />
      </Suspense>
    </group>
  )
}

export default Scene 