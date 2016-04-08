$(function() {
    var margin = { top: 80, right: 20, bottom: 20, left: 80 };

    var width = 500 - margin.left - margin.right;
    // calculate height to keep grid items square
    var height = width * 12 / 7;

    // create axis scale functions
    var x = d3.scale.ordinal().domain(["A", "B", "C", "D", "E", "F", "G"]).rangePoints([width / 7, width]);
    var ydomain = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3"];
    var y = d3.scale.ordinal().domain(ydomain)
        .rangePoints([height / 12, height]);

    var r = d3.scale.linear().range([0, height / 12]);

    var color = d3.scale.category10();

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


    var data;
    d3.json("SIC.json", function(error, read_data) {

        // cleanup read-in data to separate conjugated nodes
        // assumes equal weighting
        read_data.forEach(function(d, i) {
            var activities = d.activity.replace(/\s+/g, '').split(",");
            var resources = d.resource.replace(/\s+/g, '').split(",");
            if (d.activity.length > 1) {
                for (var i = 0; i < activities.length; i++) {
                    var entry = {
                            "year": d.year,
                            "SIC": d.SIC,
                            "activity": activities[i],
                            "resource": resources[i],
                            "firms": d.firms / activities.length
                        }
                        // console.log(data[i]); 
                    read_data.push(entry);
                }
                // data[i].firms = 0; // "remove" the conjugated entry
                // read_data.splice(i, 1);
                d.firms = 0;
            }
        });
        data = read_data;

        var maxFirmCount = 0;
        var totalFirmCount = 0;
        data.forEach(function(d, i) {
            if (d.year == 2013) {
                console.log(d.firms);
                maxFirmCount = Math.max(maxFirmCount, d.firms);
                totalFirmCount += d.firms;
            }
        });
        console.log(totalFirmCount);
        r.domain([0, maxFirmCount]);

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

        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .filter(function(d) {
                return (d.year == 2013);
            })
            .attr("class", "dot")
            .attr("r", function(d) {
                console.log(d.firms, r(d.firms));
                return r(d.firms);
            })
            .attr("cx", function(d) {
                return x(d.resource.charAt(0));
            })
            .attr("cy", function(d) {
                return y(d.activity.substring(0, 3));
            })
            .style("fill", "transparent");

        svg.selectAll("text.label")
            .style("font-size", "16px")
            .style("font-family", "avenir")
            .style("font-weight", "bold");

        svg.selectAll(".tick > text")
            .style("font-size", "12px")
            .style("font-family", "avenir");

    });


});


// d3.json("SIC.json", function(error, data) {
// if (error) throw error;
// })
