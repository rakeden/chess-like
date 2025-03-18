import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGameContext } from '@/lib/game-context';
import puzzles, { getRandomPuzzle } from '@/lib/puzzles';
import stockfishUtils from '@/lib/stockfish-utils';

export default function PuzzleSelection() {
  const { startPuzzle } = useGameContext();
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  
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
  
  // Copy FEN to clipboard
  const copyFEN = (fen, id) => {
    navigator.clipboard.writeText(fen).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  
  // Generate a Stockfish command for the puzzle
  const getStockfishCommand = (fen) => {
    return stockfishUtils.generatePositionCommand(fen);
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
            <Card key={puzzle.id} className="overflow-hidden">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-accent/10"
                onClick={() => handleSelectPuzzle(puzzle)}
              >
                <CardTitle className="text-xl">{puzzle.name}</CardTitle>
                <CardDescription className="text-sm font-medium">
                  Difficulty: <span className="text-yellow-500">{formatDifficulty(puzzle.difficulty)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent
                className="cursor-pointer hover:bg-accent/10"
                onClick={() => handleSelectPuzzle(puzzle)}
              >
                <p className="text-sm mb-2">{puzzle.description}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Opponent Pieces: {puzzle.opponentPieces.length}</span>
                  <span>Max Value: {puzzle.maxPlayerValue}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex-col items-start gap-2 border-t p-2">
                <div className="flex items-center w-full">
                  <p className="text-xs text-muted-foreground truncate mr-2 font-mono">
                    FEN: {puzzle.fen}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 ml-auto"
                        onClick={() => copyFEN(puzzle.fen, puzzle.id)}
                      >
                        {copied === puzzle.id ? 'Copied!' : 'Copy'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy FEN to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        Stockfish Commands
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Stockfish Commands for {puzzle.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Position Command:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                          {getStockfishCommand(puzzle.fen)}
                        </pre>
                        <p className="text-sm font-medium mt-4">Analysis Command:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                          {stockfishUtils.generateAnalysisCommand(15)}
                        </pre>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => copyFEN(`${getStockfishCommand(puzzle.fen)}\n${stockfishUtils.generateAnalysisCommand(15)}`, `cmd-${puzzle.id}`)}
                        >
                          {copied === `cmd-${puzzle.id}` ? 'Copied!' : 'Copy Commands'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {puzzle.solution && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 text-xs h-7"
                        >
                          Solution: {puzzle.solution}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This puzzle has a specific solution: {puzzle.solution}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 