<script>
	import { systemData } from '../utils/storage.svelte';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import Throbber from './throbber.svelte';

	let isLoading = $state(false);

	// const data = [
	// 	{ range: '0-100', value: 0 },
	// 	{ range: '101-200', value: 0 },
	// 	{ range: '201-300', value: 0 },
	// 	{ range: '301-400', value: 0 },
	// 	{ range: '401-500', value: 0 }
	// ];

	let svg, binnedData;

	function drawBarChart() {
		const margin = { top: 10, right: 5, bottom: 20, left: 30 };
		const width = svg.clientWidth;
		const height = svg.clientHeight;

		d3.select(svg).selectAll('*').remove();

		const x = d3
			.scaleBand()
			.domain(binnedData.map((d) => `${d.x0.toFixed(0)}-${d.x1.toFixed(0)}`))
			.range([margin.left, width - margin.right])
			.padding(0.1);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(binnedData, (d) => d.value)])
			.nice()
			.range([height - margin.bottom, margin.top]);

		const xAxis = (g) =>
			g
				.attr('transform', `translate(0,${height - margin.bottom})`)
				.call(d3.axisBottom(x).tickSize(0))
				.call((g) => g.selectAll('text').style('font-size', '10px'));

		const yAxis = (g) =>
			g
				.attr('transform', `translate(${margin.left},0)`)
				.call(d3.axisLeft(y).ticks(5, 's').tickSize(0))
				.call((g) => g.selectAll('text').style('font-size', '8px'));

		d3.select(svg).append('g').call(xAxis);

		d3.select(svg).append('g').call(yAxis);

		d3.select(svg)
			.append('g')
			.selectAll('rect')
			.data(binnedData)
			.join('rect')
			.attr('x', (d) => x(`${d.x0.toFixed(0)}-${d.x1.toFixed(0)}`))
			.attr('y', (d) => y(d.value))
			.attr('height', (d) => y(0) - y(d.value))
			.attr('width', x.bandwidth())
			.attr('fill', (d) =>
				isSelected([d.x0, d.x1], systemData.seedCustomerObj['Discount Amount'])
					? 'oklch(70.27% 0.1889 142.02)'
					: 'lightgrey'
			);

		function isSelected(range, value) {
			return range[0] <= value && value < range[1];
		}
	}

	onMount(() => {
		isLoading = true;
		// const cKey = {};

		// sum discount amount by customer
		const discountSums = d3.rollups(
			systemData.archived,
			(D) => D.reduce((sum, d) => (sum += d['Discount Amount']), 0),
			(d) => d.CID
		);

		const binGen = d3.bin().thresholds(5);
		const bins = binGen(discountSums.map((d) => d[1]));

		binnedData = bins.map((b) => ({ value: b.length, x0: b.x0, x1: b.x1 }));

		// systemData.archived.forEach((item) => {
		// 	if (item['Discount Amount (INR)'] <= 100) {
		// 		cKey['0-100'] = cKey['0-100'] ? cKey['0-100'] + 1 : 1;
		// 	} else if (item['Discount Amount (INR)'] <= 200) {
		// 		cKey['101-200'] = cKey['101-200'] ? cKey['101-200'] + 1 : 1;
		// 	} else if (item['Discount Amount (INR)'] <= 300) {
		// 		cKey['201-300'] = cKey['201-300'] ? cKey['201-300'] + 1 : 1;
		// 	} else if (item['Discount Amount (INR)'] <= 400) {
		// 		cKey['301-400'] = cKey['301-400'] ? cKey['301-400'] + 1 : 1;
		// 	} else {
		// 		cKey['401-500'] = cKey['401-500'] ? cKey['401-500'] + 1 : 1;
		// 	}

		// 	// if (!cKey[item['Discount Amount (INR)']]) {
		// 	//     cKey[item['Discount Amount (INR)']] = 1;
		// 	// } else {
		// 	//     cKey[item['Discount Amount (INR)']] = cKey[item['Discount Amount (INR)']] + 1;
		// 	// }
		// });

		drawBarChart();
		isLoading = false;
	});

	function selectMatchType(matchType) {
		systemData.criterions[2].matchType = matchType;
	}

	function isActive(matchType) {
		return systemData.criterions[2].matchType === matchType;
	}
</script>

<div>
	<div class="options">
		<button
			type="button"
			class="option {isActive('ignore') && 'active'}"
			onclick={() => {
				selectMatchType('ignore');
			}}
		>
			X
		</button>
		<button
			type="button"
			class="option {isActive('close') && 'active'}"
			onclick={() => {
				selectMatchType('close');
			}}
		>
			~
		</button>
		<button
			type="button"
			class="option {isActive('exact') && 'active'}"
			onclick={() => {
				selectMatchType('exact');
			}}
		>
			=
		</button>
	</div>

	<div class="slider-container">
		<input
			class="custom-slider"
			type="range"
			min="0"
			max="2"
			step="0.01"
			bind:value={systemData.criterions[2].weight}
			style="width: 100%; margin: 10px 0;"
		/>
	</div>
	<div style="text-align: center; font-size: 14px; font-weight: bold;">
		{systemData.criterions[2].weight.toFixed(2)}
	</div>

	<svg bind:this={svg} style="width: 100%; height: 400px; background-color: #f9f9f9;"></svg>

	<div
		style="text-align: center; font-size: 16px; margin-top: 5px;"
		class="font-bold text-[#098009]"
	>
		{systemData.seedCustomerObj['Discount Amount'].toFixed(2)}
	</div>

	<div class="mt-2 text-center text-sm font-bold">Discount Amount</div>

	{#if isLoading}
		<Throbber class="h-8 w-8 text-info" />
	{/if}
</div>

<style>
	.options {
		display: flex;
		width: 100%;
	}

	.option {
		padding: 5px 10px;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: center;
		color: #fff;
		font-weight: bold;
		background-color: lightgrey;
	}

	.option.active {
		background-color: green;
	}

	svg {
		background-color: #f9f9f9;
	}

	.slider-container {
		margin-top: 20px;
		text-align: center;
	}

	.custom-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 10px;
		background: linear-gradient(to right, #d3d3d3, #d3d3d3);
		border-radius: 5px;
		outline: none;
		cursor: pointer;
		transition: opacity 0.2s ease-in-out;
	}

	.custom-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background-color: #ffffff;
		border: 2px solid #ffffff;
		border-radius: 50%;
		box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		cursor: pointer;
		transition: transform 0.2s ease-in-out;
	}

	.custom-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.custom-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background-color: #ffffff;
		border: 2px solid #ffffff;
		border-radius: 50%;
		box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		cursor: pointer;
	}

	.custom-slider::-ms-thumb {
		width: 20px;
		height: 20px;
		background-color: #ffffff;
		border: 2px solid #ffffff;
		border-radius: 50%;
		box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		cursor: pointer;
	}
</style>
