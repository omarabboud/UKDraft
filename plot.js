$(function() {

    /**
     * wait for data to be calculated and made available to this file
     */
    waitdataready();
    function waitdataready() {
        if (data == null) { //we want it to match
            setTimeout(waitdataready, 500); //wait 50 millisecnds then recheck
            return;
        }
        return data
    };

    var width = 960,
        size = 150,
        padding = 19.5;

    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);

    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

    var color = d3.scale.category10();

    d3.json("SIC.json", function(error, data) {
        if (error) throw error;

        var domainByTrait = {},
            traits = d3.keys(data[0]).filter(function(d) {
                return d !== "species";
            }),
            n = traits.length;

        traits.forEach(function(trait) {
            domainByTrait[trait] = d3.extent(data, function(d) {
                return d[trait];
            });
        });

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);

        var svg = d3.select("body").append("svg")
            .attr("class", "scatter")
            .attr("width", size * n + padding)
            .attr("height", size * n + padding)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        svg.selectAll(".x.axis.scatter")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis scatter")
            .attr("transform", function(d, i) {
                return "translate(" + (n - i - 1) * size + ",0)";
            })
            .each(function(d) {
                x.domain(domainByTrait[d]);
                d3.select(this).call(xAxis);
            });

        svg.selectAll(".y.axis.scatter")
            .data(traits)
            .enter().append("g")
            .attr("class", "y axis scatter")
            .attr("transform", function(d, i) {
                return "translate(0," + i * size + ")";
            })
            .each(function(d) {
                y.domain(domainByTrait[d]);
                d3.select(this).call(yAxis);
            });

        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
            })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) {
                return d.i === d.j;
            }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function(d) {
                return d.x;
            });

        function plot(p) {
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);

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
                .style("fill", function(d,i) {
                    return color(i);
                });
        }

        function cross(a, b) {
            var c = [],
                n = a.length,
                m = b.length,
                i, j;
            for (i = -1; ++i < n;)
                for (j = -1; ++j < m;) c.push({ x: a[i], i: i, y: b[j], j: j });
            return c;
        }

        d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
    });

})
