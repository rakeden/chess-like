import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { getModel, createColoredModel } from '../models'
import { useGesture } from 'react-use-gesture'
import { useSpring, animated } from '@react-spring/three'

// Shadow component to show under dragged pieces
const DragShadow = ({ position, visible, size = 1, isOutOfBounds = false }) => {
  return (
    <mesh position={[position[0], -0.95, position[2]]} rotation={[-Math.PI / 2, 0, 0]} visible={visible}>
      <circleGeometry args={[size * 0.4, 32]} />
      <meshBasicMaterial color={isOutOfBounds ? "#ff0000" : "#000000"} transparent opacity={isOutOfBounds ? 0.4 : 0.3} />
    </mesh>
  )
}

// Create a simple chess piece shape as fallback
const FallbackPiece = ({ position, color, scale = [1, 1, 1], isOutOfBounds = false, ...props }) => {
  // Mix the original color with red if out of bounds
  const pieceColor = isOutOfBounds 
    ? (color === 'white' ? '#ffcccc' : '#662222') 
    : (color === 'white' ? '#ffffff' : '#333333')
    
  return (
    <animated.group position={position} scale={scale} {...props}>
      {/* Base of the piece */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color={pieceColor} />
      </mesh>
      
      {/* Body of the piece */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.7, 16]} />
        <meshStandardMaterial color={pieceColor} />
      </mesh>
      
      {/* Top of the piece */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={pieceColor} />
      </mesh>
    </animated.group>
  )
}

const ChessPiece = ({ type, position, color = 'white' }) => {
  const modelRef = useRef()
  const [processedScene, setProcessedScene] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width
  
  // Define initial position from props
  const initialPosition = [position[0], position[1], position[2]]
  
  // Track current position of the piece
  const [currentPosition, setCurrentPosition] = useState(initialPosition)
  
  // Track if piece is outside board boundaries
  const [isOutOfBounds, setIsOutOfBounds] = useState(false)
  
  // Effect to dispatch custom event when out of bounds state changes
  useEffect(() => {
    // Create and dispatch a custom event when the out of bounds state changes
    const event = new CustomEvent('piece-out-of-bounds', {
      detail: { isOutOfBounds: isOutOfBounds }
    })
    window.dispatchEvent(event)
  }, [isOutOfBounds])
  
  // Get reference to the actual board size from Scene
  const boardSize = 5 // This should match the boardSize in Scene component
  const halfBoardSize = boardSize / 2
  
  // Setup spring for animations
  const [spring, set] = useSpring(() => ({ 
    position: initialPosition, 
    scale: [13,13,13],
    rotation: [0, 0, 0],
    config: { 
      friction: 10,
      tension: 300
    } 
  }))
  
  // Stored material references for highlighting
  const materialsRef = useRef(new Map())

  // Track if currently dragging to prevent other interactions
  const [isDragging, setIsDragging] = useState(false)
  
  // Store initial drag position to calculate delta
  const dragStart = useRef({ x: 0, y: 0, piecePos: [...initialPosition] })
  
  // Define drag gesture
  const bind = useGesture({
    onDrag: ({ offset: [x, y], first, last, event }) => {
      if (first) {
        setIsDragging(true)
        // Save the starting position of this drag operation
        dragStart.current = {
          x: 0,
          y: 0,
          piecePos: [...currentPosition]
        }
        // Prevent camera movement when dragging pieces
        if (event.stopPropagation) event.stopPropagation()
      }

      // Calculate the new position based on mouse movement from the start of this drag
      const newX = dragStart.current.piecePos[0] + x / aspect
      const newZ = dragStart.current.piecePos[2] + y / aspect
      
      // Check if outside board boundaries
      const pieceRadius = 0.15 // Approximate radius of a chess piece
      const isOutside = 
        newX < -halfBoardSize - pieceRadius || 
        newX > halfBoardSize + pieceRadius || 
        newZ < -halfBoardSize - pieceRadius || 
        newZ > halfBoardSize + pieceRadius
        
      // Update out of bounds state
      setIsOutOfBounds(isOutside)
      
      // Update current position
      setCurrentPosition([newX, currentPosition[1], newZ])

      // Update position
      set({ 
        position: [newX, currentPosition[1] + 0.2, newZ], // Lift piece during drag
        // Add a slight tilt during drag for feedback
        rotation: [y / 1000, -x / 1000, 0]
      })
      
      if (last) {
        // When finished dragging, snap to valid positions
        const snappedX = Math.round(newX)
        const snappedZ = Math.round(newZ)
        
        // Ensure piece stays within board boundaries
        const boundedX = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedX))
        const boundedZ = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedZ))
        
        // Update the current position to the snapped position
        setCurrentPosition([boundedX, currentPosition[1], boundedZ])
        
        // Animate to snapped position
        set({ 
          position: [boundedX, currentPosition[1], boundedZ],
          rotation: [0, 0, 0]
        })
        
        setIsDragging(false)
        setIsOutOfBounds(false)
        
        // Log the move
        console.log(`Moved ${type} to position [${boundedX}, ${currentPosition[1]}, ${boundedZ}]`)
      }
    },
    onHover: ({ hovering }) => {
      if (!isDragging) {
        set({ 
          scale: hovering ? [13.3,13.3,13.3] : [13,13,13],
          position: [
            currentPosition[0], 
            hovering ? currentPosition[1] + 0.1 : currentPosition[1], 
            currentPosition[2]
          ]
        })
      }
    }
  })
  
  // Apply highlighting to model when out of bounds
  useEffect(() => {
    if (processedScene && isOutOfBounds) {
      // Apply red tint to all materials
      processedScene.traverse((node) => {
        if (node.isMesh && node.material) {
          // Save original color if not already saved
          if (!materialsRef.current.has(node.uuid)) {
            const originalColor = node.material.color.clone()
            materialsRef.current.set(node.uuid, originalColor)
          }
          
          // Apply red tint
          node.material.color.lerp(new THREE.Color(1, 0, 0), 0.3)
        }
      })
    } else if (processedScene && !isOutOfBounds) {
      // Restore original colors
      processedScene.traverse((node) => {
        if (node.isMesh && node.material && materialsRef.current.has(node.uuid)) {
          const originalColor = materialsRef.current.get(node.uuid)
          node.material.color.copy(originalColor)
        }
      })
    }
  }, [processedScene, isOutOfBounds])
  
  // Simplified approach: get model from our preloaded store
  useEffect(() => {
    // Try to get the preloaded model
    const model = getModel(type.toLowerCase())
    
    if (!model) {
      console.warn(`Model ${type} not found in preloaded models, using fallback`)
      setLoadError(true)
      return
    }
    
    // Create a colored version of the model
    const coloredModel = createColoredModel(model, color)
    
    if (!coloredModel) {
      console.warn(`Could not create colored model for ${type}, using fallback`)
      setLoadError(true)
      return
    }
    
    // Add shadow casting to all meshes
    coloredModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        
        // Store original colors for later highlighting
        if (!materialsRef.current.has(node.uuid) && node.material) {
          const originalColor = node.material.color.clone()
          materialsRef.current.set(node.uuid, originalColor)
        }
      }
    })
    
    setProcessedScene(coloredModel)
  }, [type, color])
  
  return (
    <>
      {/* Drag shadow underneath */}
      <DragShadow 
        position={currentPosition} 
        visible={isDragging} 
        isOutOfBounds={isOutOfBounds}
      />
      
      {/* Actual chess piece */}
      {loadError || !processedScene ? (
        <FallbackPiece 
          {...spring} 
          {...bind()} 
          color={color} 
          isOutOfBounds={isOutOfBounds}
        />
      ) : (
        <animated.group ref={modelRef} {...spring} {...bind()}>
          <primitive object={processedScene} dispose={null} />
        </animated.group>
      )}
    </>
  )
}

export default ChessPiece 