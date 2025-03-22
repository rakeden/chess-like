import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react'
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

// Occupied square indicator component
const OccupiedSquareIndicator = ({ position, visible }) => {
  const [springs, api] = useSpring(() => ({
    opacity: 0,
    scale: 0.5,
    config: {
      tension: 170,
      friction: 26
    }
  }))
  
  useEffect(() => {
    if (visible) {
      // Quick pulse animation
      api.start({
        to: async (next) => {
          await next({ opacity: 0.8, scale: 1.2 })
          await next({ opacity: 0, scale: 0.5 })
        }
      })
    } else {
      api.start({ opacity: 0, scale: 0.5 })
    }
  }, [visible, api])
  
  return (
    <animated.mesh 
      position={[position[0], -0.95, position[2]]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      visible={visible}
      scale-x={springs.scale}
      scale-y={springs.scale}
    >
      <circleGeometry args={[0.4, 32]} />
      <animated.meshBasicMaterial 
        color="#ff3333" 
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

// FEN utilities
const FEN_PIECES = {
  'p': { type: 'Pawn', color: 'black' },
  'n': { type: 'Knight', color: 'black' },
  'b': { type: 'Bishop', color: 'black' },
  'r': { type: 'Rook', color: 'black' },
  'q': { type: 'Queen', color: 'black' },
  'k': { type: 'King', color: 'black' },
  'P': { type: 'Pawn', color: 'white' },
  'N': { type: 'Knight', color: 'white' },
  'B': { type: 'Bishop', color: 'white' },
  'R': { type: 'Rook', color: 'white' },
  'Q': { type: 'Queen', color: 'white' },
  'K': { type: 'King', color: 'white' }
}

// Parse FEN string to board representation
const parseFen = (fen, boardSize = 8) => {
  // Extract just the piece placement part (before the first space)
  const piecePlacement = fen.split(' ')[0];
  
  // Initialize empty board
  const board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
  
  const rows = piecePlacement.split('/');
  
  // Process each row
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    
    // Process each character in the row
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      // If it's a number, skip that many squares
      if (/\d/.test(char)) {
        colIndex += parseInt(char, 10);
      } 
      // Otherwise it's a piece
      else {
        if (colIndex < boardSize && rowIndex < boardSize) {
          board[rowIndex][colIndex] = char;
        }
        colIndex++;
      }
    }
  });
  
  return board;
};

// Convert board to pieces array for rendering
const boardToPieces = (board, areInitialPieces = false) => {
  const pieces = [];
  const boardSize = board.length;
  
  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece) {
        const pieceData = FEN_PIECES[piece];
        if (pieceData) {
          // Calculate 3D position from 2D grid
          const posX = colIndex - boardSize / 2 + 0.5;
          const posZ = rowIndex - boardSize / 2 + 0.5;
          
          pieces.push({
            id: `${piece}-${rowIndex}-${colIndex}-${Date.now()}`,
            type: pieceData.type,
            position: [posX, -0.85, posZ],
            color: pieceData.color,
            onBoard: true,
            isInitialPiece: areInitialPieces, // Flag to identify initial pieces
            grid: { row: rowIndex, col: colIndex }
          });
        }
      }
    });
  });
  
  return pieces;
};

// Convert a 3D position to grid coordinates
const positionToGrid = (position, boardSize, activePlayer) => {
  // Extract x and z coordinates
  let [x, _, z] = position;
  
  // Adjust for board rotation if player is BLACK
  if (activePlayer === PLAYER_BLACK) {
    x = -x;
    z = -z;
  }
  
  // Convert to grid coordinates (0-based)
  const col = Math.round(x + boardSize / 2 - 0.5);
  const row = Math.round(z + boardSize / 2 - 0.5);
  
  // Check bounds
  if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
    return { row, col };
  }
  
  return null;
};

// Update board grid with new piece position
const updateBoard = (board, grid, pieceChar) => {
  const newBoard = board.map(row => [...row]);
  
  if (grid && grid.row >= 0 && grid.row < newBoard.length && 
      grid.col >= 0 && grid.col < newBoard[grid.row].length) {
    newBoard[grid.row][grid.col] = pieceChar;
  }
  
  return newBoard;
};

// Generate FEN string from board
const boardToFen = (board) => {
  return board.map(row => {
    let rowFen = '';
    let emptyCount = 0;
    
    // Process each square in the row
    row.forEach(square => {
      if (square === null) {
        emptyCount++;
      } else {
        // If there were empty squares before this piece, add the count
        if (emptyCount > 0) {
          rowFen += emptyCount;
          emptyCount = 0;
        }
        rowFen += square;
      }
    });
    
    // If there are empty squares at the end of the row, add the count
    if (emptyCount > 0) {
      rowFen += emptyCount;
    }
    
    return rowFen;
  }).join('/');
};

