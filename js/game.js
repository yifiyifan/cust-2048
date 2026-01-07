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
    const storedBest = localStorage.getItem("2048-best");
    this.best = this.validateScore(storedBest);

    // Security: Validate difficulty level from localStorage
    const storedDifficulty = localStorage.getItem("2048-difficulty");
    this.difficulty = this.validateDifficulty(storedDifficulty);

    // Milestone targets for each difficulty level
    this.milestoneTargets = {
      beginner: 256,
      easy: 512,
      medium: 1024,
      hard: 2048,
    };

    // Track if milestone unlocked in CURRENT game (resets on restart)
    this.isMilestoneUnlockedInGame = false;

    this.gameWon = false;
    this.gameOver = false;

    // Cache DOM elements to avoid repeated queries
    this.tileContainer = document.getElementById("tile-container");
    this.scoreElement = document.getElementById("score");
    this.bestElement = document.getElementById("best");
    this.gameMessage = document.getElementById("game-message");
    this.progressBar = document.getElementById("progress-bar");
    this.difficultyFill = document.getElementById("difficulty-fill");
    this.zoomButton = document.getElementById("zoom-progress-btn");
    this.zoomModal = document.getElementById("progress-zoom-modal");
    this.zoomImage = document.getElementById("zoom-progress-image");
    this.zoomCloseBtn = document.getElementById("zoom-close-btn");
    this.targetValueElement = document.getElementById("target-value");
    this.zoomBtnIcon = document.getElementById("zoom-btn-icon");
    this.zoomBtnText = document.getElementById("zoom-btn-text");

    // Touch gesture configuration
    this.SWIPE_THRESHOLD = 30; // minimum pixels for valid swipe
    this.gameContainer = document.querySelector(".game-container");
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchInProgress = false;

    this.init();
    this.setupInputs();
    this.setupTouchControls();
    this.setupDifficultyControls();
    this.setupZoomControls();
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
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  }

  /**
   * Validates difficulty level from localStorage
   * Security: Ensure only valid difficulty values are used
   * @param {string|null} value - The difficulty value to validate
   * @returns {string} - Valid difficulty level or 'beginner' as default
   */
  validateDifficulty(value) {
    const validDifficulties = ["beginner", "easy", "medium", "hard"];
    if (value && validDifficulties.includes(value)) {
      return value;
    }
    return "beginner"; // Default difficulty
  }

  init() {
    // Reset milestone unlock status for new game
    this.isMilestoneUnlockedInGame = false;

    // Initialize empty grid
    this.grid = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(0));
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

    // Update zoom button to locked state
    this.updateZoomButton();
  }

  setupInputs() {
    // Security: Input validation - only process allowed key inputs
    // Define strict allow-list of valid keys to prevent unexpected behavior
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      W: "up",
      s: "down",
      S: "down",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
    };

    document.addEventListener("keydown", (e) => {
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
    if (!this.gameContainer || !("ontouchstart" in window)) {
      return;
    }

    // Prevent default touch behaviors for game area
    this.gameContainer.addEventListener(
      "touchstart",
      (e) => {
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
      },
      { passive: false }
    ); // passive: false allows preventDefault

    this.gameContainer.addEventListener(
      "touchmove",
      (e) => {
        if (!this.touchInProgress) return;

        // Prevent scrolling while swiping
        e.preventDefault();
      },
      { passive: false }
    );

    this.gameContainer.addEventListener("touchend", (e) => {
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
    this.gameContainer.addEventListener("touchcancel", () => {
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
      return deltaX > 0 ? "right" : "left";
    }
    // Vertical swipe (Y movement dominates)
    else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  setupDifficultyControls() {
    const markers = document.querySelectorAll(".difficulty-marker");

    markers.forEach((marker) => {
      marker.addEventListener("click", (e) => {
        // Security: Validate the difficulty value from data attribute
        const difficulty = marker.getAttribute("data-difficulty");
        const level = parseInt(marker.getAttribute("data-level"), 10);

        // Validate inputs before processing
        if (
          this.validateDifficulty(difficulty) === difficulty &&
          !isNaN(level)
        ) {
          this.setDifficulty(difficulty, level);
        }
      });
    });

    // Initialize UI with current difficulty
    this.updateDifficultyUI();
  }

  setDifficulty(difficulty, level) {
    this.difficulty = difficulty;

    // Security: Store only validated difficulty value in localStorage
    try {
      localStorage.setItem("2048-difficulty", difficulty);
    } catch (e) {
      console.warn("Unable to save difficulty setting:", e);
    }

    // Update UI
    this.updateDifficultyUI();

    // Update progress bar background image based on difficulty
    if (this.progressBar) {
      this.progressBar.style.backgroundImage = `url('assets/progress-bar-${difficulty}.png')`;
    }

    // Update fill bar width (0%, 33%, 66%, 100% for levels 1-4)
    if (this.difficultyFill) {
      const fillPercentage = ((level - 1) / 3) * 100;
      this.difficultyFill.style.width = `${fillPercentage}%`;
    }

    // Restart game with new difficulty
    this.restart();
  }

  updateDifficultyUI() {
    const markers = document.querySelectorAll(".difficulty-marker");

    markers.forEach((marker) => {
      const difficulty = marker.getAttribute("data-difficulty");
      const level = parseInt(marker.getAttribute("data-level"), 10);

      if (difficulty === this.difficulty) {
        marker.classList.add("active");

        // Update fill bar
        if (this.difficultyFill && !isNaN(level)) {
          const fillPercentage = ((level - 1) / 3) * 100;
          this.difficultyFill.style.width = `${fillPercentage}%`;
        }

        // Update progress bar background
        if (this.progressBar) {
          this.progressBar.style.backgroundImage = `url('assets/progress-bar-${difficulty}.png')`;
        }
      } else {
        marker.classList.remove("active");
      }
    });

    // Update zoom button state when difficulty UI changes
    this.updateZoomButton();
  }

  setupZoomControls() {
    // Initialize button state
    this.updateZoomButton();

    // Open modal on button click
    if (this.zoomButton) {
      this.zoomButton.addEventListener("click", () => {
        this.openZoomModal();
      });
    }

    // Close modal on close button click
    if (this.zoomCloseBtn) {
      this.zoomCloseBtn.addEventListener("click", () => {
        this.closeZoomModal();
      });
    }

    // Close modal on backdrop click
    if (this.zoomModal) {
      this.zoomModal.addEventListener("click", (e) => {
        // Only close if clicking the backdrop, not the image
        if (e.target === this.zoomModal) {
          this.closeZoomModal();
        }
      });
    }

    // Close modal on ESC key
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.zoomModal &&
        this.zoomModal.classList.contains("active")
      ) {
        this.closeZoomModal();
      }
    });
  }

  /**
   * Get the milestone target for the current difficulty level
   * @returns {number} - Target tile value for current difficulty
   */
  getMilestoneTarget() {
    return this.milestoneTargets[this.difficulty] || 2048;
  }

  /**
   * Update zoom button state based on milestone achievement
   */
  updateZoomButton() {
    if (!this.zoomButton) return;

    const target = this.getMilestoneTarget();

    // Update target value in progress text
    if (this.targetValueElement) {
      this.targetValueElement.textContent = target;
    }

    // Update button state
    if (this.isMilestoneUnlockedInGame) {
      // Unlocked state
      this.zoomButton.disabled = false;
      this.zoomBtnIcon.textContent = "🔍";
      this.zoomBtnText.textContent = "Englarge image for clue";
    } else {
      // Locked state
      this.zoomButton.disabled = true;
      this.zoomBtnIcon.textContent = "🔒";
      this.zoomBtnText.innerHTML = `Locked - Reach <span id="zoom-target">${target}</span> for clue`;
    }
  }

  /**
   * Check if milestone reached and unlock if so
   * @param {number} maxTile - Current highest tile value on board
   */
  checkAndUnlockMilestone(maxTile) {
    const target = this.getMilestoneTarget();

    // If milestone reached and not yet unlocked in this game
    if (maxTile >= target && !this.isMilestoneUnlockedInGame) {
      this.isMilestoneUnlockedInGame = true;
      this.updateZoomButton();
    }
  }

  /**
   * Open the zoom modal with current progress bar image
   */
  openZoomModal() {
    if (!this.zoomModal || !this.zoomImage) return;

    // Set the image source to current difficulty's progress bar
    const imageSrc = `assets/progress-bar-${this.difficulty}.png`;
    this.zoomImage.src = imageSrc;

    // Show modal
    this.zoomModal.classList.add("active");
    this.zoomModal.setAttribute("aria-hidden", "false");

    // Prevent body scroll on mobile
    document.body.style.overflow = "hidden";
  }

  /**
   * Close the zoom modal
   */
  closeZoomModal() {
    if (!this.zoomModal) return;

    this.zoomModal.classList.remove("active");
    this.zoomModal.setAttribute("aria-hidden", "true");

    // Restore body scroll
    document.body.style.overflow = "";
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const { r, c } =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // 90% chance of 2, 10% chance of 4
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
      return true;
    }
    return false;
  }

  move(direction) {
    let moved = false;

    if (direction === "left") {
      moved = this.moveLeft();
    } else if (direction === "right") {
      moved = this.moveRight();
    } else if (direction === "up") {
      moved = this.moveUp();
    } else if (direction === "down") {
      moved = this.moveDown();
    }

    if (moved) {
      this.addRandomTile();
      this.render();
      this.updateScore();
      this.updateProgress();

      if (this.hasWon() && !this.gameWon) {
        this.gameWon = true;
        this.showMessage("You Win!", "Congratulations! You reached 2048!");
      }

      if (this.isGameOver()) {
        this.gameOver = true;
        this.showMessage("Game Over!", "No more moves available.");
      }
    }
  }

  moveLeft() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const row = this.grid[r].filter((cell) => cell !== 0);
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
      const row = this.grid[r].filter((cell) => cell !== 0);
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
    this.tileContainer.innerHTML = "";

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const value = this.grid[r][c];
        if (value !== 0) {
          // Security: Create DOM elements safely without innerHTML injection
          const tile = document.createElement("div");

          // Use classList for safe class manipulation
          const tileClass = value > 2048 ? "super" : value;
          tile.className = `tile tile-${tileClass} tile-new`;

          // Use textContent (not innerHTML) to prevent XSS if data were ever user-controlled
          tile.textContent = value;

          // Responsive tile positioning using CSS custom properties
          tile.style.setProperty("--col-index", c);
          tile.style.setProperty("--row-index", r);

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
    const currentMaxElement = document.getElementById("current-max");
    if (currentMaxElement) {
      currentMaxElement.textContent = maxTile || 2;
    }

    // Update progress bar sections
    const sections = document.querySelectorAll(".progress-section");
    sections.forEach((section) => {
      const value = parseInt(section.getAttribute("data-value"), 10);
      if (value <= maxTile) {
        section.classList.add("achieved");
      } else {
        section.classList.remove("achieved");
      }
    });

    // Check if milestone reached and unlock zoom feature
    this.checkAndUnlockMilestone(maxTile);
  }

  updateScore() {
    // Security: Use textContent for safe DOM updates
    this.scoreElement.textContent = this.score;

    if (this.score > this.best) {
      this.best = this.score;
      // Security: Store only validated numeric values in localStorage
      try {
        localStorage.setItem("2048-best", this.best.toString());
      } catch (e) {
        // Handle localStorage quota exceeded or disabled scenarios gracefully
        console.warn("Unable to save best score:", e);
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
    const messageTitle = document.getElementById("message-title");
    const messageText = document.getElementById("message-text");

    if (messageTitle) messageTitle.textContent = title;
    if (messageText) messageText.textContent = text;

    this.gameMessage.classList.add(this.gameWon ? "game-won" : "game-over");
  }

  hideMessage() {
    this.gameMessage.classList.remove("game-won", "game-over");
  }

  restart() {
    this.init();
  }
}

// Security: Initialize game only after DOM is fully loaded to ensure all elements exist
// This prevents null reference errors and potential security issues from race conditions
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();
  });
} else {
  // DOM already loaded
  window.game = new Game();
}
