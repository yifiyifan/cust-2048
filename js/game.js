/**
 * 2048 Game Implementation
 * Client-side puzzle game with localStorage persistence
 */

class Game {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;

        // Security: Validate localStorage data before use to prevent data corruption
        // Parse as integer and fallback to 0 if invalid
        const storedBest = localStorage.getItem('2048-best');
        this.best = this.validateScore(storedBest);

        this.gameWon = false;
        this.gameOver = false;

        // Cache DOM elements to avoid repeated queries
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.gameMessage = document.getElementById('game-message');

        // Touch gesture configuration
        this.SWIPE_THRESHOLD = 30; // minimum pixels for valid swipe
        this.gameContainer = document.querySelector('.game-container');
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchInProgress = false;

        this.init();
        this.setupInputs();
        this.setupTouchControls();
    }

    /**
     * Validates and sanitizes score values from localStorage
     * Security: Prevent NaN, negative values, or non-numeric data from corrupting game state
     * @param {string|null} value - The value to validate
     * @returns {number} - Valid score (non-negative integer) or 0
     */
    validateScore(value) {
        if (!value) return 0;
        const parsed = parseInt(value, 10);
        // Return 0 if not a valid number or negative
        return (!isNaN(parsed) && parsed >= 0) ? parsed : 0;
    }

    init() {
        // Initialize empty grid
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameWon = false;
        this.gameOver = false;
        this.updateScore();
        this.updateBest();
        this.updateProgress();
        this.hideMessage();

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    setupInputs() {
        // Security: Input validation - only process allowed key inputs
        // Define strict allow-list of valid keys to prevent unexpected behavior
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        document.addEventListener('keydown', (e) => {
            // Prevent input when game is over (unless won)
            if (this.gameOver && !this.gameWon) return;

            // Security: Validate key input against allow-list
            const direction = keyMap[e.key];
            if (direction) {
                e.preventDefault();
                this.move(direction);
            }
            // Silently ignore any keys not in the allow-list
        });
    }

    setupTouchControls() {
        // Only set up if game container exists and touch is supported
        if (!this.gameContainer || !('ontouchstart' in window)) {
            return;
        }

        // Prevent default touch behaviors for game area
        this.gameContainer.addEventListener('touchstart', (e) => {
            // Ignore if game is over or touch already in progress
            if ((this.gameOver && !this.gameWon) || this.touchInProgress) {
                return;
            }

            // Only handle single touch (first finger)
            const touch = e.touches[0];
            if (!touch) return;

            this.touchInProgress = true;
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;

            // Prevent scrolling/zooming from starting
            e.preventDefault();
        }, { passive: false }); // passive: false allows preventDefault

        this.gameContainer.addEventListener('touchmove', (e) => {
            if (!this.touchInProgress) return;

            // Prevent scrolling while swiping
            e.preventDefault();
        }, { passive: false });

        this.gameContainer.addEventListener('touchend', (e) => {
            if (!this.touchInProgress) return;

            // Get the touch point where finger lifted
            const touch = e.changedTouches[0];
            if (!touch) {
                this.touchInProgress = false;
                return;
            }

            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;

            // Calculate swipe distance and direction
            const direction = this.calculateSwipeDirection(
                this.touchStartX,
                this.touchStartY,
                touchEndX,
                touchEndY
            );

            // Execute move if valid direction detected
            if (direction) {
                this.move(direction);
            }

            this.touchInProgress = false;
        });

        // Handle touch cancellation (e.g., phone call, notification)
        this.gameContainer.addEventListener('touchcancel', () => {
            this.touchInProgress = false;
        });
    }

    calculateSwipeDirection(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Calculate total distance using Pythagorean theorem
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Ignore if swipe is too short (likely accidental tap)
        if (distance < this.SWIPE_THRESHOLD) {
            return null;
        }

        // Determine primary axis by comparing absolute deltas
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Horizontal swipe (X movement dominates)
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        }
        // Vertical swipe (Y movement dominates)
        else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 90% chance of 2, 10% chance of 4
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return true;
        }
        return false;
    }

    move(direction) {
        let moved = false;

        if (direction === 'left') {
            moved = this.moveLeft();
        } else if (direction === 'right') {
            moved = this.moveRight();
        } else if (direction === 'up') {
            moved = this.moveUp();
        } else if (direction === 'down') {
            moved = this.moveDown();
        }

        if (moved) {
            this.addRandomTile();
            this.render();
            this.updateScore();
            this.updateProgress();

            if (this.hasWon() && !this.gameWon) {
                this.gameWon = true;
                this.showMessage('You Win!', 'Congratulations! You reached 2048!');
            }

            if (this.isGameOver()) {
                this.gameOver = true;
                this.showMessage('Game Over!', 'No more moves available.');
            }
        }
    }

    moveLeft() {
        let moved = false;
        for (let r = 0; r < this.size; r++) {
            const row = this.grid[r].filter(cell => cell !== 0);
            const newRow = [];

            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    newRow.push(row[i] * 2);
                    this.score += row[i] * 2;
                    i++;
                } else {
                    newRow.push(row[i]);
                }
            }

            while (newRow.length < this.size) {
                newRow.push(0);
            }

            if (JSON.stringify(this.grid[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[r] = newRow;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let r = 0; r < this.size; r++) {
            const row = this.grid[r].filter(cell => cell !== 0);
            const newRow = [];

            for (let i = row.length - 1; i >= 0; i--) {
                if (i > 0 && row[i] === row[i - 1]) {
                    newRow.unshift(row[i] * 2);
                    this.score += row[i] * 2;
                    i--;
                } else {
                    newRow.unshift(row[i]);
                }
            }

            while (newRow.length < this.size) {
                newRow.unshift(0);
            }

            if (JSON.stringify(this.grid[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[r] = newRow;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let c = 0; c < this.size; c++) {
            const column = [];
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] !== 0) {
                    column.push(this.grid[r][c]);
                }
            }

            const newColumn = [];
            for (let i = 0; i < column.length; i++) {
                if (i < column.length - 1 && column[i] === column[i + 1]) {
                    newColumn.push(column[i] * 2);
                    this.score += column[i] * 2;
                    i++;
                } else {
                    newColumn.push(column[i]);
                }
            }

            while (newColumn.length < this.size) {
                newColumn.push(0);
            }

            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] !== newColumn[r]) {
                    moved = true;
                }
                this.grid[r][c] = newColumn[r];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let c = 0; c < this.size; c++) {
            const column = [];
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] !== 0) {
                    column.push(this.grid[r][c]);
                }
            }

            const newColumn = [];
            for (let i = column.length - 1; i >= 0; i--) {
                if (i > 0 && column[i] === column[i - 1]) {
                    newColumn.unshift(column[i] * 2);
                    this.score += column[i] * 2;
                    i--;
                } else {
                    newColumn.unshift(column[i]);
                }
            }

            while (newColumn.length < this.size) {
                newColumn.unshift(0);
            }

            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] !== newColumn[r]) {
                    moved = true;
                }
                this.grid[r][c] = newColumn[r];
            }
        }
        return moved;
    }

    hasWon() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const current = this.grid[r][c];
                if (c < this.size - 1 && current === this.grid[r][c + 1]) {
                    return false;
                }
                if (r < this.size - 1 && current === this.grid[r + 1][c]) {
                    return false;
                }
            }
        }

        return true;
    }

    render() {
        // Clear existing tiles
        this.tileContainer.innerHTML = '';

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                if (value !== 0) {
                    // Security: Create DOM elements safely without innerHTML injection
                    const tile = document.createElement('div');

                    // Use classList for safe class manipulation
                    const tileClass = value > 2048 ? 'super' : value;
                    tile.className = `tile tile-${tileClass} tile-new`;

                    // Use textContent (not innerHTML) to prevent XSS if data were ever user-controlled
                    tile.textContent = value;

                    // Responsive tile positioning using CSS custom properties
                    tile.style.setProperty('--col-index', c);
                    tile.style.setProperty('--row-index', r);

                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }

    updateProgress() {
        // Find the highest tile value on the board
        let maxTile = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] > maxTile) {
                    maxTile = this.grid[r][c];
                }
            }
        }

        // Security: Use textContent to safely update display (prevents XSS)
        const currentMaxElement = document.getElementById('current-max');
        if (currentMaxElement) {
            currentMaxElement.textContent = maxTile || 2;
        }

        // Update progress bar sections
        const sections = document.querySelectorAll('.progress-section');
        sections.forEach(section => {
            const value = parseInt(section.getAttribute('data-value'), 10);
            if (value <= maxTile) {
                section.classList.add('achieved');
            } else {
                section.classList.remove('achieved');
            }
        });
    }

    updateScore() {
        // Security: Use textContent for safe DOM updates
        this.scoreElement.textContent = this.score;

        if (this.score > this.best) {
            this.best = this.score;
            // Security: Store only validated numeric values in localStorage
            try {
                localStorage.setItem('2048-best', this.best.toString());
            } catch (e) {
                // Handle localStorage quota exceeded or disabled scenarios gracefully
                console.warn('Unable to save best score:', e);
            }
            this.updateBest();
        }
    }

    updateBest() {
        // Security: Use textContent for safe DOM updates
        this.bestElement.textContent = this.best;
    }

    showMessage(title, text) {
        // Security: Use textContent to safely set message content
        const messageTitle = document.getElementById('message-title');
        const messageText = document.getElementById('message-text');

        if (messageTitle) messageTitle.textContent = title;
        if (messageText) messageText.textContent = text;

        this.gameMessage.classList.add(this.gameWon ? 'game-won' : 'game-over');
    }

    hideMessage() {
        this.gameMessage.classList.remove('game-won', 'game-over');
    }

    restart() {
        this.init();
    }
}

// Security: Initialize game only after DOM is fully loaded to ensure all elements exist
// This prevents null reference errors and potential security issues from race conditions
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
} else {
    // DOM already loaded
    window.game = new Game();
}
