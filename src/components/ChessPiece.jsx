import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { getModel, createColoredModel } from '../models'
import { useGesture } from 'react-use-gesture'
import { useSpring, animated } from '@react-spring/three'

// Shadow component to show under dragged pieces
const DragShadow = ({ position, visible, size = 1, isOutOfBounds = false }) => {
  return (
    <mesh position={[position[0], -0.8, position[2]]} rotation={[-Math.PI / 2, 0, 0]} visible={visible}>
      <circleGeometry args={[size * 0.4, 32]} />
      <meshBasicMaterial color={isOutOfBounds ? "#ff0000" : "#000000"} transparent opacity={isOutOfBounds ? 0.2 : 0.1} />
    </mesh>
  )
}

const ChessPiece = ({ type, position, color = 'white', isTrayPiece = false, scale = 1 }) => {
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
  
  // Track if piece has been removed from the board
  const [isRemoved, setIsRemoved] = useState(false)
  
  // Track if this piece was originally from the tray
  const [wasFromTray, setWasFromTray] = useState(isTrayPiece)
  
  // Track if the piece has been placed on the board from the tray
  const [onBoard, setOnBoard] = useState(!isTrayPiece)
  
  // Track if this tray piece should be hidden (after placement on board)
  const [hideOriginal, setHideOriginal] = useState(false)
  
  // Calculate the scale factor based on tray piece status
  const getScaleFactor = () => {
    if (wasFromTray && onBoard) {
      return 1 // Full size when on board
    } else if (wasFromTray && !onBoard) {
      return scale // Original reduced scale when in tray
    } else {
      return 1 // Regular pieces are always full size
    }
  }
  
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
    scale: [13 * getScaleFactor(), 13 * getScaleFactor(), 13 * getScaleFactor()],
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
        // When finished dragging, check if piece is out of bounds
        if (isOutside) {
          // For tray pieces that haven't been placed on the board yet,
          // we need to check if they're being intentionally discarded
          if (wasFromTray && !onBoard) {
            // Check if the piece is far away from the tray
            // The tray is at z position 3, so if dragged further away it should be removed
            const distanceFromTray = Math.abs(newZ - 3);
            
            if (distanceFromTray > 1.5) {
              // If dragged far from the tray, animate removal
              console.log(`Discarded ${color} ${type} from the tray`)
              
              // Animate the piece falling off with acceleration and fading
              set({
                position: [
                  currentPosition[0] + (Math.random() * 0.5 - 0.25),
                  currentPosition[1] - 10,
                  currentPosition[2] + (Math.random() * 0.5 - 0.25)
                ],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
                scale: [0, 0, 0],
                config: {
                  duration: 800,
                  easing: t => t * t
                }
              })
              
              setHideOriginal(true)
              setIsRemoved(true)
              return
            }
            
            // Otherwise, just return it to its original position
            set({
              position: initialPosition,
              rotation: [0, 0, 0],
              config: {
                tension: 200,
                friction: 20
              }
            })
            setCurrentPosition(initialPosition)
            setIsOutOfBounds(false)
            setIsDragging(false)
            return
          }
          
          // Create and dispatch a removal event
          const removalEvent = new CustomEvent('piece-removed', {
            detail: { 
              type,
              color,
              position: currentPosition
            }
          })
          window.dispatchEvent(removalEvent)
          
          // Log the removal
          console.log(`Removed ${color} ${type} from the board`)
          
          // Animate the piece falling off with acceleration and fading
          set({
            position: [
              currentPosition[0] + (Math.random() * 0.5 - 0.25), // Add slight x randomness for realism
              currentPosition[1] - 10, // Fall further for acceleration effect
              currentPosition[2] + (Math.random() * 0.5 - 0.25) // Add slight z randomness
            ],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI], // Random rotation as it falls
            scale: [0, 0, 0], // Scale to zero for disappearing effect
            config: {
              duration: 800,
              easing: t => t * t // Quadratic easing for acceleration effect
            }
          })
          
          setIsRemoved(true)
          return
        }
        
        // If not out of bounds, snap to valid positions on the board
        const snappedX = Math.round(newX)
        const snappedZ = Math.round(newZ)
        
        // Ensure piece stays within board boundaries
        const boundedX = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedX))
        const boundedZ = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedZ))
        
        // Update the current position to the snapped position
        setCurrentPosition([boundedX, currentPosition[1], boundedZ])
        
        // Check if this is a tray piece being placed on the board
        const isOnBoard = Math.abs(boundedZ) <= halfBoardSize - 0.5;
        
        if (wasFromTray && !onBoard && isOnBoard) {
          // This is a tray piece being placed on the board for the first time
          setOnBoard(true)
          
          // Dispatch an event to notify the placement
          const placementEvent = new CustomEvent('tray-piece-placed', {
            detail: { 
              id: type + "-" + Date.now(), // Generate a unique ID
              type,
              color,
              position: [boundedX, currentPosition[1], boundedZ]
            }
          })
          window.dispatchEvent(placementEvent)
          
          // Hide the original tray piece
          setHideOriginal(true)
          
          // Animate to snapped position with full size
          set({ 
            position: [boundedX, currentPosition[1], boundedZ],
            rotation: [0, 0, 0],
            scale: [13, 13, 13] // Full size
          })
        } else {
          // Normal piece movement
          set({ 
            position: [boundedX, currentPosition[1], boundedZ],
            rotation: [0, 0, 0]
          })
        }
        
        setIsDragging(false)
        setIsOutOfBounds(false)
        
        // Log the move
        console.log(`Moved ${type} to position [${boundedX}, ${currentPosition[1]}, ${boundedZ}]`)
      }
    },
    onHover: ({ hovering }) => {
      if (!isDragging) {
        const baseScale = 13 * getScaleFactor();
        const hoverScale = baseScale * 1.03; // 3% larger on hover
        
        set({ 
          scale: hovering ? [hoverScale, hoverScale, hoverScale] : [baseScale, baseScale, baseScale],
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
      {/* Don't render anything if this is a hidden original tray piece */}
      {!hideOriginal && (
        <>
          {/* Drag shadow underneath */}
          <DragShadow 
            position={currentPosition} 
            visible={isDragging && !isRemoved} 
            isOutOfBounds={isOutOfBounds}
          />
          
          {/* Actual chess piece */}
          {processedScene && (
            <animated.group ref={modelRef} {...spring} {...bind()}>
              <primitive object={processedScene} dispose={null} />
            </animated.group>
          )}
        </>
      )}
    </>
  )
}

export default ChessPiece 