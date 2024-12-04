<script>
	import { systemData } from '../utils/storage.svelte';
	import { calculateSimilarity } from '../utils/score';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let isFirst = true;
	let isSlider = false;
	let isSelectOption = false;
	let data = [];
	let filtered = [];
	let allValue = 0;

	let sliderValue = $state(0);
	let selectedOption = $state('N');

	let svg;

	let temporary = [];

	// function calculateSimilarity(seed, compare) {
	// 	let totalScore = 0;

	// 	systemData.criterions.forEach(({ name, weight, matchType }) => {
	// 		if (matchType === 'ignore') return; // Skip this criterion

	// 		let seedAgeRange = [];
	// 		if (seed['Age Group'] == 'under 18') {
	// 			seedAgeRange = [0, 18];
	// 		} else if (seed['Age Group'] == '18-25') {
	// 			seedAgeRange = [19, 25];
	// 		} else if (seed['Age Group'] == '25-45') {
	// 			seedAgeRange = [26, 45];
	// 		} else if (seed['Age Group'] == '45-60') {
	// 			seedAgeRange = [46, 60];
	// 		} else if (seed['Age Group'] == '60 and above') {
	// 			seedAgeRange = [61, 120];
	// 		}

	// 		let comAgeRange = [];
	// 		if (compare['Age Group'] == 'under 18') {
	// 			comAgeRange = [0, 18];
	// 		} else if (compare['Age Group'] == '18-25') {
	// 			comAgeRange = [19, 25];
	// 		} else if (compare['Age Group'] == '25-45') {
	// 			comAgeRange = [26, 45];
	// 		} else if (compare['Age Group'] == '45-60') {
	// 			comAgeRange = [46, 60];
	// 		} else if (compare['Age Group'] == '60 and above') {
	// 			comAgeRange = [61, 120];
	// 		}

	// 		if (name === 'Gender') {
	// 			// Gender Matching
	// 			if (seed.gender === compare.gender) {
	// 				totalScore += matchType === 'exact' ? weight : 0; // Gender has no "close match" logic
	// 			}
	// 		} else if (name === 'Age Group') {
	// 			// Age Group Matching
	// 			const [seedStart, seedEnd] = seedAgeRange;
	// 			const [compareStart, compareEnd] = comAgeRange;

	// 			if (matchType === 'exact') {
	// 				// Exact Match: Fully overlapping ranges
	// 				if (seedStart === compareStart && seedEnd === compareEnd) {
	// 					totalScore += weight;
	// 				} else {
	// 					totalScore += 0; // No overlap, score = 0
	// 				}
	// 			} else if (matchType === 'close') {
	// 				// Close Match: Overlapping ranges
	// 				if (seedEnd >= compareStart && compareEnd >= seedStart) {
	// 					totalScore += weight * 0.5;
	// 				}
	// 			}
	// 		} else if (name === 'Discount Amount (INR)') {
	// 			// Discount Amount Matching
	// 			const seedRange = getDiscountRange(seed['Discount Amount (INR)']);
	// 			const compareRange = getDiscountRange(compare['Discount Amount (INR)']);

	// 			if (matchType === 'exact') {
	// 				// Exact Match: Fully overlapping ranges
	// 				if (seedRange[0] === compareRange[0] && seedRange[1] === compareRange[1]) {
	// 					totalScore += weight;
	// 				} else {
	// 					totalScore += 0; // No overlap, score = 0
	// 				}
	// 			} else if (matchType === 'close') {
	// 				// Close Match: Overlapping ranges
	// 				if (seedRange[1] >= compareRange[0] && compareRange[1] >= seedRange[0]) {
	// 					totalScore += weight * 0.5;
	// 				}
	// 			}
	// 		}
	// 	});

	// 	temporary.push({
	// 		...compare,
	// 		totalScore
	// 	});

	// 	return totalScore;
	// }

	// // Helper function: Map Discount Amount to predefined ranges
	// function getDiscountRange(amount) {
	// 	if (amount <= 100) return [0, 100];
	// 	if (amount <= 200) return [101, 200];
	// 	if (amount <= 300) return [201, 300];
	// 	if (amount <= 400) return [301, 400];
	// 	return [401, 500];
	// }

	function drawBarChart() {
		const margin = { top: 5, right: 5, bottom: 40, left: 40 };
		const width = svg.clientWidth;
		const height = svg.clientHeight;

		d3.select(svg).selectAll('*').remove();

		const x = d3
			.scaleBand()
			.domain(data.map((d) => d.range))
			.range([margin.left, width - margin.right])
			.padding(0.1);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.value)])
			.nice()
			.range([height - margin.bottom, margin.top]);

		const xAxis = (g) => {
			g = g
				.attr('transform', `translate(0,${height - margin.bottom})`)
				.call(d3.axisBottom(x).tickSize(0))
				.call((g) => g.selectAll('text').style('font - size', '10px'));

			g.append('text')
				.attr('x', margin.left + 70)
				.attr('y', margin.bottom - 10)
				.text('(most similar)')
				.style('font-size', '16px')
				.style('fill', 'gray');

			g.append('text')
				.attr('x', width / 2 + 20)
				.attr('y', margin.bottom - 10)
				.text('Score')
				.style('font-size', '16px')
				.style('font-weight', 'bold')
				.style('fill', '#000');

			g.append('text')
				.attr('x', width - 70)
				.attr('y', margin.bottom - 10)
				.text('(least similar)')
				.style('font-size', '16px')
				.style('fill', 'gray');
			return g;
		};
		// g
		// 	.attr('transform', `translate(0,${height - margin.bottom})`)
		// 	.call(d3.axisBottom(x).tickSize(0))
		// 	.call((g) => g.selectAll('text').style('font-size', '10px'))
		//     .append('text')
		//     .attr('x', margin.left)
		//     .attr('y', margin.bottom / 2)
		//     .text('(most similar)')
		//     .style('font - size', '10px')
		//     .style('fill', 'gray')
		//     .attr('dx', '0.5em')
		//     .attr('dy', '0.5em')
		//     .on('click', () => {
		//         console.log('Most similar clicked');
		//         })

		const yAxis = (g) =>
			g
				.attr('transform', `translate(${margin.left},0)`)
				.call(d3.axisLeft(y).ticks(5).tickSize(0))
				.call((g) => g.selectAll('text').style('font-size', '8px'))
				.call((g) => g.selectAll('text').style('font - size', '8px'))
				.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 0 - margin.left)
				.attr('x', 0 - height / 3)
				.attr('dy', '1em')
				.style('text - anchor', 'middle')
				.text('# of records')
				.style('font-size', '18px')
				.style('font-weight', 'bold')
				.style('fill', '#000');

		d3.select(svg).append('g').call(xAxis);

		d3.select(svg).append('g').call(yAxis);

		d3.select(svg)
			.append('g')
			.selectAll('rect')
			.data(data)
			.join('rect')
			.attr('x', (d) => x(d.range))
			.attr('y', (d) => y(d.value))
			.attr('height', (d) => y(0) - y(d.value))
			.attr('width', x.bandwidth())
			.attr('fill', (d) => (isSelected(d.range, d.value) ? 'green' : 'lightgrey'));
	}

	function isSelected(range, value) {
		if (selectedOption == 'N') {
			const isSelect = sliderValue > allValue;
			allValue = allValue + value;

			// if(isSelect){
			//     filtered = temporary.filter((item)=>{
			//         if(item.totalScore==range){
			//             return item
			//         }
			//     })
			// }
			return isSelect;
		} else if (selectedOption == '%') {
			const isSelect = sliderValue * systemData.archived.length * 0.01 > allValue;
			allValue = allValue + value;

			// if(isSelect){
			//     filtered = temporary.filter((item)=>{
			//         if(item.totalScore==range){
			//             return item
			//         }
			//     })
			// }

			return isSelect;
		}
	}

	function computedSimilar() {
		if (selectedOption == 'N') {
			return sliderValue;
		} else if (selectedOption == '%') {
			return (systemData.maxValue * sliderValue * 0.01).toFixed(0) + '%';
		}
	}

	function computedOther() {
		if (selectedOption == 'N') {
			return systemData.maxValue - sliderValue;
		} else if (selectedOption == '%') {
			const res = (100 - systemData.maxValue * sliderValue * 0.01).toFixed(0);
			return (res <= 0 ? 0 : res) + '%';
		}
	}

	const initData = () => {
		data = [];

		temporary = [];

		const cKey = {};

		const seed = systemData.seedCustomerObj;

		systemData.archived.forEach((item) => {
			const totalScore = calculateSimilarity(seed, item, (i) => {
				temporary.push(i);
			});
			if (!cKey[totalScore]) {
				cKey[totalScore] = 1;
			} else {
				cKey[totalScore] = cKey[totalScore] + 1;
			}
		});

		// console.log('temporary####', temporary);

		for (let i in cKey) {
			data.push({ range: i, value: cKey[i] });
		}

		data.sort((a, b) => {
			return b.range - a.range;
		});

		allValue = 0;
		drawBarChart();
	};

	function throttle(func, delay) {
		let timer = null;
		return function () {
			if (!timer) {
				func.apply(this, arguments);
				timer = setTimeout(() => {
					timer = null;
				}, delay);
			}
		};
	}

	const changeHandler = throttle((e) => {
		sliderValue = e.target.valueAsNumber;
		isSlider = true;
	}, 400);

	onMount(() => {
		systemData.maxValue = systemData.archived.length;
		initData();
	});

	$effect(() => {
		if (systemData.criterions) {
			!isFirst && initData();

			isFirst = false;
		}

		if ((sliderValue || sliderValue == 0) && isSlider) {
			let judgeData = 0;

			if (selectedOption == 'N') {
				allValue = 0;
				systemData.maxValue = systemData.archived.length;
				judgeData = sliderValue;
			} else if (selectedOption == '%') {
				allValue = 0;
				systemData.maxValue = 100;
				judgeData = (temporary.length * sliderValue * 0.01).toFixed(0);
			}

			drawBarChart();
			allValue = 0;
			data.forEach((item) => {
				if (isSelected(item.range, item.value)) {
					filtered = filtered.concat(
						temporary.filter((item1) => {
							if (item1.totalScore == item.range) {
								return item1;
							}
						})
					);

					if (filtered.length > judgeData) {
						filtered = filtered.splice(0, judgeData);
					}
				}
			});
			isSlider = false;
			systemData.filtered = filtered.map((item1) => {
				return item1;
			});
			filtered = [];

			// console.log('🚀 ~ $effect ~ systemData.filtered:', systemData.filtered);
		}

		if (selectedOption && isSelectOption) {
			let judgeData = 0;
			if (selectedOption == 'N') {
				allValue = 0;
				systemData.maxValue = systemData.archived.length;
				judgeData = sliderValue;
				// sliderValue = 0
			} else if (selectedOption == '%') {
				allValue = 0;
				systemData.maxValue = 100;
				judgeData = (temporary.length * sliderValue * 0.01).toFixed(0);
				// sliderValue = 0
			}

			drawBarChart();

			allValue = 0;

			data.forEach((item) => {
				if (isSelected(item.range, item.value)) {
					filtered = filtered.concat(
						temporary.filter((item1) => {
							if (item1.totalScore == item.range) {
								return item1;
							}
						})
					);

					if (filtered.length > judgeData) {
						filtered = filtered.splice(0, judgeData);
					}
				}
			});
			isSelectOption = false;
			systemData.filtered = filtered.map((item1) => {
				return item1;
			});
			filtered = [];

			// console.log('🚀 ~ $effect ~ systemData.filtered:', systemData.filtered);
		}
	});
