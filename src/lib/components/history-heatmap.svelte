<script>
	import { axisTop, scaleBand, select } from 'd3';

	const cellW = 60,
		cellH = 20,
		// margins
		MB = 20,
		ML = 30,
		MR = 20,
		MT = 20;

	let yAttr = $state('Gender');
	let drawH = $state(400);
	let drawW = $state(600);
	let chartH = $derived(drawH + MT + MB);
	let chartW = $derived(drawW + MR + ML);

	let heatSvg, axisX, filteredData, scaleX;

	$effect(() => {
		heatSvg = select('#heat');
		initAxis();

		calcTimeScale();
		calcYScale();
	});

	function calcMapDimension() {}

	function initAxis() {
		axisX = heatSvg.append('g').attr('transform', `translate(0,${MT})`);
	}

	function calcYScale() {
		// TODO update with dataset
		const yLen = 2;

		drawH = yLen * cellH;
	}

	function calcTimeScale() {
		// TODO calculate min, max date with filtered dataset
		const minDate = new Date(2020, 0, 1);
		const maxDate = new Date(2024, 11, 30);
		const minYear = minDate.getFullYear();
		const yearSpan = maxDate.getFullYear() - minDate.getFullYear() + 1;
		const timeBand = Array.from({ length: yearSpan * 2 }, (_, i) =>
			i % 2 === 0 ? `${minYear + Math.floor(i / 2)}_Top` : `${minYear + Math.floor(i / 2)}_Bot`
		);

		// udpate draw width
		drawW = timeBand.length * cellW;
		// update scaleX
		scaleX = scaleBand(timeBand, [ML, chartW - MR]);

		axisX.call(axisTop(scaleX));
	}

	function populate() {
		filteredData = [
			{
				cat: 'Male',
				timeFrame: '2021_Top'
			}
		];
	}
</script>

<div class="chart-container overflow-auto bg-white p-3" style="max-width: 600px;">
	<svg id="heat" width={chartW} viewbox="0 0 {chartW} {chartH}" />
</div>
