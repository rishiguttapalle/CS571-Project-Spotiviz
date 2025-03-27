document.addEventListener("DOMContentLoaded", function () {
    const width = 900, height = 500;

    const svg = d3.select("#world-map")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator()
        .scale(140)
        .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    Promise.all([
        d3.json("data/world.geojson"),
        d3.csv("data/dummy-data.csv")
    ]).then(function ([world, data]) {
        let countryData = {};
        data.forEach(d => countryData[d.country_code] = +d.users);

        svg.selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .on("mouseover", function (event, d) {
                let country = d.properties.ISO_A2;
                let users = countryData[country] || "No data";
                d3.select(this).attr("fill", "#1DB954");

                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`${d.properties.NAME}: ${users} users`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#ddd");
                tooltip.transition().duration(200).style("opacity", 0);
            });

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "white")
            .style("padding", "5px")
            .style("border-radius", "5px");
    });
});
