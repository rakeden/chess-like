import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

function Square({ position, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[SQUARE_SIZE, 0.1, SQUARE_SIZE]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function Board() {
  const boardRef = useRef()

  useFrame(() => {
    if (boardRef.current) {
      // Add any board animations or updates here
    }
  })

  // Create the 5x5 board squares
  const squares = []
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let z = 0; z < BOARD_SIZE; z++) {
      const isWhite = (x + z) % 2 === 0
      squares.push(
        <Square
          key={`${x}-${z}`}
          position={[
            x * SQUARE_SIZE - BOARD_OFFSET,
            0,
            z * SQUARE_SIZE - BOARD_OFFSET
          ]}
          color={isWhite ? '#e2e8f0' : '#64748b'}
        />
      )
    }
  }

  return (
    <>
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={5}
        maxDistance={10}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <group ref={boardRef} rotation={[0, Math.PI / 18, 0]}>
        {squares}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[BOARD_SIZE * SQUARE_SIZE + 0.4, 0.1, BOARD_SIZE * SQUARE_SIZE + 0.4]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
    </>
  )
} 