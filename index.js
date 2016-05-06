var annualHistory, output;
var maxFirmCount = 0;

data = [{ 'firms': 1753, 'tech': 'Software for Business & Healthcare', 'center': '2.2C' }, { 'firms': 1, 'tech': 'Advanced/Alternative Energy', 'center': '2.2E' }, { 'firms': 47, 'tech': 'Aero-Propulsion Power Management', 'center': '2.2B' }, { 'firms': 997, 'tech': 'Medical Technology', 'center': '2.2E' }, { 'firms': 393, 'tech': 'Advanced Materials', 'center': '2.2B' }, { 'firms': 30, 'tech': 'Situational Awareness & Surveillance Systems', 'center': '2.2B' }, { 'firms': 10, 'tech': 'Solar Photovoltaics', 'center': '2.2B' }, { 'firms': 94, 'tech': 'Agbiosciences', 'center': '2.1G' }, { 'firms': 318, 'tech': 'Fuel Cells & Energy Storage', 'center': '1.3E' }, { 'firms': 381, 'tech': 'Sensing & Automation Technologies', 'center': '2.2B' }, { 'firms': 2, 'tech': 'Shale / Unconventional Oil & Gas', 'center': '2.2E' }, { 'firms': 103, 'tech': 'Information Technology', 'center': '2.3G' }, { 'firms': 8, 'tech': 'Agribusiness and Food Processing', 'center': '2.2E' }]

LOCI_TO_ENGLISH = {
    "2.2C": "create software",
    "2.2E": "produce medicine or energy",
    "2.2B": "produce equipment",
    "2.1G": "research",
    "1.3E": "store energy",
    "2.3G": "IT"
}

// whole script is wrapped in document.ready
var data, weights, YEAR = 2010; // initial slider year
var margin = { top: 100, right: 20, bottom: 20, left: 80 };
// var width = $(window).width() * 0.30;

// calculate height to keep grid items square
var height = $(window).height() * 0.9;
var width = height * 7 / 12;


var Scale = makeScales();
var x = Scale.x,
    y = Scale.y,
    r = Scale.r;

/**
 * @param  {error} error handler in callback
 * @param  {JSON} json - read rson object
 * @return {error} returns error when there is one
 */
// d3.json("weights-large.json", function(error, json) {
//     weights = json;
//     // console.log(weights)
//     d3.json("SIC.json", function(error, json) {
//         if (error) return error;
//         output = processedData(json, weights, false);
//         setupSlider(output.MIN_YEAR, output.MAX_YEAR);
//         data = output.data;
//         annualHistory = output.coordHistory;
//         updateChart(YEAR);
//     });
// });

var svg = d3.select(".circle.chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ") ");

updateChart();

/**
 * [createAxis] creates x y axis and labels
 * @return {null}
 */
var xAxis, yAxis;
(function createAxis() {
    xAxis = d3.svg.axis()
        .scale(x)
        .orient("top")
        .innerTickSize(-height)
        .outerTickSize(0)
        .tickPadding(10);
    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(10);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 10 + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("y", -10)
        .attr("transform", "rotate(-90) translate(0,40)")
        .style("text-anchor", "beginning")
        .text("Resource");

    svg.append("g").attr("class", "y axis").call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("y", -10)
        .attr("transform", "translate(0,30)")
        .style("text-anchor", "end")
        .text("Activity");

    svg.selectAll("text.label")
        .style("font-size", "20px")
        .style("font-weight", "bold");
    svg.selectAll(".tick > text")
        .style("font-size", "16px");

})();

/**
 * manipulates charts to update circle size and chart title
 * http://www.census.gov/ces/dataproducts/bds/data_firm.html > sector
 * @param  {int} YEAR: represents a year between 1997 and 2013
 */
function updateChart() {
    var chartData = data;

    var counts = []

    for (var i = 0; i < chartData.length; i++) {
        chartData[i]["activity"] = chartData[i].center.substring(0, 3);
        chartData[i]["resource"] = chartData[i].center.charAt(3);
        counts.push(chartData[i].firms)
    }

    maxFirmCount = Math.max.apply(null, counts);
    r.domain([0, maxFirmCount]);

    var totalFirmCount = 0;
    var color = d3.scale.category20();

    chartData.forEach(function(d, i) {
        totalFirmCount += d.firms;
    });

    var title = d3.select(".chartTitle");
    svg.append("text").attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 4))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        // .text("click on circle to visualize change");

    if (title.empty()) {
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("class", "chartTitle")
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Distribution of " + numberWithCommas(totalFirmCount) + " firms");
    } else {
        title.transition().text("Distribution of " + numberWithCommas(totalFirmCount) + " firms in " + YEAR);
    }

    svg.selectAll(".dot").remove();
    var dots = svg.selectAll(".dot")
        .data(chartData);

    var circles = dots.enter().append("circle")
        .attr("class", "dot")
        .attr("data-center", function(d) {
            return d.center;
        })
        .attr('stroke', function(d, i) {
            return color(i);
        }).attr("fill", function(d, i) {
            return color(i);
        })

    // if (allHighlighted) {
    circles.attr("fill-opacity", 0.8);
    // } else {
    // circles.attr("fill-opacity", 0);
    // }

    circles.transition()
        .attr("r", function(d) {
            console.log(r(d.firms))
            return r(d.firms)
        })
        .attr("cx", function(d) {
            return x(d.resource);
        })
        .attr("cy", function(d) {
            return y(d.activity);
        })
        .attr("y", 0)

    d3.selectAll(".dot").each(function(d) {
        $(this).popup({
            content: d.firms + " firms at " + LOCI_TO_ENGLISH[d.center],
            variation: "inverted tiny",
            position: "top left",
            // inline: "true",
            hoverable: "true"
        });
    })
}

/**
 * helper for creating scale functions
 * @constructor
 * @returns {Object} with attributes {Function} x, {Function} y, and {Function} r
 */
function makeScales() {
    var Scale = { x: null, y: null, r: null };

    Scale.x = d3.scale.ordinal()
        .domain(["A", "B", "C", "D", "E", "F", "G"])
        .rangePoints([width / 7, width]);

    var ydomain = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3"];
    Scale.y = d3.scale.ordinal().domain(ydomain)
        .rangePoints([height / 12, height]);

    Scale.r = d3.scale.sqrt().range([0, height / 12]);
    return Scale;
}

var allHighlighted;

function highlightScatter(year) {
    var index = year - output.MIN_YEAR;
    d3.selectAll(".cell").each(function() {
        var self = d3.select(this);
        self.selectAll(".scatterpoint")
            .filter(function(d, i) {
                return i === index;
            }).transition().attr("r", 5).transition().attr("r", 3)
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
