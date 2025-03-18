import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameContext } from '@/lib/game-context'
import * as THREE from 'three'
import Piece from './Piece'
import { useDroppable } from '@dnd-kit/core'

const BOARD_SIZE = 5
const SQUARE_SIZE = 1
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2

// A droppable cell component that integrates with dnd-kit
const DroppableCell = ({ row, col, isHovered, isSelected, children }) => {
  const { setNodeRef } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col }
  })

  return (
    <div 
      ref={setNodeRef}
      style={{
        position: 'absolute',
        width: `${100/5}%`,
        height: `${100/5}%`,
        top: `${(row/5) * 100}%`,
        left: `${(col/5) * 100}%`,
        zIndex: 10,
        opacity: 0,
      }}
    >
      {children}
    </div>
  )
}

function Square({ position, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[SQUARE_SIZE, 0.1, SQUARE_SIZE]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function Board() {
  const { board, placePiece, removePiece } = useGameContext()
  const boardRef = useRef()
  const [hoveredCell, setHoveredCell] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  
  // Rotate the board slightly to get a better view
  useFrame(() => {
    if (boardRef.current) {
      boardRef.current.rotation.x = -Math.PI / 18 // About 10 degrees tilt
    }
  })

  // Handle mouse interaction with the board
  const handlePointerMove = (e) => {
    // Convert pointer position to board coordinates
    e.stopPropagation()
    
    // Calculate the cell coordinates from the hit point
    const x = Math.floor(e.point.x + 2.5)
    const z = Math.floor(e.point.z + 2.5)
    
    // Only update if within board boundaries
    if (x >= 0 && x < 5 && z >= 0 && z < 5) {
      setHoveredCell({ row: z, col: x })
    } else {
      setHoveredCell(null)
    }
  }
  
  const handlePointerOut = () => {
    setHoveredCell(null)
  }
  
  // Handle selecting a cell for piece placement or removal
  const handleClick = (e) => {
    e.stopPropagation()
    
    if (!hoveredCell) return
    
    // If a cell is already selected and we click on it again, deselect it
    if (selectedCell && 
        selectedCell.row === hoveredCell.row && 
        selectedCell.col === hoveredCell.col) {
      setSelectedCell(null)
      return
    }
    
    // Otherwise, select the hovered cell
    setSelectedCell(hoveredCell)
    
    // If there's a piece on the cell, remove it
    if (board[hoveredCell.row][hoveredCell.col]) {
      removePiece(hoveredCell)
    }
  }
  
  // Function to handle dropping a piece onto the board - this will be connected to the DnD system
  const handleDropOnBoard = (pieceId, position) => {
    placePiece(pieceId, position)
  }

  // Create the checkered board
  const boardSquares = []
  const droppableCells = []
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const isHovered = hoveredCell && hoveredCell.row === row && hoveredCell.col === col
      const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col
      
      // Add droppable cell
      droppableCells.push(
        <DroppableCell 
          key={`droppable-${row}-${col}`}
          row={row}
          col={col}
          isHovered={isHovered}
          isSelected={isSelected}
        />
      )
      
      // Determine square color (dark or light)
      const isLightSquare = (row + col) % 2 === 0
      let squareColor
      
      if (isSelected) {
        squareColor = new THREE.Color(0x4caf50) // Green for selected
      } else if (isHovered) {
        squareColor = new THREE.Color(0x2196f3) // Blue for hovered
      } else {
        squareColor = isLightSquare 
          ? new THREE.Color(0xe0e0e0) // Light square
          : new THREE.Color(0x78909c) // Dark square
      }
      
      boardSquares.push(
        <mesh 
          key={`square-${row}-${col}`}
          position={[col - 2, 0, row - 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={squareColor} />
        </mesh>
      )
      
      // Render pieces on the board
      const piece = board[row][col]
      if (piece) {
        boardSquares.push(
          <Piece 
            key={`piece-${piece.id}`}
            type={piece.type}
            color={piece.color}
            position={[col - 2, 0.1, row - 2]}
          />
        )
      }
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
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <group ref={boardRef}>
        {/* Board container */}
        <mesh 
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[5.2, 0.2, 5.2]} />
          <meshStandardMaterial color={0x795548} />
        </mesh>
        
        {/* Board squares */}
        {boardSquares}
      </group>
      
      {/* Overlay for dnd-kit droppable areas */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {droppableCells}
        </div>
      </div>
    </>
  )
} 