<script>
	import SeedRecord from '$lib/components/seed-record.svelte';
	import SimilarityCriteriaControl from '$lib/components/similarity-criteria-control.svelte';
	import SimilarRecordDistribution from '$lib/components/similar-record-distribution.svelte';
	import SimilarityDistribution from '$lib/components/similarity-distribution.svelte';
	import LikemeDonuts from '../../lib/components/likeme-donuts.svelte';
	import RankingGlyph from '../../lib/components/ranking-glyph.svelte';
	import HistoryHeatmap from '../../lib/components/history-heatmap.svelte';
	import SimilarityMap from '../../lib/components/similarity-map.svelte';

	/** @type {import('./$types').PageData} */
	// export let data;
</script>

<section class="flex flex-wrap gap-4">
	<div class="card flex-grow" style="max-width: 600px;">
		<SeedRecord />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm" style="max-width: 700px;">
		<h2 class="card-title mb-3">Similarity Criteria Control</h2>
		<SimilarityCriteriaControl />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm" style="max-width: 400px;">
		<h2 class="card-title mb-3">Similarity Distribution</h2>
		<SimilarityDistribution />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm">
		<h2 class="card-title mb-3">Similar Record Distribution</h2>
		<SimilarRecordDistribution />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm" style="max-width: 600px;">
		<h2 class="card-title mb-3">Like me Donuts</h2>
		<LikemeDonuts />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm" style="max-width: 500px;">
		<h2 class="card-title">Ranking Glyph</h2>
		<RankingGlyph />
	</div>

	<div class="card flex-grow bg-base-200 px-4 py-3 shadow-sm" style="max-width: 600px;">
		<h2 class="card-title mb-3">History Heatmap</h2>
		<HistoryHeatmap />
	</div>

	<div
		class="card flex-grow bg-base-200 px-4 py-3 shadow-sm"
		style="max-width: 700px;min-width:500px"
	>
		<h2 class="card-title mb-3">Similarity Map</h2>
		<SimilarityMap />
	</div>
</section>
