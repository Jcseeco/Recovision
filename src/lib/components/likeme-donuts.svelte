
<script>

    import {rollups,select, csv, groups, hierarchy, partition, arc ,scaleOrdinal,schemeCategory10, color} from 'd3';
    import { systemData } from '../utils/storage.svelte'
    let temp_data ={}
    let seed_customer
    let radius = 100
    let arc_ ,root,colorScale,p_root

    const INRtoCat = [
            { min: 0, max: 5000, category: "A"},
            { min: 5000, max: 10000, category: "B"},
            { min: 10000, max: 15000, category: "C"},
            { min: 15000, max: 20000, category: "D" }
    ]

    const AgeGrouptoCat = {
        "under 18" : 0,
        "18-25"    : 1,
        "25-45"    : 2,
        "45-60"    : 3,
        "60 and above" : 4
    }


    $effect(async()=>{
        var d = await loadData()
        if(d.length>0){
            select("#likeme-donuts").selectAll("*").remove()
            dataPreprocessing(d)
            buildHierarchy()
            drawDonuts()
        }
        else{
            select("#likeme-donuts").selectAll("*").remove()
        }
        
    })

    async function loadData() {
        //var data = await csv("ecommerce_usa.csv")
        var data = await systemData.filtered
        return data
    }

    function dataPreprocessing(data){
        
        /////////////////////
        //aggregation
        var rollups_data = rollups(
            systemData.filtered,
            (group) => ({
                ...group[0],
                totalDiscount: group.reduce((sum, d) => sum + (+d["Discount Amount"]), 0) 
            }),
            (d) => d.CID
        ).map(([key, value]) => value)

       ////////////////////////

       //seed customer (will use data from aggregation => change "totalDiscount" to ?)
        var seed_data = rollups_data.find(d => d.CID == systemData.seedCustomer)
        seed_customer = {
            gender : seed_data.Gender,
            age : seed_data["Age Group"],
            inr: INRtoCat.find(c => seed_data.totalDiscount > c.min 
            && seed_data.totalDiscount <= c.max).category
        }
        
        //tree data (will use data from aggregation => => change "totalDiscount" to ?)
        var group_data = groups(rollups_data, d => d["Age Group"], d => d.Gender, d => findCategory(d.totalDiscount))
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

        p_root = partition_(root);

        arc_ = arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, d.x0)); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, d.x1)); })
            .innerRadius(function(d) { return Math.max(55, Math.sqrt(d.y0)); })
            .outerRadius(function(d) { return Math.max(55, Math.sqrt(d.y1)); })
        
        colorScale = scaleOrdinal()
		.domain(['exact', 'half-smi', 'non-smi'])
        .range(['oklch(70.27% 0.1889 142.02)','oklch(56.26% 0.1653 142.02)','oklch(68.85% 0.0082 142.02)'])
        
        //.range(['#02576c', '#E8DB64', 'gray'])
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

        const label = donuts
            .append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "#888")
            .style("visibility", "hidden")
        
        label
            .append("tspan")
            .attr("class","percentage")
            .attr("x",0)
            .attr("y",0)
            .attr("dy","-0.1em")
            .attr("font-size",10)
            .text("")
        label
            .append("tspan")
            .attr("class","category_text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "1.5em")
            .attr("font-size",7)
            .text("of people are in this category")
        
        const tooltip =  select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "#333")
            .style("color", "#fff")
            .style("padding", "5px 10px")
            .style("border-radius", "4px")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.3)")
            .style("opacity", 0)
            .style("transition", "opacity 0.2s ease")
            .style("text-align", "center")

        donuts
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr("d", arc_)
            .style("fill", function(d){
                var temp
                if(d.depth == 1){ //age group
                    temp = SimilaritytoCat(Math.abs(AgeGrouptoCat[d.data.name]-AgeGrouptoCat[seed_customer.age]))
                }
                else if(d.depth == 2){ //gender
                    if(d.data.name == seed_customer.gender){
                        temp = "exact"
                    }
                    else{
                        temp = "non-smi"
                    }
                }
                else if(d.depth == 3){ //inr
                    temp = SimilaritytoCat(Math.abs(d.data.name.charCodeAt(0)-seed_customer.inr.charCodeAt(0)))
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
                    .style("filter", node => ancestors.includes(node) ? "brightness(1.2)" : "brightness(1)")
                var percentage_ = ((100*d.value)/p_root.value).toPrecision(3)
                label.style("visibility","visible")
                    .select(".percentage")
                    .text(`${percentage_}%`)

                // var ancestors_string = ancestors.map(a => a.data.name).join(" ")
                // label.select(".category_text")
                //     .text(` ${ancestors_string}`)

                var tooltip_msg = ""
                if(ancestors.length > 0){//age
                    tooltip_msg = `Age : ${ancestors[0].data.name}`
                }
                if(ancestors.length > 1){//gender
                    tooltip_msg += `<br>Gender : ${ancestors[1].data.name}`
                }
                if(ancestors.length > 2){//inr
                    tooltip_msg += `<br>INR range :
                    ${INRtoCat.find(d => d.category == ancestors[2].data.name).min}-
                    ${INRtoCat.find(d => d.category == ancestors[2].data.name).max}`
                }
                tooltip.style("opacity", 1)
                    .html(tooltip_msg)
                    .style("left", `${event.pageX}px`)
                    .style("top", `${event.pageY - 20}px`)
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
            })
            .on("mouseleave",function(event,d){
                donuts.selectAll("path").style("filter", "brightness(1)")
                tooltip.style("opacity",0)
            })
    }

</script>

<div class="chart-container h-60 w-96 bg-white">
    <svg id="likeme-donuts" width="100%" height="100%">

    </svg>
</div>
