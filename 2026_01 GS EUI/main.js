// use CDN instead of GH
import { GlobeScatterPlot } from "https://cdn.jsdelivr.net/gh/euissR/commentary@9e7bb5b/2026_01%20GS%20EUI/GlobeScatterPlot.js";
import { ScatterComparisonRender } from "https://cdn.jsdelivr.net/gh/euissR/commentary@ed25d70/2026_01%20GS%20EUI/ScatterComparison.js";

// local for dev
// import { GlobeScatterPlot } from "./GlobeScatterPlot.js";
// import { ScatterComparisonRender } from "./ScatterComparison.js";

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  const visualizationElement = document.getElementById("visualization");
  const comparisonElement = document.getElementById("visualization-comparison");

  // Initialize visualizations
  const globeScatter = new GlobeScatterPlot(visualizationElement);
  const scatterComparisonRender = new ScatterComparisonRender(
    comparisonElement,
  );

  let currentVisualization = globeScatter;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        cards.forEach((card) => card.classList.remove("active"));

        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          const step = parseInt(entry.target.dataset.step);

          // Handle visualization transitions
          if (step < 20) {
            currentVisualization = globeScatter;
            if (step >= 2) {
              // Transition to scatter view
              globeScatter.toggleView(true, step);
            } else if (globeScatter.isScatterView) {
              // If scrolling back up from scatter to globe (steps 0-1), transition back
              globeScatter.toggleView(false, step);
            }
          } else if (step >= 20) {
            currentVisualization = scatterComparisonRender;
            scatterComparisonRender.render();
          }
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of the card is visible
    },
  );

  cards.forEach((card) => observer.observe(card));
});
