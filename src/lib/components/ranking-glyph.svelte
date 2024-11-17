<script>
	import { axisBottom, scaleBand, scaleLinear, scaleOrdinal, select } from 'd3';

	let rankSvg, filteredSimilarity;
	let criterias = [1, 2, 3, 4, 5, 6];
	const filteredLen = 800; // length of filtered selection of data
	const Color = scaleOrdinal()
		.domain(['exact', 'within', 'out', 'null'])
		.range(['#098009', '#458045', 'gray', 'lightgray']);

	const scaleX = scaleBand().domain([1, 2, 0]).range([0, 600]).padding(0.2);
	const scaleY = scaleBand([1, 2], [0, 600]).padding(0.2);
	let scaleBar;

	$effect(() => {
		rankSvg = select('#rank');
		populate();
		drawBars();
	});

	/**
	 * helper, remove after data loading process has finialized
	 */
	function populate() {
		filteredSimilarity = [
			{
				CID: '12345',
				similarity: ['null', 'within', 'exact', 'within', 'null', 'within']
			},
			{
				CID: '12346',
				similarity: ['null', 'exact', 'out', 'exact', 'null', 'out']
			},
			{
				CID: '12347',
				similarity: ['null', 'exact', 'exact', 'out', 'null', 'out']
			}
		];
		const len = filteredSimilarity.length;

		scaleBar = scaleBand(
			Array.from({ length: len }, (_, i) => i),
			[0, scaleY.bandwidth()]
		);
	}

	function drawBars() {
		rankSvg
			.selectAll('rect.bars')
			.data(criterias)
			.join('rect')
			.attr('class', 'bars')
			.attr('fill', 'lightgray')
			.attr('x', (d) => scaleX(d % 3))
			.attr('y', (d) => scaleY(Math.ceil(d / 3)))
			.attr('width', scaleX.bandwidth())
			.attr('height', scaleY.bandwidth());

		const records = rankSvg
			.selectAll('g.records')
			.data(filteredSimilarity, (d) => d.CID)
			.join('g')
			.attr('class', 'records')
			.attr('transform', (_, i) => `translate(0,${scaleBar(i)})`);

		records
			.selectAll('rect')
			.data((d) => d.similarity)
			.join('rect')
			.attr('x', (_, i) => scaleX((i + 1) % 3))
			.attr('y', (_, i) => scaleY(Math.ceil((i + 1) / 3)))
			.attr('width', scaleX.bandwidth())
			.attr('height', scaleBar.bandwidth())
			.attr('fill', (d) => Color(d));
	}
</script>

<div class="chart-container bg-white" style="width: 600px;">
	<svg id="rank" width="100%" viewbox="0 0 600 600" />
</div>
