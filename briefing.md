# Chess-like: Game Briefing

## Overview
Chess-like is a roguelike autobattler based on chess mechanics. This unique game combines traditional chess gameplay with roguelike progression and autobattler strategy elements. Players progress through stages of increasing difficulty, selecting chess pieces within value constraints to battle against randomly placed opponent pieces.

## Core Concept
- 5x5 chessboard
- different puzzle stages with predefined puzzle positions
- Stage-specific player pieces value maximums
- Player selects pieces without exceeding the stage's max value
- AI-powered opponent (Stockfish) makes optimal moves each turn

## Development Approach
We'll build Chess-like in two main phases:

### Phase 1: Proof of Concept (PoC)
- Single playable stage with basic piece selection
- Simplified AI opponent (reduced depth/time)
- Core game mechanics implemented:
  - 5x5 board rendering
  - Basic piece movement
  - Turn system
  - Win/loss conditions
- UI components using shadcn/ui:
  - Card components for piece selection
  - Progress indicators for stages
  - Dialog components for game states
  - Toast notifications for moves/events
- Local state management

### Phase 2: Full Implementation
- Complete 3-stage progression system
- Enhanced AI opponent
- Stage unlocking mechanism
- Improved visuals and animations
- Local storage for progress tracking
- Refined UI/UX with shadcn/ui components:
  - Hover Cards for piece information
  - Command palette for game controls
  - Collapsible sections for game rules
  - Sheet component for piece selection
  - Tabs for different game modes

## Design Guidelines
- Use shadcn/ui's design system and components
- Dark mode support using shadcn's theming
- Minimalist aesthetic with accent colors from shadcn's palette
- Clean, intuitive UI/UX with consistent spacing
- Chessboard viewed from above with slight 10° angle (player POV)
- Animations using shadcn's motion preferences

## Technical Stack
- use javascript, not typescript
- Vite for build tooling
- React 18 for UI components
- shadcn/ui for application UI:
  - Button
  - Card
  - Dialog
  - DropdownMenu
  - HoverCard
  - Progress
  - Sheet
  - Tabs
  - Toast
- Tailwind CSS (via @tailwindcss/postcss in postcss.config)
- three.js for game rendering

## Data Management
- Local JSON for puzzle definitions
- Local storage for game progress
- Minimalist dependency approach
- No user authentication required

## Key Screens
1. Homepage with prominent "Puzzle Mode" button using shadcn Button component
2. Puzzle Mode screen with selectable stages using Card components
3. Game screen layout:
   - Main game board (three.js)
   - Piece Bench
   - Game state in HoverCard
