<script>
	import {
		geoPath,
		select,
		json,
		zoom,
		scaleSequential,
		rollup,
		sum as d3sum,
		rollups,
		maxIndex
	} from 'd3';
	import * as topojson from 'topojson-client';
	import { systemData } from '../utils/storage.svelte';
	import { onMount } from 'svelte';

	let states, map, path, seed, tooltip;
	/** @type {typeof systemData.filtered} */
	let selectedData = [];
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
	const Color = scaleSequential();

	$effect(async () => {
		const [albersStates, data] = await Promise.all([
			json('states-albers-10m.json'),
			await systemData.filtered
		]);
		selectedData = data;
		states = topojson.feature(albersStates, albersStates.objects.states).features;

		insertSimilarityData();
		drawMap();
	});

	// operations that should only happen once
	onMount(() => {
		tooltip = select('#sim_map_tooltip');
		map = select('#map');
		path = geoPath();
		initDef();
		drawLegend();
	});

	function insertSimilarityData() {
		let maxAmount = 0;
		let minAmount = Infinity;
		let minState = '';

		// rollup attributes in each state
		const stateProps = rollup(
			selectedData,
			(D) => {
				const netAmount = d3sum(D, (d) => d['Net Amount']);
				const prodCount = rollups(
					D,
					(prod) => prod.length,
					(d) => d['Product Category']
				);
				const topProduct = prodCount[maxIndex(prodCount, (d) => d[1])][0];

				return { netAmount, topProduct };
			},
			(d) => d.Location
		);

		// populate geojson properties with rolledup data
		states.map((state) => {
			const stateProp = stateProps.get(state.properties.name);

			if (stateProp) {
				state.properties = {
					...state.properties,
					netAmount: stateProp.netAmount,
					topProduct: stateProp.topProduct
				};

				if (maxAmount < stateProp.netAmount) maxAmount = stateProp.netAmount;
				if (minAmount > stateProp.netAmount) {
					minAmount = stateProp.netAmount;
					minState = state.properties.name;
				}
			} else {
				state.properties = {
					...state.properties,
					netAmount: 0,
					topProduct: 'none'
				};
			}

			return state;
		});

		// udpate color scale
		Color.domain([minAmount, maxAmount]).range(['lightgray', 'green']);
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
			.attr('transform', `translate(${viewW - 80},${viewH - 130})`);

		legendLabels.append('text').attr('class', 'high').attr('fill', 'currentColor');
		legendLabels.append('text').attr('class', 'low').attr('y', 130).attr('fill', 'currentColor');
	}

	function updateLegend(domain) {
		map.select('text.low').text(domain[0].toFixed(2));

		map.select('text.high').text(domain[1].toFixed(2));
	}

	function drawMap() {
		updateLegend(Color.domain());

		const statesP = map
			.selectAll('.states')
			.data(states)
			.join('path')
			.attr('class', 'states cursor-default')
			.attr('d', path)
			.attr('fill', (d) => Color(d.properties.netAmount))
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

	function showTooltip(ev, d) {
		tooltip
			.html(
				`
				<div>
					<div>State:<span class="font-bold"> ${d.properties.name}</span></div>
					<div>Net Amount:<span class="font-bold"> ${d.properties.netAmount.toFixed(2)}</span></div>
					<div>Top Product:<span class="font-bold"> ${d.properties.topProduct}</span></div>
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
