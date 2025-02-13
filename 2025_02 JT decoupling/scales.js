import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { config } from "./config.js";

export function createScales(data, xDomain, yDomain) {
  const width = config.width - config.margin.left - config.margin.right;
  const height = config.height - config.margin.top - config.margin.bottom;

  const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);

  const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);

  const colorScale = d3
    .scaleOrdinal()
    .domain([...new Set(data.map((d) => d.group))])
    .range(config.colors.groups);

  return { xScale, yScale, colorScale };
}

export function createAxes(svg, xScale, yScale, height) {
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  svg.append("g").attr("class", "axis").call(yAxis);
}
