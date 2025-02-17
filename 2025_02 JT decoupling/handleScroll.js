import { updateVisualization } from "./updateVisualization.js";
import { getGlobalData } from "./main.js";

let currentStep = null;

export function handleScroll() {
  const cards = document.querySelectorAll(".card[data-step]");
  const { data, rectData, config } = getGlobalData();

  // Calculate which card is most visible
  let mostVisibleCard = null;
  let maxVisibilityRatio = 0;

  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardHeight = cardRect.height;

    // Calculate how much of the card is in the viewport
    const visibleTop = Math.min(Math.max(cardRect.top, 0), window.innerHeight);
    const visibleBottom = Math.max(
      Math.min(cardRect.bottom, window.innerHeight),
      0
    );
    const visibleHeight = visibleBottom - visibleTop;

    // Calculate what percentage of the card is visible
    const visibilityRatio = visibleHeight / cardHeight;

    // console.log("Card visibility:", {
    //   dataStep: card.getAttribute("data-step"),
    //   visibilityRatio,
    //   visibleHeight,
    //   cardHeight,
    //   cardTop: cardRect.top,
    //   cardBottom: cardRect.bottom,
    // });

    // Update most visible card if this one has a higher visibility ratio
    // Only consider cards that are at least 30% visible
    if (visibilityRatio > maxVisibilityRatio && visibilityRatio > 0.3) {
      maxVisibilityRatio = visibilityRatio;
      mostVisibleCard = card;
    }
  });

  if (mostVisibleCard) {
    const newStep = mostVisibleCard.getAttribute("data-step");
    // console.log("Most visible card:", {
    //   step: newStep,
    //   currentStep,
    //   visibilityRatio: maxVisibilityRatio,
    //   willUpdate: newStep !== currentStep,
    // });

    if (newStep !== currentStep) {
      // Get all chart elements
      const chartElements = document.querySelectorAll(
        ".sticky-container .chart"
      );

      // Debug: Log all charts and their visibility status
      chartElements.forEach((chart) => {
        const rect = chart.getBoundingClientRect();
        // console.log("Chart visibility check:", {
        //   id: chart.id,
        //   rect,
        //   isInViewport:
        //     rect.top >= 0 &&
        //     rect.left >= 0 &&
        //     rect.bottom <=
        //       (window.innerHeight || document.documentElement.clientHeight) &&
        //     rect.right <=
        //       (window.innerWidth || document.documentElement.clientWidth),
        // });
      });

      // Find the visible chart with more lenient conditions
      const visibleChart = Array.from(chartElements).find((chart) => {
        const rect = chart.getBoundingClientRect();
        // More lenient check - element is at least partially visible
        return (
          rect.top <
            (window.innerHeight || document.documentElement.clientHeight) &&
          rect.bottom > 0 &&
          rect.left <
            (window.innerWidth || document.documentElement.clientWidth) &&
          rect.right > 0
        );
      });

      if (!visibleChart) {
        console.log("No chart currently visible");
        return;
      }

      // console.log("Found visible chart:", {
      //   id: visibleChart.id,
      //   dataChartId: visibleChart.getAttribute("data-chart-id"),
      // });

      const chartId = visibleChart.getAttribute("data-chart-id");
      const chartDivId = visibleChart.id;

      currentStep = newStep;

      // Get fresh data from global state
      const { data, rectData, config } = getGlobalData();

      if (!data || !rectData || !config) {
        console.error("Missing required data:", { data, rectData, config });
        return;
      }

      updateVisualization(
        newStep,
        chartDivId,
        data,
        rectData,
        config.dotX,
        config.dotY,
        config.linkX,
        config.linkY
      );
    }
  }
}
