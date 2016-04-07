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
    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.ordinal().domain(["A", "B", "C", "D", "E", "F", "G"]).rangePoints([0, width]);

    var ydomain = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3"];
    var y = d3.scale.ordinal().domain(ydomain)
        .rangePoints([height, 0]);

    var r = d3.scale.linear().range([0, height/10]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("SIC.json", function(error, data) {
        if (error) throw error;
        console.log(data);
        var maxFirmCount = 0;
        data.forEach(function(d, i) {
            
            if (d.activity.length > 1) {
                var activities = d.activity.replace(/\s+/g, '').split(",");
                var resources = d.resource.replace(/\s+/g, '').split(",");
                maxFirmCount=Math.max(maxFirmCount, d.firms/activities.length);
                for (var i = 0; i < activities.length; i++) {
                    var entry = {
                        "year": d.year,
                        "SIC": d.SIC,
                        "activity": activities[i],
                        "resource": resources[i],
                        "firms": d.firms / activities.length
                    }
                    data.splice(i, 1);
                    data.push(entry);
                }
            } else {
              maxFirmCount=Math.max(maxFirmCount, d.firms);
            }
        });
        r.domain([0, maxFirmCount]);

        // x.domain(d3.extent(data, function(d) {
        //     return d.resource.charAt(0)
        // }));
        // y.domain(d3.extent(data, function(d) {
        //     return d.sepalLength;
        // })).nice();

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("Sepal Width (cm)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Sepal Length (cm)")

        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", function(d) {
                return r(d.firms);
            })
            .attr("cx", function(d) {
              // console.log(d.resource.charAt(0), x(d.resource.charAt(0)))
                return x(d.resource.charAt(0));
            })
            .attr("cy", function(d) {
                console.log(d.activity.substring(0, 3), y(d.activity.substring(0, 3)));
                return y(d.activity.substring(0, 3));
            })
            .style("fill", function(d) {
                return color(d.species);
            });

        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {
                return d;
            });

    });
})
