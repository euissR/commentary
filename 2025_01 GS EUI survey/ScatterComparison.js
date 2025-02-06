// ScatterBase.js - Base component for shared functionality
export class ScatterComparison {
  constructor(container, width) {
    this.container = container;
    this.width = width || 600; // Default width if not specified
  }

  async loadData() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2025_01%20GS%20EUI%20survey/comparison.csv"
      );
      const csvText = await response.text();
      this.data = d3.csvParse(csvText, (d) => ({
        eu: d.eu,
        us: d.us,
        question: d.question,
      }));
      return this.data;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  }

  createPlot(type) {
    return Plot.plot({
      width: this.width,
      height: this.width,
      title: " ",
      // title: "Comparing results across the Atlantic",
      // subtitle:
      //   "Only questions from EU survey with equivalents in US survey. The EU is more worried than US in only in two cases (Libya and Sahel).",
      marginLeft: 0,
      marginBottom: 0,
      x: {
        domain: [
          "Tier III/Remote risk",
          "Tier II/Moderate risk",
          "Tier I/High risk",
          "z",
          "zz",
        ],
        ticks: [
          "Tier III/Remote risk",
          "Tier II/Moderate risk",
          "Tier I/High risk",
        ],
      },
      y: { label: null, grid: false },
      color: {
        range: ["#309ebe", "#aaa", "#df3144"],
        legend: true,
        reverse: true,
      },
      symbol: { range: ["circle", "star"], legend: true },
      marks: [
        // arrows
        Plot.link(this.data, {
          x1: "eu",
          x2: "us",
          y1: "question",
          y2: "question",
          stroke: "#c6c6c6",
          markerEnd: "arrow",
        }),
        // eu
        Plot.dot(this.data, {
          x: "eu",
          y: "question",
          stroke: "eu",
          fill: "#fff",
          strokeWidth: 2,
          symbol: (d) => "EU",
          r: 11,
        }),
        // us
        Plot.dot(this.data, {
          x: "us",
          y: "question",
          stroke: "us",
          fill: "#fff",
          strokeWidth: 2,
          symbol: (d) => "US",
          r: 6,
        }),
        // labels
        Plot.text(this.data, {
          x: (d) => "Tier I/High risk",
          dx: 20,
          y: "question",
          text: "question",
          // fontWeight: 700,
          lineWidth: 20,
          textAnchor: "start",
          lineAnchor: "middle",
        }),
      ],
    });
  }
}

export class ScatterComparisonRender extends ScatterComparison {
  constructor(container, width) {
    super(container, width);
  }

  async render() {
    if (!this.data) {
      await this.loadData();
    }
    const plot = this.createPlot();
    this.container.innerHTML = "";
    this.container.appendChild(plot);
    return plot;
  }
}
