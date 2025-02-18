import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { dataUrls } from "./config.js";
import { createVisualization } from "./scatter.js";
import { handleScroll } from "./handleScroll.js";
import { updateVisualization } from "./updateVisualization.js";

// Store configurations globally with a map of chart IDs to their configs
const globalConfigs = new Map();
let globalData = null;
let globalRectData = null;

// Data processing function
function processData(data) {
  return data.map((d) => ({
    ...d,
    x: +d.x,
    y: +d.y,
    xend: +d.xend,
    yend: +d.yend,
    group: d.group,
    name_short: d.name_short,
  }));
}

// Export the global data and config
export function getGlobalData() {
  return {
    data: globalData,
    rectData: globalRectData,
    config: getCurrentConfig(), // Get config for currently visible chart
  };
}

// Get configuration for currently visible chart
function getCurrentConfig() {
  const visibleChart = Array.from(
    document.querySelectorAll(".sticky-container .chart")
  ).find((chart) => {
    const rect = chart.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  });

  if (!visibleChart) return null;
  return globalConfigs.get(visibleChart.id);
}

// Main initialization function
export async function initializeVisualization(containerId, config) {
  try {
    // Store the configuration globally for this specific chart
    globalConfigs.set(containerId, config);

    const container = document.getElementById(containerId);
    const containerDataStep = container.dataset.step
      ? JSON.parse(container.dataset.step)
      : null;

    // Fetch data if not already loaded
    if (!globalData || !globalRectData) {
      const [rectData, rawData] = await Promise.all([
        d3.json(dataUrls.quadrants),
        d3.csv(dataUrls.industries),
      ]);

      globalData = processData(rawData);
      globalRectData = rectData;
    }

    // Create visualization with the full configuration
    createVisualization(
      globalData,
      globalRectData,
      containerId,
      config.dotX,
      config.dotY,
      config.linkX,
      config.linkY,
      {
        showDots: config.showDots,
        showLinks: config.showLinks,
        includeLinks: config.includeLinks,
        dataStep: containerDataStep,
        legend: config.legend,
      }
    );

    // Add scroll listener only once
    if (containerId === "chart1" && !window.scrollListenerAdded) {
      window.addEventListener("scroll", handleScroll);
      window.scrollListenerAdded = true;
    }
  } catch (error) {
    console.error("Error in initializeVisualization:", error);
  }
}
