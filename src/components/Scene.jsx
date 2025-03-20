import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const Scene = () => {
  const sceneRef = useRef()
  const { camera, gl } = useThree()
  
  // Move the cube up to be above the chessboard
  const cubeRef = useRef()
  
  // State for orbit controls
  const [isDragging, setIsDragging] = useState(false)
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
    
    // Add mouse event listeners for orbit controls
    const canvas = gl.domElement
    
    const handleMouseDown = (e) => {
      setIsDragging(true)
      setPreviousMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x
        const deltaY = e.clientY - previousMousePosition.y
        
        // Rotate camera around target
        const rotationSpeed = 0.005
        camera.position.x = camera.position.x * Math.cos(deltaX * rotationSpeed) - camera.position.z * Math.sin(deltaX * rotationSpeed)
        camera.position.z = camera.position.x * Math.sin(deltaX * rotationSpeed) + camera.position.z * Math.cos(deltaX * rotationSpeed)
        
        // Limit vertical rotation
        const newYPosition = camera.position.y + deltaY * rotationSpeed * 5
        camera.position.y = Math.max(1, Math.min(15, newYPosition))
        
        camera.lookAt(0, 0, 0)
        setPreviousMousePosition({ x: e.clientX, y: e.clientY })
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [camera, gl, isDragging, previousMousePosition])
  
  // Rotate the cube
  useFrame(() => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += 0.01
      cubeRef.current.rotation.y += 0.01
    }
  })

  // Generate chessboard squares
  const renderChessboard = () => {
    const squares = []
    const size = 1 // Size of each square
    const boardSize = 8 // 8x8 chessboard
    
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const isWhite = (i + j) % 2 === 0
        const posX = (i - boardSize / 2 + 0.5) * size
        const posZ = (j - boardSize / 2 + 0.5) * size
        
        squares.push(
          <mesh key={`${i}-${j}`} position={[posX, -1, posZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial color={isWhite ? 'white' : 'black'} />
          </mesh>
        )
      }
    }
    return squares
  }

  // Generate chessboard border
  const renderChessboardBorder = () => {
    const size = 1 // Size of each square
    const boardSize = 8 // 8x8 chessboard
    const borderWidth = 0.2
    const borderHeight = 0.2
    
    const borderPieces = []
    
    // Create the border pieces
    // Top border
    borderPieces.push(
      <mesh key="top" position={[0, -1 + borderHeight/2, -boardSize/2 - borderWidth/2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[boardSize + 2 * borderWidth, borderHeight, borderWidth]} />
        <meshStandardMaterial color="#5c3c24" />
      </mesh>
    )
    
    // Bottom border
    borderPieces.push(
      <mesh key="bottom" position={[0, -1 + borderHeight/2, boardSize/2 + borderWidth/2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[boardSize + 2 * borderWidth, borderHeight, borderWidth]} />
        <meshStandardMaterial color="#5c3c24" />
      </mesh>
    )
    
    // Left border
    borderPieces.push(
      <mesh key="left" position={[-boardSize/2 - borderWidth/2, -1 + borderHeight/2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[borderWidth, borderHeight, boardSize]} />
        <meshStandardMaterial color="#5c3c24" />
      </mesh>
    )
    
    // Right border
    borderPieces.push(
      <mesh key="right" position={[boardSize/2 + borderWidth/2, -1 + borderHeight/2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[borderWidth, borderHeight, boardSize]} />
        <meshStandardMaterial color="#5c3c24" />
      </mesh>
    )
    
    return borderPieces
  }

  return (
    <group ref={sceneRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Floating cube */}
      <mesh ref={cubeRef} position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      
      {/* Chessboard */}
      {renderChessboard()}
      {renderChessboardBorder()}
    </group>
  )
}

export default Scene 