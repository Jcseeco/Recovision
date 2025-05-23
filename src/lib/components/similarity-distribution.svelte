<script>
	import { systemData } from '../utils/storage.svelte';
	import * as d3 from 'd3';
	import { debounce } from '../utils/event-utils';
	import Throbber from './throbber.svelte';

	let sliderValue = $state(systemData.filteredAggregated.length);
	let selectedOption = $state('N');
	let sliderMax = $state(systemData.aggregated.length);

	let svg, binnedData;
	let isFiltering = $state(false);

	// detect distance sorted change and criterions change
	$effect(() => {
		recalculate(systemData.distanceSorted);
	});

	function recalculate(distanceSorted) {
		const binGen = d3
			.bin()
			.thresholds(4)
			.value((d) => d.score);
		const bins = binGen(distanceSorted);

		binnedData = bins.map((b) => ({ value: b.length, x0: b.x0, x1: b.x1 }));

		drawBarChart();
	}

	function drawBarChart() {
		const margin = { top: 5, right: 5, bottom: 40, left: 40 };
		const width = svg.clientWidth;
		const height = svg.clientHeight;

		d3.select(svg).selectAll('*').remove();

		const x = d3
			.scaleBand()
			// .domain(data.map((d) => d.range))
			.domain(binnedData.map((d) => `< ${d.x1.toFixed(1)}`))
			.range([margin.left, width - margin.right])
			.padding(0.1);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(binnedData, (d) => d.value)])
			.nice()
			.range([height - margin.bottom, margin.top]);

		const xAxis = (g) => {
			g = g
				.attr('transform', `translate(0,${height - margin.bottom})`)
				.call(d3.axisBottom(x).tickSize(0))
				.call((g) => g.selectAll('text').style('font - size', '10px'));

			g.append('text')
				.attr('x', margin.left + 70)
				.attr('y', margin.bottom - 10)
				.text('(most similar)')
				.style('font-size', '16px')
				.style('fill', 'gray');

			g.append('text')
				.attr('x', width / 2 + 20)
				.attr('y', margin.bottom - 10)
				.text('Distance')
				.style('font-size', '16px')
				.style('font-weight', 'bold')
				.style('fill', 'currentColor');

			g.append('text')
				.attr('x', width - 70)
				.attr('y', margin.bottom - 10)
				.text('(least similar)')
				.style('font-size', '16px')
				.style('fill', 'gray');
			return g;
		};

		const yAxis = (g) =>
			g
				.attr('transform', `translate(${margin.left},0)`)
				.call(d3.axisLeft(y).ticks(5).tickSize(0))
				.call((g) => g.selectAll('text').style('font-size', '8px'))
				.call((g) => g.selectAll('text').style('font - size', '8px'))
				.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 0 - margin.left)
				.attr('x', 0 - height / 3)
				.attr('dy', '1em')
				.style('text - anchor', 'middle')
				.text('# of records')
				.style('font-size', '18px')
				.style('font-weight', 'bold')
				.style('fill', 'currentColor');

		d3.select(svg).append('g').call(xAxis);

		d3.select(svg).append('g').call(yAxis);

		d3.select(svg)
			.append('g')
			.selectAll('rect')
			.data(binnedData)
			.join('rect')
			.attr('x', (d) => x(`< ${d.x1.toFixed(1)}`))
			.attr('y', (d) => y(d.value))
			.attr('height', (d) => y(0) - y(d.value))
			.attr('width', x.bandwidth())
			.attr('fill', (d) => (isIncluded(d.x0) ? 'green' : 'lightgrey'));
	}

	function isIncluded(rangeLow) {
		const lastIndex = systemData.filteredAggregated.length;
		if (lastIndex === 0) return false;

		const lastIncludedScore = systemData.distanceSorted[lastIndex - 1].score;

		return rangeLow <= lastIncludedScore;
	}

	/**
	 * filters aggregated data
	 */
	async function filterData() {
		isFiltering = true;

		const includeCount =
			selectedOption === 'N'
				? sliderValue
				: (systemData.aggregated.length * sliderValue) / sliderMax;

		const includedCID = systemData.distanceSorted.slice(0, includeCount).map((d) => d.CID);
		const distinctCID = new Set(includedCID); // effciency purpose in search

		systemData.filteredAggregated = await systemData.aggregated.filter((d) =>
			distinctCID.has(d.CID)
		);
		systemData.filtered = await systemData.archived.filter((d) => distinctCID.has(d.CID));

		isFiltering = false;
	}

	function changeOption(option) {
		if (selectedOption === option) return;

		selectedOption = option;
		sliderMax = selectedOption === 'N' ? systemData.aggregated.length : 100;
		sliderValue =
			selectedOption === 'N'
				? systemData.filteredAggregated.length
				: Math.floor((systemData.filteredAggregated.length / systemData.aggregated.length) * 100);
	}
</script>

<div class="relative w-full">
	<div class="options">
		<button
			type="button"
			class="option"
			onclick={() => {
				changeOption('N');
			}}
			style="background-color: {selectedOption === 'N' ? 'green' : 'lightgrey'}"
		>
			N
		</button>
		<button
			type="button"
			class="option"
			onclick={() => {
				changeOption('%');
			}}
			style="background-color: {selectedOption === '%' ? 'green' : 'lightgrey'}"
		>
			%
		</button>
	</div>

	<div class="flex flex-col gap-2 rounded-b-md bg-base-100 px-3 py-1">
		<div class="flex justify-between">
			<span>All Archived Records</span>
			<span>{systemData.aggregated.length}</span>
		</div>

		<div class="flex justify-between">
			<span>Filtered Out</span>
			<span>{systemData.aggregated.length - systemData.filteredAggregated.length}</span>
		</div>

		<div class="flex justify-between">
			<span class="font-bold">Remainings Ranked by Similarity</span>
			<span>{systemData.filteredAggregated.length}</span>
		</div>
	</div>

	<div class="slider-container">
		<div class="slider-info">
			<span class="slider-similar">{sliderValue}{selectedOption === '%' ? '%' : ''} similar</span>
			<span class="slider-others"
				>{sliderMax - sliderValue}{selectedOption === '%' ? '%' : ''} others</span
			>
		</div>
		<input
			type="range"
			min="0"
			max={sliderMax}
			bind:value={sliderValue}
			onchange={filterData}
			style="width: 100%; margin-bottom: 5px;"
			class="styled-slider"
		/>
	</div>

	<svg bind:this={svg} class="w-full" style="aspect-ratio: 1.2;"></svg>

	{#if isFiltering}
		<div
			class="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center bg-slate-900 bg-opacity-30"
		>
			<div class="text-2xl font-bold text-info">Filtering Data...</div>
			<Throbber class="h-32 w-32 text-info" />
		</div>
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
	}

	.slider-container {
		width: 100%;
		max-width: 600px;
		margin: 20px auto;
		font-family: Arial, sans-serif;
	}

	.slider-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
		font-size: 16px;
		color: #6b7280;
		font-weight: bold;
	}

	.slider-similar {
		color: #10b981;
	}

	.slider-others {
		color: #6b7280;
	}

	.styled-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 12px;

		/* background: linear-gradient(to right, #10b981 12%, #e5e7eb 12%);  */
		border-radius: 6px;
		outline: none;
		position: relative;
	}

	.styled-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		background: #ffffff;
		border: 4px solid #10b981;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease;
	}

	.styled-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}
</style>
