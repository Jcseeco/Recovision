<script>

    import {select, csv, groups, hierarchy, partition, arc ,scaleOrdinal,schemeCategory10, color} from 'd3';
    let temp_data ={}
    let temp_user = ["25-45","Female","A"]
    let radius = 100
    let arc_ ,root,colorScale

    const INRtoCat = [
        { min: 0, max: 50, category: "A" },
        { min: 51, max: 100, category: "B" },
        { min: 101, max: 150, category: "C" },
        { min: 151, max: 500, category: "D" }
    ];

    $effect(async()=>{
        await loadData()
        buildHierarchy()
        drawDonuts()
        //console.log(temp_data)
    })

    async function loadData() {
        var data = await csv("ecommerce_usa.csv")

            //var key = [`${d.Gender}`,`${d["Age Group"]}`,`${findCategory(+d["Discount Amount (INR)"])}`]
            var group_data = groups(data, d => d["Age Group"], d => d.Gender, d => findCategory(+d["Discount Amount (INR)"]))
            temp_data = {
                "name": "root",
                "children": group_data.map(function(ageGroup) {
                    return {
                        "name": ageGroup[0],  // age_group
                        "children": ageGroup[1].map(function(genderGroup) {
                            return {
                                "name": genderGroup[0],  // gender
                                "children": genderGroup[1].map(function(inrGroup) {
                                    return {
                                    "name": inrGroup[0], 
                                    "value": inrGroup[1].length
                                    }
                                })
                            }
                        })
                    }
                })
            }
    }
    function findCategory(value) {
        const category = INRtoCat.find(c => value >= c.min && value <= c.max);
        return category ? category.category : "Unknown";
    }

    function buildHierarchy(){
        root = hierarchy(temp_data)
            .sum(function(d) { return d.value; })
            .sort(function(a, b) { return b.value - a.value; })

        var partition_ = partition()
            .size([2 * Math.PI, radius * radius])

        partition_(root);
        //console.log(root)

        arc_ = arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, d.x0)); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, d.x1)); })
            .innerRadius(function(d) { return Math.max(55, Math.sqrt(d.y0)); })
            .outerRadius(function(d) { return Math.max(55, Math.sqrt(d.y1)); })
        
        colorScale = scaleOrdinal(schemeCategory10);
    }


    function drawDonuts(){

        select("#likeme-donuts")
            .append("g")
            .attr('transform', 'translate(' + 190 + ',' + 120 + ')')
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr("d", arc_)
            .style("fill", function(d){
                console.log("this",d)
                return colorScale(d.name)
            })
            .style("stroke", "white")
            .style("stroke-width", "1px")
    }

</script>

<div class="chart-container h-60 w-96 bg-white">
    <svg id="likeme-donuts" width="100%" height="100%">

    </svg>
</div>
