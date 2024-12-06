<script>
	import { axisTop, rollups, scaleBand, scaleOrdinal, select } from 'd3';
	import { systemData } from '../utils/storage.svelte';

	let rankSvg, rankedData, axisX, legend;
	/** @type {typeof systemData.distanceSorted} */
	let selectedData = [];
	let viewH = 480,
		viewW = 480;
	const MT = 70,
		MB = 30;
	let scaleX = scaleBand().range([0, viewW]).padding(0.2);

	const colors = [
		{ label: 'exact', color: 'oklch(70.27% 0.1889 142.02)' },
		{ label: 'within', color: 'oklch(56.26% 0.1653 142.02)' },
		{ label: 'out', color: 'oklch(68.85% 0.0082 142.02)' },
		{ label: 'ignored', color: 'lightgray' }
	];
	const Color = scaleOrdinal()
		.domain(colors.map((c) => c.label))
		.range(colors.map((c) => c.color));

	$effect(() => {
		selectedData = systemData.distanceSorted.slice(0, systemData.filteredAggregated.length);

		rankSvg = select('#rank');
		udpateAxis();
		updateLegend();
		// rankData();
		drawBars();
	});

	function udpateAxis() {
		if (axisX === undefined)
			axisX = rankSvg.append('g').attr('class', 'axisX').attr('transform', `translate(0,${MT})`);

		scaleX.domain(systemData.criterions.map((c) => c.name));
		axisX.call(axisTop(scaleX));
		axisX.selectAll('path,line').remove();
	}

	function updateLegend() {
		if (legend === undefined)
			legend = rankSvg
				.append('g')
				.attr('class', 'legend')
				.attr('transform', `translate(0,${MT - 40})`);

		const l = legend
			.selectAll('g')
			.data(colors, (d) => d.label)
			.join('g')
			.attr('transform', (_, i) => `translate(${i * (viewW / 4) + 10},0)`);

		l.append('rect')
			.attr('width', 15)
			.attr('height', 15)
			.attr('x', 0)
			.attr('y', -12)
			.attr('fill', (d) => d.color);

		l.append('text')
			.text((d) => d.label)
			.attr('fill', 'currentColor')
			.attr('x', 20)
			.attr('y', 0);
	}

	function drawBars() {
		const scaleBar = scaleBand(
			Array.from({ length: selectedData.length }, (_, i) => i),
			[MT, viewH - MB]
		);

		rankSvg
			.selectAll('rect.bars')
			.data(systemData.criterions)
			.join('rect')
			.attr('class', 'bars')
			.attr('fill', 'lightgray')
			.attr('x', (d) => scaleX(d.name))
			.attr('y', MT)
			.attr('width', scaleX.bandwidth())
			.attr('height', viewH - MT - MB);

		// group containing all bars of each customer
		const records = rankSvg
			.selectAll('g.records')
			.data(selectedData, (d) => d.CID)
			.join('g')
			.attr('class', 'records')
			.attr('transform', (_, i) => `translate(0,${scaleBar(i)})`);

		// bars for each criteria
		records
			.selectAll('rect')
			.data((d) => [d['Age Group Match'], d['Gender Match'], d['Discount Amount Match']])
			.join('rect')
			.attr('x', (_, i) => scaleX(systemData.criterions[i].name))
			// .attr('y', (_, i) => scaleY(Math.ceil((i + 1) / 3)))
			.attr('width', scaleX.bandwidth())
			.attr('height', scaleBar.bandwidth())
			.attr('fill', (d) => Color(d));
	}
</script>

<svg id="rank" width={viewW} height={viewH} viewbox="0 0 {viewW} {viewH}" />
