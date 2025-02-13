import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { config } from "./config.js";
import { createScales, createAxes } from "./scales.js";

export function createVisualization(
  data,
  rectData,
  chartId,
  dotX,
  dotY,
  linkX,
  linkY,
  {
    showDots = true, // Optional flag to show/hide dots
    showLinks = true, // Optional flag to show/hide links
    includeLinks = false, // Optional flag to show/hide links irrespective of hover
  } = {}
) {
  console.log(data);
  // Set up SVG
  const width = config.width - config.margin.left - config.margin.right;
  const height = config.height - config.margin.top - config.margin.bottom;

  const svg = d3
    .select("#chart" + chartId)
    .append("svg")
    .attr("width", config.width)
    .attr("height", config.height)
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Get unique values for domain calculation
  const allXValues = [
    ...new Set([
      ...(showDots ? data.map((d) => d[dotX]) : []),
      ...(showLinks ? data.map((d) => d[linkX]) : []),
      ...rectData.map((d) => d.x),
    ]),
  ];
  const allYValues = [
    ...new Set([
      ...(showDots ? data.map((d) => d[dotY]) : []),
      ...(showLinks ? data.map((d) => d[linkY]) : []),
      ...rectData.map((d) => d.y),
    ]),
  ];

  // Calculate domains
  const xDomain = [Math.max(...allXValues), Math.min(...allXValues)]; // Reversed for x-axis
  const yDomain = [Math.min(...allYValues), Math.max(...allYValues)];

  const { xScale, yScale, colorScale } = createScales(data, xDomain, yDomain);

  // Create tooltip
  const tooltip = d3
    .select("#chart" + chartId)
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip" + chartId)
    .style("opacity", 0);

  // Draw background rectangles
  drawRectangles(svg, rectData, xScale, yScale);

  // include drawn links without interaction?
  includeLinks
    ? drawLinks(svg, data, xScale, yScale, colorScale, dotX, dotY, linkX, linkY)
    : null;
  // Draw dots and interactions
  showDots
    ? drawDots(
        svg,
        data,
        xScale,
        yScale,
        colorScale,
        tooltip,
        dotX,
        dotY,
        linkX,
        linkY,
        chartId,
        { includeLinks } // Pass includeLinks here
      )
    : null;

  // Add legend
  showLinks ? createLegend(svg, colorScale, width) : null;

  // Add axes
  createAxes(svg, xScale, yScale, height);
}

