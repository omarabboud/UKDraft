$(function() {
    // var SIC_KEY = {};
    // var plotData = null;
    // Tabletop.init({
    //     key: 'https://docs.google.com/spreadsheets/d/1QVe47-yrv5Q_hs2Xd1MBovY3L6Fbnt8N6RMx0Jytq3E/pubhtml?gid=1019022566&single=true',
    //     callback: function(data, tabletop) {
    //         for (var i = 0; i < data.length; i++) {
    //             var sic = data[i].SIC;
    //             SIC_KEY[sic] = { "activity": data[i].activity, "resource": data[i].resource };
    //         }
    //         // console.log(SIC_KEY)
    //         plotData = parseSIC(SIC_KEY);
    //         console.log(plotData);

    //     },
    //     simpleSheet: true
    // });

    // var parseSIC = function(SIC_KEY) {
    //     var plotData = null
    //     $.ajax({
    //         'async': false,
    //         'global': false,
    //         'url': "http://localhost:8080/SIC.json",
    //         'dataType': "json",
    //         'success': function(data) {
    //             // json = data;
    //             // console.log(json);
    //             for (var i = 0; i < data.length; i++) {
    //                 var sic = data[i].SIC;
    //                 console.log(SIC_KEY[sic]);
    //                 var activity = SIC_KEY[sic]["activity"];
    //                 var resource = SIC_KEY[sic]["resource"];
    //                 data[i]["activity"] = activity;
    //                 data[i]["resource"] = resource;
    //             }
    //             plotData = data;
    //         }
    //     }).done(function() {

    //     });
    // }
    var margin = { top: 80, right: 20, bottom: 20, left: 80 };

    var width = 500 - margin.left - margin.right;
    var height = width * 12 / 7;

    var x = d3.scale.ordinal().domain(["A", "B", "C", "D", "E", "F", "G"]).rangePoints([width / 7, width]);

    var ydomain = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3"];
    var y = d3.scale.ordinal().domain(ydomain)
        .rangePoints([height / 12, height]);

    var r = d3.scale.linear().range([10, height / 10]);

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

    d3.json("SIC.json", function(error, data) {
        if (error) throw error;
        var maxFirmCount = 0;
        data.forEach(function(d, i) {
            if (d.activity.length > 1) {
                var activities = d.activity.replace(/\s+/g, '').split(",");
                var resources = d.resource.replace(/\s+/g, '').split(",");
                if (d.year == 2013) {
                    maxFirmCount = Math.max(maxFirmCount, d.firms / activities.length);
                }

                for (var i = 0; i < activities.length; i++) {
                    var entry = {
                            "year": d.year,
                            "SIC": d.SIC,
                            "activity": activities[i],
                            "resource": resources[i],
                            "firms": d.firms / activities.length
                        }
                    d.firms = 0;      // "remove" the conjugated entry
                    data.push(entry);
                }
            } else {
                if (d.year == 2013) {
                    maxFirmCount = Math.max(maxFirmCount, d.firms);
                }
                
            }
        });
        console.log(maxFirmCount);
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


        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0," + 10 + ")")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("y", -10)
            .attr("transform", "translate(0,30)")
            .style("text-anchor", "end")
            .text("Activity");

        // console.log(data);
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
})
