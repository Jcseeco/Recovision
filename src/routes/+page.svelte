<script>
	import Logo from '$lib/components/logo.svelte';
	import { csv as loadCSV, sum as d3sum, rollups } from 'd3';
	import { systemData } from '../lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import { calcSimilarities } from '../lib/utils/score';

	let filteredData = $state([]);
	let cols = $state([]);
	let page = $state(1);
	let perPage = $state(20);
	let totalPages = $derived(Math.ceil(filteredData.length / perPage));

	let searchCol = $state('');
	let search = $state('');
	let isLoading = $state(false);

	onMount(() => {
		loadData();
	});

	async function loadData() {
		isLoading = true;
		systemData.archived = await loadCSV('ecommerce_usa_v2.csv', parseRow);
		systemData.aggregated = aggregate(systemData.archived);
		isLoading = false;
		// these are used as table data
		filteredData = systemData.aggregated;
		cols = Object.keys(systemData.aggregated[0]);
	}

	function parseRow(row) {
		// let [day, month, yearTime] = row['Purchase Date'].split('/');
		row['Purchase Date'] = new Date(row['Purchase Date']);
		row['Discount Amount'] = +row['Discount Amount'];
		row['Gross Amount'] = +row['Gross Amount'];
		row['Net Amount'] = +row['Net Amount'];

		return row;
	}

	/**
	 * aggregates data for distinct customers
	 */
	function aggregate(dataset) {
		return rollups(
			dataset,
			(D) => ({
				CID: D[0].CID,
				'Age Group': D[0]['Age Group'],
				Gender: D[0]['Gender'],
				'Discount Amount': d3sum(D, (d) => d['Discount Amount'])
			}),
			(d) => d.CID
		).map(([CID, d]) => d);
	}

	function filterData() {
		if (search === '') {
			filteredData = systemData.aggregated;
			return;
		}

		const re = new RegExp(`.*${search}.*`, 'i');
		filteredData = systemData.aggregated.filter((d) => d[searchCol].match(re));
	}

	function selectSeed(CID, i) {
		systemData.seedCustomer = CID;
		const seedI = perPage * (page - 1) + i;

		systemData.seedCustomerObj = systemData.aggregated[seedI];
		systemData.distanceSorted = calcSimilarities(
			systemData.seedCustomerObj,
			systemData.aggregated,
			systemData.criterions
		);
	}

	function deselectSeed() {
		systemData.seedCustomer = '';
		systemData.seedCustomerObj = { 'Age Group': '', Gender: '', 'Discount Amount': 0 };
	}
</script>

<!-- hero -->
<div
	class="hero -ml-6 -mr-6 lg:-mt-8"
	style="background-image: url(cubes.png);background-size:auto;width:auto"
>
	<div class="hero-overlay bg-opacity-15"></div>
	<div class="hero-content text-center shadow-inner">
		<div class="max-w-md">
			<h1 class="mb-5 flex items-end gap-3 text-5xl font-bold">
				<Logo class="h-10 w-10" /> RecoVision
			</h1>
			<p class="mb-5">Let's start with loading some data!</p>
		</div>
	</div>
</div>
<!-- hero end -->

<!-- data  -->
<section class="py-6">
	{#if systemData.archived.length > 0}
		<!-- search -->
		<div class="mt-4 flex flex-wrap items-center gap-4">
			<select class="select border-base-200" bind:value={searchCol}>
				<option value="" disabled>select col</option>
				{#each cols as col}
					<option value={col}>{col}</option>
				{/each}
			</select>

			<div class="join">
				<input
					type="text"
					class="input join-item border-base-200"
					placeholder="search..."
					bind:value={search}
					onchange={filterData}
					disabled={searchCol === ''}
				/>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button
					type="button"
					class="btn join-item"
					onclick={filterData}
					disabled={searchCol === ''}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
						/>
					</svg>
				</button>
			</div>
		</div>
		<div class="my-3 flex items-center gap-2">
			Seed Cutomer ID: <span class="font-bold"> {systemData.seedCustomer}</span>
			<button
				type="button"
				aria-label="deselect seeed"
				onclick={deselectSeed}
				class="btn btn-outline btn-error btn-xs"
				title="Deselect Customer"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-4"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>

			{#if systemData.seedCustomer}
				<span class="text-success"
					>Great! Now go to <a href="/similars" class="underline">Review Similar Records</a> to select
					records to inlcude for the calculations
				</span>
			{/if}
		</div>

		<!-- table -->
		<div class="mt-4 overflow-x-auto" style="max-height: 30rem;">
			<table class="table table-pin-rows table-xs">
				<thead>
					<tr>
						<th></th>
						{#each cols as col}
							<th>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each filteredData.slice((page - 1) * perPage, page * perPage) as d, i}
						<tr
							class="hover cursor-pointer {systemData.seedCustomer === d.CID && 'is-seed'}"
							title="select as seed"
							onclick={() => {
								selectSeed(d.CID, i);
							}}
						>
							<th>{i + 1}</th>
							{#each Object.keys(d) as col}
								<td>{typeof d[col] === 'number' ? d[col].toFixed(2) : d[col]}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- table end -->

		<!-- actions -->
		<div class="mt-3 flex items-center gap-6">
			<label>
				<select class="select" bind:value={perPage}>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={30}>30</option>
					<option value={40}>40</option>
				</select>
				per page
			</label>

			<div class="join">
				<button
					class="btn join-item"
					onclick={() => {
						page--;
					}}>«</button
				>
				<select bind:value={page} class="join-item select border-base-200">
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
				<button
					class="btn join-item"
					onclick={() => {
						page++;
					}}>»</button
				>
			</div>
		</div>
		<!-- actions end -->
	{/if}
</section>

<style>
	.is-seed,
	.is-seed:hover {
		background-color: oklch(var(--n)) !important;
		color: oklch(var(--nc)) !important;
	}
</style>
