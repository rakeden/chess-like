import React, { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'
import ChessPiece from './ChessPiece'

// Board boundary glow effect component
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

// Player colors
const PLAYER_WHITE = 'WHITE'
const PLAYER_BLACK = 'BLACK'

const Chessboard = ({ boardSize = 5, activePlayer = PLAYER_BLACK }) => {
  // State to track all pieces on the board
  const [pieces, setPieces] = useState([
    { id: 'wK', type: "King", position: [0, -0.85, 0], color: "white", onBoard: true },
    { id: 'wQ', type: "Queen", position: [-1, -0.85, 0], color: "white", onBoard: true },
    { id: 'wB', type: "Bishop", position: [1, -0.85, 0], color: "white", onBoard: true },
    { id: 'wN', type: "Knight", position: [-2, -0.85, 0], color: "white", onBoard: true },
    { id: 'wR', type: "Rook", position: [2, -0.85, 0], color: "white", onBoard: true },
    { id: 'bK', type: "King", position: [0, -0.85, 2], color: "black", onBoard: true },
    { id: 'bQ', type: "Queen", position: [0, -0.85, -2], color: "black", onBoard: true },
    { id: 'bP', type: "Pawn", position: [1, -0.85, -1], color: "black", onBoard: true }
  ])
  
  // Define tray pieces separately - set color based on active player
  const trayPieceTemplates = useMemo(() => [
    { type: 'Pawn', color: activePlayer === PLAYER_WHITE ? 'white' : 'black' },
    { type: 'Knight', color: activePlayer === PLAYER_WHITE ? 'white' : 'black' },
    { type: 'Bishop', color: activePlayer === PLAYER_WHITE ? 'white' : 'black' },
    { type: 'Rook', color: activePlayer === PLAYER_WHITE ? 'white' : 'black' },
    { type: 'Queen', color: activePlayer === PLAYER_WHITE ? 'white' : 'black' }
  ], [activePlayer])
  
  // Calculate board rotation based on active player
  const boardRotation = useMemo(() => {
    return activePlayer === PLAYER_BLACK ? Math.PI : 0
  }, [activePlayer])
  
  // State for tray pieces
  const [trayPieces, setTrayPieces] = useState([])
  
  // Initialize or update tray pieces when active player changes
  useEffect(() => {
    const newTrayPieces = trayPieceTemplates.map((piece, index) => ({
      id: `tray-${piece.type.toLowerCase()}-${index}-${Date.now()}`,
      type: piece.type,
      color: piece.color,
      position: [(index - 2) * 0.8, -0.85, 3], // Position in tray - always at the same location
      onBoard: false,
      scale: 0.5 // Half size for tray pieces
    }))
    
    setTrayPieces(newTrayPieces)
  }, [trayPieceTemplates])
  
  // Track if any piece is out of bounds
  const [showBoundary, setShowBoundary] = useState(false)
  
  // Track which square is currently being intersected with a piece
  const [intersectedSquare, setIntersectedSquare] = useState(null)
  
  // Refs for hitboxes
  const hitboxRefs = useRef({})
  
  // Calculate board boundaries
  const halfBoardSize = boardSize / 2
  
  // Collection of hitbox positions for intersection testing
  const hitboxPositions = useMemo(() => {
    const positions = {}
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const posX = (i - boardSize / 2 + 0.5)
        const posZ = (j - boardSize / 2 + 0.5)
        const key = `${i}-${j}`
        positions[key] = { x: posX, z: posZ, i, j }
      }
    }
    return positions
  }, [boardSize])
  
  // Check for intersections between a piece and all square hitboxes
  // Transform positions based on active player if the piece is on the board
  const checkIntersections = (piecePosition, isPieceOnBoard = true) => {
    if (!piecePosition) return null
    
    // Clone position to avoid modifying the original
    let [pieceX, pieceY, pieceZ] = piecePosition
    
    // Transform coordinates based on board rotation if piece is on the board
    if (isPieceOnBoard && activePlayer === PLAYER_BLACK) {
      // For black player, coordinates are rotated 180 degrees
      pieceX = -pieceX
      pieceZ = -pieceZ
    }
    
    // Threshold for intersection (half square size)
    const threshold = 0.5
    
    let closestSquare = null
    let minDistance = Infinity
    
    // Find the closest square
    Object.entries(hitboxPositions).forEach(([key, pos]) => {
      const dx = Math.abs(pos.x - pieceX)
      const dz = Math.abs(pos.z - pieceZ)
      
      // Check if piece is within the square boundary
      if (dx <= threshold && dz <= threshold) {
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance < minDistance) {
          minDistance = distance
          closestSquare = key
        }
      }
    })
    
    return closestSquare
  }
  
  // Get the position coordinates from a square key
  const getPositionFromSquare = (squareKey) => {
    if (!squareKey || !hitboxPositions[squareKey]) return null
    
    let { x, z } = hitboxPositions[squareKey]
    
    // If player is BLACK, invert the coordinates
    if (activePlayer === PLAYER_BLACK) {
      x = -x
      z = -z
    }
    
    return [x, -0.85, z] // Use standard Y height for pieces
  }
  
  // Handle when a piece is moved
  const handlePieceMove = (id, newPosition, isDragging, isFinalPlacement) => {
    // Only update position while dragging or on final placement
    if (isDragging) {
      // Update piece position
      setPieces(prev => prev.map(piece => 
        piece.id === id ? { ...piece, position: newPosition } : piece
      ))
      
      // Check for intersections (accounting for board rotation)
      const intersection = checkIntersections(newPosition, true)
      setIntersectedSquare(intersection)
    } else if (isFinalPlacement) {
      // Get the current intersected square if any
      const targetSquare = intersectedSquare
      
      // Default to snapping to the nearest grid position if no intersection
      let finalPosition = [...newPosition]
      
      if (targetSquare) {
        // Use the precise square position if there's an intersection
        const squarePosition = getPositionFromSquare(targetSquare)
        if (squarePosition) {
          finalPosition = squarePosition
        }
      } else {
        // If no intersection with a square, use traditional grid snapping
        let snappedX = Math.round(newPosition[0])
        let snappedZ = Math.round(newPosition[2])
        
        // Ensure piece stays within board boundaries
        snappedX = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedX))
        snappedZ = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedZ))
        
        finalPosition = [snappedX, newPosition[1], snappedZ]
      }
      
      // Update the piece position
      setPieces(prev => prev.map(piece => 
        piece.id === id ? { ...piece, position: finalPosition } : piece
      ))
      
      // Clear intersection when piece is placed
      setIntersectedSquare(null)
    }
  }
  
  // Handle when a tray piece is moved
  const handleTrayPieceMove = (id, newPosition, isDragging, isFinalPlacement) => {
    if (isDragging) {
      // Update tray piece position while dragging
      setTrayPieces(prev => prev.map(piece => 
        piece.id === id ? { ...piece, position: newPosition } : piece
      ))
      
      // For tray pieces, we need to transform position to board space for intersection checking
      // Calculate the position relative to the rotated board
      let boardSpacePosition = [...newPosition]
      
      // The tray is always in front of the player, but the board may be rotated
      // So when dragging onto a rotated board, we need to inverse position
      if (activePlayer === PLAYER_BLACK) {
        // Z coordinate stays the same if we're considering the tray piece as "not on board"
        // But X needs to be inverted to match the rotated board coordinates
        boardSpacePosition[0] = -boardSpacePosition[0]
      }
      
      // Check for intersections with coordinates relative to the board
      const intersection = checkIntersections(boardSpacePosition, false)
      setIntersectedSquare(intersection)
    } else if (isFinalPlacement) {
      // Check if the piece is being placed on the board
      const isOnBoard = Math.abs(newPosition[2]) <= halfBoardSize - 0.5
      const targetSquare = intersectedSquare
      
      if (isOnBoard && targetSquare) {
        // Get the tray piece that's being placed
        const trayPiece = trayPieces.find(p => p.id === id)
        
        if (trayPiece) {
          // Get precise position from the square
          const squarePosition = getPositionFromSquare(targetSquare)
          const finalPosition = squarePosition || [
            Math.round(newPosition[0]), 
            newPosition[1], 
            Math.round(newPosition[2])
          ]
          
          // Create a new board piece from the tray piece using the square position
          const newBoardPiece = {
            id: `${trayPiece.type.toLowerCase()}-${Date.now()}`,
            type: trayPiece.type,
            color: trayPiece.color,
            position: finalPosition,
            onBoard: true
          }
          
          // Add the new piece to the board
          setPieces(prev => [...prev, newBoardPiece])
          
          // Reset the tray piece to its original position
          const trayIndex = trayPieceTemplates.findIndex(p => p.type === trayPiece.type)
          const originalTrayPosition = [(trayIndex - 2) * 0.8, -0.85, 3]
          
          // Generate a new ID to ensure we get a fresh component with reset state
          const newTrayId = `tray-${trayPiece.type.toLowerCase()}-${Date.now()}`
          
          // Update tray pieces with new ID and position
          setTrayPieces(prev => {
            const updated = prev.map(piece => 
              piece.id === id ? { 
                ...piece, 
                id: newTrayId,
                position: originalTrayPosition
              } : piece
            );
            
            // Simulate a delayed position update to ensure the dragStart is correctly set
            setTimeout(() => {
              setTrayPieces(current => 
                current.map(p => 
                  p.id === newTrayId ? { ...p, position: [...originalTrayPosition] } : p
                )
              );
            }, 50);
            
            return updated;
          });
        }
      } else {
        // Return the tray piece to its original position
        const trayPiece = trayPieces.find(p => p.id === id)
        
        if (trayPiece) {
          const trayIndex = trayPieceTemplates.findIndex(p => p.type === trayPiece.type)
          const originalTrayPosition = [(trayIndex - 2) * 0.8, -0.85, 3]
          
          // First update immediately
          setTrayPieces(prev => prev.map(piece => 
            piece.id === id ? { ...piece, position: originalTrayPosition } : piece
          ));
          
          // Then update again after a slight delay to ensure dragStart is updated
          setTimeout(() => {
            setTrayPieces(current => 
              current.map(p => 
                p.id === id ? { ...p, position: [...originalTrayPosition] } : p
              )
            );
          }, 50);
        }
      }
      
      // Clear intersection when piece is placed
      setIntersectedSquare(null)
    }
  }
  
  // Handle out of bounds status
  const handleOutOfBoundsChange = (isOutOfBounds) => {
    setShowBoundary(isOutOfBounds)
  }
  
  // Handle piece removal
  const handlePieceRemove = (id) => {
    setPieces(prev => prev.filter(piece => piece.id !== id))
  }
  
  // Generate chessboard squares
  const renderChessboardSquares = () => {
    const squares = []
    const size = 1.0 // Size of each square
    const squareHeight = 0.05 // Height of each square
    const boardElevation = 0.1 // Elevation from the ground
    const debugHitboxHeight = 1.0 // Height of the debug hitbox
    
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const isWhite = (i + j) % 2 === 0
        const posX = (i - boardSize / 2 + 0.5) * size
        const posZ = (j - boardSize / 2 + 0.5) * size
        const squareKey = `${i}-${j}`
        const isIntersected = intersectedSquare === squareKey
        
        // Check if the square is in the first two rows (rows 0 and 1)
        const isFirstTwoRows = j < 2
        
        squares.push(
          <mesh 
            key={`${i}-${j}`} 
            position={[posX, -1 + squareHeight/2 + boardElevation, posZ]}
            receiveShadow
          >
            <boxGeometry args={[size, squareHeight, size]} />
            <meshStandardMaterial 
              color={isFirstTwoRows 
                ? (isWhite ? '#e1c16e' : '#b8860b') // Gold tones for first two rows
                : (isWhite ? '#f0d9b5' : '#b58863')} // Normal colors for other squares
              metalness={isFirstTwoRows ? 0.3 : 0.1}
              roughness={isFirstTwoRows ? 0.4 : (isWhite ? 0.5 : 0.7)}
              emissive={isFirstTwoRows ? new THREE.Color(0.1, 0.05, 0) : undefined}
              emissiveIntensity={isFirstTwoRows ? 0.2 : 0}
            />
          </mesh>
        )
        
        // Add debug hitbox
        squares.push(
          <mesh 
            key={`debug-hitbox-${i}-${j}`}
            position={[posX, -1 + (debugHitboxHeight/2) + boardElevation + squareHeight, posZ]}
            visible={true}
            ref={el => {
              if (el) hitboxRefs.current[squareKey] = el
            }}
          >
            <boxGeometry args={[size, debugHitboxHeight, size]} />
            <meshBasicMaterial 
              color={isFirstTwoRows 
                ? '#ff9900' // Orange for first two rows
                : (isIntersected ? '#ff44ff' : (isWhite ? '#22ff22' : '#00cc00'))}
              transparent={true}
              opacity={isFirstTwoRows ? 0.5 : (isIntersected ? 0.4 : 0.2)}
              wireframe={true}
            />
          </mesh>
        )
      }
    }
    return squares
  }
  
  // Render the tray squares
  const renderTraySquares = () => {
    // Tray is always positioned in front of the player
    const trayBaseZ = 3 // Distance in front of the board
    const squareHeight = 0.05 // Height of each square
    const boardElevation = 0.1 // Elevation from the ground
    const spacing = 0.8 // Spacing between each piece
    
    return trayPieceTemplates.map((piece, index) => {
      const posX = (index - 2) * spacing // Center the tray
      
      return (
        <mesh 
          key={`tray-square-${index}`} 
          position={[posX, -1 + squareHeight/2 + boardElevation, trayBaseZ]}
          receiveShadow
        >
          <boxGeometry args={[0.6, 0.05, 0.6]} />
          <meshStandardMaterial 
            color="#d0d0d0" 
            metalness={0.1}
            roughness={0.5}
          />
        </mesh>
      )
    })
  }

  return (
    <group>
      {/* Board container that rotates based on active player */}
      <group rotation={[0, boardRotation, 0]}>
        {/* Red glowing boundary */}
        <BoardBoundary visible={showBoundary} boardSize={boardSize} />
        
        {/* Render board squares */}
        {renderChessboardSquares()}
        
        {/* Render board pieces */}
        {pieces.map((piece) => (
          <ChessPiece
            key={piece.id}
            id={piece.id}
            type={piece.type}
            position={piece.position}
            color={piece.color}
            onBoard={true}
            boardSize={boardSize}
            onMove={handlePieceMove}
            onRemove={handlePieceRemove}
            onOutOfBoundsChange={handleOutOfBoundsChange}
          />
        ))}
      </group>
      
      {/* Tray is always in front of the player, not rotated with the board */}
      <group>
        {/* Render tray squares */}
        {renderTraySquares()}
        
        {/* Render tray pieces */}
        {trayPieces.map((piece, index) => (
          <ChessPiece
            key={piece.id}
            id={piece.id}
            type={piece.type}
            position={piece.position}
            color={piece.color}
            onBoard={false}
            isTrayPiece={true}
            scale={piece.scale}
            entryDelay={index * 40}
            boardSize={boardSize}
            onMove={handleTrayPieceMove}
            onOutOfBoundsChange={handleOutOfBoundsChange}
          />
        ))}
      </group>
    </group>
  )
}

export default Chessboard 