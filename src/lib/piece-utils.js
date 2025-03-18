// Piece value mapping
export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 4,
};

/**
 * Calculate the point value of a chess piece
 * @param {string} pieceType - The type of chess piece (pawn, knight, bishop, rook, queen, king)
 * @returns {number} - The point value of the piece
 */
export function calculatePieceValue(pieceType) {
  return PIECE_VALUES[pieceType] || 0;
}

/**
 * Generate a set of available chess pieces based on color
 * @param {string} color - The color of the pieces (white or black)
 * @returns {Array} - Array of piece objects
 */
export function generateAvailablePieces(color) {
  return [
    { type: 'king', color },
    { type: 'queen', color },
    { type: 'rook', color },
    { type: 'rook', color },
    { type: 'bishop', color },
    { type: 'bishop', color },
    { type: 'knight', color },
    { type: 'knight', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
    { type: 'pawn', color },
  ];
}

/**
 * Get the Unicode symbol for a chess piece
 * @param {string} pieceType - The type of chess piece
 * @param {string} pieceColor - The color of the chess piece
 * @returns {string} - Unicode symbol for the chess piece
 */
export function getPieceSymbol(pieceType, pieceColor) {
  const symbols = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙',
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟',
    },
  };
  
  return symbols[pieceColor]?.[pieceType] || '';
}

/**
 * Get the background color for a chess board cell
 * @param {number} row - The row index
 * @param {number} col - The column index
 * @returns {string} - CSS class for the cell background
 */
export function getCellBackgroundColor(row, col) {
  return (row + col) % 2 === 0 
    ? 'bg-amber-100 dark:bg-amber-900' 
    : 'bg-amber-800 dark:bg-amber-800';
}

/**
 * Convert cell ID to board coordinates
 * @param {string} cellId - The cell ID in chess notation (e.g., 'a1')
 * @returns {Object} - Row and column indices
 */
export function cellIdToCoords(cellId) {
  if (!cellId || typeof cellId !== 'string' || cellId.length !== 2) {
    return null;
  }
  
  const col = cellId.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 5 - parseInt(cellId[1], 10); // 5x5 board with 1-indexed rows
  
  return { row, col };
}

/**
 * Convert board coordinates to cell ID
 * @param {number} row - The row index
 * @param {number} col - The column index
 * @returns {string} - Cell ID in chess notation
 */
export function coordsToCellId(row, col) {
  if (row < 0 || row > 4 || col < 0 || col > 4) {
    return null;
  }
  
  const colChar = String.fromCharCode('a'.charCodeAt(0) + col);
  const rowNum = 5 - row; // 5x5 board with 1-indexed rows
  
  return `${colChar}${rowNum}`;
} 