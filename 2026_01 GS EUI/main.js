import { GlobeScatterPlot } from "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2026_01%20GS%20EUI/GlobeScatterPlot.js";
// import { GlobeScatterPlot } from "./GlobeScatterPlot.js";
import {
  ScatterRegion,
  ScatterEmployer,
} from "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2026_01%20GS%20EUI/ScatterPlots.js";
// } from "./ScatterPlots.js";
import { ScatterComparisonRender } from "https://raw.githubusercontent.com/euissR/commentary/refs/heads/main/2026_01%20GS%20EUI/ScatterComparison.js";
// import { ScatterComparisonRender } from "./ScatterComparison.js";

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  const visualizationElement = document.getElementById("visualization");
  const scatterElement = document.getElementById("visualization-scatter");
  const comparisonElement = document.getElementById("visualization-comparison");

  // Initialize visualizations
  const globeScatter = new GlobeScatterPlot(visualizationElement);
  const scatterRegion = new ScatterRegion(scatterElement);
  const scatterEmployer = new ScatterEmployer(scatterElement);
  const scatterComparisonRender = new ScatterComparisonRender(
    comparisonElement
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
          // Handle visualization transitions
          if (step < 7) {
            currentVisualization = globeScatter;
            if (step >= 2) {
              // Transition to scatter view
              globeScatter.toggleView(true, step);
            } else if (globeScatter.isScatterView) {
              // If scrolling back up from scatter to globe (steps 0-1), transition back
              globeScatter.toggleView(false, step);
            }
          } else if (step === 8) {
            // Transition to Region scatter
            scatterElement.innerHTML = "";
            currentVisualization = scatterEmployer;
            scatterEmployer.render();
          } else if (step === 9) {
            // Transition to Employer scatter with animation
            const transitionDuration = 0;

            // First render Region with points at mean positions
            scatterEmployer.render(true).then(() => {
              // After a brief pause, switch to Employer plot
              setTimeout(() => {
                currentVisualization = scatterRegion;
                scatterRegion.render();
              }, transitionDuration);
            });
          } else if (step >= 10) {
            currentVisualization = scatterComparisonRender;
            scatterComparisonRender.render();
          }
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of the card is visible
    }
  );

  cards.forEach((card) => observer.observe(card));
});