function drawRectangles(svg, rectData, xScale, yScale) {
  const groupedRects = d3.groups(rectData, (d) => d.rect);

  groupedRects.forEach(([key, rectPoints]) => {
    const rectGroup = svg.append("g").attr("class", "rect-group");

    rectGroup
      .append("polygon")
      .attr(
        "points",
        rectPoints.map((d) => [xScale(d.x), yScale(d.y)].join(",")).join(" ")
      )
      .attr("fill", config.colors.rectangle)
      .attr("stroke", config.colors.rectangleStroke)
      .attr("stroke-width", 2);

    const label = rectPoints[0].name;
    const labelX = d3.mean(rectPoints, (d) => xScale(d.x));
    const labelY = d3.mean(rectPoints, (d) => yScale(d.y));

    rectGroup
      .append("text")
      .attr("class", "label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text(label);
  });
}

function drawDots(
  svg,
  data,
  xScale,
  yScale,
  colorScale,
  tooltip,
  dotX,
  dotY,
  linkX,
  linkY,
  chartId,
  { includeLinks = false } = {} // Add includeLinks parameter
) {
  const getUniqueKey = (d) => `${d[dotX]},${d[dotY]}`;
  const uniqueData = Array.from(
    new Map(data.map((d) => [getUniqueKey(d), d])).values()
  );

  const dots = svg
    .selectAll(".dot")
    .data(uniqueData)
    .enter()
    .append("g")
    .attr("class", "dot-group");

  dots
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => xScale(d[dotX]))
    .attr("cy", (d) => yScale(d[dotY]))
    .attr("r", config.dotRadius)
    // .style("opacity", (d) => {
    //   // If dataStep is provided and matches the current dot's name_short, set opacity to 1
    //   // Otherwise, set opacity to 0.2
    //   return dataStep && d.name_short === dataStep ? 1 : 0.2;
    // })
    .on("mouseover", function (event, d) {
      // Clear any existing tooltips
      d3.selectAll(".tooltip").style("opacity", 0);

      tooltip.transition().duration(50).style("opacity", 0.9);

      // Get the chart container's position
      const chartContainer = d3.select("#chart" + chartId).node();
      const containerRect = chartContainer.getBoundingClientRect();

      // Get mouse position relative to viewport
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Calculate position relative to chart container
      const tooltipX = mouseX - containerRect.left + 10;
      const tooltipY = mouseY - containerRect.top - 28;

      tooltip
        .html(d.name)
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`);

      const relatedDots = data.filter(
        (item) => item.name_short === d.name_short
      );

      // Remove existing hover effects before drawing new ones
      if (!includeLinks) {
        svg.selectAll(".arrow").remove();
        svg.selectAll(".hover-dot").remove();
      }

      drawHoverEffects(
        svg,
        relatedDots,
        xScale,
        yScale,
        colorScale,
        dotX,
        dotY,
        linkX,
        linkY
      );
    })

    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
      if (!includeLinks) {
        svg.selectAll(".arrow").remove();
        svg.selectAll(".hover-dot").remove();
      }
    });

  dots
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d[dotX]))
    .attr("y", (d) => yScale(d[dotY]))
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .text((d) => d.name_short);
}

function drawLinks(
  svg,
  relatedDots,
  xScale,
  yScale,
  colorScale,
  dotX,
  dotY,
  linkX,
  linkY
) {
  const links = svg
    .selectAll(".link")
    .data(relatedDots)
    .enter()
    .append("g")
    .attr("class", "link-group");

  // svg
  //   .selectAll(".hover-dot")
  //   .data(relatedDots)
  //   .enter()
  links
    .append("circle")
    .attr("class", "hover-dot")
    .attr("cx", (d) => xScale(d[linkX]))
    .attr("cy", (d) => yScale(d[linkY]))
    .attr("r", config.hoverDotRadius)
    .style("fill", (d) => colorScale(d.group));

  // svg
  //   .selectAll(".arrow")
  //   .data(relatedDots)
  //   .enter()
  links
    .append("line")
    .attr("class", "arrow")
    .attr("x1", (d) => xScale(d[dotX]))
    .attr("y1", (d) => yScale(d[dotY]))
    .attr("x2", (d) => xScale(d[linkX]))
    .attr("y2", (d) => yScale(d[linkY]))
    .attr("stroke", (d) => colorScale(d.group))
    .attr("stroke-width", config.arrowStrokeWidth);
}

function drawHoverEffects(
  svg,
  relatedDots,
  xScale,
  yScale,
  colorScale,
  dotX,
  dotY,
  linkX,
  linkY
) {
  svg
    .selectAll(".hover-dot")
    .data(relatedDots)
    .enter()
    .append("circle")
    .attr("class", "hover-dot")
    .attr("cx", (d) => xScale(d[linkX]))
    .attr("cy", (d) => yScale(d[linkY]))
    .attr("r", config.hoverDotRadius)
    .style("fill", (d) => colorScale(d.group));

  svg
    .selectAll(".arrow")
    .data(relatedDots)
    .enter()
    .append("line")
    .attr("class", "arrow")
    .attr("x1", (d) => xScale(d[dotX]))
    .attr("y1", (d) => yScale(d[dotY]))
    .attr("x2", (d) => xScale(d[linkX]))
    .attr("y2", (d) => yScale(d[linkY]))
    .attr("stroke", (d) => colorScale(d.group))
    .attr("stroke-width", config.arrowStrokeWidth);
}

function createLegend(svg, colorScale, width) {
  const legend = svg
    .selectAll(".legend")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      (d, i) => `translate(${(i * width) / 4 + 10},${-config.margin.top})`
    );

  legend
    .append("circle")
    .attr("r", config.legendDotRadius)
    .attr("cy", 5)
    .style("fill", colorScale);

  legend
    .append("text")
    .attr("class", "label")
    .attr("x", 10)
    .attr("y", 5)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text((d) => d);
}
