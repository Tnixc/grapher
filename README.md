# Grapher

An advanced web-based graphing calculator with automatic asymptote and discontinuity detection.

## Features

- 📊 **Multi-Function Graphing**: Plot multiple mathematical functions simultaneously
- 🎯 **Asymptote Detection**: Automatically identifies and highlights vertical and horizontal asymptotes
- 🕳️ **Discontinuity Detection**: Detects and marks removable discontinuities (holes) in functions
- ✏️ **Math Input**: Style math input with standard mathematical notation (x^2, sin(x), 1/x, etc.)
- 🎨 **Color Customization**: Assign unique colors to each function for easy identification
- 🔍 **Interactive Tooltips**: Hover over the graph to see coordinate values
- ⚙️ **Adjustable View**: Customize X and Y axis ranges to zoom in/out

## Usage

Simply open `index.html` in a web browser. No build process or server required!

### Supported Functions

The calculator supports standard mathematical expressions:

- Basic operations: `+`, `-`, `*`, `/`, `^`
- Trigonometric: `sin(x)`, `cos(x)`, `tan(x)`, `sec(x)`, `csc(x)`, `cot(x)`
- Inverse trig: `asin(x)`, `acos(x)`, `atan(x)`
- Logarithmic: `log(x)`, `ln(x)`, `log10(x)`
- Exponential: `exp(x)`, `e^x`
- Absolute value: `abs(x)`
- Square root: `sqrt(x)`

### Examples

Try these functions to see asymptote and discontinuity detection in action:

- `1/x` - Vertical asymptote at x=0, horizontal asymptote at y=0
- `tan(x)` - Multiple vertical asymptotes
- `(x^2-1)/(x-1)` - Removable discontinuity (hole) at x=1
- `1/(x^2-4)` - Vertical asymptotes at x=2 and x=-2
- `x/(x^2+1)` - Horizontal asymptote at y=0

## Technology Stack

- **HTML5 Canvas** for high-performance rendering
- **Math.js** for mathematical expression parsing and evaluation
- **Vanilla JavaScript** for application logic
- **CSS3** for modern, responsive styling

## Color Legend

- 🔴 **Red Dashed Lines**: Vertical asymptotes
- 🟢 **Green Dashed Lines**: Horizontal asymptotes
- 🟠 **Orange Circles**: Discontinuities (holes)