import { useRef, useEffect, Suspense, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'
import ChessPiece from './ChessPiece'

// Custom component for the board boundary glow effect
const BoardBoundary = ({ visible, boardSize }) => {
  const boundaryRef = useRef()
  
  // Use react-spring for animation
  const [springs, api] = useSpring(() => ({
    opacity: 0,
    scale: 0.9,
    config: {
      tension: 60,
      friction: 14
    }
  }))
  
  // Update animation when visibility changes
  useEffect(() => {
    if (visible) {
      // Start the pulsing animation
      let cancel
      const startPulsing = () => {
        api.start({
          to: async (next) => {
            // Create a continuous pulsing effect
            while (visible) {
              await next({ opacity: 0.10, scale: 1 })
              await next({ opacity: 0.01, scale: 0.9 })
            }
          }
        })
      }
      
      startPulsing()
      return () => cancel && cancel()
    } else {
      // Reset animation when not visible
      api.start({ opacity: 0, scale: 0.9 })
    }
  }, [visible, api])
  
  // Calculate the size to be slightly larger than the board
  const boundarySize = boardSize + 2
  
  return (
    <animated.mesh 
      ref={boundaryRef}
      position={[0, -1 + 0.02, 0]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      visible={visible}
      scale-x={springs.scale}
      scale-y={springs.scale}
    >
      <planeGeometry args={[boundarySize, boundarySize]} />
      <animated.meshBasicMaterial 
        color="#ff0000" 
        transparent 
        opacity={springs.opacity} 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </animated.mesh>
  )
}

const Scene = () => {
  const sceneRef = useRef()
  const { camera } = useThree()
  
  // Track if any piece is out of bounds
  const [showBoundary, setShowBoundary] = useState(false)
  
  // State to track all pieces on the board
  const [pieces, setPieces] = useState([
    { id: 'wK', type: "King", position: [0, -0.85 + 0.1, 0], color: "white" },
    { id: 'wQ', type: "Queen", position: [-1, -0.85 + 0.1, 0], color: "white" },
    { id: 'wB', type: "Bishop", position: [1, -0.85 + 0.1, 0], color: "white" },
    { id: 'wN', type: "Knight", position: [-2, -0.85 + 0.1, 0], color: "white" },
    { id: 'wR', type: "Rook", position: [2, -0.85 + 0.1, 0], color: "white" },
    { id: 'bK', type: "King", position: [0, -0.85 + 0.1, 2], color: "black" },
    { id: 'bQ', type: "Queen", position: [0, -0.85 + 0.1, -2], color: "black" },
    { id: 'bP', type: "Pawn", position: [1, -0.85 + 0.1, -1], color: "black" }
  ])
  
  // Create a custom event for pieces going out of bounds
  useEffect(() => {
    const handlePieceOutOfBounds = (e) => {
      setShowBoundary(e.detail.isOutOfBounds)
    }
    
    // Handle piece removal events
    const handlePieceRemoved = (e) => {
      const { type, color, position } = e.detail
      
      // Remove the piece from our state
      setPieces(prevPieces => 
        prevPieces.filter(piece => 
          !(piece.type === type && 
            piece.color === color && 
            Math.abs(piece.position[0] - position[0]) < 0.1 && 
            Math.abs(piece.position[2] - position[2]) < 0.1)
        )
      )
      
      console.log(`Scene: Removed ${color} ${type}`)
    }
    
    window.addEventListener('piece-out-of-bounds', handlePieceOutOfBounds)
    window.addEventListener('piece-removed', handlePieceRemoved)
    
    return () => {
      window.removeEventListener('piece-out-of-bounds', handlePieceOutOfBounds)
      window.removeEventListener('piece-removed', handlePieceRemoved)
    }
  }, [])
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 6, 6) // Adjusted for better view of the board
    camera.lookAt(0, 0, 0)
    
    console.log("Scene mounted, camera setup complete")
  }, [camera])

  // Generate chessboard squares
  const renderChessboard = () => {
    const squares = []
    const size = 1.0 // Size of each square (full size, no gaps)
    const fullSize = 1.0 // Full size of each square (no gaps)
    const boardSize = 5 // 5x5 chessboard
    const squareHeight = 0.05 // Height of each square
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
      
      {/* Red glowing boundary */}
      <BoardBoundary visible={showBoundary} boardSize={5} />
      
      {/* Chessboard */}
      {renderChessboard()}
      
      {/* Chess pieces - now rendered from state */}
      <Suspense fallback={null}>
        {pieces.map(piece => (
          <ChessPiece 
            key={piece.id}
            type={piece.type} 
            position={piece.position} 
            color={piece.color} 
          />
        ))}
      </Suspense>
    </group>
  )
}

export default Scene 