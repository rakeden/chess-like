// Utility functions for working with chess engines like Stockfish

// Piece abbreviations
const pieceToFEN = {
  'white': {
    'pawn': 'P',
    'knight': 'N',
    'bishop': 'B',
    'rook': 'R',
    'queen': 'Q',
    'king': 'K'
  },
  'black': {
    'pawn': 'p',
    'knight': 'n',
    'bishop': 'b',
    'rook': 'r',
    'queen': 'q',
    'king': 'k'
  }
};

/**
 * Convert the game board to a standard FEN string
 * Note: This is a simplified FEN for a 5x5 board
 * @param {Array} board The 2D board array
 * @param {Array} whitePieces Array of white pieces
 * @param {Array} blackPieces Array of black pieces
 * @param {String} activeColor 'w' or 'b' to indicate whose turn it is
 * @returns {String} FEN notation string
 */
export function boardToFEN(board, whitePieces, blackPieces, activeColor = 'w') {
  // Start with an empty board representation
  const fenRows = [];
  
  // Process each row
  for (let row = 0; row < 5; row++) {
    let fenRow = '';
    let emptyCount = 0;
    
    // Process each column in the row
    for (let col = 0; col < 5; col++) {
      const piece = board[row][col];
      
      if (piece) {
        // If there were empty squares before this piece, add the count
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        
        // Add the piece abbreviation
        fenRow += pieceToFEN[piece.color][piece.type];
      } else {
        // Count empty squares
        emptyCount++;
      }
    }
    
    // If there are empty squares at the end of the row, add the count
    if (emptyCount > 0) {
      fenRow += emptyCount;
    }
    
    // Add the row to our FEN representation
    fenRows.push(fenRow);
  }
  
  // Combine rows with '/' separator
  const boardPosition = fenRows.join('/');
  
  // For a 5x5 custom board, we'll use a simplified FEN that just has the position and active color
  return `${boardPosition} ${activeColor} - - 0 1`;
}

// Helper function to convert a FEN character to piece type
const fenCharToPiece = (char) => {
  const pieceMap = {
    'p': 'pawn',
    'n': 'knight',
    'b': 'bishop',
    'r': 'rook',
    'q': 'queen',
    'k': 'king'
  };
  return pieceMap[char.toLowerCase()];
};

// Convert FEN notation to board and pieces arrays
export const fenToBoard = (fen) => {
  const board = Array(5).fill(null).map(() => Array(5).fill(null));
  const pieces = [];
  
  if (!fen) return { board, pieces };
  
  const [position] = fen.split(' ');
  const rows = position.split('/');
  
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (/[1-5]/.test(char)) {
        colIndex += parseInt(char);
      } else {
        const isWhite = char === char.toUpperCase();
        const pieceType = fenCharToPiece(char);
        const color = isWhite ? 'white' : 'black';
        const position = { row: rowIndex, col: colIndex };
        
        const piece = {
          id: `${pieceType}-${rowIndex}-${colIndex}-${color}`,
          type: pieceType,
          color: color,
          position: position
        };
        
        board[rowIndex][colIndex] = piece;
        pieces.push(piece);
        
        colIndex++;
      }
    }
  });
  
  return { board, pieces };
};

/**
 * Generate a UCI (Universal Chess Interface) position command for Stockfish
 * @param {String} fen FEN notation string
 * @returns {String} UCI position command
 */
export function generatePositionCommand(fen) {
  // In UCI protocol, you set the position with this format:
  return `position fen ${fen}`;
}

/**
 * Generate a UCI go command for analysis
 * @param {Number} depth The depth to analyze to
 * @returns {String} UCI go command
 */
export function generateAnalysisCommand(depth = 15) {
  return `go depth ${depth}`;
}

export default {
  boardToFEN,
  fenToBoard,
  generatePositionCommand,
  generateAnalysisCommand
}; 