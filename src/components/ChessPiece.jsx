import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { getModel, createColoredModel } from '../models'
import { useGesture } from 'react-use-gesture'
import { useSpring, animated } from '@react-spring/three'

// Shadow component to show under dragged pieces
const DragShadow = ({ position, visible, isOutOfBounds = false }) => {
  return (
    <mesh position={[position[0], -0.8, position[2]]} rotation={[-Math.PI / 2, 0, 0]} visible={visible}>
      <circleGeometry args={[0.3, 32]} />
      <meshBasicMaterial 
        color={isOutOfBounds ? "#ff0000" : "#000000"} 
        transparent 
        opacity={isOutOfBounds ? 0.2 : 0.1} 
      />
    </mesh>
  )
}

const ChessPiece = ({ 
  id,
  type, 
  position, 
  color = 'white', 
  onBoard = true,
  isTrayPiece = false, 
  scale = 1, 
  entryDelay = 0,
  boardSize = 5,
  onMove,
  onRemove,
  onOutOfBoundsChange
}) => {
  const modelRef = useRef()
  const [processedScene, setProcessedScene] = useState(null)
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width
  
  // Define initial position from props
  const initialPosition = position
  
  // Track current position for internal renders
  const [currentPosition, setCurrentPosition] = useState(position)
  
  // Track if piece is outside board boundaries
  const [isOutOfBounds, setIsOutOfBounds] = useState(false)
  
  // Track if currently dragging
  const [isDragging, setIsDragging] = useState(false)
  
  // Track if tray piece is currently being dragged to maintain full size
  const [isDraggingTrayPiece, setIsDraggingTrayPiece] = useState(false)
  
  // Stored material references for highlighting
  const materialsRef = useRef(new Map())
  
  // Calculate the scale factor based on piece type and drag state
  const getScaleFactor = useCallback(() => {
    // Tray pieces are always smaller unless being dragged
    if (isTrayPiece && !onBoard && !isDragging) {
      return scale;
    }
    // All pieces use full size when on board or being dragged
    return 1;
  }, [isTrayPiece, onBoard, scale, isDragging])
  
  // Define lift height constant
  const LIFT_HEIGHT = 0 // Set to 0 to disable lifting animation
  
  // Ref to track the base y-position of the piece
  const baseYPosition = useRef(position[1])
  
  // Calculate board boundaries
  const halfBoardSize = boardSize / 2
  
  // Notify parent when out of bounds state changes
  useEffect(() => {
    onOutOfBoundsChange?.(isOutOfBounds)
  }, [isOutOfBounds, onOutOfBoundsChange])
  
  // Setup spring for animations
  const [spring, api] = useSpring(() => ({ 
    position: [position[0], position[1], position[2]], // No lift on initial position
    scale: [0, 0, 0],
    rotation: [0, 0, 0],
    opacity: 0,
    config: { 
      friction: 10,
      tension: 300
    } 
  }))
  
  // Store initial drag position to calculate delta
  const dragStart = useRef({ x: 0, y: 0, piecePos: [...position] })
  
  // Create falling animation
  const animateFalling = () => {
    api.start({
      position: [
        currentPosition[0] + (Math.random() * 0.5 - 0.25),
        baseYPosition.current - 10,
        currentPosition[2] + (Math.random() * 0.5 - 0.25)
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: [0, 0, 0],
      config: {
        duration: 800,
        easing: t => t * t
      }
    })
  }
  
  // Handle drag gestures
  const bind = useGesture({
    onDragStart: (state) => {
      setIsDragging(true)
      
      // Store the base Y position (without lift)
      baseYPosition.current = currentPosition[1]
      
      // Save the starting position of this drag operation
      dragStart.current = {
        x: 0, y: 0,
        piecePos: [currentPosition[0], baseYPosition.current, currentPosition[2]]
      }
      
      // Prevent camera movement when dragging pieces
      state.event?.stopPropagation?.()
      
      // Apply full scale when dragging starts (no lift)
      api.start({
        scale: [13, 13, 13], // Full board piece size for all dragging pieces
        position: [currentPosition[0], baseYPosition.current, currentPosition[2]], // No lift
        rotation: [0, 0, 0]
      })
    },
    
    onDrag: ({ offset: [x, y] }) => {
      // Calculate the new position based on mouse movement
      const newX = dragStart.current.piecePos[0] + x / aspect
      const newZ = dragStart.current.piecePos[2] + y / aspect
      
      // Check if outside board boundaries
      const pieceRadius = 0.15
      const isOutside = 
        newX < -halfBoardSize - pieceRadius || 
        newX > halfBoardSize + pieceRadius || 
        newZ < -halfBoardSize - pieceRadius || 
        newZ > halfBoardSize + pieceRadius
        
      // Update out of bounds state
      setIsOutOfBounds(isOutside)
      
      // Update internal position
      setCurrentPosition([newX, baseYPosition.current, newZ])

      // Apply position without lift
      api.start({
        position: [newX, baseYPosition.current, newZ],
        rotation: [y / 1000, -x / 1000, 0], // Keep subtle rotation for visual feedback
        scale: [13, 13, 13]  // Always use full size when dragging
      })
      
      // Notify parent of position change
      onMove?.(id, [newX, baseYPosition.current, newZ], true, false)
    },
    
    onDragEnd: () => {
      // Get the current position
      const [newX, _, newZ] = currentPosition
      
      // Check if outside board boundaries
      const pieceRadius = 0.15
      const isOutside = 
        newX < -halfBoardSize - pieceRadius || 
        newX > halfBoardSize + pieceRadius || 
        newZ < -halfBoardSize - pieceRadius || 
        newZ > halfBoardSize + pieceRadius
      
      // When finished dragging, check if piece is out of bounds
      if (isOutside) {
        if (isTrayPiece && !onBoard) {
          // For tray pieces - check if intentionally discarded
          const distanceFromTray = Math.abs(newZ - 3)
          
          if (distanceFromTray > 1.5) {
            console.log(`Discarded ${color} ${type} from the tray`)
            animateFalling()
            return
          }
          
          // Otherwise return to original position in the tray with tray scale
          onMove?.(id, initialPosition, false, true)
          
          const trayScale = 13 * scale
          api.start({
            position: initialPosition,
            rotation: [0, 0, 0],
            scale: [trayScale, trayScale, trayScale],
            config: { tension: 200, friction: 20 }
          })
          
          setCurrentPosition(initialPosition)
          // Update base Y and dragStart position
          baseYPosition.current = initialPosition[1]
          dragStart.current.piecePos = [...initialPosition]
          setIsOutOfBounds(false)
          setIsDragging(false)
          return
        }
        
        // For board pieces - remove when dragged off
        console.log(`Removed ${color} ${type} from the board`)
        animateFalling()
        
        // Notify parent of removal
        onRemove?.(id)
        return
      }
      
      // If not out of bounds, notify parent for final placement
      onMove?.(id, [newX, baseYPosition.current, newZ], false, true)
      
      // Calculate the appropriate scale based on where the piece landed
      const isOnBoard = Math.abs(newZ) <= halfBoardSize - 0.5
      const finalScale = (isTrayPiece && !isOnBoard) ? 13 * scale : 13
      
      // Get the final position
      const finalPosition = [newX, baseYPosition.current, newZ]

      // Reset piece appearance after dragging ends
      api.start({
        rotation: [0, 0, 0],
        scale: [finalScale, finalScale, finalScale],
        position: finalPosition
      })
      
      // Update dragStart position to final position for next drag operation
      dragStart.current.piecePos = [...finalPosition]
      
      setCurrentPosition(finalPosition)
      setIsDragging(false)
      setIsOutOfBounds(false)
    },
    
    onHover: ({ hovering }) => {
      // Only apply hover effects if not dragging
      if (!isDragging) {
        const baseScale = 13 * getScaleFactor()
        const hoverScale = baseScale * 1.03 // 3% larger on hover
        
        api.start({ 
          scale: hovering ? [hoverScale, hoverScale, hoverScale] : [baseScale, baseScale, baseScale]
        })
      }
    }
  })
  
  // Apply highlighting to model when out of bounds
  useEffect(() => {
    if (!processedScene) return
    
    if (isOutOfBounds) {
      // Apply red tint
      processedScene.traverse((node) => {
        if (node.isMesh && node.material) {
          // Save original color if not already saved
          if (!materialsRef.current.has(node.uuid)) {
            const originalColor = node.material.color.clone()
            materialsRef.current.set(node.uuid, originalColor)
          }
          
          node.material.color.lerp(new THREE.Color(1, 0, 0), 0.3)
        }
      })
    } else {
      // Restore original colors
      processedScene.traverse((node) => {
        if (node.isMesh && node.material && materialsRef.current.has(node.uuid)) {
          const originalColor = materialsRef.current.get(node.uuid)
          node.material.color.copy(originalColor)
        }
      })
    }
  }, [processedScene, isOutOfBounds])
  
  // Load model from preloaded store
  useEffect(() => {
    const model = getModel(type.toLowerCase())
    
    if (!model) {
      console.warn(`Model ${type} not found in preloaded models`)
      return
    }
    
    const coloredModel = createColoredModel(model, color)
    
    if (!coloredModel) {
      console.warn(`Could not create colored model for ${type}`)
      return
    }
    
    // Add shadow casting and store original colors
    coloredModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        
        if (!materialsRef.current.has(node.uuid) && node.material) {
          const originalColor = node.material.color.clone()
          materialsRef.current.set(node.uuid, originalColor)
        }
      }
    })
    
    setProcessedScene(coloredModel)
  }, [type, color])
  
  // Update position from props
  useEffect(() => {
    // Only update if not dragging
    if (!isDragging) {
      setCurrentPosition(position)
      baseYPosition.current = position[1]
      
      // Ensure dragStart is also updated with the new position
      // This is important when tray pieces are reset to original position
      dragStart.current = {
        x: 0, y: 0,
        piecePos: [...position]
      }
      
      const baseScale = 13 * getScaleFactor()
      api.start({
        position: position,
        scale: [baseScale, baseScale, baseScale]
      })
    }
  }, [position, isDragging, getScaleFactor, api, isTrayPiece, onBoard])
  
  // Animate piece appearance when it first loads
  useEffect(() => {
    if (processedScene) {
      const randomDelay = Math.random() * 50
      const totalDelay = entryDelay / 2 + randomDelay
      
      setTimeout(() => {
        // Calculate scale based on piece type
        const baseScale = 13 * getScaleFactor()
        
        // Store the initial Y position
        baseYPosition.current = initialPosition[1]
        
        api.start({
          scale: [baseScale, baseScale, baseScale],
          position: initialPosition,
          opacity: 1,
          config: {
            friction: 12,
            tension: 180,
            mass: 0.8
          }
        })
      }, totalDelay)
    }
  }, [processedScene, initialPosition, api, getScaleFactor, entryDelay])
  
  return (
    <>
      <DragShadow 
        position={currentPosition} 
        visible={isDragging} 
        isOutOfBounds={isOutOfBounds}
      />
      
      {processedScene && (
        <animated.group ref={modelRef} {...spring} {...bind()}>
          <primitive object={processedScene} dispose={null} />
        </animated.group>
      )}
    </>
  )
}

export default ChessPiece 