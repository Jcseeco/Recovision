<script>
	import AgeChart from './criteria-control-age.svelte';
	import GenderChart from './criteria-control-gender.svelte';
	import DiscountAmountChart from './criteria-control-discount-amount.svelte';
	import { calcSimilarities } from '../utils/score';
	import { systemData } from '../utils/storage.svelte';

	$effect(() => {
		systemData.distanceSorted = calcSimilarities(
			systemData.seedCustomerObj,
			systemData.aggregated,
			systemData.criterions
		);
	});
</script>

<div class="flex justify-between">
	<AgeChart />
	<GenderChart />
	<DiscountAmountChart />
</div>

<style>
</style>
