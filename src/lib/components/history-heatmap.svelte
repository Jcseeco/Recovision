<script>
	import { axisLeft, axisTop, scaleBand, select, csv, union, rollup, scaleSequential } from 'd3';
	import { systemData } from '../utils/storage.svelte';

	const cellW = 40,
		cellH = 25,
		// margins
		MB = 20,
		ML = 90,
		MR = 60,
		MT = 20;

	let yAttr = $state('Product Category');
	let drawH = $state(400);
	let drawW = $state(600);
	let chartH = $derived(drawH + MT + MB);
	let chartW = $derived(drawW + MR + ML);

	let heatSvg, tooltip, axisX, selectedData, filteredData, scaleX, axisY, scaleY, dataset, yBand;
	let scaleHeat = scaleSequential([0, 10], ['white', 'green']);

	$effect(async () => {
		// TODO replace with systemData.selected
		selectedData = await systemData.archived;
		selectedData = selectedData.slice(0, 1000);
		initAxis();

		calcTimeScale();
		calcYScale();
		drawCell();
	});

	$effect(() => {
		heatSvg = select('#heat');
		tooltip = select('#tooltip');
		drawLengend();
	});

	function initAxis() {
		axisX = heatSvg.append('g').attr('transform', `translate(0,${MT})`);
		axisY = heatSvg.append('g').attr('transform', `translate(${ML},0)`);
	}

	function calcYScale() {
		yBand = Array.from(union(selectedData.map((d) => d[yAttr])));
		const yLen = yBand.length;

		drawH = yLen * cellH;
		// update scaleY
		scaleY = scaleBand(yBand, [MT, chartH - MB]);
		// update axis
		axisY.call(axisLeft(scaleY));
	}

	/**
	 * draw color scale legend
	 */
	function drawLengend() {
		heatSvg
			.append('rect')
			.attr('x', chartW - 20)
			.attr('y', chartH - 120)
			.attr('width', 15)
			.attr('height', 100)
			.attr('fill', "url('#heatmap_colorGradient')");

		const legendLabels = heatSvg
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${chartW - 45},${chartH - 115})`);

		legendLabels
			.append('text')
			.text('10%')
			.attr('font-size', '.75rem')
			.attr('fill', 'currentColor');
		legendLabels
			.append('text')
			.text('0%')
			.attr('font-size', '.75rem')
			.attr('y', 100)
			.attr('fill', 'currentColor');
	}

	function calcTimeScale() {
		const monthBand = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];

		// udpate draw width
		drawW = monthBand.length * cellW;
		// update scaleX
		scaleX = scaleBand(monthBand, [ML, chartW - MR]);

		axisX.call(axisTop(scaleX));
	}

	/**
	 * @returns {{month:string,value:number}[]}
	 */
	function calcHeatmapData() {
		const grouped = rollup(selectedData, groupByMonth, (d) => d[yAttr]);

		// flatten
		let heatmapData = [];
		for (const yVal of grouped.keys().toArray()) {
			for (const month in grouped.get(yVal)) {
				let cellD = { month, value: grouped.get(yVal)[month] };
				cellD[yAttr] = yVal;
				heatmapData.push(cellD);
			}
		}

		return heatmapData;
	}

	/**
	 * counts the percentage of purchases of each month
	 * @param {obj[]} data array of purchases
	 * @returns {obj} short month name: percentage
	 */
	function groupByMonth(data) {
		// count monthly purchases
		let counts = {};
		for (const d of data) {
			const month = d['Purchase Date'].toLocaleString('default', { month: 'short' });

			if (month in counts) counts[month]++;
			else counts[month] = 1;
		}

		// replace with percentage
		const total = Object.values(counts).reduce((sum, count) => (sum += count), 0);
		for (const month in counts) {
			counts[month] = (counts[month] / total) * 100;
		}

		return counts;
	}

	function drawCell() {
		const data = calcHeatmapData();

		heatSvg
			.selectAll('rect')
			.data(data)
			.join('rect')
			.attr('x', (d) => scaleX(d.month))
			.attr('y', (d) => scaleY(d[yAttr]))
			.attr('width', scaleX.bandwidth())
			.attr('height', scaleY.bandwidth())
			.attr('stroke', 'black')
			.attr('fill', (d) => scaleHeat(d.value))
			.on('mousemove', showTooltip)
			.on('mouseleave', hideTooltip);
	}

	function showTooltip(ev, d) {
		tooltip
			.text(`${d.value.toFixed(2)}%`)
			.style('display', 'block')
			.style('top', `${ev.clientY - 5}px`)
			.style('left', `${ev.clientX + 5}px`)
			.style('translate', `0 -100%`);
	}

	function hideTooltip() {
		tooltip.style('display', 'none');
	}
</script>

<div class="chart-container overflow-auto p-3" style="max-width: 800px;max-height:400px">
	<svg id="heat" width={chartW} height={chartH} viewbox="0 0 {chartW} {chartH}"
		>\
		<defs>
			<linearGradient id="heatmap_colorGradient" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="green" />
				<stop offset="100%" stop-color="white" />
			</linearGradient>
		</defs>
	</svg>
	<div
		id="tooltip"
		class="fixed hidden rounded-md bg-base-100 p-3 text-base-content shadow-md"
	></div>
</div>
