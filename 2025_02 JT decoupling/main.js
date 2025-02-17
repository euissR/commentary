import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { dataUrls } from "./config.js";
import { createVisualization } from "./scatter.js";
import { handleScroll } from "./handleScroll.js";
import { updateVisualization } from "./updateVisualization.js";

// Store data globally
let globalData = null;
let globalRectData = null;
let globalConfig = null;

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
    config: globalConfig,
  };
}

// listen for scroll events
// window.addEventListener("scroll", handleScroll);

// Main initialization function
export async function initializeVisualization(containerId, config, dataStep) {
  try {
    // console.log("Starting initialization for container:", containerId);

    const container = document.getElementById(containerId);
    const dataStep = container.dataset.step
      ? JSON.parse(container.dataset.step)
      : null;

    const [rectData, rawData] = await Promise.all([
      d3.json(dataUrls.quadrants),
      d3.csv(dataUrls.industries),
    ]);

    // console.log("Data fetched:", {
    //   rectDataLength: rectData?.length,
    //   rawDataLength: rawData?.length,
    // });

    const data = processData(rawData);

    // console.log("Data processed:", {
    //   processedDataLength: data?.length,
    //   sampleDataPoint: data?.[0],
    // });

    // Store data globally
    globalData = data;
    globalRectData = rectData;
    globalConfig = { ...config }; // Make a copy to be safe

    console.log("full data", data);

    // console.log("Global data set:", {
    //   globalDataLength: globalData?.length,
    //   globalRectDataLength: globalRectData?.length,
    //   globalConfig,
    // });

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
        dataStep: dataStep,
      }
    );

    // window.addEventListener("scroll", handleScroll);
    // window.scrollListenerAdded = true;
    // Only add the scroll listener once
    if (containerId === "chart1" || containerId === "chart2") {
      // if (containerId === "chart2") {
      // Assuming this is your scrolly chart
      if (!window.scrollListenerAdded) {
        window.addEventListener("scroll", handleScroll);
        window.scrollListenerAdded = true;
        // console.log("Scroll listener added");
      }
    }
  } catch (error) {
    console.error("Error in initializeVisualization:", error);
  }
}
