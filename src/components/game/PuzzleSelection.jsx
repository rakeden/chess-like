import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGameContext } from '@/lib/game-context';
import puzzles, { getRandomPuzzle } from '@/lib/puzzles';

export default function PuzzleSelection() {
  const { startPuzzle } = useGameContext();
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(null);
  
  // Start a random puzzle
  const handleRandomPuzzle = () => {
    try {
      const puzzle = getRandomPuzzle();
      if (!puzzle) {
        throw new Error("Failed to get a random puzzle");
      }
      setError(null);
      startPuzzle(puzzle);
    } catch (err) {
      console.error("Error starting random puzzle:", err);
      setError("Failed to start puzzle. Please try again.");
    }
  };
  
  // Start a specific puzzle
  const handleSelectPuzzle = (puzzle) => {
    try {
      if (!puzzle || !puzzle.id) {
        throw new Error("Invalid puzzle selected");
      }
      setError(null);
      startPuzzle(puzzle);
    } catch (err) {
      console.error("Error selecting puzzle:", err);
      setError("Failed to start the selected puzzle. Please try again.");
    }
  };
  
  // Format puzzle difficulty
  const formatDifficulty = (level) => {
    const stars = '★'.repeat(level);
    const emptyStars = '☆'.repeat(3 - level);
    return stars + emptyStars;
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-[400px] mx-4 mb-8">
        <CardHeader>
          <CardTitle>Chess Puzzles</CardTitle>
          <CardDescription>
            Select a puzzle to solve or try a random one
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm mb-2">
              {error}
            </div>
          )}
          
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleRandomPuzzle}
          >
            Random Puzzle
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Hide Puzzles' : 'Show All Puzzles'}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                How to Play
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Game Rules</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Chess-like is a roguelike autobattler based on chess mechanics:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Play on a 5x5 chessboard</li>
                  <li>You have 60 seconds to place your pieces</li>
                  <li>Select pieces within value constraints</li>
                  <li>Battle against AI-controlled pieces</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      {showAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[800px] mx-4 mb-8">
          {puzzles.map((puzzle) => (
            <Card key={puzzle.id} className="cursor-pointer hover:bg-accent/10" onClick={() => handleSelectPuzzle(puzzle)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{puzzle.name}</CardTitle>
                <CardDescription className="text-sm font-medium">
                  Difficulty: <span className="text-yellow-500">{formatDifficulty(puzzle.difficulty)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{puzzle.description}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Opponent Pieces: {puzzle.opponentPieces.length}</span>
                  <span>Max Value: {puzzle.maxPlayerValue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 