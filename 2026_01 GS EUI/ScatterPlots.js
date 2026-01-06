// ScatterBase.js - Base component for shared functionality
export class ScatterBase {
  constructor(container, width) {
    this.container = container;
    this.width = width || 600; // Default width if not specified
  }

  async loadData() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2026_01%20GS%20EUI/globalmeans.csv"
      );
      const csvText = await response.text();
      this.data = d3.csvParse(csvText, (d) => ({
        name: d.name,
        type: d.type,
        Likelihood: +d.Likelihood,
        Impact: +d.Impact,
        Likelihood_mean: +d.Likelihood_mean,
        Impact_mean: +d.Impact_mean,
      }));
      return this.data;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  }

  createPlot(type, isTransitioning = false) {
    return Plot.plot({
      width: this.width,
      height: this.width,
      marginBottom: 50,
      // title: "Variation in average survey response",
      // subtitle: this.type,
      x: {
        domain: [2.8, 3.2],
        ticks: [2.8, 2.9, 3, 3.1, 3.2],
        format: "d",
        grid: false,
        label: "Likelihood",
      },
      y: {
        domain: [3.4, 3.9],
        ticks: [3.4, 3.5, 3.6, 3.7, 3.8],
        grid: false,
        label: "Impact",
      },
      color: {
        range:
          type === "by region of origin"
            ? ["#df3144", "#33163a", "#E6C869", "#309ebe", "#999"]
            : ["#df3144", "#309ebe", "#1d3956"],
        legend: false,
      },
      aspectRatio: 1,
      marks: [
        // arrows with transition
        Plot.link(
          this.data.filter((d) => d.type === type),
          {
            x1: "Likelihood_mean",
            x2: isTransitioning ? "Likelihood_mean" : "Likelihood",
            y1: "Impact_mean",
            y2: isTransitioning ? "Impact_mean" : "Impact",
            stroke: "name",
            strokeWidth: 2,
            markerEnd: "arrow",
          }
        ),
        // dots
        Plot.dot(
          this.data.filter((d) => d.type === type),
          {
            x: "Likelihood_mean",
            y: "Impact_mean",
            fill: "#fff",
            r: 10,
            strokeWidth: 1,
            stroke: "#c6c6c6",
          }
        ),
        // Text with white stroke for outline
        Plot.text(
          this.data.filter(
            (d) =>
              d.type === type &&
              ![
                "Inter/governmental organisation",
                "Northern Europe",
                "Central and Eastern Europe",
              ].includes(d.name)
          ),
          {
            x: isTransitioning ? "Likelihood_mean" : "Likelihood",
            y: isTransitioning ? "Impact_mean" : "Impact",
            dx: 8,
            dy: -5,
            text: "name",
            // fontSize: 16,
            fontWeight: 700,
            stroke: "#fff",
            strokeWidth: 3,
            lineWidth: 7,
            lineAnchor: "top",
            textAnchor: "start",
          }
        ),
        // Actual text
        Plot.text(
          this.data.filter(
            (d) =>
              d.type === type &&
              ![
                "Inter/governmental organisation",
                "Northern Europe",
                "Central and Eastern Europe",
              ].includes(d.name)
          ),
          {
            x: isTransitioning ? "Likelihood_mean" : "Likelihood",
            y: isTransitioning ? "Impact_mean" : "Impact",
            dx: 8,
            dy: -5,
            fill: "name",
            text: "name",
            // fontSize: 16,
            fontWeight: 700,
            lineWidth: 7,
            lineAnchor: "top",
            textAnchor: "start",
          }
        ),
        // Actual text, right-aligned
        Plot.text(
          this.data.filter(
            (d) =>
              d.type === type &&
              [
                "Inter/governmental organisation",
                "Northern Europe",
                "Central and Eastern Europe",
              ].includes(d.name)
          ),
          {
            x: isTransitioning ? "Likelihood_mean" : "Likelihood",
            y: isTransitioning ? "Impact_mean" : "Impact",
            dx: -8,
            dy: -5,
            fill: "name",
            text: "name",
            // fontSize: 16,
            fontWeight: 700,
            lineWidth: 7,
            lineAnchor: "top",
            textAnchor: "end",
          }
        ),
      ],
    });
  }
}

// ScatterRegion.js - Region-specific scatter plot
export class ScatterRegion extends ScatterBase {
  constructor(container, width) {
    super(container, width);
    this.type = "by region of origin";
  }

  async render(isTransitioning = false) {
    if (!this.data) {
      await this.loadData();
    }
    const plot = this.createPlot(this.type, isTransitioning);
    this.container.innerHTML = "";
    this.container.appendChild(plot);
    return plot;
  }
}

// ScatterEmployer.js - Employer-specific scatter plot
export class ScatterEmployer extends ScatterBase {
  constructor(container, width) {
    super(container, width);
    this.type = "by sector";
  }

  async render(isTransitioning = false) {
    if (!this.data) {
      await this.loadData();
    }
    const plot = this.createPlot(this.type, isTransitioning);
    this.container.innerHTML = "";
    this.container.appendChild(plot);
    return plot;
  }
}
