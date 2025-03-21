import React, { useState, useEffect } from 'react'
import ChessPiece from './ChessPiece'

const PieceTray = ({ onPieceDragged }) => {
  // Tray pieces configuration
  const trayPieces = [
    { id: 'tray-pawn', type: 'Pawn', color: 'white' },
    { id: 'tray-knight', type: 'Knight', color: 'white' },
    { id: 'tray-bishop', type: 'Bishop', color: 'white' },
    { id: 'tray-rook', type: 'Rook', color: 'white' },
    { id: 'tray-queen', type: 'Queen', color: 'white' }
  ]
  
  // Track when pieces need to be refreshed (after placement)
  const [refreshCounter, setRefreshCounter] = useState(0)
  
  // Listen for tray-piece-placed events to refresh tray pieces
  useEffect(() => {
    const handleTrayPiecePlaced = () => {
      // Increment counter to force refresh of tray pieces
      setRefreshCounter(prev => prev + 1)
    }
    
    window.addEventListener('tray-piece-placed', handleTrayPiecePlaced)
    
    return () => {
      window.removeEventListener('tray-piece-placed', handleTrayPiecePlaced)
    }
  }, [])
  
  // Position the tray in front of the board
  const trayBaseZ = 3 // Distance in front of the board (reduced from 4.5)
  const trayBaseY = -0.85 // Same Y height as board pieces
  const spacing = 0.8 // Spacing between each piece (reduced from 1)
  
  // Render the tray squares (neutral color)
  const renderTraySquares = () => {
    return trayPieces.map((piece, index) => {
      const posX = (index - 2) * spacing // Center the tray
      
      return (
        <mesh 
          key={`tray-square-${index}`} 
          position={[posX, -1 + 0.025, trayBaseZ]}
          receiveShadow
        >
          <boxGeometry args={[0.6, 0.05, 0.6]} /> {/* Reduced from 0.8 to 0.6 */}
          <meshStandardMaterial 
            color="#d0d0d0" 
            metalness={0.1}
            roughness={0.5}
          />
        </mesh>
      )
    })
  }
  
  // Render the tray pieces with staggered appearance
  const renderTrayPieces = () => {
    return trayPieces.map((piece, index) => {
      const posX = (index - 2) * spacing // Center the tray
      
      // Create a unique key that changes when a piece is placed
      const pieceKey = `${piece.id}-${refreshCounter}-${index}`
      
      // Add a staggered appearance by setting a different initial position for each piece
      const entryDelay = index * 40; // Reduced from 80ms for twice as fast animation
      
      return (
        <ChessPiece 
          key={pieceKey}
          id={piece.id}
          type={piece.type} 
          position={[posX, trayBaseY + 0.1, trayBaseZ]} 
          color={piece.color}
          isTrayPiece={true}
          scale={0.5} // Half the normal size
          entryDelay={entryDelay} // Pass delay to stagger appearances
        />
      )
    })
  }
  
  return (
    <group>
      {renderTraySquares()}
      {renderTrayPieces()}
    </group>
  )
}

export default PieceTray 