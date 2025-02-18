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
  { showDots, showLinks, includeLinks, dataStep = null, legend } = {}
) {
  // console.log("createVisualization received dataStep:", dataStep);

  // console.log("current dataStep:", dataStep);
  // Parse numeric values
  const parsedData = data.map((d) => ({
    ...d,
    [dotX]: parseFloat(d[dotX]),
    [dotY]: parseFloat(d[dotY]),
    [linkX]: parseFloat(d[linkX]),
    [linkY]: parseFloat(d[linkY]),
  }));

  // Set up SVG
  const width = config.width - config.margin.left - config.margin.right;
  const height = config.height - config.margin.top - config.margin.bottom;

  // console.log("Clearing chart:", chartId);

  // Remove existing SVG completely
  const chartDiv = d3.select(`#${chartId}`);
  chartDiv.selectAll("svg").remove();

  // Create new SVG
  const svg = chartDiv
    .append("svg")
    .attr("width", config.width)
    .attr("height", config.height)
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // console.log("Created new SVG for chart:", chartId);

  // Get unique values for domain calculation
  const allXValues = [
    ...new Set([
      ...(showDots ? parsedData.map((d) => d[dotX]) : []),
      ...(showLinks || includeLinks ? parsedData.map((d) => d[linkX]) : []),
      ...rectData.map((d) => parseFloat(d.x)),
    ]),
  ].filter((x) => !isNaN(x));

  const allYValues = [
    ...new Set([
      ...(showDots ? parsedData.map((d) => d[dotY]) : []),
      ...(showLinks || includeLinks ? parsedData.map((d) => d[linkY]) : []),
      ...rectData.map((d) => parseFloat(d.y)),
    ]),
  ].filter((y) => !isNaN(y));

  // console.log("Domain values:", { x: allXValues, y: allYValues });

  // Calculate domains
  const xDomain = [Math.max(...allXValues), Math.min(...allXValues)]; // Reversed for x-axis
  const yDomain = [Math.min(...allYValues), Math.max(...allYValues)];

  const { xScale, yScale, colorScale } = createScales(
    parsedData,
    xDomain,
    yDomain
  );

  // Create tooltip
  const tooltip = d3
    .select("#" + chartId)
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip" + chartId)
    .style("opacity", 0);

  // Draw background rectangles
  drawRectangles(svg, rectData, xScale, yScale);

  // Draw data elements
  if (includeLinks) {
    drawLinks(
      svg,
      parsedData,
      xScale,
      yScale,
      colorScale,
      dotX,
      dotY,
      linkX,
      linkY,
      { dataStep }
    );
  }

  // Draw data elements
  if (showDots) {
    // console.log("About to call drawDots with dataStep:", dataStep);
    drawDots(
      svg,
      parsedData, // Pass all data
      xScale,
      yScale,
      colorScale,
      tooltip,
      dotX,
      dotY,
      linkX,
      linkY,
      chartId,
      {
        showLinks,
        includeLinks,
        dataStep,
        // dataStep: String(dataStep), // Ensure dataStep is a string
      }
    );
  }

  // Add legend
  if (legend) {
    // console.log("creating legend");
    createLegend(svg, colorScale, width);
  }

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

    // rectGroup
    //   .append("text")
    //   .attr("class", "label")
    //   .attr("x", labelX)
    //   .attr("y", labelY)
    //   .attr("text-anchor", "middle")
    //   .attr("dy", ".3em")
    //   .text(label);
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
  { showLinks, includeLinks, dataStep } = {}
) {
  // console.log("Drawing dots with dataStep:", dataStep);

  // console.log("Drawing dots, removing old ones first");

  // only unique dots
  function getUniqueByShortName(data) {
    const uniqueMap = new Map();

    data.forEach((item) => {
      if (!uniqueMap.has(item.name_short)) {
        uniqueMap.set(item.name_short, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  let uniqueData = getUniqueByShortName(data);
  // console.log("unique dots", uniqueData);

  // Remove existing dots
  svg.selectAll(".dot-group").remove();

  const dots = svg
    .selectAll(".dot")
    .data(uniqueData)
    .enter()
    .append("g")
    .attr("class", "dot-group");

  // console.log("Creating new dots with dataStep:", dataStep);

  dots
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => xScale(d[dotX]))
    .attr("cy", (d) => yScale(d[dotY]))
    .attr("r", config.dotRadius)
    .style("fill", (d) => {
      if (!dataStep) return "#fff"; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? // return dataStep === null || String(dataStep) === d.name_short
          "#000"
        : "#fff";
    })
    .style("opacity", (d) => {
      if (!dataStep) return 0.2; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? 1
        : 0.5;
    })
    .style("stroke-width", (d) => {
      if (!dataStep) return 0.2;
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? 2
        : 0.5;
    })
    .on("mouseover", function (event, d) {
      // Clear any existing tooltips
      d3.selectAll(".tooltip").style("opacity", 0);

      tooltip.transition().duration(50).style("opacity", 0.9);

      // Get the chart container's position
      const chartContainer = d3.select("#" + chartId).node();
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
      if (showLinks || !includeLinks) {
        svg.selectAll(".arrow").remove();
        svg.selectAll(".hover-dot").remove();
      }

      // console.log("should we hover? (showLinks)", showLinks);

      if (showLinks) {
        drawHoverEffects(
          svg,
          relatedDots,
          xScale,
          yScale,
          colorScale,
          dotX,
          dotY,
          linkX,
          linkY,
          showLinks,
          dataStep
        );
      }
    })

    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
      if (showLinks) {
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
    .style("fill", (d) => {
      if (!dataStep) return "#000";
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? "#fff"
        : "#000";
    })
    .style("opacity", (d) => {
      if (!dataStep) return 0.2;
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? 1
        : 0.5;
    })
    .style("font-weight", (d) => {
      if (!dataStep) return 300;
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? 700
        : 300;
    })
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
  linkY,
  { dataStep } = {}
) {
  // console.log("dataStep", dataStep);
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
    .style("fill", (d) => {
      if (!dataStep) return "#ffffff00"; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? colorScale(d.group)
        : "#ffffff00";
    });

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
    .style("stroke", (d) => {
      if (!dataStep) return "#ffffff00"; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? colorScale(d.group)
        : "#ffffff00";
    })
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
  linkY,
  showLinks,
  dataStep
) {
  // console.log("we're hovering!!!");
  // console.log("dataStep", dataStep);

  svg
    .selectAll(".hover-dot")
    .data(relatedDots)
    .enter()
    .append("circle")
    .attr("class", "hover-dot")
    .attr("cx", (d) => xScale(d[linkX]))
    .attr("cy", (d) => yScale(d[linkY]))
    .attr("r", config.hoverDotRadius)
    .style("fill", (d) => {
      if (!dataStep) return "#ffffff00"; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? // return dataStep === null || String(dataStep) === d.name_short
          colorScale(d.group)
        : "#ffffff00";
    });

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
    .style("stroke", (d) => {
      if (!dataStep) return "#ffffff00"; // Default color if no steps
      return !dataStep || // Check if dataStep is null/undefined
        dataStep.some((step) => String(step) === String(d.name_short))
        ? // return dataStep === null || String(dataStep) === d.name_short
          colorScale(d.group)
        : "#ffffff00";
    })
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
