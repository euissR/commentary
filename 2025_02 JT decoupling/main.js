import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { dataUrls } from "./config.js";
import { createVisualization } from "./scatter.js";
import { handleScroll } from "./handleScroll.js";

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

// listen for scroll events
window.addEventListener("scroll", handleScroll);

// Main initialization function
export async function initializeVisualization(containerId, config) {
  try {
    const [rectData, rawData] = await Promise.all([
      d3.json(dataUrls.quadrants),
      d3.csv(dataUrls.industries),
    ]);

    const data = processData(rawData);

    createVisualization(
      data,
      rectData,
      containerId,
      config.dotX,
      config.dotY,
      config.linkX,
      config.linkY,
      {
        showDots: config.showDots ?? true,
        showLinks: config.showLinks ?? true,
        includeLinks: config.includeLinks ?? false,
      }
    );
  } catch (error) {
    console.error("Error loading data:", error);
  }
}
