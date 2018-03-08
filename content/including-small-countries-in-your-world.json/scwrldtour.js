var width = 500,
    height = 500;

var projection = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .scale(width / 2 - 20)
    .clipAngle(90)
    .precision(0.6)
    .rotate([-40, -30]);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var title = d3.select("#countryName");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("defs").append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);

svg.append("use")
    .attr("class", "stroke")
    .attr("xlink:href", "#sphere");

svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

var projection2 = d3.geo.orthographic()
  .translate([width / 2, height / 2])
  .scale(width / 2 - 20)
  .clipAngle(90)
  .precision(0.6)
  .rotate([-40, -30]);

var path2 = d3.geo.path()
  .projection(projection2);

var svg2 = d3.select("#map2").append("svg")
  .attr("width", width)
  .attr("height", height);

svg2.append("defs").append("path")
  .datum({type: "Sphere"})
  .attr("id", "sphere2")
  .attr("d", path2);

svg2.append("use")
  .attr("class", "stroke")
  .attr("xlink:href", "#sphere2");

svg2.append("use")
  .attr("class", "fill")
  .attr("xlink:href", "#sphere2");

svg2.append("path")
  .datum(graticule)
  .attr("class", "graticule")
  .attr("d", path2);

d3.json("world.json", function(error, world) {
    if (error) throw error;

   var land = topojson.feature(world, world.objects.countries).features,
   small = land.filter(function(d) { return d.geometry.type === 'Point'; }),
   i = 0,
   n  = small.length;

   svg.insert("g", ".graticule").attr("id", "countries");
   d3.selectAll("#countries").selectAll("path").data(land)
      .enter().append("path").attr("class", "land").attr("id", function(d, i) { return d.id; }).attr("d", path);

   svg2.insert("g", ".graticule2").attr("id", "countries2");
   d3.selectAll("#countries2").selectAll("path").data(land.filter(function(d) { return d.geometry.type !== 'Point'; }))
      .enter().append("path").attr("class", "land").attr("id", function(d, i) { return d.id; }).attr("d", path2);

   (function transition() {
       d3.transition()
           .duration(2000)
           .each("start", function() {
              d3.selectAll(".cselect").remove();
              title.text(small[i = (i + 1) % n].properties.name);
           })
           .tween("rotate", function() {
            var p = d3.geo.centroid(small[i]),
                r = d3.interpolate(projection2.rotate(), [-p[0], -p[1]]);
            return function(t) {
              svg2.insert("path", ".graticule2").datum({ type: "Point", coordinates: [p[0], p[1]] })
                           .attr("class", "cselect").attr("d", path2);
              projection2.rotate(r(t));
              d3.select("#map2").selectAll("path").attr("d", d3.geo.path().projection(projection2));
            };
           })
        .transition()
           .each("end", transition);
    })();
 });
