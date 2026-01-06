# Assets Directory

This directory contains visual assets for the 2048 game.

## Progress Bar Background

The progress bar background is fully customisable by replacing the `progress-bar.png` file.

### How to Replace

1. Create or obtain your own image for the progress bar background
   - **Recommended dimensions**: 500px width × 100px height
   - **Format**: PNG (supports transparency)
   - The image should represent progression visually (gradient, pattern, etc.)

2. Save your image as `progress-bar.png` in this directory

3. The CSS will automatically display your custom image

### Current Setup

- The game expects `progress-bar.png` in this directory
- CSS properties:
  - `background-size: cover` - Image will resize to fill the 500×100px progress bar
  - `background-position: center` - Image will be centred
  - If no image exists, a grey fallback colour (#d3d3d3) will display

### Supported Image Formats

While PNG is configured by default, you can modify `css/style.css` to use other formats:
- JPG/JPEG (no transparency)
- WebP (modern browsers only)
- SVG (vector graphics)

To change the format, edit the `.progress-bar` background-image URL in `css/style.css`.

### Image Positioning Options

If your image doesn't fit perfectly, you can adjust the CSS:
- `background-size: contain` - Fit entire image without cropping
- `background-size: 100% 100%` - Stretch to fill exactly
- `background-position: left/right/top/bottom` - Change alignment
