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

  // Animate a move (for playing phase)
  animateMove(fromPosition, toPosition) {
    if (this.gamePhase !== GAME_PHASES.PLAYING) return false;

    // Get the piece at the from position
    const piece = this.board[fromPosition.row][fromPosition.col];
    if (!piece) return false;

    // Move the piece
    this.board[toPosition.row][toPosition.col] = piece;
    this.board[fromPosition.row][fromPosition.col] = null;

    // Update piece position in pieces array
    const updatePieceInArray = (pieceArray, pieceId, newPosition) => {
      const idx = pieceArray.findIndex(p => p.id === pieceId);
      if (idx !== -1) {
        pieceArray[idx] = { ...pieceArray[idx], position: newPosition };
      }
    };

    // Update in appropriate array based on color
    if (piece.color === this.playerColor) {
      updatePieceInArray(this.pieces, piece.id, toPosition);
    } else {
      updatePieceInArray(this.opponentPieces, piece.id, toPosition);
    }

    this.updateFEN();
    return true;
  }

  // Get FEN string for current board state
  getFEN() {
    return this.currentFEN;
  }

  // Update FEN string
  updateFEN() {
    this.currentFEN = boardToFEN(
      this.board,
      this.pieces,
      this.opponentPieces,
      'w' // Always white's turn in this simplified version
    );
  }

  // Start playing phase
  startPlaying() {
    if (this.gamePhase === GAME_PHASES.PREPARATION) {
      this.gamePhase = GAME_PHASES.PLAYING;
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
      gamePhase: this.gamePhase,
      availablePieces: this.pieceManager.getAvailablePieces(this.playerColor),
      remainingValue: this.pieceManager.getRemainingValue(),
      currentFEN: this.currentFEN,
      currentPuzzle: this.currentPuzzle
    };
  }
} 