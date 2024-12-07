<script>
	import {
		rollups,
		select,
		csv,
		scaleBand,
		scaleLinear,
		group,
		axisBottom,
		axisLeft,
		max,
		scaleOrdinal
	} from 'd3';
	import { systemData } from '../utils/storage.svelte';
	let temp_data;
	let seed_customer; //= ["25-45","Female","A"]

	const INRtoCat = [
		{ min: -1, max: 5000, category: 'A', name: '0~5000' },
		{ min: 5000, max: 10000, category: 'B', name: '5001~10000' },
		{ min: 10000, max: 15000, category: 'C', name: '10001~15000' },
		{ min: 15000, max: 20000, category: 'D', name: '15001~20000' }
	];

	const AgeGrouptoCat = {
		'under 18': 0,
		'18-25': 1,
		'25-45': 2,
		'45-60': 3,
		'60 and above': 4
	};

	const xAxis = {
		Gender: ['Female', 'Male', 'Other'],
		Age_group: ['under 18', '18-25', '25-45', '45-60', '60 and above'],
		Inr: INRtoCat.map((item) => item.name)
	};

	var colorScale = scaleOrdinal()
		.domain(['exact', 'within', 'out'])
		.range([
			'oklch(70.27% 0.1889 142.02)',
			'oklch(56.26% 0.1653 142.02)',
			'oklch(68.85% 0.0082 142.02)'
		]);

	$effect(async () => {
		loadData();
		drawBar();
	});

	async function loadData() {
		select('#similar-rcord').selectAll('*').remove();

		const seed_data = systemData.seedCustomerObj;
		seed_customer = {
			gender: seed_data['Gender'],
			age: seed_data['Age Group'],
			inr: INRtoCat.find(
				(c) => seed_data['Discount Amount'] > c.min && seed_data['Discount Amount'] <= c.max
			).category
		};

		temp_data = systemData.filteredAggregated.map(function (d) {
			return {
				Gender: d['Gender'],
				Age_group: d['Age Group'],
				Inr: findCategory(d['Discount Amount'])
			};
		});
	}

	function findCategory(value) {
		const category = INRtoCat.find((c) => value > c.min && value <= c.max);
		if (!category) console.log(value, category);
		return category ? category.name : 'Unknown';
	}

	function drawBar() {
		console.log('draw');
		var attribute = ['Age_group', 'Gender', 'Inr'];
		var svg = select('#similar-rcord');
		var legend = svg.append('g').attr('transform', `translate(${-20}, 20)`);
		legend
			.selectAll('legend')
			.data(colorScale.domain())
			.enter()
			.append('g')
			.attr('transform', (d, i) => `translate(20, ${20 + i * 20})`)
			.each(function (d) {
				select(this)
					.append('rect')
					.attr('width', 15)
					.attr('height', 15)
					.attr('fill', colorScale(d));

				select(this)
					.append('text')
					.attr('x', 20)
					.attr('y', 12)
					.text(d)
					.style('font-size', '12px')
					.style('fill', 'currentColor');
			});
		for (let i in attribute) {
			var m = [i * 380, 200];
			singleBar(svg, attribute[i], m, dataPreprocessing(attribute[i]));
		}
	}

	function dataPreprocessing(attri) {
		var groupedData = group(temp_data, (d) => d[attri]);
		groupedData = Array.from(groupedData, ([attribute, items]) => [
			(attribute = attribute),
			items.length
		]);
		return groupedData;
	}

	function SimilaritytoCat(smi) {
		if (smi == 0) return 'exact';
		else if (smi == 1) return 'within';
		else {
			return 'out';
		}
	}

	function singleBar(svg, id, movement, bardata) {
		//console.log(bardata)
		var singleBar_svg = svg
			.append('g')
			.attr('transform', `translate(${movement[0]},${movement[1]})`)
			.style('border-color', 'blue');

		// singleBar_svg
		// 	.append('rect')
		// 	.attr('class', `rect_${id}`)
		// 	.attr('x', -60)
		// 	.attr('y', -50)
		// 	.attr('width', 400)
		// 	.attr('height', 300)
		// 	.style('fill', 'none')
		// 	.style('stroke', 'red')
		// 	.style('visibility', 'hidden');

		var xScale = scaleBand()
			.range([0, 300])
			.domain(xAxis[id]) //.domain(bardata.map(d => d[0]))
			.padding(0.1);

		var yScale = scaleLinear()
			.range([200, 0])
			.domain([0, max(bardata, (d) => d[1])]);

		// { label: 'exact', color: 'oklch(70.27% 0.1889 142.02)' },
		// { label: 'within', color: 'oklch(56.26% 0.1653 142.02)' },
		// { label: 'out', color: 'oklch(68.85% 0.0082 142.02)' }
		//.range(['green','darkgreen','grey'])
		//.range(['#02576c', '#E8DB64', 'gray'])

		singleBar_svg
			.append('g')
			.attr('transform', 'translate(0,' + 200 + ')')
			.call(axisBottom(xScale))
			.selectAll('text')
			.attr('transform', 'translate(-10,0)rotate(-45)')
			.style('text-anchor', 'end');

		singleBar_svg.append('g').call(axisLeft(yScale));

		singleBar_svg
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('x', 400 / 2 - 50)
			.attr('y', 300 - 10)
			.text(function () {
				if (id == 'Inr') return 'Discount Amount';
				else if (id == 'Age_group') return 'Age Group';
				else return id;
			})
			// .style('font-size', '14px')
			.style('fill', 'currentColor');
		singleBar_svg
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('transform', `rotate(-90)`)
			.attr('x', -300 / 2 + 30)
			.attr('y', -40)
			.text('# of records')
			// .style('font-size', '14px')
			.style('fill', 'currentColor');

		singleBar_svg
			.selectAll(`.${id}`)
			.data(bardata)
			.enter()
			.append('rect')
			.attr('class', `${id}`)
			.attr('x', (d) => xScale(d[0]))
			.attr('y', (d) => yScale(d[1]))
			.attr('width', xScale.bandwidth())
			.attr('height', (d) => 200 - yScale(d[1]))
			.attr('fill', function (d) {
				var c;
				if (id == 'Gender') {
					if (d[0] == seed_customer.gender) c = 'exact';
					else c = 'out';
				} else if (id == 'Age_group') {
					c = SimilaritytoCat(Math.abs(AgeGrouptoCat[d[0]] - AgeGrouptoCat[seed_customer.age]));
				} else if (id == 'Inr') {
					var n = INRtoCat.find((item) => item.name === d[0]);
					c = SimilaritytoCat(Math.abs(n.category.charCodeAt(0) - seed_customer.inr.charCodeAt(0)));
				}
				return colorScale(c);
			});
		// .on('mouseenter', function (event, d) {
		// 	singleBar_svg.select(`.rect_${id}`).style('visibility', 'visible');
		// })
		// .on('mouseleave', function (event, d) {
		// 	singleBar_svg.select(`.rect_${id}`).style('visibility', 'hidden');
		// });
	}
</script>

<div class="chart-container">
	<svg id="similar-rcord" width="100%" height="450px" viewbox="0 0 1000 580"> </svg>
</div>
