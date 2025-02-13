export function handleScroll() {
  const scrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;

  // Get all the scroll-step elements
  const scrollSteps = document.querySelectorAll("[data-step]");

  // Loop through each scroll-step element
  scrollSteps.forEach((step, index) => {
    const stepTop = step.offsetTop;
    const stepBottom = stepTop + step.offsetHeight;

    // Check if the current scroll position is within the step's boundaries
    if (scrollPosition >= stepTop && scrollPosition < stepBottom) {
      // Update the visualization with the current data-step value
      const dataStep = step.getAttribute("data-step");
      updateVisualization(dataStep);
    }
  });
}
