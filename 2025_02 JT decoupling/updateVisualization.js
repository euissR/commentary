import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createVisualization } from "./scatter.js";

export function updateVisualization(
  dataStep,
  chartId,
  data,
  rectData,
  dotX,
  dotY,
  linkX,
  linkY,
  legend
) {
  if (!dataStep) return;

  // First, get the string value, whether it's in an array or not
  const stepString = Array.isArray(dataStep) ? dataStep[0] : dataStep;

  // Then split it into a proper array
  const steps = stepString.split(",").map((step) => step.trim());

  // Filter the data based on the current data-step
  const filteredData = data.filter((d) =>
    steps.some((step) => String(step) === String(d.name_short))
  );

  if (filteredData.length === 0) {
    console.warn("No data found for steps:", steps);
    return;
  }

  // Create the new visualization with the filtered data
  createVisualization(data, rectData, chartId, dotX, dotY, linkX, linkY, {
    showDots: true,
    showLinks: true,
    includeLinks: false,
    dataStep: steps,
    legend,
  });
}
