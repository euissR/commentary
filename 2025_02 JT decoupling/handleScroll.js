import { updateVisualization } from "./updateVisualization.js";
import { getGlobalData } from "./main.js";

let currentStep = null;

export function handleScroll() {
  const cards = document.querySelectorAll(".card[data-step]");
  const { data, rectData, config } = getGlobalData();

  if (!config) {
    // console.log("No visible chart configuration found");
    return;
  }

  // Calculate which card is most visible
  let mostVisibleCard = null;
  let maxVisibilityRatio = 0;

  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardHeight = cardRect.height;
    const visibleTop = Math.min(Math.max(cardRect.top, 0), window.innerHeight);
    const visibleBottom = Math.max(
      Math.min(cardRect.bottom, window.innerHeight),
      0
    );
    const visibleHeight = visibleBottom - visibleTop;
    const visibilityRatio = visibleHeight / cardHeight;

    if (visibilityRatio > maxVisibilityRatio && visibilityRatio > 0.3) {
      maxVisibilityRatio = visibilityRatio;
      mostVisibleCard = card;
    }
  });

  if (mostVisibleCard) {
    const newStep = mostVisibleCard.getAttribute("data-step");

    if (newStep !== currentStep) {
      const chartElements = document.querySelectorAll(
        ".sticky-container .chart"
      );
      const visibleChart = Array.from(chartElements).find((chart) => {
        const rect = chart.getBoundingClientRect();
        return (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
        );
      });

      if (!visibleChart) {
        // console.log("No chart currently visible");
        return;
      }

      const chartDivId = visibleChart.id;
      currentStep = newStep;

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
        config.linkY,
        config.legend,
        {
          showDots: config.showDots,
          showLinks: config.showLinks,
          includeLinks: config.includeLinks,
        }
      );
    }
  }
}
