import { PIECE_VALUES } from './puzzle-engine';

export class PieceManager {
  constructor(maxValue = 15) {
    this.maxValue = maxValue;
    this.usedValue = 0;
    this.pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
  }

  reset(maxValue = 15) {
    this.maxValue = maxValue;
    this.usedValue = 0;
  }

  // Get all available piece types with their status
  getAvailablePieces(color) {
    return this.pieceTypes.map(type => ({
      type,
      color,
      value: PIECE_VALUES[type],
      isAffordable: this.canAffordPiece(type),
      id: `${type}-template-${color}` // Template ID for the piece type
    }));
  }

  // Check if a piece type can be afforded
  canAffordPiece(type) {
    return this.usedValue + PIECE_VALUES[type] <= this.maxValue;
  }

  // Get remaining value
  getRemainingValue() {
    return this.maxValue - this.usedValue;
  }

  // Add a piece and update used value
  addPiece(type) {
    if (!this.canAffordPiece(type)) {
      return false;
    }
    this.usedValue += PIECE_VALUES[type];
    return true;
  }

  // Remove a piece and update used value
  removePiece(type) {
    this.usedValue = Math.max(0, this.usedValue - PIECE_VALUES[type]);
  }

  // Generate a unique ID for a new piece instance
  generatePieceId(type, color, position) {
    return `${type}-${Date.now()}-${position.row}-${position.col}-${color}`;
  }

  // Create a new piece instance
  createPiece(type, color, position) {
    if (!this.canAffordPiece(type)) {
      return null;
    }

    const piece = {
      id: this.generatePieceId(type, color, position),
      type,
      color,
      value: PIECE_VALUES[type],
      position
    };

    if (this.addPiece(type)) {
      return piece;
    }
    return null;
  }
} 