</script>

<div>
	<div class="options">
		<button
			type="button"
			class="option"
			onclick={() => {
				selectedOption = 'N';
				isSelectOption = true;
			}}
			style="background-color: {selectedOption === 'N' ? 'green' : 'lightgrey'}"
		>
			N
		</button>
		<button
			type="button"
			class="option"
			onclick={() => {
				selectedOption = '%';
				isSelectOption = true;
			}}
			style="background-color: {selectedOption === '%' ? 'green' : 'lightgrey'}"
		>
			%
		</button>
	</div>

	<div class="my-[10px] bg-[lightgrey] p-[10px]">
		<div class="my-[10px] flex justify-between">
			<span>All Archived Records</span>
			<span>{systemData.maxValue + (selectedOption == '%' ? selectedOption : '')}</span>
		</div>

		<div class="my-[10px] flex justify-between">
			<span>Filtered Out</span>
			<span>{computedOther()}</span>
		</div>

		<div class="my-[10px] flex justify-between">
			<span class="font-bold">Remainings Ranked by Similarity</span>
			<span>{computedSimilar()}</span>
		</div>
	</div>

	<div class="slider-container">
		<div class="slider-info">
			<span class="slider-similar">{computedSimilar()} similar</span>
			<span class="slider-others">{computedOther()} others</span>
		</div>
		<input
			type="range"
			min="0"
			max={systemData.maxValue}
			value={sliderValue}
			onchange={changeHandler}
			style="width: 100%; margin-bottom: 5px;"
			class="styled-slider"
		/>
		<!-- <div class="slider-percentage">{sliderValue + (selectedOption == '%' ? selectedOption : '')}</div> -->
	</div>
	<!-- <div style="text-align: center; font-size: 14px; font-weight: bold;">
		{sliderValue + (selectedOption == '%' ? selectedOption : '')}
	</div> -->

	<svg bind:this={svg} style="width: 100%; height: 400px; background-color: #f9f9f9;"></svg>
</div>

<style>
	.options {
		display: flex;
		width: 100%;
	}

	.option {
		padding: 5px 10px;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: center;
		color: #fff;
		font-weight: bold;
	}

	svg {
		background-color: #f9f9f9;
	}

	.slider-container {
		width: 100%;
		max-width: 600px;
		margin: 20px auto;
		font-family: Arial, sans-serif;
	}

	.slider-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
		font-size: 16px;
		color: #6b7280;
		font-weight: bold;
	}

	.slider-similar {
		color: #10b981;
	}

	.slider-others {
		color: #6b7280;
	}

	.styled-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 12px;

		/* background: linear-gradient(to right, #10b981 12%, #e5e7eb 12%);  */
		border-radius: 6px;
		outline: none;
		position: relative;
	}

	.styled-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		background: #ffffff;
		border: 4px solid #10b981;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease;
	}

	.styled-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.slider-percentage {
		margin-top: 8px;
		text-align: center;
		font-size: 16px;
		font-weight: bold;
		color: #10b981;
	}
</style>
