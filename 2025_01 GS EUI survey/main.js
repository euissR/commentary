import { GlobeScatterPlot } from "./GlobeScatterPlot.js";
import { ScatterRegion, ScatterEmployer } from "./ScatterPlots.js";

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  const visualizationElement = document.getElementById("visualization");
  const scatterElement = document.getElementById("visualization-scatter");

  // Initialize visualizations
  const globeScatter = new GlobeScatterPlot(visualizationElement);
  const scatterRegion = new ScatterRegion(scatterElement);
  const scatterEmployer = new ScatterEmployer(scatterElement);

  let currentVisualization = globeScatter;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        cards.forEach((card) => card.classList.remove("active"));

        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          const step = parseInt(entry.target.dataset.step);

          // Handle visualization transitions
          if (step < 7) {
            currentVisualization = globeScatter;
            globeScatter.toggleView(step >= 2, step);
          } else if (step === 7) {
            // Transition to Region scatter
            scatterElement.innerHTML = "";
            currentVisualization = scatterEmployer;
            scatterEmployer.render();
          } else if (step === 8) {
            // Transition to Employer scatter with animation
            const transitionDuration = 1000;

            // First render Region with points at mean positions
            scatterEmployer.render(true).then(() => {
              // After a brief pause, switch to Employer plot
              setTimeout(() => {
                currentVisualization = scatterRegion;
                scatterRegion.render();
              }, transitionDuration);
            });
          }
        }
      });
    },
    {
      threshold: 0.5,
    }
  );

  cards.forEach((card) => observer.observe(card));
});
