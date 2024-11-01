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
	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Seed Record</h2>
			<SeedRecord />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Similarity Distribution</h2>
			<SimilarityDistribution />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Similarity Criteria Control</h2>
			<SimilarityCriteriaControl />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Similar Record Distribution</h2>
			<SimilarRecordDistribution />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Like me Donuts</h2>
			<LikemeDonuts />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Ranking Glyph</h2>
			<RankingGlyph />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">History Heatmap</h2>
			<HistoryHeatmap />
		</div>
	</div>

	<div class="card flex-grow bg-base-200">
		<div class="card-body">
			<h2 class="card-title">Similarity Map</h2>
			<SimilarityMap />
		</div>
	</div>
</section>
