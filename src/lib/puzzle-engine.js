import { boardToFEN, fenToBoard } from './stockfish-utils';
import { PieceManager } from './piece-manager';

// Game phases
export const GAME_PHASES = {
  MENU: 'MENU',
  PREPARATION: 'PREPARATION',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

// Piece values for the game
export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};

export class PuzzleEngine {
  constructor() {
    this.pieceManager = new PieceManager();
    this.reset();
  }

  reset() {
    this.board = this.createEmptyBoard();
    this.pieces = [];
    this.opponentPieces = [];
    this.selectedPieces = [];
    this.playerColor = 'white';
    this.currentTurn = 'white';
    this.gamePhase = GAME_PHASES.MENU;
    this.currentFEN = '5/5/5/5/5 w - - 0 1';
    this.currentPuzzle = null;
    this.pieceManager.reset();
  }

  createEmptyBoard() {
    return Array(5).fill(null).map(() => Array(5).fill(null));
  }

  // Helper function to create a piece object
  createPieceObject(type, color, position, id) {
    return {
      id: id || `${type}-${position.row}-${position.col}-${color}`,
      type,
      color,
      position,
      value: PIECE_VALUES[type]
    };
  }

  // Start a new puzzle
  startPuzzle(puzzleData) {
    if (!puzzleData?.fen) {
      throw new Error('Invalid puzzle data');
    }

    this.reset();
    this.currentPuzzle = puzzleData;
    
    // Parse FEN and set up the board
    const { pieces, board } = fenToBoard(puzzleData.fen);
    
    // Separate pieces into player and opponent pieces
    const playerPieces = [];
    const opponentPieces = [];
    
    pieces.forEach(piece => {
      const pieceObj = this.createPieceObject(piece.type, piece.color, piece.position);
      if (piece.color === this.playerColor) {
        playerPieces.push(pieceObj);
      } else {
        opponentPieces.push(pieceObj);
      }
    });
    
    this.board = board;
    this.pieces = playerPieces;
    this.opponentPieces = opponentPieces;
    this.selectedPieces = [...playerPieces];
    
    // Initialize piece manager with puzzle's max value
    this.pieceManager.reset(puzzleData.maxPlayerValue || 15);
    
    this.currentFEN = puzzleData.fen;
    this.gamePhase = GAME_PHASES.PREPARATION;
  }

  // Place a piece during preparation
  placePiece(pieceType, position) {
    if (this.gamePhase !== GAME_PHASES.PREPARATION) return false;
    if (!pieceType || !position) return false;
    if (this.board[position.row][position.col]) return false;

    // Create new piece instance
    const newPiece = this.pieceManager.createPiece(pieceType, this.playerColor, position);
    if (!newPiece) return false;

    // Update board and pieces
    this.board[position.row][position.col] = newPiece;
    this.pieces.push(newPiece);
    this.selectedPieces.push(newPiece);
    
    this.updateFEN();
    return true;
  }

  // Move a piece during gameplay
  movePiece(fromPosition, toPosition) {
    if (this.gamePhase !== GAME_PHASES.PLAYING) return false;
    if (this.currentTurn !== this.playerColor) return false;

    const piece = this.board[fromPosition.row][fromPosition.col];
    if (!piece || piece.color !== this.playerColor) return false;

    // Move the piece
    this.board[toPosition.row][toPosition.col] = piece;
    this.board[fromPosition.row][fromPosition.col] = null;

    // Update piece position in pieces array
    const pieceIndex = this.pieces.findIndex(p => p.id === piece.id);
    if (pieceIndex !== -1) {
      this.pieces[pieceIndex] = { ...piece, position: toPosition };
    }

    this.updateFEN();
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

    return true;
  }

  // Check if the move is a solution to the puzzle
  checkSolution(fromPosition, toPosition) {
    // For puzzles with solutions, check if the move matches
    if (this.currentPuzzle?.solution) {
      const { algebraicToCoords, coordsToAlgebraic } = require('./puzzles').chessUtils;
      
      // Parse the solution (e.g., "Qc3#")
      const pieceType = this.currentPuzzle.solution.charAt(0) === this.currentPuzzle.solution.charAt(0).toUpperCase() 
        ? this.currentPuzzle.solution.charAt(0).toLowerCase() 
        : 'pawn';
      
      const targetSquare = this.currentPuzzle.solution.match(/[a-e][1-5]/)[0];
      const targetCoords = algebraicToCoords(targetSquare);
      
      // Get piece at fromPosition
      const piece = this.board[fromPosition.row][fromPosition.col];
      
      // Check if the correct piece is moving to the correct square
      return piece && 
        piece.type === (pieceType === 'q' ? 'queen' : 
                      pieceType === 'r' ? 'rook' : 
                      pieceType === 'b' ? 'bishop' : 
                      pieceType === 'n' ? 'knight' : 
                      pieceType === 'k' ? 'king' : 'pawn') && 
        toPosition.row === targetCoords.row && 
        toPosition.col === targetCoords.col;
    }
    
    return false;
  }

  // Get best move from API
  async getBestMove() {
    try {
      // TODO: Implement API call to get best move
      // This would typically call your chess engine API
      return {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 0 }
      };
    } catch (error) {
      console.error('Error getting best move:', error);
      return null;
    }
  }

  // Update FEN string
  updateFEN() {
    this.currentFEN = boardToFEN(
      this.board,
      this.pieces,
      this.opponentPieces,
      this.currentTurn === 'white' ? 'w' : 'b'
    );
  }

  // Start playing phase
  startPlaying() {
    if (this.gamePhase === GAME_PHASES.PREPARATION) {
      this.gamePhase = GAME_PHASES.PLAYING;
      this.currentTurn = 'white';
    }
  }

  // Get current game state
  getState() {
    return {
      board: this.board,
      pieces: this.pieces,
      opponentPieces: this.opponentPieces,
      selectedPieces: this.selectedPieces,
      playerColor: this.playerColor,
      currentTurn: this.currentTurn,
      gamePhase: this.gamePhase,
      availablePieces: this.pieceManager.getAvailablePieces(this.playerColor),
      remainingValue: this.pieceManager.getRemainingValue(),
      currentFEN: this.currentFEN,
      currentPuzzle: this.currentPuzzle
    };
  }
} 