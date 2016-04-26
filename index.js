var annualHistory, output;
var SIC_DICT;
var maxFirmCount = 0;

SIC_DICT = {
    "7": { "color": ["#db2828", "red"], "name": "agriculture, forestry, fishing" },
    "10": { "color": ["#f2711c", "orange"], "name": "mining" },
    "15": { "color": ["#fbbd08", "yellow"], "name": "construction" },
    "20": { "color": ["#b5cc18", "olive"], "name": "manufacturing" },
    "40": { "color": ["#21ba45", "green"], "name": "transportation & public utilities" },
    "50": { "color": ["#00b5ad", "teal"], "name": "wholesale trade" },
    "52": { "color": ["#2185d0", "blue"], "name": "retail trade" },
    "60": { "color": ["#a333c8", "purple"], "name": "finance, insurance, real estate" },
    "70": { "color": ["#e03997", "pink"], "name": "services" }
}

// whole script is wrapped in document.ready
$(function() {
    var data, weights, YEAR = 2010; // initial slider year
    var margin = { top: 80, right: 20, bottom: 20, left: 80 };
    // var width = $(window).width() * 0.30;

    // calculate height to keep grid items square
    // var height = width * 12 / 7;
    // var maxHeight = $(window).height() * 0.80;
    var width = $(window).width() * 0.3;

    // var width = Math.min(maxHeight * 7 / 12, maxWidth);
    var height = width * 12 / 7;

    // console.log(width, height)

    $(".timeslider.grid").css("margin-top", height - margin.top - margin.bottom);

    var Scale = makeScales();
    var x = Scale.x,
        y = Scale.y,
        r = Scale.r;

    /**
     * @param  {error} error handler in callback
     * @param  {JSON} json - read rson object
     * @return {error} returns error when there is one
     */
    d3.json("weights-large.json", function(error, json) {
        weights = json;
        // console.log(weights)
        d3.json("SIC.json", function(error, json) {
            if (error) return error;
            output = processedData(json, weights, false);
            setupSlider(output.MIN_YEAR, output.MAX_YEAR);
            data = output.data;
            annualHistory = output.coordHistory;
            updateChart(YEAR);
        });
    });

    var svg = d3.select(".circle.chart")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ") ");

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
    function updateChart(YEAR) {
        var chartData = data.filter(function(d) {
            return d.year == YEAR
        });
        var totalFirmCount = 0;
        chartData.forEach(function(d, i) {
            totalFirmCount += d.equalWeightFirms;
        });
        totalFirmCount = ~~(totalFirmCount);

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
                .text("Distribution of " + numberWithCommas(totalFirmCount) + " firms in " + YEAR);
        } else {
            title.transition().text("Distribution of " + numberWithCommas(totalFirmCount) + " firms in " + YEAR);
        }

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        svg.selectAll(".dot").remove();
        var dots = svg.selectAll(".dot")
            .data(chartData);

        var circles = dots.enter().append("circle")
            .attr("class", "dot")
            .attr("data-center", function(d) {
                return d.center;
            })
            .attr('stroke', function(d) {
                return d.color;
            }).attr("fill", function(d) {
                return d.color
            }).attr("fill-opacity", 0)
            // .attr("fill-opacity", 0);

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
    }

    /**
     * processes SIC.json to create separate entries for conjugated SIC codes
     * assumes equal weighting
     * appends data with nodes for SIC codes that appear in multiple Locus coordinates
     * @returns {JSON} with separated entries for each locus coordinate
     * as well as time series data for each coordinate metadata
     */
    function processedData(read_data, weights, combineCircles) {
        var processing = [];
        var centers = {};
        var output = {
            "data": null,
            "MIN_YEAR": Number.MAX_SAFE_INTEGER,
            "MAX_YEAR": 0,
            "coordHistory": null
        }

        /**
         * @param  {JSON} d, data read in from SIC.json
         * @param  {int} index of current iteration
         */
        read_data.forEach(function(d, i) {
            var activities = d.activity.replace(/\s+/g, '').split(",");
            var resources = d.resource.replace(/\s+/g, '').split(",");
            output.MIN_YEAR = Math.min(output.MIN_YEAR, d.year);
            output.MAX_YEAR = Math.max(output.MAX_YEAR, d.year);
            var activity, resource, center, weight, count, sum;

            for (var i = 0; i < activities.length; i++) {
                activity = activities[i].substring(0, 3)
                resource = resources[i].charAt(0);
                center = activity + resource;
                count = weights[d.SIC][center];
                sum = weights[d.SIC].sum;
                if (isNaN(count)) { // count was not in the random sampling
                    count = 1;
                }

                weight = count / weights[d.SIC].sum

                var firmCount = d.firms * weight;
                var equalWeightFirms = d.firms / activities.length; //assumes equal weighting

                var entry = {
                    "year": d.year,
                    "SIC": [d.SIC],
                    "activity": activities[i].substring(0, 3),
                    "resource": resources[i].charAt(0),
                    "firms": firmCount,
                    "equalWeightFirms": equalWeightFirms,
                    "center": center,
                    "color": SIC_DICT[d.SIC].color[0]
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
                    processing.push(entry);
                }
            }
        });

        /**
         * if circles were combined, calculate max firmcount by looking at the cumulative data
         * pushes all data into processing
         * @param  {Boolean} combineCircles
         */
        if (combineCircles) {
            maxFirmCount = 0;
            for (center in centers) {
                maxFirmCount = Math.max(maxFirmCount, centers[center].firms)
                processing.push(centers[center])
            }
        }

        output.coordHistory = (function() {
            var h = {};
            for (i in processing) {
                var d = processing[i];
                var color = d.color;
                var center = d.center;

                if (!(center in h)) {
                    h[center] = {};
                    h[center]["data"] = new Array(output.MAX_YEAR - output.MIN_YEAR + 1);
                    h[center]["color"] = d.color;
                }
                h[center].data[d.year - output.MIN_YEAR] = d.firms;
            }
            h["MIN_YEAR"] = output.MIN_YEAR;
            h["MAX_YEAR"] = output.MAX_YEAR;
            return h;
        })();

        r.domain([0, maxFirmCount]);
        output.data = processing;
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
     * [setupSlider] creates a slider with listeners inside the #slider div
     * @param  {int} min - minimum value of slider, 1977 in this case
     * @param  {int} max - maximum, 2013 in this case
     * @mutator manimupates the DOM and attaches listener to slider changes
     */
    function setupSlider(min, max) {
        var sliderValue = YEAR;
        $(".slider.value").html(YEAR);

        $('#slider').range({
            min: min,
            max: max,
            start: YEAR,
            input: '#input',
            onChange: function(val) {
                if (val != YEAR) {
                    YEAR = ~~(val);
                    updateChart(YEAR);
                    $(".slider.value").html(val);
                    $(".slider.value").css({ left: $(".thumb").position().left - $(".thumb").width() / 2 })
                }
                $(".circular.label").removeClass("selected").addClass("basic")
            }
        });
        var thumb = $(".thumb");
        var fill = $(".track-fill");
        var value = $(".slider.value");
        value.css({ left: $(".thumb").position().left })
            // var start = output.MIN_YEAR;

        var labelLeftMax = $(".track").width() - $(".slider.label").width() / 2;
        makeSliderTicks(min, max);

        $(".play.icon").on("click", function() {
            var tt = new TimelineLite();
            var tf = new TimelineLite();
            var tv = new TimelineLite();
            tt.to(thumb, 0.5, {
                left: "0px",
                onStart: function() {
                    // $(".circular.label").removeClass("selected").addClass("basic");
                },
                onUpdate: function() {
                    var left = thumb.position().left
                    updateSlider(left);
                }
            });
            tf.to(fill, 0.5, { width: "0px" });
            tv.to(value, 0.5, { left: "0px" });

            tt.to(thumb, 3, {
                left: "100%",
                onUpdate: function() {
                    var left = thumb.position().left
                    updateSlider(left);
                }
            });
            tf.to(fill, 3, { width: "100%" });
            tv.to(value, 3, { left: labelLeftMax + "px" });
        })

        function updateSlider(val) {
            var year = ~~(val / $(".track").width() * (output.MAX_YEAR - output.MIN_YEAR) + output.MIN_YEAR)
            value.html(year)
            YEAR = year;
            updateChart(YEAR);
            highlightScatter(YEAR);
        }
    };

    function makeSliderTicks(min, max) {
        var slider = $(".track")
        var spacing = 100 / (max - min);

        for (var i = 0; i < max - min; i++) {
            $('<span class="ui-slider-tick-mark"></span>').css('left', (spacing * i) + '%').appendTo(slider);
        }

    }

    setUpLabels();

    /**
     * creates labels (appends HTML) and attaches hover/click listeners
     * interacts with the circle chart
     */
    function setUpLabels() {
        for (key in SIC_DICT) {
            $(".buttoncontainer").append(makeButtonHTML(key));

            function makeButtonHTML(key) {
                var color = SIC_DICT[key].color[1];
                // var HTML = '<button class="ui small circular basic ' + color + ' label" ' + makeToolTip(key) + ' ></button>'+ key + ': ' + SIC_DICT[key].name + '</br>'
                var HTML = '<div class="item"><button class="ui horizontal small circular basic ' + color + ' label" data-key="' + key + '"></button> ' + makeToolTip(key) + '</div>'
                return HTML
            }

            function makeToolTip(key) {
                // var HTML = 'data-key="' + key + '" data-content="' + key + ': ' + SIC_DICT[key].name + '" data-variation="inverted tiny"'
                var HTML = key + ': ' + SIC_DICT[key].name
                return HTML;
            }
        };

        $(".circular.label").on("mouseenter", function() {
            var active = !$(this).hasClass("selected");
            if (active) transitionCircle($(this), 1);
        }).on("mouseleave", function() {
            var active = !$(this).hasClass("selected");
            if (active) transitionCircle($(this), 0);
            d3.selectAll(".cell").transition().style("fill-opacity", 1)
        }).on("click", function() {
            var checkbox = $('.ui.checkbox.sic');
            if (checkbox.hasClass("checked")) {
                $('.ui.checkbox.sic').checkbox("uncheck")
                $(".circular.label").each(function() {
                    transitionCircle($(this), 1);
                })
            }
            $(this).toggleClass("selected");
            transitionCircle($(this), 1);
        });

        $('.ui.checkbox.sic').checkbox({
            onChecked: function() {
                $(".circular.label").each(function() {
                    $(this).addClass("selected");
                    transitionCircle($(this), 1, true);
                })
            },
            onUnchecked: function() {
                $(this).removeClass("selected");
                $(".circular.label").each(function() {
                    transitionCircle($(this), 0, true);
                })
            }
        })

        function handleLabelClick(elm) {
            if (elm.hasClass("selected")) {
                transitionCircle(elm, 1);
            }
        }

        /**
         * @param  {DOM object} label clicked
         * @param  {int} 0 or 1, represents desired opacity of circle fill
         * @mutator mutates the DOM
         */
        function transitionCircle(elm, op, checkboxMode) {
            if (typeof checkboxMode === 'undefined') { checkboxMode = false; }
            var active = !$(this).hasClass("selected");
            if (!active) {
                elm.toggleClass("basic");
            };
            var sic = elm.data("key");
            if (op == 1) {
                elm.removeClass("basic");
            } else {
                elm.addClass("basic");
            }
            d3.selectAll(".dot").filter(function(d) {
                return (d.SIC.indexOf(sic) != -1)
            }).each(function(d) {
                /**
                 * select scatterplots at that SIC code and highlight those
                 */
                if (!checkboxMode) {
                    var center = $(this).data("center");
                    var newCenter = center.charAt(0) + center.slice(-1);
                    d3.selectAll(".cell").transition().style("fill-opacity", 0.2);
                    d3.selectAll(".cell").filter(function(d) {
                        return (d.center == newCenter)
                    }).transition().style("fill-opacity", 1)
                }
            }).transition().style("fill-opacity", op)
        }

    }

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

})
