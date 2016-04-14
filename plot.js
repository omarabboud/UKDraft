/**
 * wait for data to be calculated and made available to this file
 */

waitdataready();

function waitdataready(documentReady) {
    if (annualHistory == null) {
        setTimeout(waitdataready, 500);
        return;
    }
    processAnnualData();
}

var data = [],
    resources = ["A", "B", "C", "D", "E"],
    activities = [1, 2, 3, 4];

function processAnnualData() {
    var actGroup, resGroup, newCenter, entry,
        added = {};

    for (center in annualHistory) {
        if (center == "MIN_YEAR" || center == "MAX_YEAR") {
            continue;
        }

        actGroup = center.charAt(0); // first character, "2"
        resGroup = center.slice(-1); // last character of string, "E"
        newCenter = actGroup + resGroup; // '2E'

        entry = {
                "activity": actGroup,
                "resource": resGroup,
                "center": newCenter,
                "history": annualHistory[center].data
            }
            // console.log(newCenter)
        if (newCenter in added) {
            var history = added[newCenter].history;
            for (var i = 0; i < history.length; i++) {
                history[i] += entry.history[i]
            }
        } else {
            added[newCenter] = entry;
        }
    }
    for (var entry in added) {
        data.push(added[entry]);
    }
    makeChart();
}

function makeChart() {
    var width = 960,
        size = 150,
        padding = 19.5;

    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);

    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);

    var resourceToInt = d3.scale.ordinal()
        .domain(activities)
        .range([0, 4])

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

    var color = d3.scale.category10();

    var m = resources.length;
    var n = activities.length;

    xAxis.tickSize(size * m);
    yAxis.tickSize(-size * (n+1));

    var svg = d3.select("body").append("svg")
        .attr("class", "scatter")
        .attr("width", size * m + padding)
        .attr("height", size * n + padding)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis.scatter")
        .data(resources)
        .enter().append("g")
        .attr("class", "x axis scatter")
        .attr("transform", function(d, i) {
            return "translate(" + (n - i) * size + ",0)";
        })
        .each(function(d) {
            x.domain([0, maxFirmCount]);
            d3.select(this).call(xAxis);
        });

    svg.selectAll(".y.axis.scatter")
        .data(activities)
        .enter().append("g")
        .attr("class", "y axis scatter")
        .attr("transform", function(d, i) {
            return "translate(0," + i * size + ")";
        })
        .each(function(d) {
            y.domain([0, maxFirmCount]);
            d3.select(this).call(yAxis);
        });

    var cell = svg.selectAll(".cell")
        .data(data)
        .enter().append("g")
        .attr("class", function(d) {
            return d.center + " cell"
        })
        .attr("transform", function(d) {
            return "translate(" + d.activity * size + "," + resourceToInt(d.resource) * size + ")";
        })
        .each(plot);

    function plot(p) {
        var cell = d3.select(this);

        x.domain([output.MIN_YEAR, output.MAX_YEAR]);
        y.domain([0, maxFirmCount]);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.selectAll(".scatterpoint")
            .data(data)
            .enter().append("circle")
            .attr("class", "scatterpoint")
            .attr("cx", function(d) {
                return 1;
            })
            .attr("cy", function(d) {
                return 1;
            })
            .attr("r", 3)
            .style("fill", function(d, i) {
                return color(i);
            });
    }

    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

}
