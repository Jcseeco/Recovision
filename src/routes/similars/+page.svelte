<script>
	import SeedRecord from '$lib/components/seed-record.svelte';
	import SimilarityCriteriaControl from '$lib/components/similarity-criteria-control.svelte';
	import SimilarRecordDistribution from '$lib/components/similar-record-distribution.svelte';
	import SimilarityDistribution from '$lib/components/similarity-distribution.svelte';

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
</section>
