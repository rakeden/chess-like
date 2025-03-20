# Chess-like

Let's define a software design document for a roque-like chess game, which is essentially a custom version of chess and chess puzzles, but with a autobattler twist.

# The Game
- The game is played on a 5x5 chessboard.
- There are 3 consecutive stages to play
- Per stage a certain chess piece value maximum is defined.
- The openents pieces are selected and placed randomly
- The player selects pieces and not exceeding the stage max value
- Then the game phase starts
- stockfish calculates an plays the best move

# Design
- minimalist design, unsaturated colors, maybe a little bit flat
- clear UI/UX
- ocassionaly use emojis
- chessboard is shown from above, slight angle 10 deg, similar to player pov

# Key Screens
- Frontpage with prominent button to Puzzle Mode
- Puzzle Mode with selectable stages
- puzzle stage rendering the game

# Tech Stack
- vite
- React 18
- shadcn for the app UI
- tailwind4 through "@tailwindcss/postcss" in postcss.config
- three.js for the game rendereing

# Data Handling
- When defining puzzles or positions use local json
- keep the dependencies low
- Don't add user and auth, but save a state for puzzles in localstorage

