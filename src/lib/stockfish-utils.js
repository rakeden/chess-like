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

/**
 * Convert FEN string to board setup
 * @param {String} fen FEN notation string
 * @returns {Object} Board representation with piece positions
 */
export function fenToBoard(fen) {
  // Initialize an empty 5x5 board
  const board = Array(5).fill().map(() => Array(5).fill(null));
  
  // Split the FEN string to get just the board position part
  const [boardPart] = fen.split(' ');
  const rows = boardPart.split('/');
  
  // Process each row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    let colIndex = 0;
    const row = rows[rowIndex];
    
    // Process each character in the row
    for (let charIndex = 0; charIndex < row.length; charIndex++) {
      const char = row[charIndex];
      
      if (/\d/.test(char)) {
        // If it's a number, skip that many columns
        colIndex += parseInt(char, 10);
      } else {
        // Determine piece color and type
        const isWhite = char === char.toUpperCase();
        const color = isWhite ? 'white' : 'black';
        let type;
        
        switch (char.toLowerCase()) {
          case 'p': type = 'pawn'; break;
          case 'n': type = 'knight'; break;
          case 'b': type = 'bishop'; break;
          case 'r': type = 'rook'; break;
          case 'q': type = 'queen'; break;
          case 'k': type = 'king'; break;
        }
        
        // Place the piece on the board
        if (type) {
          board[rowIndex][colIndex] = { type, color };
        }
        
        colIndex++;
      }
    }
  }
  
  return board;
}

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