import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

export class GlobeScatterPlot {
  constructor(container) {
    this.container = container;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    this.width = containerRect.width;
    this.height = this.width;

    // track rotation offset
    this.rotationOffset = 0;

    // Calculate scatter dimensions (width-based aspect ratio)
    this.scatterWidth = this.width;
    this.scatterHeight = this.width / 2;

    // Calculate scatter plot offset to center it vertically
    this.scatterOffsetY = (this.height - this.scatterHeight) / 2;
    console.log(this.scatterOffsetY);

    this.init();

    window.addEventListener("resize", () => {
      const containerRect = container.getBoundingClientRect();
      this.width = containerRect.width;
      this.height = containerRect.height;
      this.scatterWidth = this.width;
      this.scatterHeight = this.width / 2;
      this.scatterOffsetY = (this.height - this.scatterHeight) / 2;
      this.resize();
    });

    // labels for scatter plot
    this.matrix = [
      { x1: 3, x2: 4, y1: 4, y2: 5, type: "High\nrisk" },
      { x1: 4, x2: 5, y1: 4, y2: 5, type: "High\nrisk" },
      { x1: 4, x2: 5, y1: 3, y2: 4, type: "High\nrisk" },
      { x1: 2, x2: 3, y1: 4, y2: 5, type: "Moderate\nrisk" },
      { x1: 3, x2: 4, y1: 3, y2: 4, type: "Moderate\nrisk" },
      { x1: 4, x2: 5, y1: 2, y2: 3, type: "Moderate\nrisk" },
      { x1: 2, x2: 3, y1: 3, y2: 4, type: "Remote\nrisk" },
      { x1: 2, x2: 3, y1: 2, y2: 3, type: "Remote\nrisk" },
      { x1: 3, x2: 4, y1: 2, y2: 3, type: "Remote\nrisk" },
    ];

    this.matrixLabel = [
      {
        x: 4,
        y: 5,
        type: "High\nrisk",
        lineAnchor: "top",
        textAnchor: "middle",
        fontWeight: 700,
      },
      {
        x: 4.5,
        y: 2,
        type: "Moderate\nrisk",
        lineAnchor: "bottom",
        textAnchor: "middle",
        fontWeight: 700,
      },
      {
        x: 3,
        y: 2,
        type: "Remote\nrisk",
        lineAnchor: "bottom",
        textAnchor: "middle",
        fontWeight: 700,
      },
    ];

    // Add highlight configurations for each step
    this.stepHighlights = {
      3: [
        "Cross-strait military conflict between China and Taiwan",
        "Violent clash between radicalised political groups in the US",
      ],
      4: [
        "Deeper regional escalation of the Israel-Iran conflict",
        "Ceasefire breakdown between Israel and Hamas",
        "State collapse in Lebanon",
        "Georgian government submits to Russian agenda fully",
        "Large scale irregular migration from the Middle East and North Africa (MENA) and Sub-Saharan Africa to the EU",
      ],
      5: [
        "Disruptive hybrid attack on EU critical infrastructure (e.g. subsea sabotage; electrical grids shutdown)",
      ],
      6: [
        "Disruptive hybrid attack on EU critical infrastructure (e.g. subsea sabotage; electrical grids shutdown)",
      ],
      7: [
        "A ceasefire favourable to Russia in its war against Ukraine",
        "New Russian military action in non-NATO neighbouring states",
        "Direct NATO-Russia military conflict",
        "Georgian government submits to Russian agenda fully",
      ],
      8: ["A ceasefire favourable to Russia in its war against Ukraine"],
      9: [
        "New Russian military action in non-NATO neighbouring states",
        "Georgian government submits to Russian agenda fully",
      ],
      10: [
        "A ceasefire favourable to Russia in its war against Ukraine",
        "New Russian military action in non-NATO neighbouring states",
        "Direct NATO-Russia military conflict",
        "Georgian government submits to Russian agenda fully",
      ],
      11: [
        "US withdrawal from security guarantees to European allies",
        "Use of nuclear weapons by Russia",
      ],
      12: [
        "US withdrawal from security guarantees to European allies",
        "Use of nuclear weapons by Russia",
      ],
      13: [
        "Cross-strait military conflict between China and Taiwan",
        "US China direct military confrontation",
        "Deeper regional escalation of the Israel-Iran conflict",
        "Ceasefire breakdown between Israel and Hamas",
        "Destabilising armed conflict within Libya",
        "Aggressive Chinese action in the South China Sea",
        "Escalation of hostilities against European naval deployments in the Red Sea by the Houthi rebels",
      ],
    };
  }

