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
    resources = ["A", "B", "C", "D", "E", "F", "G"],
    activities = [1, 2, 3, 4];

function processAnnualData() {
    var actGroup, resGroup, newCenter, entry,
        added = {};
        console.log(annualHistory)
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
            "color" : annualHistory[center].color,
            "history": annualHistory[center].data
        }
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
    var width = 1000,
        size = 150,
        padding = 20;

    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);

    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);

    var resourceToInt = d3.scale.ordinal()
        .domain(resources)
        .range([0, 6])

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

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * m);

    var svg = d3.select("body").append("svg")
        .attr("class", "scatter")
        .attr("width", size * m + padding)
        .attr("height", size * n + padding)
        .append("g")
        .attr("transform", "translate(" + padding * 2 + "," + padding / 2 + ")");

    svg.selectAll(".x.axis.scatter")
        .data(resources)
        .enter().append("g")
        .attr("class", "x axis scatter")
        .attr("transform", function(d, i) {
            return "translate(" + i * size + ",0)";
        })
        .each(function(d) {
            x.domain([output.MIN_YEAR, output.MAX_YEAR]);
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
            return d.center + " cell" + "resourceToInt " + resources.indexOf(d.resource)
        })
        .attr("transform", function(d) {
            return "translate(" + resources.indexOf(d.resource) * size + "," + (d.activity - 1) * size + ")";
        })
        .each(function(d) {
            var self = d3.select(this);
            return plot(self, d.center)
        });

    /**
     * creates individual scatterplots
     * @param  {DOM element} self   cell element
     * @param  {STRING} center "2E", for example
     * @return {null}  
     */
    function plot(self, center) {
        var cell = self;

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding).style("fill", "none");

        var history, color;
        for (var i = 0; i < data.length; i++) {
            entry = data[i];
            if (entry.center == center) {
                history = entry.history;
                color = entry.color;
            }
        }

        x.domain([output.MIN_YEAR, output.MAX_YEAR]);
        // just use maxFirmCount you want all of them to share the same scale
        y.domain([0, Math.max.apply(Math, history)]);

        cell.selectAll(".scatterpoint")
            .data(history)
            .enter().append("circle")
            .attr("class", "scatterpoint")
            .attr("cx", function(d, i) {
                return x(i + output.MIN_YEAR);
            })
            .attr("cy", function(d, i) {
                return y(d);
            })
            .attr("r", 3)
            .style("fill", color);
    }

    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

}
