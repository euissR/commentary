import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

export class GlobeScatterPlot {
  constructor(container) {
    this.container = container;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    this.width = containerRect.width;
    this.height = this.width;

    // Calculate scatter dimensions (width-based aspect ratio)
    this.scatterWidth = this.width;
    this.scatterHeight = this.width / 2;

    // Calculate scatter plot offset to center it vertically
    this.scatterOffsetY = (this.height - this.scatterHeight) / 2;

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
      { x1: 3, x2: 4, y1: 4, y2: 5, type: "High risk" },
      { x1: 4, x2: 5, y1: 4, y2: 5, type: "High risk" },
      { x1: 4, x2: 5, y1: 3, y2: 4, type: "High risk" },
      { x1: 2, x2: 3, y1: 4, y2: 5, type: "Moderate risk" },
      { x1: 3, x2: 4, y1: 3, y2: 4, type: "Moderate risk" },
      { x1: 4, x2: 5, y1: 2, y2: 3, type: "Moderate risk" },
      { x1: 2, x2: 3, y1: 3, y2: 4, type: "Remote risk" },
      { x1: 2, x2: 3, y1: 2, y2: 3, type: "Remote risk" },
      { x1: 3, x2: 4, y1: 2, y2: 3, type: "Remote risk" },
    ];

    this.matrixLabel = [
      { x: 5, y: 4, type: "High risk", lineAnchor: "top", textAnchor: "start" },
      {
        x: 5,
        y: 2,
        type: "Moderate risk",
        lineAnchor: "bottom",
        textAnchor: "end",
      },
      {
        x: 3,
        y: 2,
        type: "Remote risk",
        lineAnchor: "bottom",
        textAnchor: "end",
      },
    ];

    // Add highlight configurations for each step
    this.stepHighlights = {
      3: [
        "A ceasefire favorable to Russia in its war against Ukraine",
        "A government favorable to Russia installed in Georgia",
        "A government favorable to Russia installed in Moldova",
      ],
      4: [
        "U.S. withdrawal from security guarantees to European allies",
        "U.S.-China direct military confrontation",
      ],
      5: [
        "Disruptive hybrid attack on EU critical infrastructure (e.g. cyber, subsea sabotage)",
      ],
      6: [
        "Large scale military confrontation between Iran and Israel",
        "No ceasefire between Israel and Hamas",
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
        "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2025_01%20GS%20EUI%20survey/data_mean_wide_sf.geojson"
      );
      this.data = await response.json();

      // Fetch world coastlines
      const coastResponse = await fetch(
        "https://unpkg.com/world-atlas@2/land-110m.json"
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
      .domain(["Remote risk", "Moderate risk", "High risk"])
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
      .attr("dy", (d) => (d.lineAnchor === "top" ? "-0.5em" : "1em"))
      .text((d) => d.type)
      .attr("fill", (d) => this.colorScale(d.type))
      .style("font-size", "12px");
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
          .tickFormat(d3.format("d"))
      )
      .call((g) => {
        g.selectAll(".tick line").attr("stroke", "#aaa");
        g.selectAll(".tick text").attr("fill", "#aaa");
        g.select(".domain").attr("stroke", "#aaa");
      })
      .append("text")
      .attr("x", this.width / 2)
      .attr("y", 40)
      .attr("fill", "#333")
      .attr("font-family", "PT Sans , sans-serif")
      .attr("font-weight", 700)
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
          .tickFormat(d3.format("d"))
      )
      .call((g) => {
        g.selectAll(".tick line").attr("stroke", "#aaa");
        g.selectAll(".tick text").attr("fill", "#aaa");
        g.select(".domain").attr("stroke", "#aaa");
      })
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.width / 2)
      .attr("y", -40)
      .attr("fill", "#333")
      .attr("font-family", "PT Sans , sans-serif")
      .attr("font-weight", 700)
      .text("Impact");
  }

  setupGlobe() {
    this.globe = this.svg
      .append("circle")
      .attr("fill", "#fff")
      .attr("stroke", "#ddd")
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
      .style("stroke", "#ddd")
      .style("stroke-width", ".5");
  }

  globeInstructions() {
    this.globeInstructions = getElementById("visualization")
      .append("text")
      .attr("x", this.width / 2)
      .attr("y", this.width - 50)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
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
    } else {
      this.tooltip = d3.select("body").select(".tooltip");
    }
  }

  handleMouseOver(event, d) {
    d3.select(event.currentTarget)
      .attr("stroke", "#000")
      .attr("stroke-width", "2");

    this.tooltip
      .style("opacity", 1)
      .html(d.properties.question)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");

    // console.log(
    //   "Question: ",
    //   d.properties.question,
    //   "Likelihood ",
    //   d.properties.Likelihood,
    //   "Impact ",
    //   d.properties.Impact
    // );
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
          })
      )
      .on("mouseout", () => {
        if (!this.isScatterView) {
          // Only enable rotation in globe view
          this.rotationEnabled = true;
        }
      });
  }

  startRotation() {
    const t0 = Date.now();

    const rotationTimer = () => {
      if (!this.rotationEnabled) return true;

      const dt = (Date.now() - t0) / 1200;
      let pos = (dt / 30) * 360;
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
      // Update dots with highlighting based on step
      this.dots
        .transition()
        .duration(1000)
        .attr("d", (d) => {
          const path = d3.geoPath().projection(null);
          const radius =
            step &&
            step >= 3 &&
            step <= 6 &&
            this.stepHighlights[step].includes(d.properties.question)
              ? 7
              : 5;
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
          )`
        )
        .style("opacity", (d) => {
          if (step && step >= 3 && step <= 6) {
            return this.stepHighlights[step].includes(d.properties.question)
              ? 1
              : 0.2;
          }
          return 1;
        });

      this.globe.transition().duration(1000).style("opacity", 0);
      this.borders.transition().duration(1000).style("opacity", 0);
      this.axesGroup.transition().duration(1000).style("opacity", 1);

      this.matrixRects.style("display", "block");
      this.matrixLabels.style("display", "block");
    } else {
      // Reset all dots to full opacity in globe view
      this.dots
        .transition()
        .duration(1000)
        .attr("transform", null)
        .attr("d", this.path)
        .style("opacity", 1);

      this.globe.transition().duration(1000).style("opacity", 1);
      this.borders.transition().duration(1000).style("opacity", 1);
      this.axesGroup.transition().duration(1000).style("opacity", 0);

      this.matrixRects.style("display", "none");
      this.matrixLabels.style("display", "none");

      this.rotationEnabled = true;
      this.startRotation();
    }
  }
}

export default GlobeScatterPlot;
