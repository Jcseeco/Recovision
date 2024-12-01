<script>
	import { geoPath, select, json, scaleLinear, csv } from 'd3';
	import * as topojson from 'topojson-client';

	let states, dataset, map, path, seed;
	const icons = {
		'Beauty and Health': '',
		Books: '',
		Clothing: '',
		Electronics: '',
		'Home & Kitchen': '',
		Other: '',
		'Pet Care': '',
		'Sports & Fitness': '',
		'Toys & Games': ''
	};
	const Color = scaleLinear().domain([0, 1]).range(['gray', 'green']);

	$effect(async () => {
		map = select('#map');
		path = geoPath();

		const [albersStates, data] = await Promise.all([json('states-albers-10m.json'), loadData()]);
		dataset = data;
		states = topojson.feature(albersStates, albersStates.objects.states).features;

		insertSimilarityData();
		drawMap();
	});

	async function loadData() {
		return csv('ecommerce_usa.csv', parseRow);
	}

	function parseRow(row) {
		let [day, month, yearTime] = row['Purchase Date'].split('/');
		row['Purchase Date'] = new Date(`${month}/${day}/${yearTime}`);
		row['Discount Amount (INR)'] = +row['Discount Amount (INR)'];
		row['Gross Amount'] = +row['Gross Amount'];
		row['Net Amount'] = +row['Net Amount'];

		return row;
	}

	function caclSimilarity() {}

	function insertSimilarityData() {
		states.map((state) => {
			state.properties = {
				...state.properties,
				similarity: Math.random(),
				topProduct: 'clothes'
			};
			return state;
		});
	}

	function drawMap() {
		map
			.selectAll('.states')
			.data(states)
			.join('path')
			.attr('class', 'states')
			.attr('d', path)
			.attr('fill', (d) => Color(d.properties.similarity))
	}

	/**
	 * helper
	 */
	function unqiueProducts(prop = 'Product Category') {
		return new Set(dataset.map((d) => d[prop]));
	}
</script>

<div class="chart-container bg-white p-3" style="width: 700px;">
	<!-- svelte-ignore component_name_lowercase -->
	<svg id="map" width="100%" viewbox="0 0 975 610" />
</div>
