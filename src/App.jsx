import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from '@/lib/game-context'
import { TooltipProvider } from "@/components/ui/tooltip"
import Layout from '@/components/layout/Layout'
import { DndContext } from '@dnd-kit/core'
import PuzzlesPage from '@/pages/PuzzlesPage'
import PuzzlePage from '@/pages/PuzzlePage'

export default function App() {
  return (
    <GameProvider>
      <DndContext>
        <TooltipProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/puzzles" replace />} />
                <Route path="/puzzles" element={<PuzzlesPage />} />
                <Route path="/puzzles/:puzzleId" element={<PuzzlePage />} />
              </Routes>
            </Layout>
          </Router>
        </TooltipProvider>
      </DndContext>
    </GameProvider>
  )
}
