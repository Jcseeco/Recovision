<script>
	import { geoPath, select, json, scaleLinear, csv, zoom, scaleSequential, selectAll } from 'd3';
	import * as topojson from 'topojson-client';
	import { systemData } from '../utils/storage.svelte';

	let states, selectedData, map, path, seed, tooltip;
	const viewW = 975,
		viewH = 610;
	const prodIcons = {
		'Beauty and Health': 'lipstick',
		Books: 'book',
		Clothing: 'clothes',
		Electronics: 'phone',
		'Home & Kitchen': 'spatula',
		Other: 'boxes',
		'Pet Care': 'collar',
		'Sports & Fitness': 'dumbbell',
		'Toys & Games': 'toy'
	};
	const Color = scaleSequential().domain([0, 1]).range(['lightgray', 'green']);

	$effect(async () => {
		const [albersStates, data] = await Promise.all([
			json('states-albers-10m.json'),
			await systemData.archived
		]);
		// TODO replace with systemData.selected
		selectedData = data.slice(0, 100);
		states = topojson.feature(albersStates, albersStates.objects.states).features;

		insertSimilarityData();
		drawMap();
	});

	// operations that should only happen once
	$effect(() => {
		tooltip = select('#sim_map_tooltip');
		map = select('#map');
		path = geoPath();
		initDef();
		drawLegend();
	});

	function insertSimilarityData() {
		const prodCats = Object.keys(prodIcons);

		states.map((state) => {
			const i = Math.floor(Math.random() * 9);

			state.properties = {
				...state.properties,
				similarity: Math.random(),
				topProduct: prodCats[i]
			};
			return state;
		});
	}

	function initDef() {
		const defs = map.select('defs');

		for (const fName of Object.values(prodIcons)) {
			defs
				.append('pattern')
				.attr('id', fName)
				.attr('width', 1)
				.attr('height', 1)
				.attr('patternContentUnits', 'objectBoundingBox')
				.append('svg:image')
				.attr('width', 1)
				.attr('height', 1)
				.attr('xlink:href', `icons/${fName}.svg`);
		}
	}

	/**
	 * draw color scale legend
	 */
	function drawLegend() {
		map
			.append('rect')
			.attr('x', viewW - 20)
			.attr('y', viewH - 120)
			.attr('width', 15)
			.attr('height', 100)
			.attr('fill', "url('#map_colorGradient')");

		const legendLabels = map
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${viewW - 35},${viewH - 115})`);

		legendLabels.append('text').text('1').attr('fill', 'currentColor');
		legendLabels.append('text').text('0').attr('y', 100).attr('fill', 'currentColor');
	}

	function drawMap() {
		const statesP = map
			.selectAll('.states')
			.data(states)
			.join('path')
			.attr('class', 'states cursor-default')
			.attr('d', path)
			.attr('fill', (d) => Color(d.properties.similarity))
			.on('mousemove', showTooltip)
			.on('mouseleave', hideTooltip);

		const prodCircles = map
			.selectAll('.prod-circle')
			.data(states)
			.join('circle')
			.attr('class', 'prod-circle')
			.attr('fill', '#ffffff55')
			.attr('r', 20)
			.attr('cx', (d) => path.centroid(d)[0])
			.attr('cy', (d) => path.centroid(d)[1])
			.on('mousemove', showTooltip)
			.on('mouseleave', hideTooltip);

		const prods = map
			.selectAll('.top-prod')
			.data(states)
			.join('circle')
			.attr('class', 'top-prod')
			.attr('fill', (d) => `url(#${prodIcons[d.properties.topProduct]})`)
			.attr('r', 20)
			.attr('cx', (d) => path.centroid(d)[0])
			.attr('cy', (d) => path.centroid(d)[1])
			.on('mousemove', showTooltip)
			.on('mouseleave', hideTooltip);

		map.call(
			zoom()
				.extent([
					[0, 0],
					[viewW, viewH]
				])
				.scaleExtent([1, 8])
				.on('zoom', ({ transform }) => {
					statesP.attr('transform', transform);
					prodCircles.attr('transform', transform);
					prods.attr('transform', transform);
				})
		);
	}

	/**
	 * helper
	 */
	function unqiueProducts(prop = 'Product Category') {
		return new Set(selectedData.map((d) => d[prop]));
	}

	function showTooltip(ev, d) {
		tooltip
			.html(
				`
				<div>
					<div>state:<span class="font-bold"> ${d.properties.name}</span></div>
					<div>similarity score:<span class="font-bold"> ${d.properties.similarity.toFixed(2)}</span></div>
					<div>Top product:<span class="font-bold"> ${d.properties.topProduct}</span></div>
				</div>
			`
			)
			.style('display', 'block')
			.style('top', `${ev.clientY - 10}px`)
			.style('left', `${ev.clientX + 10}px`)
			.style('translate', '0 -100%');
	}

	function hideTooltip() {
		tooltip.style('display', 'none');
	}
</script>

<div class="chart-container p-3" style="width: 700px;">
	<!-- svelte-ignore component_name_lowercase -->
	<svg id="map" class="cursor-grab" width="100%" viewbox="0 0 975 610">
		<defs>
			<linearGradient id="map_colorGradient" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="green" />
				<stop offset="100%" stop-color="lightgrey" />
			</linearGradient>
		</defs>
	</svg>
	<div id="sim_map_tooltip" class="fixed hidden rounded-md bg-base-100 p-3 shadow-md"></div>
</div>
