import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useGameContext, GAME_PHASES } from '@/lib/game-context'
import { getCellBackgroundColor, getPieceSymbol, coordsToCellId } from '@/lib/piece-utils'

// Individual cell component that can receive dropped pieces
function BoardCell({ row, col, isDroppable, onClick, children }) {
  const cellId = coordsToCellId(row, col)
  const { isOver, setNodeRef } = useDroppable({
    id: cellId,
    disabled: !isDroppable
  })
  
  const backgroundColor = getCellBackgroundColor(row, col)
  const coordinates = `${String.fromCharCode(97 + col)}${5 - row}`
  
  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-full h-full flex items-center justify-center
        ${backgroundColor}
        ${isDroppable ? 'cursor-pointer' : ''}
        ${isOver && isDroppable ? 'ring-2 ring-primary ring-inset' : ''}
      `}
      data-cell-id={cellId}
      onClick={onClick}
    >
      {children}
      
      {/* Coordinates label */}
      <span className="absolute bottom-0.5 right-1 text-[0.5rem] text-muted-foreground opacity-50">
        {coordinates}
      </span>
    </div>
  )
}

// Piece component to display on the board
function Piece({ piece, onClick }) {
  const { playerColor, gamePhase } = useGameContext()
  
  // Determine if this piece is draggable (player's own piece during preparation)
  const isDraggable = gamePhase === GAME_PHASES.PREPARATION && 
                     piece.color === playerColor
  
  return (
    <div
      className={`
        w-4/5 h-4/5 rounded-full flex items-center justify-center text-3xl
        ${piece.color === 'white' ? 'bg-white text-black' : 'bg-black text-white'}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        transition-transform hover:scale-105
      `}
      onClick={onClick}
    >
      {getPieceSymbol(piece.type, piece.color)}
    </div>
  )
}

export function Board({ droppableCells = [] }) {
  const { 
    playerColor, 
    gamePhase,
    selectedPieces,
    addPiece,
    removePiece
  } = useGameContext()
  
  // Create a 5x5 grid 
  const boardSize = 5
  const grid = useMemo(() => {
    const cells = []
    for (let i = 0; i < boardSize; i++) {
      const row = []
      for (let j = 0; j < boardSize; j++) {
        row.push(coordsToCellId(i, j))
      }
      cells.push(row)
    }
    return cells
  }, [])
  
  // Convert droppableCells array to a Set for faster lookup
  const droppableCellsSet = useMemo(() => {
    return new Set(droppableCells)
  }, [droppableCells])
  
  // Handle clicking on a piece to remove it
  const handlePieceClick = (e, cellId) => {
    e.stopPropagation()
    
    if (gamePhase === GAME_PHASES.PREPARATION) {
      // Only allow removing player's own pieces during preparation
      const piece = selectedPieces[cellId]
      if (piece && piece.color === playerColor) {
        removePiece(cellId)
      }
    }
  }
  
  // Handle clicking on an empty cell during preparation
  const handleEmptyCellClick = (cellId) => {
    if (gamePhase === GAME_PHASES.PREPARATION && droppableCellsSet.has(cellId)) {
      // For now, we'll just show an alert - in a real implementation,
      // this would open a piece selection dialog
      alert(`Click on a piece in the piece selection panel and drag it to cell ${cellId}`)
    }
  }
  
  return (
    <div className="w-full h-full aspect-square max-w-lg mx-auto rounded-md overflow-hidden border">
      <div className="grid grid-cols-5 grid-rows-5 w-full h-full">
        {grid.map((row, rowIndex) => (
          row.map((cellId, colIndex) => {
            const piece = selectedPieces[cellId]
            const isDroppable = droppableCellsSet.has(cellId)
            
            return (
              <BoardCell 
                key={cellId} 
                row={rowIndex} 
                col={colIndex}
                isDroppable={isDroppable}
                onClick={() => !piece && handleEmptyCellClick(cellId)}
              >
                {piece && (
                  <Piece 
                    piece={piece} 
                    onClick={(e) => handlePieceClick(e, cellId)}
                  />
                )}
              </BoardCell>
            )
          })
        ))}
      </div>
    </div>
  )
} 