  resize() {
    // Remove existing SVG
    d3.select(this.container).select("svg").remove();

    // Reinitialize with new dimensions
    this.init();
  }

  async init() {
    try {
      const response = await fetch(
        // "../flourish/data_mean_wide_sf.geojson"
        "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2026_01%20GS%20EUI/data_mean_wide_sf.geojson",
      );
      this.data = await response.json();
      console.log(this.data);
      console.log(this.data.features.map((d) => d.properties.name));
      console.log(this.data.features.map((d) => d.properties.q));

      // Fetch world coastlines
      const coastResponse = await fetch(
        "https://unpkg.com/world-atlas@2/land-110m.json",
      );
      const worldData = await coastResponse.json();
      this.coast = topojson.feature(worldData, worldData.objects.land);

      this.setupScales();
      this.setupProjection();
      this.createSVG();
      this.setupElements(); // This should call setupDataPoints
      this.setupInteractions();
      this.startRotation();

      // error handling
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  setupScales() {
    const impacts = this.data.features.map((f) => f.properties.Impact);
    const likelihoods = this.data.features.map((f) => f.properties.Likelihood);

    // Calculate aspect ratio
    const aspectRatio = 1;

    const plotSize = Math.min(this.width, this.height) - 100; // Padding

    this.xScale = d3
      .scaleLinear()
      .domain([1, 5])
      .range([50, plotSize + 50]);

    this.yScale = d3
      .scaleLinear()
      .domain([1, 5])
      .range([plotSize + 50, 50]);

    this.colorScale = d3
      .scaleOrdinal()
      .domain(["Remote\nrisk", "Moderate\nrisk", "High\nrisk"])
      .range(["#309ebe", "#aaa", "#df3144"]);
  }

  setupProjection() {
    this.projection = d3
      .geoOrthographic()
      .scale(250)
      .center([0, 0])
      .rotate([-90, -30])
      .translate([this.width / 2, this.height / 2]);

    this.initialScale = this.projection.scale();
    this.path = d3.geoPath().projection(this.projection);
  }

  createSVG() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
  }

  setupElements() {
    // Create axes group (initially hidden)
    this.setupAxes();

    // Add globe elements
    this.setupGlobe();

    // Add data points
    this.setupDataPoints();

    // Add tooltip
    this.setupTooltip();

    // Add matrix rectangles and labels (initially hidden)
    this.setupMatrix();

    // Add comparison lines group (initially hidden)
    this.setupComparisonLines();
  }

  setupMatrix() {
    // Matrix rectangles
    this.matrixRects = this.axesGroup
      .selectAll(".matrix-rect")
      .data(this.matrix)
      .enter()
      .append("rect")
      .attr("class", "matrix-rect")
      .attr("x", (d) => this.xScale(d.x1))
      .attr("y", (d) => this.yScale(d.y2))
      .attr("width", (d) => this.xScale(d.x2) - this.xScale(d.x1))
      .attr("height", (d) => this.yScale(d.y1) - this.yScale(d.y2))
      .attr("fill", (d) => this.colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", "2px")
      .attr("opacity", 0.1)
      .style("display", "none");

    // Matrix labels
    this.matrixLabels = this.axesGroup
      .selectAll(".matrix-label")
      .data(this.matrixLabel)
      .enter()
      .append("g")
      .attr("class", "matrix-label")
      .style("display", "none");

    this.matrixLabels
      .append("text")
      .attr("x", (d) => this.xScale(d.x))
      .attr("y", (d) => this.yScale(d.y))
      .attr("text-anchor", (d) => d.textAnchor)
      .attr("font-weight", (d) => d.fontWeight)
      .attr("dy", (d) => (d.lineAnchor === "top" ? "-0.5em" : "1em"))
      .text((d) => d.type)
      .attr("fill", (d) => this.colorScale(d.type));
    // .style("font-size", "12px");
  }

  setupComparisonLines() {
    // Create a group for comparison lines (2025 to 2026)
    this.comparisonLinesGroup = this.svg
      .append("g")
      .attr("class", "comparison-lines")
      .style("opacity", 0);

    // Add legend for comparison lines
    this.comparisonLegend = this.axesGroup
      .append("g")
      .attr("class", "comparison-legend")
      .attr("transform", `translate(${this.xScale(1.5)}, ${this.yScale(5)})`)
      .style("display", "none");

    // Legend line sample
    this.comparisonLegend
      .append("line")
      .attr("x1", 0)
      .attr("y1", "-.75em")
      .attr("x2", 30)
      .attr("y2", "-.75em")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .attr("marker-end", "url(#arrow)");

    // Legend text
    this.comparisonLegend
      .append("text")
      .attr("x", 35)
      .attr("y", 0)
      .attr("dy", "-0.75em")
      .attr("text-anchor", "start")
      .attr("fill", "#000")
      .style("font-size", "12px")
      .text("Change from\n2025 to 2026");
  }

  setupAxes() {
    this.axesGroup = this.svg.append("g").style("opacity", 0);

    // Add x-axis
    this.axesGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.width - 50})`)
      .call(
        d3
          .axisBottom(this.xScale)
          .tickValues([1, 2, 3, 4, 5])
          .tickFormat(d3.format("d")),
      )
      .call((g) => {
        g.selectAll(".tick line").attr("stroke", "#aaa");
        g.selectAll(".tick text").attr("fill", "#aaa");
        g.selectAll(".tick text").style("font-size", "12px");
        g.select(".domain").attr("stroke", "#aaa");
      })
      .append("text")
      .attr("x", this.width / 2)
      .attr("y", 40)
      .attr("fill", "#aaa")
      .attr("font-family", "PT Sans , sans-serif")
      // .attr("font-weight", 700)
      .text("Likelihood");

    // Add y-axis
    this.axesGroup
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(50,0)")
      .call(
        d3
          .axisLeft(this.yScale)
          .tickValues([1, 2, 3, 4, 5])
          .tickFormat(d3.format("d")),
      )
      .call((g) => {
        g.selectAll(".tick line").attr("stroke", "#aaa");
        g.selectAll(".tick text").attr("fill", "#aaa");
        g.selectAll(".tick text").style("font-size", "12px");
        g.select(".domain").attr("stroke", "#aaa");
      })
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.width / 2)
      .attr("y", -40)
      .attr("fill", "#aaa")
      .attr("font-family", "PT Sans , sans-serif")
      // .attr("font-weight", 700)
      .text("Impact");
  }

  setupGlobe() {
    this.globe = this.svg
      .append("circle")
      .attr("fill", "#fff")
      .attr("stroke", "#eee")
      .attr("stroke-width", ".5")
      .attr("cx", this.width / 2)
      .attr("cy", this.height / 2)
      .attr("r", this.initialScale);

    this.borders = this.svg
      .append("path")
      .datum(this.coast)
      .attr("d", this.path)
      .attr("class", "borders")
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", ".5");
  }

  globeInstructions() {
    this.globeInstructions = getElementById("visualization")
      .append("text")
      .attr("x", this.width / 2)
      .attr("y", this.width - 50)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      // .style("font-size", "12px")
      .style("fill", "#aaa")
      .text("Drag to rotate globe");
  }

  setupDataPoints() {
    // Use selectAll and data as before, but explicitly store the result
    this.dots = this.svg
      .selectAll(".dot") // Note: changed from ".risk" to match class name
      .data(this.data.features)
      .enter() // Add this to properly handle data binding
      .append("path")
      .attr("class", "dot")
      .attr("d", this.path)
      .attr("fill", (d) => this.colorScale(d.properties.risk))
      // .attr("stroke", (d) => this.colorScale(d.properties.risk))
      // .attr("stroke-width", "2")
      .on("mouseover", (event, d) => this.handleMouseOver(event, d))
      .on("mouseout", (event, d) => this.handleMouseOut(event, d));
  }

  setupTooltip() {
    // Create tooltip div if it doesn't exist
    if (!d3.select("body").select(".tooltip").size()) {
      this.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "white")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);
      // .style("max-width", "150px"); // wrap tooltip
    } else {
      this.tooltip = d3.select("body").select(".tooltip");
    }
  }

  handleMouseOver(event, d) {
    d3.select(event.currentTarget)
      .attr("stroke", "#000")
      .attr("stroke-width", "0");

    // Word wrap function
    const wrapText = (text, maxLength) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines.join("<br>");
    };

    this.tooltip
      .style("opacity", 1)
      .html(
        `<b>${d.properties.q_short}</b> <br> ${wrapText(d.properties.q, 40)}`,
      )
      .style("left", event.pageX + 8 + "px")
      .style("top", event.pageY - 18 + "px");
  }

  handleMouseOut(event, d) {
    d3.select(event.currentTarget)
      .attr("stroke", "none")
      .attr("stroke-width", "0");

    this.tooltip.style("opacity", 0);
  }

  setupInteractions() {
    const sensitivity = 75;
    this.rotationEnabled = true;

    this.svg
      .call(
        d3
          .drag()
          .on("start", () => {
            if (!this.isScatterView) {
              // Only disable rotation in globe view
              this.rotationEnabled = false;
            }
          })
          .on("drag", (event) => {
            if (this.isScatterView) return; // Prevent drag in scatter view
            const rotate = this.projection.rotate();
            const k = sensitivity / this.projection.scale();
            this.projection.rotate([
              rotate[0] + event.dx * k,
              rotate[1] - event.dy * k,
            ]);
            this.path = d3.geoPath().projection(this.projection);
            this.svg.selectAll("path:not(.dot)").attr("d", this.path);
            this.dots.attr("d", this.path);
          }),
      )
      .on("mouseout", () => {
        if (!this.isScatterView) {
          // Only enable rotation in globe view
          this.rotationEnabled = true;
        }
      });
  }

  startRotation() {
    this.rotationStartTime = Date.now();

    const rotationTimer = () => {
      if (!this.rotationEnabled) return true;

      const dt = (Date.now() - this.rotationStartTime) / 1200;
      let pos = (dt / 30) * 360 + this.rotationOffset; // Add the offset here
      this.projection.rotate([-90 + pos, -30]);
      this.svg.selectAll("path:not(.dot)").attr("d", this.path);
      this.dots.attr("d", this.path);

      requestAnimationFrame(rotationTimer);
    };

    rotationTimer();
  }

  toggleView(isScatter, step) {
    if (!this.dots) return;

    this.isScatterView = isScatter;
    this.rotationEnabled = !isScatter;

    if (isScatter) {
      // Save current rotation state before stopping
      const currentRotation = this.projection.rotate();
      this.rotationOffset = currentRotation[0] + 90; // Store relative to base position

      // Update dots with highlighting based on step
      this.dots
        .transition()
        .duration(1000)
        .attr("d", (d) => {
          const path = d3.geoPath().projection(null);
          const radius =
            step &&
            step >= 3 &&
            step <= 20 &&
            this.stepHighlights[step].includes(d.properties.q)
              ? 7 // Highlighted dots
              : 5; // Non-highlighted dots
          const scaledPoint = path.pointRadius(radius)({
            type: "Point",
            coordinates: [0, 0],
          });
          return scaledPoint;
        })
        .attr(
          "transform",
          (d) => `translate(
            ${this.xScale(d.properties.Likelihood)},
            ${this.yScale(d.properties.Impact)}
          )`,
        )
        .style("opacity", (d) => {
          if (step && step >= 3 && step <= 20) {
            return this.stepHighlights[step].includes(d.properties.q) ? 1 : 0.2;
          }
          return 1;
        });

      // Update comparison lines for highlighted questions
      if (step && step >= 3 && step <= 4) {
        // Filter data for highlighted questions that have 2025 data
        const highlightedData = this.data.features.filter(
          (d) =>
            this.stepHighlights[step].includes(d.properties.q) &&
            d.properties.Likelihood_2025 != null &&
            d.properties.Impact_2025 != null,
        );

        // Remove existing comparison lines
        this.comparisonLinesGroup.selectAll("*").remove();

        // Add new comparison lines
        this.comparisonLinesGroup
          .selectAll(".comparison-line")
          .data(highlightedData)
          .enter()
          .append("line")
          .attr("class", "comparison-line")
          .attr("x1", (d) => this.xScale(d.properties.Likelihood_2025))
          .attr("y1", (d) => this.yScale(d.properties.Impact_2025))
          .attr("x2", (d) => this.xScale(d.properties.Likelihood))
          .attr("y2", (d) => this.yScale(d.properties.Impact))
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("marker-end", "url(#arrow)");

        // Add small arrow marker definition if it doesn't exist
        if (this.svg.select("defs").empty()) {
          const defs = this.svg.append("defs");
          defs
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#000");
        }

        // Fade in comparison lines
        this.comparisonLinesGroup.style("opacity", 1);

        // Show legend
        this.comparisonLegend.style("display", "block");
      } else {
        // Hide comparison lines if not in highlight steps
        this.comparisonLinesGroup
          .transition()
          .duration(500)
          .style("opacity", 0);

        // Hide legend
        this.comparisonLegend.style("display", "none");
      }

      this.globe.transition().duration(1000).style("opacity", 0);
      this.borders.transition().duration(1000).style("opacity", 0);
      this.axesGroup.transition().duration(1000).style("opacity", 1);

      this.matrixRects.style("display", "block");
      this.matrixLabels.style("display", "block");
    } else {
      // Only restart rotation if we were previously in scatter view
      const wasScatterView = this.isScatterView;

      // Animate dots back to globe
      this.dots
        .transition()
        .duration(1000)
        .attrTween("transform", function (d) {
          const node = d3.select(this);
          const currentTransform = node.attr("transform");

          if (!currentTransform) return () => null;

          // Extract current x, y from transform
          const match = currentTransform.match(
            /translate\(\s*([^,]+),\s*([^)]+)\)/,
          );
          if (!match) return () => null;

          const startX = parseFloat(match[1]);
          const startY = parseFloat(match[2]);

          return (t) => {
            // Interpolate from scatter position to (0,0), then remove transform
            const x = startX * (1 - t);
            const y = startY * (1 - t);
            return t < 1 ? `translate(${x},${y})` : null;
          };
        })
        .attrTween("d", (d) => {
          const path = d3.geoPath().projection(null);
          const scatterPath = path.pointRadius(5)({
            type: "Point",
            coordinates: [0, 0],
          });
          const globePath = this.path(d.geometry);

          return d3.interpolateString(scatterPath, globePath);
        })
        .style("opacity", 1);

      this.globe.transition().duration(1000).style("opacity", 1);
      this.borders.transition().duration(1000).style("opacity", 1);
      this.axesGroup.transition().duration(1000).style("opacity", 0);

      this.matrixRects.style("display", "none");
      this.matrixLabels.style("display", "none");

      // Hide comparison lines when returning to globe view
      this.comparisonLinesGroup.transition().duration(500).style("opacity", 0);

      // Hide legend
      this.comparisonLegend.style("display", "none");

      // Only call startRotation if we're transitioning from scatter view
      if (wasScatterView) {
        this.rotationEnabled = true;
        this.startRotation();
      }
    }
  }
}

export default GlobeScatterPlot;
