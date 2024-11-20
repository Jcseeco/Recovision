<script>

    import {select, csv, groups, hierarchy, partition, arc ,scaleOrdinal,schemeCategory10, color} from 'd3';
    let temp_data ={}
    let temp_user = ["25-45","Female","A"]
    let radius = 100
    let arc_ ,root,colorScale

    const INRtoCat = [
            { min: -1, max: 50, category: "A" },
            { min: 50, max: 100, category: "B" },
            { min: 100, max: 150, category: "C" },
            { min: 150, max: 500, category: "D" }
    ]

    const AgeGrouptoCat = {
        "under 18" : 0,
        "18-25"    : 1,
        "25-45"    : 2,
        "45-60"    : 3,
        "60 and above" : 4
    }


    $effect(async()=>{
        await loadData()
        buildHierarchy()
        drawDonuts()
        //console.log('A'.charCodeAt(0) - 'B'.charCodeAt(0))
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
        
        colorScale = scaleOrdinal()
		.domain(['exact', 'half-smi', 'non-smi'])
		.range(['#02576c', '#E8DB64', 'gray'])
    }

    function SimilaritytoCat(smi){
        if(smi == 0)return "exact";
        else if(smi == 1)return "half-smi";
        else{
            return "non-smi";
        }
    }


    function drawDonuts(){

        const donuts = select("#likeme-donuts")
            .append("g")
            .attr('transform', 'translate(' + 190 + ',' + 120 + ')')
        donuts
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr("d", arc_)
            .style("fill", function(d){
                //console.log(d)
                var temp
                if(d.depth == 1){ //age group
                    temp = SimilaritytoCat(Math.abs(AgeGrouptoCat[d.data.name]-AgeGrouptoCat[temp_user[0]]))
                }
                else if(d.depth == 2){ //gender
                    if(d.data.name == temp_user[1]){
                        temp = "exact"
                    }
                    else{
                        temp = "non-smi"
                    }
                }
                else if(d.depth == 3){ //inr
                    //console.log("check",d.data.name.charCodeAt(0),temp_user[2].charCodeAt(0))
                    temp = SimilaritytoCat(Math.abs(d.data.name.charCodeAt(0)-temp_user[2].charCodeAt(0)))
                }
                else{
                    temp = "non-smi"
                }
                return colorScale(temp)
            })
            .style("stroke", "white")
            .style("stroke-width", "1px")
            .on("mouseenter",function(event,d){
                const ancestors = d.ancestors().reverse().slice(1) //remove root(the first element)
                donuts.selectAll("path")
                    .style("opacity", node => ancestors.includes(node) ? 1 : 0.7);
            })
            .on("mouseleave",function(event,d){
                donuts.selectAll("path").style("opacity", 1);
            })
    }

</script>

<div class="chart-container h-60 w-96 bg-white">
    <svg id="likeme-donuts" width="100%" height="100%">

    </svg>
</div>
