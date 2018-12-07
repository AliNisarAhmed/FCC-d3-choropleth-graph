import {
  select,
  json,
  geoAlbersUsa,
  geoPath,
  schemeGreens,
  extent,
  scaleQuantize,
  event,
  axisBottom,
  zoom
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
  // console.log("edu: ", eduData);
  // console.log("countryData: ", countryData);

  let counties = feature(countryData, countryData.objects.counties); // needed to draw counties borders
  let states = feature(countryData, countryData.objects.states); // needed to draw a bit wider state borders

  const numColors = 8; // number of colors in the fill scale
  const stateBorderWidth = "1px"; // width of state borders
  const stateBorderColor = "white";
  const countyBorderWidth = "0.4px";
  const countyBorderColor = "white";
  const highlightColor = "black";
  const highlightWidth = "0.8px";

  // console.log(counties);

  counties.features.sort((a, b) => a.id - b.id); // sorting from lowest to highest ids, so that it matches with eduData

  // mapping eduData props onto counties.features
  counties.features.forEach((obj, i) => {
    obj.bachelors = eduData[i].bachelorsOrHigher;
    obj.state = eduData[i].state;
    obj.area_name = eduData[i].area_name;
    obj.fips = eduData[i].fips;
  });

  // console.log(counties);

  // const projection = geoAlbersUsa();
  const pathGenerator1 = geoPath();
  const pathGenerator2 = geoPath();
  // .projection(projection);

  let [min, max] = extent(eduData, d => d.bachelorsOrHigher);
  // console.log(max, min);
  let interval = (max - min) / numColors;
  // console.log(interval);

  let domain = new Array(numColors)
    .fill(0)
    .map((elem, i) => Math.round(min + i * interval));

  // console.log(domain);

  const colorScale = scaleQuantize()
    .domain(extent(domain))
    .range(schemeGreens[numColors]);

  // Tooltip

  const tooltip = select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0)
    .style("left", 0)
    .style("top", 0);

  const svg = select("svg");

  const g = svg.append("g");

  const pathOne = g
    .append("g")
    .selectAll("path")
    .data(counties.features); // for counties
  const pathTwo = g
    .append("g")
    .selectAll("path")
    .data(states.features); // for states

  pathTwo
    .enter()
    .append("path")
    .attr("d", pathGenerator2)
    .attr("fill", "none")
    .attr("stroke", stateBorderColor)
    .attr("stroke-width", stateBorderWidth)
    .attr("stroke-linejoin", "round");

  const path = pathOne
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", pathGenerator1)
    .attr("stroke", countyBorderColor)
    .attr("stroke-width", countyBorderWidth)
    .attr("fill", d => colorScale(d.bachelors))
    .attr("data-fips", d => d.fips)
    .attr("data-education", d => d.bachelors);
  // console.log(path);

  // zooming and panning

  svg.call(
    zoom().on("zoom", () => {
      g.attr("transform", event.transform);
    })
  );

  // tooltip

  path.on("mouseenter", function(d) {
    tooltip
      .style("opacity", 0.7)
      .style("left", `${event.x + 10}px`)
      .style("top", `${event.y - 700}px`)
      .attr("data-education", d.bachelors)
      .html(`${d.area_name}, ${d.state}: ${d.bachelors}%`);
    select(this)
      .attr("stroke", highlightColor)
      .attr("stroke-width", highlightWidth);
  });

  path.on("mouseleave", function(d) {
    tooltip
      .style("opacity", 0)
      .style("left", 0)
      .style("top", 0);
    select(this)
      .attr("stroke", countyBorderColor)
      .attr("stroke-width", countyBorderWidth);
  });

  const legend = svg.append("g");

  legend.attr("transform", `translate(650, 20)`).attr("id", "legend");

  // console.log(legend);

  const rect = legend
    .selectAll("rect")
    .data(colorScale.range())
    .enter()
    .append("rect")
    .attr("fill", d => d)
    .attr("x", (d, i) => i * 30)
    .attr("width", "30px")
    .attr("height", "10px");

  let axis = axisBottom();

  legend
    .selectAll("text")
    .data(domain)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * 30)
    .attr("y", "23px")
    .text(d => d + "%")
    .attr("text-anchor", "middle");
});
