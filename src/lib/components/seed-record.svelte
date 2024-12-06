<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { systemData } from '../utils/storage.svelte';

	let { mode = 'record' } = $props();
	const refTypes = ['All', 'Similar'];
	let refType = $state('All');

	const showTypes = ['same', 'diff'];
	const showLabels = {
		same: 'Activities of those who are ',
		diff: 'Activities that distinguish ref from '
	};
	let showType = $state('same');

	const saleTypes = ['High', 'Med', 'Low'];
	const saleLabels = { High: 'High Valued', Med: 'Medium Valued', Low: 'Low Valued' };
	let saleType = $state('High');

	let outDistSim = $state({ High: '32', Med: '40', Low: '28' });
	let outDistArc = $state({ High: '32', Med: '28', Low: '40' });
	let outDistChange = $state({ High: 0, Med: 0, Low: 0 });

	let selectedExpenditures = $state([]);
	let totalEstExpenditure = $state(0);

	let aggJson = $state({});
	let custTypeObj = $state([]);

	let filteredAggData = [];

	function updateExpenditure() {
		totalEstExpenditure = selectedExpenditures.reduce((acc, value) => acc + value, 0);
		// console.log(totalEstExpenditure);
		let exp = totalEstExpenditure;
		if (exp == 0) {
			saleTypes.forEach((r, i) => {
				outDistChange[r] = 0;
			});
			return;
		}

		if (exp < 15000) {
			outDistChange['High'] = -Math.floor(Math.random() * 10);
			outDistChange['Med'] = -Math.floor(Math.random() * 10);
			outDistChange['Low'] = Math.floor(Math.random() * 10);
		} else if (exp >= 15000 && exp < 20000) {
			outDistChange['High'] =
				Math.random() > 0.5 || saleType == 'High'
					? Math.floor(Math.random() * 10)
					: -Math.floor(Math.random() * 10);
			outDistChange['Med'] = Math.floor(Math.random() * 10);
			outDistChange['Low'] = -Math.floor(Math.random() * 10);
		} else {
			outDistChange['High'] = Math.floor(Math.random() * 10);
			outDistChange['Med'] =
				Math.random() > 0.5 ? Math.floor(Math.random() * 10) : -Math.floor(Math.random() * 10);
			outDistChange['Low'] = -Math.floor(Math.random() * 10);
		}
	}

	// const byCID = {};
	// const byGenderAgeGroup = {};
	// let aggData = {};
	function initializeData() {
		// if (mode == 'review') {
		if (Object.keys(aggJson).length == 0) {
			d3.json('ecommerce_usa_agg.json').then((data) => {
				// console.log(data['100754']);
				// systemData.update((current) => ({
				// 	...current,
				// 	selectedSeed: data['100754'],
				// 	archived: data,
				// 	filtered: data,
				// 	seedCustomer: '100754'
				// }));
				aggJson = data;
				// systemData = {...systemData, selected: data["100754"], archived: data, filtered: data}
				// console.log(d3.rollup(systemData.archived.flat(),v=>v,v=>v.category))
				// console.log(d3.group(systemData.archived.flat(),d=>d.category))
			});
		}

		if (custTypeObj.length == 0) {
			d3.csv('ecommerce_usa_customer_type.csv').then((data) => {
				// systemData.update((current) => ({
				// 	...current,
				// 	custType: data
				// }));
				// console.log(data);

				custTypeObj = data;

				let allCount = d3.rollup(
					data,
					(v) => (v.length / data.length) * 100,
					(d) => d['Customer Type']
				);
				allCount.forEach((v, k) => {
					outDistArc[k] = v.toFixed(0);
				});
				// console.log(allCount,outDistArc);
				// outDistArc = allCount;
				// console.log(outDistArc)
				// console.log(systemData.custType);
			});
		}
		// }
	}

	function aggTransactions(data, custType) {
		if (!data || !custType) return [];

		let dataFilt = custType
			.filter((d) => data[d['CID']])
			.filter((d) =>
				showType == 'same' ? d['Customer Type'] === saleType : d['Customer Type'] !== saleType
			)
			.map((d) => data[d['CID']]);

		// console.log(dataFilt);
		if (refType != 'All') dataFilt = dataFilt.slice(0, 100);
		// list the transactions by category
		let ret = [];
		let transCat = Array.from(
			d3.group(dataFilt.flat(), (v) => v.category),
			([category, transactions]) => {
				let transc = transactions
					.flatMap((d) => d.transactions)
					.flatMap((d) =>
						Object.entries(d).map(([year, value]) => ({
							year: +year,
							value: +value
						}))
					);
				// console.log(transc,d3.group(transc,d=>d.year))
				let avg = Array.from(
					d3.group(transc, (d) => d.year),
					([year, values]) => ({
						year,
						average: d3.mean(values, (d) => d.value)
					})
				);

				let transObj = {};
				avg.forEach((row, i) => {
					transObj[row.year + 3] = row.average;
				});
				ret.push({ category: category, transactions: transObj });
			}
		);
		// console.log(ret);
		return ret;
	}

	function render_data(data1, data2, years1, years2) {
		// console.log(data1.flatMap((d) => d.transactions));

		const maxTransaction1 = d3.max(data1.flatMap((d) => Object.values(d.transactions)));
		const minTransaction1 = d3.min(data1.flatMap((d) => Object.values(d.transactions)));
		const sizeScale1 = d3.scaleLinear().domain([minTransaction1, maxTransaction1]).range([5, 20]);

		// Scaling for table 2 (2025–2027)
		const maxTransaction2 = d3.max(data2.flatMap((d) => Object.values(d.transactions)));
		const minTransaction2 = d3.min(data2.flatMap((d) => Object.values(d.transactions)));
		const colorScale2 = d3
			.scaleLinear()
			.domain([minTransaction2, maxTransaction2])
			.range(['white', 'green']);

		// Create the legend
		const legend = d3.select('#legend');

		// Squares legend for the first table
		const squareLegend = d3.select('#square-legend');
		squareLegend.selectAll('div').remove(); // Remove previous squares
		squareLegend.selectAll('span').remove(); // Remove previous labels
		squareLegend.append('div').attr('class', 'legend-item');
		squareLegend.append('span').text(`$${minTransaction1.toFixed(0)}`);
		squareLegend
			.append('div')
			.style('display', 'flex')
			.style('align-items', 'center')
			.style('margin', '0 10px')
			.selectAll('div')
			.data([minTransaction1, (minTransaction1 + maxTransaction1) / 2, maxTransaction1])
			.enter()
			.append('div')
			.style('width', (d) => `${sizeScale1(d)}px`)
			.style('height', (d) => `${sizeScale1(d)}px`)
			.style('background-color', 'steelblue')
			.style('margin', '0 5px');
		squareLegend.append('span').text(`$${maxTransaction1.toFixed(0)}`);

		if (years2.length > 0) {
			// Gradient legend for the second table
			const gradientLegend = d3.select('#gradient-legend');
			gradientLegend.selectAll('div').remove(); // Remove previous gradient
			gradientLegend.selectAll('span').remove(); // Remove previous labels
			gradientLegend.append('div').attr('class', 'legend-item').style('margin-top', '10px');
			gradientLegend.append('span').text(`$${minTransaction2.toFixed(0)}`);
			gradientLegend
				.append('div')
				.style('width', '100px')
				.style('height', '20px')
				.style('background', 'linear-gradient(to right, white, green)')
				.style('margin', '0 5px');
			gradientLegend.append('span').text(`$${maxTransaction2.toFixed(0)}`);

			const similarLegend = d3.select('#similar-legend');
			similarLegend
				.append('div')
				.style('width', '10px')
				.style('height', '10px')
				.style('background-color', 'steelblue')
				.style('margin', '0 5px');
		}

		// Create the table
		const table = d3.select('#table');
		table.html('');

		// Add header
		const header = table.append('thead').append('tr');
		header.append('th').text('Product Category');
		years1.forEach((year) => header.append('th').text(year).style('text-align', 'center'));

		if (years2.length > 0) {
			// Recommendation mode
			header.append('th').html("<div class='dashed-line'></div>"); // Separator
			years2.forEach((year) => header.append('th').text(year).style('text-align', 'center'));
		}

		// Add rows
		const body = table.append('tbody');

		let availableCats = data1.map((d) => d.category);
		// console.log(availableCats);

		data1.forEach((row, i) => {
			if (row.category == 'Discount Amount (INR)') return;
			const tr = body.append('tr');
			tr.append('td').text(row.category);

			// Table 1 (Scaled Squares)
			years1.forEach((year) => {
				const value = row.transactions[year];
				tr.append('td')
					.append('div')
					.style('width', `${sizeScale1(value)}px`)
					.style('height', `${sizeScale1(value)}px`)
					.style('background-color', 'steelblue')
					.style('margin', 'auto');
			});

			if (years2.length > 0) {
				// Separator
				tr.append('td').html("<div class='dashed-line'></div>");

				let data2Vals = [];
				years2.forEach((year) => {
					data2.forEach((d) => {
						// console.log((d.category in availableCats),d.category,availableCats)
						if (
							d.transactions[year] &&
							availableCats.includes(d.category) &&
							d.category != 'Discount Amount (INR)'
						)
							data2Vals.push(d.transactions[year]);
					});
				});

				const maxTransaction3 = d3.max(data2Vals);
				const minTransaction3 = d3.min(data2Vals);
				const sizeScale3 = d3
					.scaleLinear()
					.domain([minTransaction3, maxTransaction3])
					.range([5, 20]);
				// console.log(data2.flatMap((d) => Object.values(d.transactions)))
				// console.log(data2Vals)
				// Table 2 (Gradient Colors)
				years2.forEach((year) => {
					let value = 0;
					data2.forEach((d2, i2) => {
						if (d2.category == row.category) {
							value = d2.transactions[year];
						}
					});
					if (row.category === 'Discount Amount (INR)') value = -1;
					// const value = data2[i].transactions[year];
					tr.append('td')
						.attr('class', 'avgdata')
						.attr('data', value)
						.style('background-color', colorScale2(value))
						.on('click', function (event, d) {
							if (row.category === 'Discount Amount (INR)') {
								// d3.select(this).attr('data',"-1");
								return;
							}
							// console.log(event, d);
							const cell = d3.select(this);
							if (cell.classed('selected')) {
								cell.classed('selected', false);
								cell.select('.square').remove();
								selectedExpenditures = selectedExpenditures.filter((v) => v != value);
							} else {
								cell.classed('selected', true);
								cell
									.append('div')
									.style('background-color', 'steelblue')
									// .data(value)
									.attr('class', 'square mx-auto my-auto')

									.style('width', `${sizeScale1(value)}px`)
									.style('height', `${sizeScale1(value)}px`);
								// .attr('data', value);
								selectedExpenditures.push(value);
								// .style("background-color","gray")
							}
							updateExpenditure();
						});
				});
			}
		});
		if (years2.length > 0) {
			table
				.selectAll('tr') // Select all rows
				.select(`td:nth-child(${years1.length + 1})`) // Select the third cell of each row ${data1.length+2}
				.style('border-right', '2px dashed gray');

			table
				.selectAll('tr') // Select all rows
				.select(`th:nth-child(${years1.length + 1})`) // Select the third cell of each row ${data1.length+2}
				.style('border-right', '2px dashed gray');

			let outcomeWidth = d3.select('#saletype-outcome').node().getBoundingClientRect().width;
			let outcomeBarScale = d3
				.scaleLinear()
				.domain([0, 100])
				.range([0, outcomeWidth / 2]);
			saleTypes.forEach((row, i) => {
				// console.log(d3.select(`#${row}-similar-bar`), outcomeBarScale(outDistSim[row]));
				d3.select(`#${row}-similar-bar`).style('width', `${outcomeBarScale(outDistSim[row])}px`);

				d3.select(`#${row}-all-bar`).style('width', `${outcomeBarScale(outDistArc[row])}px`);
			});
		}
	}
	// Data for 2019–2024 (scaled squares)
	const data1 = [
		{
			category: 'Electronics',
			transactions: { 2019: 1200, 2020: 800, 2021: 1500, 2022: 2000, 2023: 1100, 2024: 1800 }
		},
		{
			category: 'Beauty & Health',
			transactions: { 2019: 1200, 2020: 800, 2021: 1500, 2022: 2000, 2023: 1100, 2024: 1800 }
		},
		{
			category: 'Books',
			transactions: { 2019: 1200, 2020: 800, 2021: 1500, 2022: 2000, 2023: 1100, 2024: 1800 }
		},
		{
			category: 'Clothing',
			transactions: { 2019: 700, 2020: 950, 2021: 1100, 2022: 900, 2023: 1300, 2024: 1200 }
		},
		{
			category: 'Home & Kitchen',
			transactions: { 2019: 700, 2020: 950, 2021: 1100, 2022: 900, 2023: 1300, 2024: 1200 }
		},
		{
			category: 'Sports & Fitness',
			transactions: { 2019: 300, 2020: 500, 2021: 600, 2022: 700, 2023: 400, 2024: 750 }
		},
		{
			category: 'Toys & Games',
			transactions: { 2019: 300, 2020: 500, 2021: 600, 2022: 700, 2023: 400, 2024: 750 }
		},
		{
			category: 'Other',
			transactions: { 2019: 300, 2020: 500, 2021: 600, 2022: 700, 2023: 400, 2024: 750 }
		},
		{
			category: 'Discount Availed',
			transactions: { 2019: 30, 2020: 50, 2021: 60, 2022: 70, 2023: 40, 2024: 75 }
		}
	];

	// Data for 2025–2027 (gradient colors)
	const data2 = [
		{ category: 'Electronics', transactions: { 2025: 1400, 2026: 1000, 2027: 1600 } },
		{ category: 'Beauty & Health', transactions: { 2025: 800, 2026: 1100, 2027: 1250 } },
		{ category: 'Books', transactions: { 2025: 800, 2026: 1100, 2027: 1250 } },
		{ category: 'Clothing', transactions: { 2025: 800, 2026: 1100, 2027: 1250 } },
		{ category: 'Home & Kitchen', transactions: { 2025: 500, 2026: 600, 2027: 650 } },
		{ category: 'Sports & Fitness', transactions: { 2025: 300, 2026: 100, 2027: 160 } },
		{ category: 'Toys & Games', transactions: { 2025: 300, 2026: 100, 2027: 160 } },
		{ category: 'Other', transactions: { 2025: 300, 2026: 100, 2027: 160 } },
		{ category: 'Discount Availed', transactions: { 2025: 300, 2026: 100, 2027: 160 } }
	];

	const years1 = [2019, 2020, 2021, 2022, 2023, 2024];
	let years2 = [2025, 2026, 2027];

	if (mode == 'record') years2 = [];

	function setSimilarOutcomeBars(custTypeData, filteredData) {
		if (!custTypeData || !filteredData) return;
		let filteredType = custTypeData.filter((d) => filteredData[d['CID']]);
		let allCount = d3.rollup(
			filteredType,
			(v) => (v.length / filteredType.length) * 100,
			(d) => d['Customer Type']
		);
		allCount.forEach((v, k) => {
			outDistSim[k] = v.toFixed(0);
		});

		// console.log(outDistSim);
	}

	function showPlan() {
		// let data1 = systemData.archived[systemData.seedCustomer];

		let values = [];
		d3.selectAll('.avgdata').each(function (d, i) {
			const cell = d3.select(this);
			let val = +cell.attr('data');
			if (val == -1) return;
			values.push(val);
		});
		// console.log(values);
		const maxTransaction1 = d3.max(values);
		const minTransaction1 = d3.min(values);
		const sizeScale1 = d3.scaleLinear().domain([minTransaction1, maxTransaction1]).range([5, 20]);
		d3.selectAll('.avgdata').each(function (d, i) {
			const cell = d3.select(this);
			if (cell.classed('selected')) return;
			cell.classed('selected', true);
			const value = +cell.attr('data');
			if (value == -1) return;
			// console.log(value);
			cell
				.append('div')
				.style('background-color', 'steelblue')
				.attr('class', 'square mx-auto my-auto')
				.style('width', `${sizeScale1(value)}px`)
				.style('height', `${sizeScale1(value)}px`);
			selectedExpenditures.push(value);
		});
		// console.log(selectedExpenditures);
		updateExpenditure();
	}
	function clearPlan() {
		// showType || refType || saleType;
		d3.selectAll('.square').remove();
		d3.selectAll('.avgdata').classed('selected', false);
		selectedExpenditures = [];
		saleTypes.forEach((row, i) => {
			outDistChange[row] = 0;
		});
		totalEstExpenditure = 0;
		// updateExpenditure();
	}

	// function setFiltered(){
	//     filteredAggData = [];
	//     for(let i=0;i<systemData.filteredAggregated.length;i++){
	//         filteredAggData.push(aggJson[systemData.filteredAggregated[i].CID])
	//     }
	// }

	function setAndRender() {
		// console.log(systemData.filteredAggregated.length)
		if (systemData.filteredAggregated.length == 0) {
			d3.select('#Similar').attr('disabled', true);
		} else {
			d3.select('#Similar').attr('disabled', null);
		}
		initializeData();
		if (mode == 'record') {
			d3.select('#cust-sales-header').classed('w-3/4', false).classed('w-full', true);
			d3.select('#cust-sales-record').classed('w-3/4', false).classed('w-full', true);
		}
		clearPlan();
		// setOutcomeChange();
		if (systemData.seedCustomer != '') {
			d3.select('#cid').html(systemData.seedCustomer);
		} else {
			d3.select('#cid').html('N/A');
			return;
		}
		let selectedSeed = aggJson[systemData.seedCustomer];
		// console.log(selectedSeed,custTypeObj)
		// console.log(systemData.seedCustomer,selectedSeed, $state.snapshot(Object.keys(aggJson)));
		if (selectedSeed && selectedSeed.length > 0 && custTypeObj.length > 0) {
			// aggTransactions(systemData.archived)
			let fData = {};
			for (let i = 0; i < systemData.filteredAggregated.length; i++) {
				fData[systemData.filteredAggregated[i].CID] = aggJson[systemData.filteredAggregated[i].CID];
			}
			// console.log(
			// 	$state.snapshot(systemData.filtered),
			// 	$state.snapshot(systemData.filteredAggregated)
			// );
			// console.log(fData)
			let d2 = refType == 'All' ? aggJson : fData;
			d2 = aggTransactions(d2, custTypeObj);
			setSimilarOutcomeBars(custTypeObj, fData);
			// console.log(d2);
			render_data(selectedSeed, d2, years1, years2);
		} else {
			//render_data([],[],years1,years2)
			// render_data(data1,data2,years1,years2)
		}
	}

	$effect(() => {
		// clearPlan();
		setAndRender();
	});

	// setTimeout(setAndRender, 5000);
