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
    $('.ui.checkbox.axis').checkbox({
        onChecked: function() {
            ydomainShared(true);
        },
        onUnchecked: function() {
            ydomainShared(false);
        }
    });
    ydomainShared(false);


    bindLeftChartHoverEffects();
}

var data = [],
    resources = ["A", "B", "C", "D", "E", "F", "G"],
    activities = [1, 2, 3, 4],
    svg, update;
/**
 * [processAnnualData] process history data to create data attached to each center
 * @return {null} mutates the update function and 
 */
function processAnnualData() {
    var actGroup, resGroup, newCenter, entry, added = {},
        history;

    /**
     * mutates added to aggregate activity groups, for example merging 2.2E and 2.1E into 2E
     * @mutates {JSON} "added" collects the aggregated data
     */
    (function aggregateData() {
        for (center in annualHistory) {
            // don't process if it's metadata
            if (center == "MIN_YEAR" || center == "MAX_YEAR") continue;

            actGroup = center.charAt(0); // first character, "2"
            resGroup = center.slice(-1); // last character of string, "E"
            newCenter = actGroup + resGroup; // '2E'
            // console.log(annualHistory[center].data[0])
            entry = {
                "activity": actGroup,
                "resource": resGroup,
                "center": newCenter,
                "color": annualHistory[center].color,
                "colorFirmCount": annualHistory[center].data[0],
                "history": annualHistory[center].data
            }
            if (newCenter in added) {
                history = added[newCenter].history;
                for (var i = 0; i < history.length; i++) {
                    history[i] += entry.history[i]
                }
                /**
                 * uses 1977 data, the scatterplot line color is set to the color of the largest subgroup
                 * 1977 data is a good enough approximation
                 */
                if (entry.colorFirmCount > added[newCenter].colorFirmCount) {
                    added[newCenter].colorFirmCount = entry.colorFirmCount;
                    added[newCenter].color = entry.color;
                }
            } else {
                added[newCenter] = entry;
            }
        }
    })();

    for (var entry in added) {
        data.push(added[entry]);
    }
    update = makeChart();
}

/**
 * [makeChart] main function for creating the scatterplot
 * @return {FUNCTION} update, see documentation for update
 */
var size, padding, x, y, xAxis, yAxis, svg;

function makeChart() {
    // size = 150;
    padding = 20;
    var m = resources.length;
    var n = activities.length;
    // var offset = $(window).width()*0.3;

    // size = Math.min($(window).width() * 0.5 / 6, $(window).height() * 0.8 / 4);
    size = ($(window).width() - $(".circle.chart").width() - $(".right.floated.column").width())/8;

    svg = d3.select(".scatterplot")
        .attr("width", size * (m - 1))
        .attr("height", size * n)
        .append("g")
        .attr("transform", "translate(" + padding + ", " + padding * 5 + ")");

    $(".scatterplot").css("margin-left", $(".circle.chart").width());

    (function makeAxis() {
        x = d3.scale.linear()
            .range([padding / 2, size - padding / 2]);

        y = d3.scale.linear()
            .range([size - padding / 2, padding / 2]);

        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(4);

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(4);

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * m);

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
    })();

    (function addOuterAxisLabels() {
        for (var i = 0; i < activities.length; i++) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + -60 + "," + (size * i + size / 2) + ")")
                .text(activities[i])
                .style("font-size", "16px")
                .style("font-weight", "bold");
        }

        for (var i = 0; i < resources.length; i++) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (size * i + size / 2) + "," + -20 + ")")
                .text(resources[i])
                .style("font-size", "16px")
        }
    })();

    var cell = svg.selectAll(".cell")
        .data(data)
        .enter().append("g")
        .attr("class", function(d) {
            return d.center + " cell"
        })
        .attr("transform", function(d) {
            return "translate(" + resources.indexOf(d.resource) * size + "," + (d.activity - 1) * size + ")";
        })
        .each(function(d) {
            var cell = d3.select(this);
            drawPlotForCell(cell, d);
        });

    hoverValueDisplay();

    /**
     * [drawPlotForCell] plots individual scatterplots inside a given cell and its data
     * @param  {DOM element} cell - element to draw in
     * @param  {JSON} d           - data bound to the cell
     */
    function drawPlotForCell(cell, d) {
        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding).style("fill", "none");
        cell.append("text")
            .attr("x", size / 2)
            .attr("y", size / 2 + padding)
            .attr("color", "black")
            .style("opacity", 0.2)
            .style("font-size", 30)
            .text(function(d) {
                return d.center
            });
        // var cell = self;

        var history, color;
        for (var i = 0; i < data.length; i++) {
            entry = data[i];
            if (entry.center == d.center) {
                history = entry.history;
                color = entry.color;
            }
        }
        x.domain([output.MIN_YEAR, output.MAX_YEAR]);
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

    /**
     * creates individual scatterplots
     * @param  {DOM element} self   cell element
     * @param  {STRING} center "2E", for example
     * @return {null}  
     */
    function update(self, center, shared) {
        var cell = self;
        var history, color;
        for (var i = 0; i < data.length; i++) {
            entry = data[i];
            if (entry.center == center) {
                history = entry.history;
            }
        }

        var domain = (shared) ? maxFirmCount : Math.max.apply(Math, history);
        y.domain([0, domain]);
        cell.selectAll(".scatterpoint")
            .transition().duration(500)
            .attr("cy", function(d, i) {
                return y(d);
            })
    }

    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

    return update;

}

function ydomainShared(shared) {
    if (shared == false) {
        $(".axis + .y.axis.scatter g text").css("display", "none");
        // console.log("here")
    } else {
        $(".axis + .y.axis.scatter g text").css("display", "block");
    }
    var cell = svg.selectAll(".cell")
    cell.each(function(d) {
        var self = d3.select(this);
        return update(self, d.center, shared)
    });
}

function bindLeftChartHoverEffects() {
    // var circles = d3.selectAll(".dot");
    $('.circle.chart').on('mouseover', '.dot', function() {
        var center = $(this).data("center");
        var newCenter = center.charAt(0) + center.slice(-1);
        d3.selectAll(".cell").filter(function() {
            return !$(this).hasClass(newCenter);
        }).transition().style("fill-opacity", 0.2)
    });

    $('.circle.chart').on('mouseleave', '.dot', function() {
        d3.selectAll(".cell").transition().style("fill-opacity", 1)
    })

}

function hoverValueDisplay() {
    d3.selectAll(".scatterpoint").each(function(d) {
        $(this).popup({
            content: ~~(d),
            variation: "inverted tiny",
            position: "top center"
        });
    })
}
