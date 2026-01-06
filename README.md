# 2048 Game

A clean, modern implementation of the classic 2048 puzzle game. Join the tiles to reach 2048!

## Features

- Smooth animations and transitions
- Score tracking with best score persistence
- Visual progress bar showing your journey to 2048
- Responsive keyboard controls (Arrow keys or WASD)
- Clean, modular code structure
- Customisable progress bar background

## Live Demo

Once deployed to GitHub Pages, your game will be available at:
```
https://[your-username].github.io/[repository-name]/
```

## Repository Structure

```
.
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All game styles
├── js/
│   └── game.js            # Game logic and mechanics
├── assets/
│   ├── progress-bar.svg   # Default progress bar gradient (placeholder)
│   └── README.md          # Instructions for customising assets
├── 2048-checkpoint.html   # Original single-file version (reference)
└── README.md              # This file
```

## Getting Started

### Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/[repository-name].git
   cd [repository-name]
   ```

2. Open `index.html` in your web browser:
   ```bash
   # On macOS
   open index.html

   # On Linux
   xdg-open index.html

   # On Windows
   start index.html
   ```

   Or use a local web server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with http-server installed)
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

### Deploying to GitHub Pages

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit: 2048 game"
   git push origin main
   ```

2. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select the `main` branch
   - Click **Save**

3. Your game will be live at `https://[your-username].github.io/[repository-name]/` within a few minutes

## How to Play

- **Objective**: Combine tiles with the same number to reach 2048
- **Controls**:
  - Use **Arrow Keys** (↑ ↓ ← →) to move tiles
  - Or use **WASD** keys
- **Rules**:
  - Tiles slide in the direction you choose
  - When two tiles with the same number touch, they merge into one
  - After each move, a new tile (2 or 4) appears
  - The game ends when no more moves are possible

## Customisation

### Changing the Progress Bar Background

The progress bar at the bottom displays your journey from 2 to 2048. You can customise its background:

1. Create or obtain a PNG image (recommended: 500px × 100px)
2. Save it as `assets/progress-bar.png`
3. The game will automatically use your custom image

See `assets/README.md` for more details.

### Modifying Colours and Styles

All visual styles are in `css/style.css`. You can customise:
- Tile colours (`.tile-2`, `.tile-4`, etc.)
- Background colours
- Fonts and sizes
- Animation speeds

### Adjusting Game Logic

Game mechanics are in `js/game.js`. You can modify:
- Grid size (change `this.size = 4` in the constructor)
- Winning tile value (change `2048` checks in `hasWon()`)
- New tile probability (change `Math.random() < 0.9` in `addRandomTile()`)

## Browser Compatibility

This game works in all modern browsers that support:
- ES6 JavaScript classes
- CSS Grid and Flexbox
- LocalStorage API
- CSS transforms and transitions

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Technical Details

- **No dependencies**: Pure HTML, CSS, and JavaScript
- **LocalStorage**: Best score persists across sessions
- **Responsive design**: Adapts to different screen sizes
- **Secure coding practices**: Input validation and XSS prevention

## Credits

Based on the original 2048 game created by Gabriele Cirulli.

## Licence

This project is open source and available under the MIT Licence.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

If you encounter any problems or have suggestions, please [open an issue](https://github.com/[your-username]/[repository-name]/issues).
