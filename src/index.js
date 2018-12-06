import {
  select,
  json,
  geoAlbersUsa,
  geoPath,
  scaleOrdinal,
  schemeGreens,
  extent,
  scaleQuantize,
  event,
  scaleLinear
} from "d3";
import { feature } from "topojson";

Promise.all([
  json(
    "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json"
  ),
  json(
    "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json"
  )
]).then(([eduData, countryData]) => {
  console.log("edu: ", eduData);
  console.log("countryData: ", countryData);

  let counties = feature(countryData, countryData.objects.counties);
  let states = feature(countryData, countryData.objects.states);

  console.log(counties);

  counties.features.sort((a, b) => a.id - b.id);

  counties.features.forEach((obj, i) => {
    obj.bachelors = eduData[i].bachelorsOrHigher;
    obj.state = eduData[i].state;
    obj.area_name = eduData[i].area_name;
    obj.fips = eduData[i].fips;
  });

  console.log(counties);

  // const projection = geoAlbersUsa();
  const pathGenerator1 = geoPath();
  const pathGenerator2 = geoPath();
  // .projection(projection);

  let [min, max] = extent(eduData, d => d.bachelorsOrHigher);
  console.log(max, min);
  let interval = (max - min) / 8;
  console.log(interval);

  let domain = new Array(8)
    .fill(0)
    .map((elem, i) => Math.round(min + i * interval));

  console.log(domain);

  const colorScale = scaleQuantize()
    .domain(extent(eduData, d => d.bachelorsOrHigher))
    .range(schemeGreens[8]);

  // Tooltip

  const tooltip = select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0)
    .style("left", 0)
    .style("top", 0);

  const svg = select("svg");

  const g = svg.append("g");

  const pathOne = g.selectAll("path").data(counties.features);
  const pathTwo = svg.selectAll("path").data(states.features);

  pathTwo
    .enter()
    .append("path")
    .attr("d", pathGenerator2)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", "1px");

  const path = pathOne
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", pathGenerator1)
    .attr("stroke", "white")
    .attr("stroke-width", "0.4px")
    .attr("fill", d => colorScale(d.bachelors))
    .attr("data-fips", d => d.fips)
    .attr("data-education", d => d.bachelors);
  // console.log(path);

  // tooltip

  path.on("mouseenter", function(d) {
    tooltip
      .style("opacity", 0.7)
      .style("left", `${event.x + 10}px`)
      .style("top", `${event.y - 700}px`)
      .attr("data-education", d.bachelors)
      .html(`${d.area_name}, ${d.state}: ${d.bachelors}%`);
    select(this)
      .attr("stroke", "black")
      .attr("stroke-width", "0.8px");
  });

  path.on("mouseleave", function(d) {
    tooltip
      .style("opacity", 0)
      .style("left", 0)
      .style("top", 0);
    select(this)
      .attr("stroke", "white")
      .attr("stroke-width", "0.4px");
  });

  const legend = svg
    .append("g")
    .attr("transform", `translate(750, 20)`)
    .attr("id", "legend");

  legend
    .selectAll("rect")
    .data(colorScale.range())
    .enter()
    .append("rect")
    .attr("fill", d => d)
    .attr("x", (d, i) => i * 30)
    .attr("width", "30px")
    .attr("height", "10px");
});
