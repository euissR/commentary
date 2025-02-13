const initCollapsibles = () => {
  const collapsibles = document.querySelectorAll(".collapsible");

  collapsibles.forEach((button) => {
    button.addEventListener("click", function () {
      // Get the next element (the content div)
      const content = this.nextElementSibling;
      // Get the arrow within this button
      const arrow = this.querySelector(".tag");

      // Toggle the content and arrow
      content.classList.toggle("show");
      arrow.classList.toggle("rotated");
    });
  });
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initCollapsibles);

// Export the init function in case you want to use it elsewhere
export { initCollapsibles };
