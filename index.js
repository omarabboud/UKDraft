$(function() {
    var margin = { top: 80, right: 20, bottom: 20, left: 80 };
    var width = 500 - margin.left - margin.right;

    // calculate height to keep grid items square
    var height = width * 12 / 7;
    var Scale = makeScales();
    var x = Scale.x,
        y = Scale.y,
        r = Scale.r;

    var YEAR = 2010;
    var maxFirmCount = 0;

    /** 
     * create x & y axis
     */
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top")
        .innerTickSize(-height)
        .outerTickSize(0)
        .tickPadding(10);
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(10);
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /**
     * @param  {error} error handler in callback
     * @param  {JSON} json - read rson object
     * @return {error} returns error when there is one
     */
    var output;
    var data, history;
    d3.json("SIC.json", function(error, json) {
        if (error) return error;
        output = processedData(json, false);
        setupSlider(output.MIN_YEAR, output.MAX_YEAR);
        data = output.data;
        history = output.coordHistory;

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
            .style("font-size", "16px")
            .style("font-weight", "bold");
        svg.selectAll(".tick > text")
            .style("font-size", "12px");

        updateChart(YEAR);

    });

    // console.log(data)

    /**
     * manipulates charts to update circle size and chart title
     * http://www.census.gov/ces/dataproducts/bds/data_firm.html
     * sector
     * @param  {int} YEAR: represents a year between 1997 and 2013
     */
    function updateChart(YEAR) {
        var chartData = data.filter(function(d) {
            return d.year == YEAR
        });
        var totalFirmCount = 0;
        chartData.forEach(function(d, i) {
            totalFirmCount += d.firms;
        });
        totalFirmCount = ~~(totalFirmCount);

        // var svg = d3.select("svg").transition();
        var title = d3.select(".chartTitle");
        if (title.empty()) {
            svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 0 - (margin.top / 2))
                .attr("class", "chartTitle")
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Distribution of " + totalFirmCount + " firms");
        } else {
            title.transition().text("Distribution of " + totalFirmCount + " firms");
        }
        svg.selectAll(".dot").remove();
        var dots = svg.selectAll(".dot")
            .data(chartData);
        var circles = dots.enter().append("circle")
            .attr("class", "enter dot circle")
            .attr('stroke', function(d) {
                return d.color;
            }).attr("fill", function(d) {
                return d.color
            })
            .attr("fill-opacity", 0);
        circles.transition()
            .attr("r", function(d) {
                return r(d.firms)
            })
            .attr("cx", function(d) {
                return x(d.resource);
            })
            .attr("cy", function(d) {
                return y(d.activity);
            })
            .attr("y", 0)

        circles.on("click", function(d) {
            createChart(history[d.center]);
        });
    }

    /**
     * processes SIC.json to create separate entries for conjugated SIC codes
     * assumes equal weighting
     * appends data with nodes for SIC codes that appear in multiple Locus coordinates
     * @returns {JSON} with separated entries for each locus coordinate
     */
    function processedData(read_data, combineCircles) {
        var data = [];
        var centers = {};
        var output = {
            "data": null,
            "MIN_YEAR": Number.MAX_SAFE_INTEGER,
            "MAX_YEAR": 0,
            "coordHistory": null
        }

        read_data.forEach(function(d, i) {
            var activities = d.activity.replace(/\s+/g, '').split(",");
            var resources = d.resource.replace(/\s+/g, '').split(",");
            output.MIN_YEAR = Math.min(output.MIN_YEAR, d.year);
            output.MAX_YEAR = Math.max(output.MAX_YEAR, d.year);

            for (var i = 0; i < activities.length; i++) {

                var center = activities[i].substring(0, 3) + resources[i].charAt(0);
                var firmCount = d.firms / activities.length;

                var entry = {
                    "year": d.year,
                    "SIC": [d.SIC],
                    "activity": activities[i].substring(0, 3),
                    "resource": resources[i].charAt(0),
                    "firms": firmCount,
                    "center": center,
                    "color": COLOR_DICT[d.SIC][0]
                }

                if (combineCircles) {
                    var key = entry.year + center;
                    if (key in centers) {
                        centers[key].firms += entry.firms;
                        centers[key].SIC = centers[key].SIC.concat(entry.SIC);
                    } else {
                        centers[key] = entry;
                    }
                } else {

                    maxFirmCount = Math.max(maxFirmCount, entry.firms)
                    data.push(entry);
                }
            }

        });
        if (combineCircles) {
            maxFirmCount = 0;
            for (center in centers) {
                maxFirmCount = Math.max(maxFirmCount, centers[center].firms)
                data.push(centers[center])
            }
        }

        output.coordHistory = (function() {
            var h = {};
            for (i in data) {
                var d = data[i];
                var center = d.center;

                if (!(center in h)) {
                    h[center] = new Array(output.MAX_YEAR - output.MIN_YEAR + 1);
                }
                h[center][d.year - output.MIN_YEAR] = d.firms;
            }
            return h;
        })();

        r.domain([0, maxFirmCount]);
        output.data = data;
        return output;
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

    /**
     * sets up year slider
     */
    function setupSlider(min, max) {
        var sliderValue = YEAR;
        $(".slider.value").html(YEAR);

        $('#slider').range({
            min: min,
            max: max,
            start: YEAR,
            onChange: function(val) {
                if (val != YEAR) {
                    YEAR = val;
                    updateChart(YEAR);
                    $(".slider.value").html(val);
                    $(".slider.value").css({ left: $(".thumb").position().left - $(".thumb").width() / 2 })
                }
            }
        });
        $(".slider.value").css({ left: $(".thumb").position().left })
    };

    var COLOR_DICT = {
            "7": ["#db2828", "red"],
            "10": ["#f2711c", "orange"],
            "15": ["#fbbd08", "yellow"],
            "20": ["#b5cc18", "olive"],
            "40": ["#21ba45", "green"],
            "50": ["#00b5ad", "teal"],
            "52": ["#2185d0", "blue"],
            "60": ["#a333c8", "purple"],
            "70": ["#e03997", "pink"]
        }

    setUpLabels();

    function setUpLabels() {
        Object.keys(COLOR_DICT).map(function(key) {
            $(".buttoncontainer").append(makeButtonHTML(key));

            function makeButtonHTML(key) {
                var color = COLOR_DICT[key][1];
                var HTML = '<button class="ui small circular basic ' + color + ' label" ' + makeToolTip(key) + ' ></button>'
                return HTML
            }

            function makeToolTip(key) {
                var HTML = 'data-content="' + key + '" data-variation="inverted tiny"'
                return HTML;
            }
        });

        (function makeLabelControls() {
            $(".label.circular").popup({
                inline: true,
                position: 'top center',
            });

            $(".circular.label").on("mouseenter", function() {
                var active = !$(this).hasClass("selected");
                if (active) transitionCircle($(this), 1);
            }).on("mouseleave", function() {
                var active = !$(this).hasClass("selected");
                if (active) transitionCircle($(this), 0);
            }).on("click", function() {
                $(this).toggleClass("selected");
                transitionCircle($(this), 1);
            })

            /**
             * TODO: HIGHLIGHT SUBCIRCLES WITH SIC CODES — MAYBE HIGHLIGHT BIG CIRCLE THAT CONTAINS
             * @param  {[type]}
             * @param  {[type]}
             * @return {[type]}
             */
            function transitionCircle(elm, op) {
                var active = !$(this).hasClass("selected");
                if (!active) {
                    elm.toggleClass("basic");
                };
                var sic = elm.data("content");
                if (op == 1) {
                    elm.removeClass("basic")
                } else {
                    elm.addClass("basic");
                }
                d3.selectAll("circle").filter(function(d) {
                    return (d.SIC.indexOf(sic) != -1)
                }).transition().style("fill-opacity", op)
            }

            function handleLabelClick(elm) {
                var sic = elm.data("content");
                if (elm.hasClass("selected")) {
                    transitionCircle(elm, 1);
                }
            }
        })();
    }

});
