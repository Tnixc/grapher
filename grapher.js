// Grapher - Advanced Graphing Calculator
// Main application logic

class Grapher {
  constructor() {
    this.canvas = document.getElementById("graph-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.functions = [];
    this.nextFunctionId = 0;

    // View bounds
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;

    // Pan and zoom state
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    // Colors for functions
    this.colors = [
      "#00adb5",
      "#ff6b6b",
      "#4ecdc4",
      "#ffe66d",
      "#a8dadc",
      "#f1faee",
      "#ff006e",
      "#8338ec",
    ];

    this.setupCanvas();
    this.setupEventListeners();
    this.addInitialFunction();
    this.draw();
  }

  setupCanvas() {
    // Set canvas size to fill container with high DPI support
    const container = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width - 40;
    const height = rect.height - 40;

    // Set display size
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    // Set actual size in memory (scaled by DPR for high resolution)
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    // Scale context to match DPR
    this.ctx.scale(dpr, dpr);

    // Store display dimensions for calculations
    this.displayWidth = width;
    this.displayHeight = height;
  }

  setupEventListeners() {
    // Add function button
    document
      .getElementById("add-function-btn")
      .addEventListener("click", () => {
        this.addFunction();
      });

    // View controls
    document.getElementById("x-min").addEventListener("change", (e) => {
      this.xMin = parseFloat(e.target.value);
      this.draw();
    });

    document.getElementById("x-max").addEventListener("change", (e) => {
      this.xMax = parseFloat(e.target.value);
      this.draw();
    });

    document.getElementById("y-min").addEventListener("change", (e) => {
      this.yMin = parseFloat(e.target.value);
      this.draw();
    });

    document.getElementById("y-max").addEventListener("change", (e) => {
      this.yMax = parseFloat(e.target.value);
      this.draw();
    });

    document.getElementById("reset-view-btn").addEventListener("click", () => {
      this.resetView();
    });

    // Canvas mouse events for tooltip
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isPanning) {
        this.handlePan(e);
      } else {
        this.handleMouseMove(e);
      }
    });

    this.canvas.addEventListener("mousedown", (e) => {
      this.startPan(e);
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.endPan(e);
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.hideTooltip();
      this.isPanning = false;
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener("wheel", (e) => {
      this.handleZoom(e);
    });

    // Window resize
    window.addEventListener("resize", () => {
      this.setupCanvas();
      this.draw();
    });
  }

  addInitialFunction() {
    this.addFunction("1/x", false);
  }

  addFunction(expression = "", skipDraw = false) {
    const id = this.nextFunctionId++;
    const color = this.colors[id % this.colors.length];

    const func = {
      id,
      expression: expression,
      color: color,
      visible: true,
      parsed: null,
      asymptotes: [],
      holes: [],
    };

    this.functions.push(func);
    this.renderFunctionItem(func);

    if (expression && !skipDraw) {
      this.updateFunction(func);
    }
  }

  renderFunctionItem(func) {
    const list = document.getElementById("functions-list");
    const item = document.createElement("div");
    item.className = "function-item";
    item.dataset.id = func.id;

    item.innerHTML = `
            <div class="function-header">
                <input type="color" class="function-color" value="${func.color}">
                <input type="text" class="function-input" placeholder="f(x) = x^2, sin(x), 1/x, etc." value="${func.expression}">
            </div>
            <div class="function-info">
                <span class="info-text"></span>
            </div>
            <div class="function-controls">
                <button class="btn btn-small toggle-btn">${func.visible ? "Hide" : "Show"}</button>
                <button class="btn btn-small btn-danger remove-btn">Remove</button>
            </div>
        `;

    // Event listeners
    const input = item.querySelector(".function-input");
    const colorPicker = item.querySelector(".function-color");
    const toggleBtn = item.querySelector(".toggle-btn");
    const removeBtn = item.querySelector(".remove-btn");

    input.addEventListener("input", (e) => {
      func.expression = e.target.value;
      this.updateFunction(func);
    });

    colorPicker.addEventListener("change", (e) => {
      func.color = e.target.value;
      this.draw();
    });

    toggleBtn.addEventListener("click", () => {
      func.visible = !func.visible;
      toggleBtn.textContent = func.visible ? "Hide" : "Show";
      this.updateAsymptotesList();
      this.draw();
    });

    removeBtn.addEventListener("click", () => {
      this.removeFunction(func.id);
    });

    list.appendChild(item);
  }

  removeFunction(id) {
    const index = this.functions.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.functions.splice(index, 1);
      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) item.remove();
      this.updateAsymptotesList();
      this.draw();
    }
  }

  updateAsymptotesList() {
    const listElement = document.getElementById("asymptotes-list");
    listElement.innerHTML = "";

    // Collect all asymptotes and holes from visible functions
    const allFeatures = [];

    for (const func of this.functions) {
      if (!func.visible || !func.parsed) continue;

      if (func.asymptotes.length > 0 || func.holes.length > 0) {
        allFeatures.push({
          func: func,
          asymptotes: func.asymptotes,
          holes: func.holes,
        });
      }
    }

    if (allFeatures.length === 0) {
      return;
    }

    // Display features for each function
    for (const feature of allFeatures) {
      const funcDiv = document.createElement("div");
      funcDiv.className = "asymptote-group";

      // Function title
      const title = document.createElement("div");
      title.className = "asymptote-group-title";
      title.innerHTML = `
                <span style="width: 12px; height: 12px; background: ${feature.func.color}; border-radius: 2px; display: inline-block;"></span>
                <span>f(x) = ${feature.func.expression.substring(0, 20)}${feature.func.expression.length > 20 ? "..." : ""}</span>
            `;
      funcDiv.appendChild(title);

      const valuesDiv = document.createElement("div");
      valuesDiv.className = "asymptote-values";

      // Vertical asymptotes
      const vAsymp = feature.asymptotes.filter((a) => a.type === "vertical");
      if (vAsymp.length > 0) {
        for (const asymp of vAsymp) {
          const valueDiv = document.createElement("div");
          valueDiv.className = "asymptote-value";
          valueDiv.style.borderLeftColor = "#ff3b30";
          valueDiv.style.borderLeftWidth = "2px";
          valueDiv.textContent = `V.A. at x = ${asymp.x.toFixed(3)}`;
          valuesDiv.appendChild(valueDiv);
        }
      }

      // Horizontal asymptotes
      const hAsymp = feature.asymptotes.filter((a) => a.type === "horizontal");
      if (hAsymp.length > 0) {
        for (const asymp of hAsymp) {
          const valueDiv = document.createElement("div");
          valueDiv.className = "asymptote-value";
          valueDiv.style.borderLeftColor = "#34c759";
          valueDiv.style.borderLeftWidth = "2px";
          valueDiv.textContent = `H.A. at y = ${asymp.y.toFixed(3)}`;
          valuesDiv.appendChild(valueDiv);
        }
      }

      // Holes
      if (feature.holes.length > 0) {
        for (const hole of feature.holes) {
          const valueDiv = document.createElement("div");
          valueDiv.className = "asymptote-value";
          valueDiv.style.borderLeftColor = "#ff9500";
          valueDiv.style.borderLeftWidth = "2px";
          valueDiv.textContent = `Hole at (${hole.x.toFixed(3)}, ${hole.y.toFixed(3)})`;
          valuesDiv.appendChild(valueDiv);
        }
      }

      funcDiv.appendChild(valuesDiv);
      listElement.appendChild(funcDiv);
    }
  }

  updateFunction(func) {
    try {
      // Parse the expression
      const expr = func.expression.trim();
      if (!expr) {
        func.parsed = null;
        func.asymptotes = [];
        func.holes = [];
        this.updateFunctionInfo(func, "");
        this.updateAsymptotesList();
        this.draw();
        return;
      }

      // Replace common math notation
      const normalized = this.normalizeExpression(expr);
      func.parsed = math.compile(normalized);

      // Detect asymptotes and holes
      this.detectAsymptotesAndHoles(func);

      // Update info display
      let info = "";
      if (func.asymptotes.length > 0) {
        const vAsymp = func.asymptotes.filter((a) => a.type === "vertical");
        const hAsymp = func.asymptotes.filter((a) => a.type === "horizontal");

        if (vAsymp.length > 0) {
          const vList = vAsymp.map((a) => `x=${a.x.toFixed(2)}`).join(", ");
          info += `<span class="info-badge asymptote" title="Vertical asymptotes at: ${vList}">${vAsymp.length} V.A.</span>`;
        }
        if (hAsymp.length > 0) {
          const hList = hAsymp.map((a) => `y=${a.y.toFixed(2)}`).join(", ");
          info += `<span class="info-badge asymptote" title="Horizontal asymptotes at: ${hList}">${hAsymp.length} H.A.</span>`;
        }
      }
      if (func.holes.length > 0) {
        const holeList = func.holes
          .map((h) => `(${h.x.toFixed(2)}, ${h.y.toFixed(2)})`)
          .join(", ");
        info += `<span class="info-badge hole" title="Holes at: ${holeList}">${func.holes.length} Hole${func.holes.length > 1 ? "s" : ""}</span>`;
      }
      this.updateFunctionInfo(func, info);

      this.updateAsymptotesList();
      this.draw();
    } catch (error) {
      console.error("Error parsing function:", error, error.stack);
      this.updateFunctionInfo(
        func,
        `<span style="color: #ff4444;">Error: ${error.message}</span>`,
      );
      func.parsed = null;
      func.asymptotes = [];
      func.holes = [];
      this.updateAsymptotesList();
    }
  }

  normalizeExpression(expr) {
    // Replace common notations
    let normalized = expr.replace(/\^/g, "^"); // Power notation

    // Fix implicit multiplication
    // Number followed by letter or opening parenthesis: 2x -> 2*x, 2(x+1) -> 2*(x+1)
    normalized = normalized.replace(/(\d)([a-zA-Z(])/g, "$1*$2");

    // Closing parenthesis followed by number: )(2 -> )*(2
    normalized = normalized.replace(/\)(\d)/g, ")*$1");

    // Closing parenthesis followed by letter: )(x -> )*(x
    normalized = normalized.replace(/\)([a-zA-Z])/g, ")*$1");

    // Closing parenthesis followed by opening parenthesis: )( -> )*(
    normalized = normalized.replace(/\)\(/g, ")*(");

    // Letter followed by opening parenthesis (but not a function call)
    // We need to be careful here - sin(x) should stay sin(x), but x(x+1) -> x*(x+1)
    // This is already handled by the tokenizer treating multi-letter as functions

    return normalized;
  }

  updateFunctionInfo(func, html) {
    const item = document.querySelector(`[data-id="${func.id}"]`);
    if (item) {
      const infoText = item.querySelector(".info-text");
      if (infoText) {
        infoText.innerHTML = html;
      }
    }
  }

  evaluateFunction(func, x) {
    if (!func.parsed) return null;
    try {
      const result = func.parsed.evaluate({ x });
      if (typeof result === "number" && isFinite(result)) {
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  detectAsymptotesAndHoles(func) {
    func.asymptotes = [];
    func.holes = [];

    const xRange = this.xMax - this.xMin;
    const samples = 1000; // Increased for better detection
    const step = xRange / samples;

    // Detect vertical asymptotes and holes
    for (let i = 0; i < samples; i++) {
      const x = this.xMin + i * step;
      const leftX = x - step * 0.5;
      const rightX = x + step * 0.5;

      const y1 = this.evaluateFunction(func, leftX);
      const y2 = this.evaluateFunction(func, x);
      const y3 = this.evaluateFunction(func, rightX);

      // Check for vertical asymptote - undefined at point but defined on both sides
      if (y2 === null && y1 !== null && y3 !== null) {
        // Check if there's a sign change or large jump
        const signChange = (y1 > 0 && y3 < 0) || (y1 < 0 && y3 > 0);
        const largeJump = Math.abs(y3 - y1) > (this.yMax - this.yMin) * 1.5;

        if (signChange || largeJump) {
          // Vertical asymptote
          func.asymptotes.push({
            type: "vertical",
            x: x,
            y: null,
          });
        } else if (Math.abs(y3 - y1) < (this.yMax - this.yMin) * 0.5) {
          // Potential hole (removable discontinuity)
          const avgY = (y1 + y3) / 2;
          if (Math.abs(avgY) < Math.abs(this.yMax - this.yMin) * 5) {
            func.holes.push({
              x: x,
              y: avgY,
            });
          }
        }
      }

      // Also check for asymptotes where value goes to infinity
      if (y1 !== null && y2 !== null && y3 !== null) {
        if (Math.abs(y2) > Math.abs(this.yMax - this.yMin) * 100) {
          const signChange1 = (y1 > 0 && y2 < 0) || (y1 < 0 && y2 > 0);
          const signChange2 = (y2 > 0 && y3 < 0) || (y2 < 0 && y3 > 0);

          if (signChange1 || signChange2) {
            func.asymptotes.push({
              type: "vertical",
              x: x,
              y: null,
            });
          }
        }
      }
    }

    // Detect horizontal asymptotes
    const leftY = this.evaluateFunction(func, this.xMin - 100);
    const rightY = this.evaluateFunction(func, this.xMax + 100);

    if (leftY !== null && Math.abs(leftY) < 1000) {
      func.asymptotes.push({
        type: "horizontal",
        x: null,
        y: leftY,
      });
    }

    if (
      rightY !== null &&
      Math.abs(rightY) < 1000 &&
      Math.abs(rightY - (leftY || 0)) > 0.1
    ) {
      func.asymptotes.push({
        type: "horizontal",
        x: null,
        y: rightY,
      });
    }

    // Deduplicate asymptotes
    func.asymptotes = this.deduplicateAsymptotes(func.asymptotes);
  }

  deduplicateAsymptotes(asymptotes) {
    const threshold = (this.xMax - this.xMin) * 0.02;
    const unique = [];

    for (const asymp of asymptotes) {
      const isDuplicate = unique.some((u) => {
        if (u.type !== asymp.type) return false;
        if (asymp.type === "vertical") {
          return Math.abs(u.x - asymp.x) < threshold;
        } else {
          return Math.abs(u.y - asymp.y) < 0.5;
        }
      });

      if (!isDuplicate) {
        unique.push(asymp);
      }
    }

    return unique;
  }

  resetView() {
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;

    document.getElementById("x-min").value = this.xMin;
    document.getElementById("x-max").value = this.xMax;
    document.getElementById("y-min").value = this.yMin;
    document.getElementById("y-max").value = this.yMax;

    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    // Clear canvas
    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--canvas-bg")
        .trim() || "#fafafa";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    this.drawGrid();

    // Draw axes
    this.drawAxes();

    // Draw functions
    for (const func of this.functions) {
      if (func.visible && func.parsed) {
        this.drawFunction(func);
        this.drawAsymptotes(func);
        this.drawHoles(func);
      }
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    const gridColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--border-color")
        .trim() || "#d2d2d7";
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    // Vertical grid lines
    const xStep = this.getGridStep(this.xMax - this.xMin);
    for (
      let x = Math.ceil(this.xMin / xStep) * xStep;
      x <= this.xMax;
      x += xStep
    ) {
      const px = this.xToPixel(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    const yStep = this.getGridStep(this.yMax - this.yMin);
    for (
      let y = Math.ceil(this.yMin / yStep) * yStep;
      y <= this.yMax;
      y += yStep
    ) {
      const py = this.yToPixel(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  getGridStep(range) {
    const targetSteps = 10;
    const roughStep = range / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }

  drawAxes() {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    const axisColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--text-secondary")
        .trim() || "#6e6e73";
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;

    // X-axis
    if (this.yMin <= 0 && this.yMax >= 0) {
      const y = this.yToPixel(0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // X-axis labels
      ctx.fillStyle = axisColor;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      const xStep = this.getGridStep(this.xMax - this.xMin);
      for (
        let x = Math.ceil(this.xMin / xStep) * xStep;
        x <= this.xMax;
        x += xStep
      ) {
        if (Math.abs(x) < xStep * 0.01) continue; // Skip origin
        const px = this.xToPixel(x);
        ctx.fillText(x.toFixed(1), px, y + 15);
      }
    }

    // Y-axis
    if (this.xMin <= 0 && this.xMax >= 0) {
      const x = this.xToPixel(0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = axisColor;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      const yStep = this.getGridStep(this.yMax - this.yMin);
      for (
        let y = Math.ceil(this.yMin / yStep) * yStep;
        y <= this.yMax;
        y += yStep
      ) {
        if (Math.abs(y) < yStep * 0.01) continue; // Skip origin
        const py = this.yToPixel(y);
        ctx.fillText(y.toFixed(1), x - 5, py + 4);
      }
    }

    // Origin label
    if (this.xMin <= 0 && this.xMax >= 0 && this.yMin <= 0 && this.yMax >= 0) {
      const ox = this.xToPixel(0);
      const oy = this.yToPixel(0);
      ctx.fillStyle = axisColor;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("0", ox - 5, oy + 15);
    }
  }

  drawFunction(func) {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    ctx.strokeStyle = func.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let prevY = null;
    let prevX = null;
    let pathStarted = false;

    const samples = width * 2; // High resolution
    for (let px = 0; px <= width; px += 0.5) {
      const x = this.pixelToX(px);
      const y = this.evaluateFunction(func, x);

      if (y !== null) {
        const py = this.yToPixel(y);

        // Check for discontinuity
        if (prevY !== null && Math.abs(py - prevY) > height / 2) {
          // Large jump - don't connect
          ctx.stroke();
          ctx.beginPath();
          pathStarted = false;
        }

        if (py >= -50 && py <= height + 50) {
          // Extended bounds for smoother curves
          if (!pathStarted) {
            ctx.moveTo(px, py);
            pathStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
        }

        prevY = py;
        prevX = px;
      } else {
        if (pathStarted) {
          ctx.stroke();
          ctx.beginPath();
          pathStarted = false;
        }
        prevY = null;
      }
    }

    ctx.stroke();
  }

  drawAsymptotes(func) {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    for (const asymp of func.asymptotes) {
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;

      if (asymp.type === "vertical") {
        ctx.strokeStyle = "#ff3b30";
        const px = this.xToPixel(asymp.x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      } else if (asymp.type === "horizontal") {
        ctx.strokeStyle = "#34c759";
        const py = this.yToPixel(asymp.y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
  }

  drawHoles(func) {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    ctx.fillStyle = "#ff9500";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    for (const hole of func.holes) {
      const px = this.xToPixel(hole.x);
      const py = this.yToPixel(hole.y);

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  xToPixel(x) {
    const width = this.displayWidth || this.canvas.width;
    return ((x - this.xMin) / (this.xMax - this.xMin)) * width;
  }

  yToPixel(y) {
    const height = this.displayHeight || this.canvas.height;
    return height - ((y - this.yMin) / (this.yMax - this.yMin)) * height;
  }

  pixelToX(px) {
    const width = this.displayWidth || this.canvas.width;
    return this.xMin + (px / width) * (this.xMax - this.xMin);
  }

  pixelToY(py) {
    const height = this.displayHeight || this.canvas.height;
    return this.yMin + ((height - py) / height) * (this.yMax - this.yMin);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x = this.pixelToX(px);
    const y = this.pixelToY(py);

    const tooltip = document.getElementById("tooltip");
    tooltip.style.left = e.clientX + 15 + "px";
    tooltip.style.top = e.clientY + 15 + "px";
    tooltip.innerHTML = `x: ${x.toFixed(3)}<br>y: ${y.toFixed(3)}`;
    tooltip.classList.add("show");
  }

  hideTooltip() {
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.remove("show");
  }

  startPan(e) {
    this.isPanning = true;
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
    this.canvas.style.cursor = "grabbing";
    this.hideTooltip();
  }

  handlePan(e) {
    if (!this.isPanning) return;

    const dx = e.clientX - this.lastPanX;
    const dy = e.clientY - this.lastPanY;

    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    const xRange = this.xMax - this.xMin;
    const yRange = this.yMax - this.yMin;

    const xShift = -(dx / width) * xRange;
    const yShift = (dy / height) * yRange;

    this.xMin += xShift;
    this.xMax += xShift;
    this.yMin += yShift;
    this.yMax += yShift;

    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;

    this.updateViewInputs();
    this.draw();
  }

  endPan(e) {
    this.isPanning = false;
    this.canvas.style.cursor = "crosshair";
  }

  handleZoom(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get the graph coordinates at mouse position
    const graphX = this.pixelToX(mouseX);
    const graphY = this.pixelToY(mouseY);

    // Zoom factor (smaller = slower zoom)
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    const xRange = this.xMax - this.xMin;
    const yRange = this.yMax - this.yMin;

    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;

    // Calculate the ratio of mouse position in the viewport
    const xRatio = (graphX - this.xMin) / xRange;
    const yRatio = (graphY - this.yMin) / yRange;

    // Adjust bounds to zoom toward mouse position
    this.xMin = graphX - newXRange * xRatio;
    this.xMax = graphX + newXRange * (1 - xRatio);
    this.yMin = graphY - newYRange * yRatio;
    this.yMax = graphY + newYRange * (1 - yRatio);

    this.updateViewInputs();
    this.draw();
  }

  updateViewInputs() {
    document.getElementById("x-min").value = this.xMin.toFixed(2);
    document.getElementById("x-max").value = this.xMax.toFixed(2);
    document.getElementById("y-min").value = this.yMin.toFixed(2);
    document.getElementById("y-max").value = this.yMax.toFixed(2);
  }
}

// Initialize the grapher when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.grapher = new Grapher();
});
