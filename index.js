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
    var updating = false;
    setupSlider();
    // var color = d3.scale.category10();

    /** 
    create x & y axis
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


    var read_data, data;
    // var processed_data;
    d3.json("SIC.json", function(error, json) {
        if (error) return error;
        read_data = json;
        // console.log(read_data);
        data = processedData();

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

        svg.selectAll("text").style("font-family", "avenir");

        svg.selectAll("text.label")
            .style("font-size", "16px")
            .style("font-weight", "bold");

        svg.selectAll(".tick > text")
            .style("font-size", "12px");

        updateChart(YEAR);
    });


    function updateChart(YEAR) {
        var chartData = data.filter(function(d) {
            return d.year == YEAR
        });

        var maxFirmCount = 0,
            totalFirmCount = 0;

        chartData.forEach(function(d, i) {
            maxFirmCount = Math.max(maxFirmCount, d.firms);
            totalFirmCount += d.firms;
        });

        totalFirmCount = ~~(totalFirmCount);

        r.domain([0, maxFirmCount]);

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
        
        


        svg.selectAll(".dot")
            .data(chartData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", function(d) {
                return r(d.firms);
            })
            .attr("cx", function(d) {
                return x(d.resource.charAt(0));
            })
            .attr("cy", function(d) {
                return y(d.activity.substring(0, 3));
            })
            .style("fill", "transparent");
    }

    /**
     * processes SIC.json to create separate entries for conjugated SIC codes
     * assumes equal weighting
     * appends data with nodes for SIC codes that appear in multiple Locus coordinates
     * @returns {JSON} with separated entries for each locus coordinate
     */
    function processedData() {
        var data = [];
        var maxFirmCount = 0;
        var totalFirmCount = 0;

        read_data.forEach(function(d, i) {
            // if (d.year != selectedYear) {
            //     return;
            // }
            var activities = d.activity.replace(/\s+/g, '').split(",");
            var resources = d.resource.replace(/\s+/g, '').split(",");
            for (var i = 0; i < activities.length; i++) {
                var firmCount = d.firms / activities.length;

                var entry = {
                    "year": d.year,
                    "SIC": d.SIC,
                    "activity": activities[i],
                    "resource": resources[i],
                    "firms": firmCount
                }
                data.push(entry);
            }
        });
        return data;
    }
    /**
     * helper for creating scale functions
     * @constructor
     * @returns {Object} with attributes {Function} x, {Function} y, and {Function} r
     */
    function makeScales() {
        var Scale = { x: null, y: null, r: null };
        Scale.x = d3.scale.ordinal().domain(["A", "B", "C", "D", "E", "F", "G"])
            .rangePoints([width / 7, width]);
        var ydomain = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3"];
        Scale.y = d3.scale.ordinal().domain(ydomain)
            .rangePoints([height / 12, height]);

        Scale.r = d3.scale.sqrt().range([0, height / 12]);

        return Scale;
    }

    /**
     * sets up year slider
     * @param {Number} specifies inital value of slider
     */
    function setupSlider() {
        $('#slider').range({
            min: 1977,
            max: 2013,
            start: YEAR,
            onChange: function(val) {
                if (!updating) {
                    updating = true;
                    return;
                }
                // console.log(YEAR)
                updateChart(val);
            }
        });

    }

});