// Create a memoized chess piece component
const MemoizedChessPiece = memo(ChessPiece, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.color === nextProps.color &&
    prevProps.type === nextProps.type &&
    prevProps.onBoard === nextProps.onBoard
  );
});

const Chessboard = ({ boardSize = 8, activePlayer = PLAYER_WHITE, initialFen = "r1k1r/ppppp/5/5/11K11" }) => {
  // State to track the board representation
  const [board, setBoard] = useState(() => parseFen(initialFen, boardSize));
  
  // Convert board to pieces for rendering - use stable IDs
  const [pieces, setPieces] = useState(() => {
    const initialPieces = boardToPieces(board, true);
    // Create a mapping of positions to stable IDs
    const stableIds = {};
    initialPieces.forEach(piece => {
      const gridKey = `${piece.grid.row}-${piece.grid.col}`;
      stableIds[gridKey] = `${piece.type.toLowerCase()}-${piece.color}-${gridKey}`;
    });
    return { items: initialPieces, idMap: stableIds };
  });
  
  // State for occupied square indicator
  const [occupiedIndicator, setOccupiedIndicator] = useState({
    visible: false,
    position: [0, 0, 0]
  })
  
  // Show occupied indicator at a position
  const showOccupiedIndicator = useCallback((position) => {
    setOccupiedIndicator({
      visible: true,
      position
    })
    
    // Auto-hide after animation completes
    setTimeout(() => {
      setOccupiedIndicator(prev => ({
        ...prev,
        visible: false
      }))
    }, 800)
  }, [])
  
  // Update pieces when board changes, but maintain stable IDs
  useEffect(() => {
    setPieces(prev => {
      // Get existing pieces to check which ones are new vs. initial
      const existingPieceIds = new Set(prev.items.map(piece => piece.id));
      
      // Create new pieces and determine if they're initial pieces or not
      const newPieces = boardToPieces(board, false);
      
      // Transfer isInitialPiece flag from previous pieces if they exist
      newPieces.forEach(piece => {
        const existingPiece = prev.items.find(p => 
          p.grid && piece.grid && 
          p.grid.row === piece.grid.row && 
          p.grid.col === piece.grid.col &&
          p.type === piece.type &&
          p.color === piece.color
        );
        
        if (existingPiece) {
          piece.isInitialPiece = existingPiece.isInitialPiece;
        }
      });
      
      const newIdMap = { ...prev.idMap };
      
      // Update the ID map with new pieces
      newPieces.forEach(piece => {
        const gridKey = `${piece.grid.row}-${piece.grid.col}`;
        // If we don't have a stable ID for this position, create one
        if (!newIdMap[gridKey]) {
          newIdMap[gridKey] = `${piece.type.toLowerCase()}-${piece.color}-${gridKey}-${Date.now()}`;
        }
        // Update the piece ID to use the stable ID
        piece.id = newIdMap[gridKey];
      });
      
      return { items: newPieces, idMap: newIdMap };
    });
  }, [board]);
  
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
  
  // State for tray pieces with stable IDs
  const [trayPieces, setTrayPieces] = useState([])
  
  // Create stable tray piece IDs
  const trayPieceIds = useRef({});
  
  // Initialize or update tray pieces when active player changes
  useEffect(() => {
    const newTrayPieces = trayPieceTemplates.map((piece, index) => {
      // Create a unique key for this tray piece type
      const trayKey = `${piece.type.toLowerCase()}-${piece.color}-${index}`;
      
      // Get or create a stable ID
      if (!trayPieceIds.current[trayKey]) {
        trayPieceIds.current[trayKey] = `tray-${trayKey}-${Date.now()}`;
      }
      
      return {
        id: trayPieceIds.current[trayKey],
        type: piece.type,
        color: piece.color,
        position: [(index - 2) * 0.8, -0.85, 3], // Position in tray - always at the same location
        onBoard: false,
        scale: 0.5 // Half size for tray pieces
      };
    });
    
    setTrayPieces(newTrayPieces);
  }, [trayPieceTemplates]);
  
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
        const posX = (j - boardSize / 2 + 0.5)
        const posZ = (i - boardSize / 2 + 0.5)
        const key = `${i}-${j}`
        positions[key] = { x: posX, z: posZ, i, j }
      }
    }
    return positions
  }, [boardSize])
  
  // Get the FEN character for a piece - memoize this function
  const getPieceChar = useCallback((type, color) => {
    const fenChar = Object.entries(FEN_PIECES).find(
      ([_, piece]) => piece.type === type && piece.color === color
    );
    return fenChar ? fenChar[0] : null;
  }, []);
  
  // Check for intersections between a piece and all square hitboxes
  // Transform positions based on active player if the piece is on the board
  const checkIntersections = useCallback((piecePosition, isPieceOnBoard = true) => {
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
  }, [hitboxPositions, activePlayer]);
  
  // Get the position coordinates from a square key
  const getPositionFromSquare = useCallback((squareKey) => {
    if (!squareKey || !hitboxPositions[squareKey]) return null
    
    let { x, z } = hitboxPositions[squareKey]
    
    // If player is BLACK, invert the coordinates
    if (activePlayer === PLAYER_BLACK) {
      x = -x
      z = -z
    }
    
    return [x, -0.85, z] // Use standard Y height for pieces
  }, [hitboxPositions, activePlayer]);
  
  // Handle when a piece is moved
  const handlePieceMove = useCallback((id, newPosition, isDragging, isFinalPlacement) => {
    // Only update position while dragging or on final placement
    if (isDragging) {
      // Update piece position in the pieces array
      setPieces(prev => {
        const updatedItems = prev.items.map(piece => 
          piece.id === id ? { ...piece, position: newPosition } : piece
        );
        return { ...prev, items: updatedItems };
      });
      
      // Check for intersections (accounting for board rotation)
      const intersection = checkIntersections(newPosition, true);
      setIntersectedSquare(intersection);
    } else if (isFinalPlacement) {
      // Get the current intersected square if any
      const targetSquare = intersectedSquare
      
      // Find the moved piece
      const movedPiece = pieces.items.find(p => p.id === id)
      if (!movedPiece) return
      
      // Default to snapping to the nearest grid position if no intersection
      let finalPosition = [...newPosition]
      
      if (targetSquare) {
        // Get grid coordinates from intersection
        const [row, col] = targetSquare.split('-').map(Number)
        
        // Check if there's already a piece at the target position (that's not the current piece)
        const isTargetOccupied = board[row][col] !== null && 
          !(movedPiece.grid && movedPiece.grid.row === row && movedPiece.grid.col === col)
        
        // If the target square is already occupied by another piece, return to original position
        if (isTargetOccupied) {
          console.log("Square already occupied, cannot place piece")
          
          // Show the occupied square indicator
          showOccupiedIndicator(finalPosition)
          
          // If the piece has a previous position, return to it
          if (movedPiece.grid) {
            const originalPosition = getPositionFromSquare(`${movedPiece.grid.row}-${movedPiece.grid.col}`)
            if (originalPosition) {
              finalPosition = originalPosition
              
              // Update piece position in state and skip board updates
              setPieces(prev => {
                const updatedItems = prev.items.map(piece => 
                  piece.id === id ? { ...piece, position: finalPosition } : piece
                );
                return { ...prev, items: updatedItems };
              });
              
              // Clear intersection and exit
              setIntersectedSquare(null)
              return
            }
          }
        } else {
          // Target is free, use the precise square position
          const squarePosition = getPositionFromSquare(targetSquare)
          if (squarePosition) {
            finalPosition = squarePosition
          }
          
          // Update the board grid
          const newBoard = [...board.map(row => [...row])];
          
          // Remove piece from old position if it had one
          if (movedPiece.grid) {
            newBoard[movedPiece.grid.row][movedPiece.grid.col] = null;
          }
          
          // Place piece at new position
          const pieceChar = getPieceChar(movedPiece.type, movedPiece.color);
          if (pieceChar && row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
            newBoard[row][col] = pieceChar;
          }
          
          // Update board state
          setBoard(newBoard);
        }
      } else {
        // If no intersection with a square, use traditional grid snapping
        let snappedX = Math.round(newPosition[0])
        let snappedZ = Math.round(newPosition[2])
        
        // Ensure piece stays within board boundaries
        snappedX = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedX))
        snappedZ = Math.max(-halfBoardSize + 0.5, Math.min(halfBoardSize - 0.5, snappedZ))
        
        finalPosition = [snappedX, newPosition[1], snappedZ]
        
        // Convert position to grid
        const grid = positionToGrid(finalPosition, boardSize, activePlayer)
        
        if (grid) {
          // Check if there's already a piece at the target position (that's not the current piece)
          const isTargetOccupied = board[grid.row][grid.col] !== null && 
            !(movedPiece.grid && movedPiece.grid.row === grid.row && movedPiece.grid.col === grid.col)
          
          // If the target square is already occupied by another piece, return to original position
          if (isTargetOccupied) {
            console.log("Square already occupied, cannot place piece")
            
            // Show the occupied square indicator
            showOccupiedIndicator(finalPosition)
            
            // If the piece has a previous position, return to it
            if (movedPiece.grid) {
              const originalPosition = getPositionFromSquare(`${movedPiece.grid.row}-${movedPiece.grid.col}`)
              if (originalPosition) {
                finalPosition = originalPosition
                
                // Update piece position in state and skip board updates
                setPieces(prev => {
                  const updatedItems = prev.items.map(piece => 
                    piece.id === id ? { ...piece, position: finalPosition } : piece
                  );
                  return { ...prev, items: updatedItems };
                });
                
                // Clear intersection and exit
                setIntersectedSquare(null)
                return
              }
            }
          } else {
            // Target is free, update the board grid
            const newBoard = [...board.map(row => [...row])];
            
            // Remove piece from old position if it had one
            if (movedPiece.grid) {
              newBoard[movedPiece.grid.row][movedPiece.grid.col] = null;
            }
            
            // Place piece at new position
            const pieceChar = getPieceChar(movedPiece.type, movedPiece.color);
            if (pieceChar) {
              newBoard[grid.row][grid.col] = pieceChar;
            }
            
            // Update board state
            setBoard(newBoard);
          }
        }
      }
      
      // Update the piece position in the pieces array
      setPieces(prev => {
        const updatedItems = prev.items.map(piece => 
          piece.id === id ? { 
            ...piece, 
            position: finalPosition,
            grid: positionToGrid(finalPosition, boardSize, activePlayer)
          } : piece
        );
        return { ...prev, items: updatedItems };
      });
      
      // Clear intersection when piece is placed
      setIntersectedSquare(null)
    }
  }, [board, pieces, intersectedSquare, checkIntersections, getPositionFromSquare, getPieceChar, boardSize, activePlayer, halfBoardSize, showOccupiedIndicator]);
  
  // Handle when a tray piece is moved
  const handleTrayPieceMove = useCallback((id, newPosition, isDragging, isFinalPlacement) => {
    if (isDragging) {
      // Update tray piece position while dragging
      setTrayPieces(prev => prev.map(piece => 
        piece.id === id ? { ...piece, position: newPosition } : piece
      ));
      
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
      // Get the current intersected square if any
      const targetSquare = intersectedSquare
      
      // Only place pieces on valid squares within the board
      if (targetSquare) {
        const squarePosition = getPositionFromSquare(targetSquare)
        
        // Find the tray piece being moved
        const movedPiece = trayPieces.find(p => p.id === id)
        
        if (movedPiece && squarePosition) {
          // Get grid coordinates from intersection
          const [row, col] = targetSquare.split('-').map(Number)
          
          // Check if there's already a piece at the target position
          const existingPiece = board[row][col]
          
          // Only place if square is empty
          if (!existingPiece) {
            // Get the piece character for the FEN string
            const pieceChar = getPieceChar(movedPiece.type, movedPiece.color)
            
            if (pieceChar) {
              // Update the board
              const newBoard = [...board.map(boardRow => [...boardRow])]
              newBoard[row][col] = pieceChar
              
              // Generate a stable ID for the new board piece
              const gridKey = `${row}-${col}`;
              const stableId = `${movedPiece.type.toLowerCase()}-${movedPiece.color}-${gridKey}-${Date.now()}`;
              
              // Update board state
              setBoard(newBoard)
              
              // Also update the ID map and add the piece directly
              setPieces(prev => {
                const newIdMap = { ...prev.idMap };
                newIdMap[gridKey] = stableId;
                
                // Create new piece with isInitialPiece flag to make it immovable
                const newPiece = {
                  id: stableId,
                  type: movedPiece.type,
                  color: movedPiece.color,
                  position: squarePosition,
                  grid: { row, col },
                  onBoard: true,
                  isInitialPiece: false // Keep tray pieces movable after placement
                };
                
                // Add the new piece to the items array
                const updatedItems = [...prev.items, newPiece];
                
                return { items: updatedItems, idMap: newIdMap };
              });
              
              // Dispatch event to refresh tray
              window.dispatchEvent(new CustomEvent('tray-piece-placed'))
              
              // Reset tray piece to start position
              const trayIndex = trayPieceTemplates.findIndex(p => p.type === movedPiece.type)
              const originalTrayPosition = [(trayIndex - 2) * 0.8, -0.85, 3]
              
              // Update tray piece position
              setTrayPieces(prev => {
                const updated = prev.map(piece => 
                  piece.id === id ? { 
                    ...piece, 
                    position: originalTrayPosition
                  } : piece
                );
                
                // Simulate a delayed position update to ensure the dragStart is correctly set
                setTimeout(() => {
                  setTrayPieces(current => 
                    current.map(p => 
                      p.id === id ? { ...p, position: [...originalTrayPosition] } : p
                    )
                  );
                }, 50);
                
                return updated;
              });
            }
          } else {
            // Square is occupied, show feedback and reset tray piece
            console.log("Square already occupied, cannot place piece")
            
            // Show the occupied square indicator
            showOccupiedIndicator(squarePosition)
            
            // Flash the occupied square briefly to indicate it's occupied
            setShowBoundary(true)
            setTimeout(() => setShowBoundary(false), 300)
            
            // Reset tray piece to original position
            const trayIndex = trayPieceTemplates.findIndex(p => p.type === movedPiece.type)
            const originalTrayPosition = [(trayIndex - 2) * 0.8, -0.85, 3]
            
            // Update tray piece position
            setTrayPieces(prev => {
              const updated = prev.map(piece => 
                piece.id === id ? { 
                  ...piece, 
                  position: originalTrayPosition
                } : piece
              );
              
              // Simulate a delayed position update to ensure the dragStart is correctly set
              setTimeout(() => {
                setTrayPieces(current => 
                  current.map(p => 
                    p.id === id ? { ...p, position: [...originalTrayPosition] } : p
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
  }, [activePlayer, board, boardSize, checkIntersections, getPieceChar, getPositionFromSquare, halfBoardSize, intersectedSquare, trayPieceTemplates, trayPieces, showOccupiedIndicator]);
  
  // Handle out of bounds status
  const handleOutOfBoundsChange = useCallback((isOutOfBounds) => {
    setShowBoundary(isOutOfBounds)
  }, []);
  
  // Handle piece removal
  const handlePieceRemove = useCallback((id) => {
    // Find the piece being removed
    const pieceToRemove = pieces.items.find(p => p.id === id)
    
    if (pieceToRemove && pieceToRemove.grid) {
      // Update the board grid
      const newBoard = [...board.map(row => [...row])]
      newBoard[pieceToRemove.grid.row][pieceToRemove.grid.col] = null
      setBoard(newBoard)
    }
    
    // Remove from pieces array
    setPieces(prev => {
      const updatedItems = prev.items.filter(piece => piece.id !== id);
      return { ...prev, items: updatedItems };
    });
  }, [board, pieces]);
  
  // Generate chessboard squares - memoize to prevent unnecessary rerenders
  const chessboardSquares = useMemo(() => {
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
        
        squares.push(
          <mesh 
            key={`${i}-${j}`} 
            position={[posX, -1 + squareHeight/2 + boardElevation, posZ]}
            receiveShadow
          >
            <boxGeometry args={[size, squareHeight, size]} />
            <meshStandardMaterial 
              color={isWhite ? '#f0d9b5' : '#b58863'} // Standard chess colors
              metalness={0.1}
              roughness={isWhite ? 0.5 : 0.7}
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
              color={isIntersected ? '#ff44ff' : (isWhite ? '#22ff22' : '#00cc00')}
              transparent={true}
              opacity={isIntersected ? 0.4 : 0.2}
              wireframe={true}
            />
          </mesh>
        )
      }
    }
    return squares
  }, [boardSize, intersectedSquare]);
  
  // Render the tray squares - memoize to prevent unnecessary rerenders
  const traySquares = useMemo(() => {
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
  }, [trayPieceTemplates]);

  return (
    <group>
      {/* Board container that rotates based on active player */}
      <group rotation={[0, boardRotation, 0]}>
        {/* Red glowing boundary */}
        <BoardBoundary visible={showBoundary} boardSize={boardSize} />
        
        {/* Occupied square indicator */}
        <OccupiedSquareIndicator 
          position={occupiedIndicator.position} 
          visible={occupiedIndicator.visible} 
        />
        
        {/* Render board squares */}
        {chessboardSquares}
        
        {/* Render board pieces */}
        {pieces.items.map((piece) => (
          <MemoizedChessPiece
            key={piece.id}
            id={piece.id}
            type={piece.type}
            position={piece.position}
            color={piece.color}
            onBoard={true}
            isMovable={!piece.isInitialPiece}
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
        {traySquares}
        
        {/* Render tray pieces */}
        {trayPieces.map((piece) => (
          <MemoizedChessPiece
            key={piece.id}
            id={piece.id}
            type={piece.type}
            position={piece.position}
            color={piece.color}
            onBoard={false}
            isTrayPiece={true}
            isMovable={true}
            scale={piece.scale}
            entryDelay={trayPieces.indexOf(piece) * 40}
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