</script>

<div class="h-full flex-col bg-white text-xs">
	<div class="flex flex-row" id="seed-record-header">
		<div
			class="flex w-3/4 flex-row justify-between rounded-md bg-gray-200 p-4"
			id="cust-sales-header"
		>
			<div class="my-auto px-1">
				<h3>Customer ID</h3>
				<p id="cid">N/A</p>
			</div>
			{#if mode != 'record'}
				<div class="my-auto flex flex-row py-2" id="ref-options">
					<h4>Ref:</h4>
					<div class="my-auto flex flex-col px-2">
						{#each refTypes as rt}
							<div>
								<label>
									<input type="radio" id={rt} name="reftype" value={rt} bind:group={refType} />
									{rt}</label
								>
							</div>
						{/each}
					</div>
				</div>
				<div class="my-auto flex flex-row" id="show-options">
					<h4>Show:</h4>
					<div class="my-auto flex flex-col px-2">
						{#each showTypes as st}
							<div>
								<label>
									<input type="radio" id={st} name="show-type" value={st} bind:group={showType} />
									{showLabels[st]}
									{saleLabels[saleType]}</label
								>
							</div>
						{/each}
					</div>
				</div>

				<div class="my-auto flex flex-row" id="plan-options">
					<h4>Plan:</h4>
					<div class="my-auto flex flex-col justify-between px-2">
						<button
							onclick={showPlan}
							class="my-1 rounded bg-gray-500 px-4 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
							>Show</button
						>
						<button
							onclick={clearPlan}
							class="my-1 rounded bg-gray-500 px-4 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
							>Clear</button
						>
					</div>
				</div>
			{/if}
			<div class="flex flex-col">
				<div class=" my-auto flex flex-row py-1" id="square-legend"></div>
				{#if mode != 'record'}<div
						class="my-auto flex flex-row py-1"
						id="gradient-legend"
					></div>{/if}
			</div>
		</div>
		{#if mode != 'record'}
			<div class="mx-1 flex w-1/4 flex-col rounded-md bg-gray-200" id="outcome-dist-header">
				<p class="py-4 text-center text-xl">Outcome distribution</p>
				<div class="flex flex-col justify-between">
					<div class="my-auto flex flex-row justify-start">
						<div
							style="width:20px;height:20px;background-color:green"
							class="px- mx-2 my-auto"
						></div>
						<div>Similar Records</div>
					</div>
					<div class="my-auto flex flex-row justify-start">
						<div
							style="width:20px;height:5px;background-color:green"
							class="mx-2 my-auto px-1"
						></div>
						<div>All Records</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-row" id="seed-records">
		<div class="border-gray w-3/4 rounded-md border-2" id="cust-sales-record">
			<table class="table" id="table"></table>
		</div>
		{#if mode != 'record'}
			<div class="mx-1 w-1/4 rounded-md bg-gray-100 px-4" id="saletype-outcome">
				<div class="flex flex-col justify-between">
					{#each saleTypes as st}
						<div class="flex flex-row justify-between py-10">
							<label class="basis-1/3">
								<input type="radio" id={st} name="outcome-type" value={st} bind:group={saleType} />
								{saleLabels[st]}
							</label>
							<div class="flex basis-2/3 flex-col">
								<div class="flex flex-row">
									<div
										class="my-auto h-2.5 bg-green-600"
										style="width:40px"
										id="{st}-similar-bar"
									></div>
									<div class="px-2 font-bold text-green-600">
										{outDistSim[st]}% {outDistChange[st] >= 0
											? `(+${outDistChange[st]})`
											: `(${outDistChange[st]})`}
									</div>
								</div>
								<div class="flex flex-row">
									<div class="my-auto h-1 bg-green-600" style="width:40px" id="{st}-all-bar"></div>
									<div class="px-2 font-bold text-green-600">{outDistArc[st]}%</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
