<script>
	import { systemData } from '../utils/storage.svelte';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import Throbber from './throbber.svelte';
	import { debounce } from '../utils/event-utils';

	let isLoading = $state(false);

	const data = [
		{ range: 'Male', value: 0 },
		{ range: 'Female', value: 0 },
		{ range: 'Other', value: 0 }
	];

	let svg;
	let weight = $state(0);

	function drawBarChart() {
		const margin = { top: 10, right: 5, bottom: 20, left: 30 };
		const width = svg.clientWidth;
		const height = svg.clientHeight;

		d3.select(svg).selectAll('*').remove();

		const x = d3
			.scaleBand()
			.domain(data.map((d) => d.range))
			.range([margin.left, width - margin.right])
			.padding(0.1);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.value)])
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
			.data(data)
			.join('rect')
			.attr('x', (d) => x(d.range))
			.attr('y', (d) => y(d.value))
			.attr('height', (d) => y(0) - y(d.value))
			.attr('width', x.bandwidth())
			.attr('fill', (d) => getColor(d.range));

		function getColor(gender) {
			const matchType = systemData.criterions[1].matchType;
			if (matchType === 'ignore') return 'lightgrey';

			// exact match
			if (systemData.seedCustomerObj['Gender'] === gender) return 'oklch(70.27% 0.1889 142.02)'; // lighter green

			return 'lightgrey';
		}
	}

	onMount(() => {
		isLoading = true;

		weight = systemData.criterions[1].weight;

		const genderCount = d3.rollup(
			systemData.aggregated,
			(D) => D.length,
			(d) => d['Gender']
		);

		for (const d of data) {
			d.value = genderCount.get(d.range);
		}

		drawBarChart();
		isLoading = false;
	});

	function selectMatchType(matchType) {
		systemData.criterions[1].matchType = matchType;
		drawBarChart();
	}

	function isActive(matchType) {
		return systemData.criterions[1].matchType === matchType;
	}

	/**
	 * writes weight to systemData
	 * paired with debounce to prevent frequent updates
	 */
	function writeWeight() {
		systemData.criterions[1].weight = weight;
	}
</script>

<div class="flex-grow basis-full">
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
		<button type="button" class="option" disabled> ~ </button>
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
			bind:value={weight}
			onchange={debounce(writeWeight)}
			style="width: 100%; margin: 10px 0;"
		/>
	</div>
	<div style="text-align: center; font-size: 14px; font-weight: bold;">
		{weight.toFixed(2)}
	</div>

	<svg bind:this={svg} class="w-full" style="aspect-ratio: 0.8;"></svg>

	<div
		style="text-align: center; font-size: 16px; margin-top: 5px;"
		class="font-bold text-[#098009]"
	>
		{systemData.seedCustomerObj.Gender}
	</div>

	<div class="mt-2 text-center text-sm font-bold">Gender</div>

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
	.option[disabled] {
		cursor: not-allowed;
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
