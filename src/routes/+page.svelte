<script>
	import Logo from '$lib/components/logo.svelte';
	import { csv as loadCSV } from 'd3';

	let ecommerceData = $state([]);
	let filteredData = $state([]);
	let cols = $state([]);
	let page = $state(1);
	let perPage = $state(20);
	let totalPages = $derived(Math.ceil(filteredData.length / perPage));

	let searchCol = $state('');
	let search = $state('');

	async function loadData() {
		ecommerceData = await loadCSV('ecommerce.csv');
		filteredData = ecommerceData;
		cols = ecommerceData.columns;
	}

	function filterData() {
		if (search === '') {
			filteredData = ecommerceData;
			return;
		}

		const re = new RegExp(`.*${search}.*`, 'i');
		filteredData = ecommerceData.filter((d) => d[searchCol].match(re));
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
	<button type="button" class="btn btn-primary text-xl" onclick={loadData}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="size-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
			/>
		</svg>
		load Data</button
	>

	{#if ecommerceData.length > 0}
		<!-- search -->
		<div class="mt-4 flex items-center gap-4">
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

		<!-- table -->
		<div class="mt-4 overflow-x-auto" style="max-height: 30rem;">
			<table class="table table-pin-rows table-pin-cols table-xs">
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
						<tr class="hover">
							<th>{i + 1}</th>
							{#each Object.keys(d) as col}
								<td>{d[col]}</td>
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
				<button class="btn join-item">«</button>
				<select bind:value={page} class="join-item select border-base-200">
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
				<button class="btn join-item">»</button>
			</div>
		</div>
		<!-- actions end -->
	{/if}
</section>
