import { systemData } from '../utils/storage.svelte';
import { min as d3min, max as d3max, sort as d3sort } from 'd3';

export function calculateSimilarity(seed, compare, cb) {
    let totalScore = 0;
    systemData.criterions.forEach(({ name, weight, matchType }) => {
        if (matchType === 'ignore') return; // Skip this criterion

        let score = 0;

        let seedAgeRange = [];
        if (seed['Age Group'] == 'under 18') {
            seedAgeRange = [0, 18];
        } else if (seed['Age Group'] == '18-25') {
            seedAgeRange = [19, 25];
        } else if (seed['Age Group'] == '25-45') {
            seedAgeRange = [26, 45];
        } else if (seed['Age Group'] == '45-60') {
            seedAgeRange = [46, 60];
        } else if (seed['Age Group'] == '60 and above') {
            seedAgeRange = [61, 120];
        }

        let comAgeRange = [];
        if (compare['Age Group'] == 'under 18') {
            comAgeRange = [0, 18];
        } else if (compare['Age Group'] == '18-25') {
            comAgeRange = [19, 25];
        } else if (compare['Age Group'] == '25-45') {
            comAgeRange = [26, 45];
        } else if (compare['Age Group'] == '45-60') {
            comAgeRange = [46, 60];
        } else if (compare['Age Group'] == '60 and above') {
            comAgeRange = [61, 120];
        }

        if (name === 'Gender') {
            // Gender Matching
            score = seed.gender === compare.gender ? 1 : 0;
        } else if (name === 'Age Group') {
            // Age Group Matching
            const [seedStart, seedEnd] = seedAgeRange;
            const [compareStart, compareEnd] = comAgeRange;

            if (matchType === 'exact') {
                score = seedStart === compareStart && seedEnd === compareEnd ? 1 : 0;
            } else if (matchType === 'close') {
                // Close Match: Overlapping ranges
                const intersection = Math.max(0, Math.min(seedEnd, compareEnd) - Math.max(seedStart, compareStart));
                const seedLength = seedEnd - seedStart;
                score = intersection / seedLength;
            }
        } else if (name === 'Discount Amount') {
            // Discount Amount Matching
            const seedRange = getDiscountRange(seed['Discount Amount']);
            const compareRange = getDiscountRange(compare['Discount Amount']);

            if (matchType === 'exact') {
                score = seedRange[0] === compareRange[0] && seedRange[1] === compareRange[1] ? 1 : 0;
            } else if (matchType === 'close') {
                const intersection = Math.max(0, Math.min(seedRange[1], compareRange[1]) - Math.max(seedRange[0], compareRange[0]));
                const seedLength = seedRange[1] - seedRange[0];
                score = intersection / seedLength;
            }
        }
        totalScore += score * weight;
    });

    cb && cb({
        ...compare,
        totalScore
    })
    // temporary.push({
    //     ...compare,
    //     totalScore
    // });
    // console.log(`Total Score for compare record:`, temporary);
    return totalScore.toFixed(2);
}

// Helper function: Map Discount Amount to predefined ranges
function getDiscountRange(amount) {
    if (amount <= 100) return [0, 100];
    if (amount <= 200) return [101, 200];
    if (amount <= 300) return [201, 300];
    if (amount <= 400) return [301, 400];
    return [401, 500];
}

/**
 * returns the original dataset with added attribute of similarity score
 * @param {{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,[key:string]:any}} seed 
 * @param {{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,[key:string]:any}[]} dataset 
 * @param {{
 *      name:string,
 *      matchType: 'exact'|'close'|'ignore',
 *      tolerance: number,
 *      weight: number
 * }[]} criterions
 * @param {boolean} sort
 * @returns {{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,score:number,[key:string]:any}}
 */
export function calcSimilarities(seed, dataset, criterions, sort = true) {
    const range = d3max(dataset, d => d['Discount Amount']) - d3min(dataset, d => d['Discount Amount'])

    // init criterionDict for faster access
    const criterionDict = {}
    for (const criterion of criterions) {
        criterionDict[criterion.name] = criterion
    }

    let result = [];
    for (const data of dataset) {

        const ageDist = calcAgeSimimlarity(seed['Age Group'], data['Age Group'], criterionDict['Age Group'])
        const genderDist = calcGenderSimilarity(seed['Gender'], data['Gender'], criterionDict['Gender'])
        const discountDist = calcDiscountAmountSimilarity(seed['Discount Amount'], data['Discount Amount'], criterionDict['Discount Amount'], range)

        result.push({
            CID: data.CID,
            'Age Group': ageDist,
            'Gender': genderDist,
            'Discount Amount': discountDist,
            score: ageDist + genderDist + discountDist
        })
    }

    // sort from least to greatest distance score
    if (sort)
        result = d3sort(result, d => d.score)

    return result
}

const ageGroupIndex = {
    'under 18': 0,
    '18-25': 1,
    '25-45': 2,
    '45-60': 3,
    '60 and above': 4
}

/**
 * returns weighted distance between seed age group and compare age group
 * @param {string} seedAgeGroup 
 * @param {string} compareAgeGroup 
 * @param {{
 *      name:string,
 *      matchType: 'exact'|'close'|'ignore',
 *      tolerance: number,
 *      weight: number
 * }} criterion 
 * @returns {number}
 */
export function calcAgeSimimlarity(seedAgeGroup, compareAgeGroup, criterion) {
    // max distance is 1
    let distances = [];
    if (criterion.matchType === 'exact')
        distances = [0, 1, 1, 1, 1]; // equals number of age groups
    else if (criterion.matchType === 'close')
        distances = [0, 0.5, 1, 1, 1];
    else
        return 1 * criterion.weight

    // calc group distance
    const i = Math.abs(ageGroupIndex[seedAgeGroup] - ageGroupIndex[compareAgeGroup])

    return distances[i] * criterion.weight
}

/**
 * returns weighted distance between seed gender and compare gender
 * @param {string} seedGender 
 * @param {string} compareGender 
 * @param {{
*      name:string,
*      matchType: 'exact'|'close'|'ignore',
*      tolerance: number,
*      weight: number
* }} criterion 
* @returns {number}
*/
export function calcGenderSimilarity(seedGender, compareGender, criterion) {
    if (seedGender === compareGender)
        return 0
    else
        return 1 * criterion.weight
}

/**
 * returns weighted distance between seed discount amount and compare discount amount
 * @param {number} seed 
 * @param {number} compare
 * @param {number} range - range of discount amount for normalization
 * @param {{
*      name:string,
*      matchType: 'exact'|'close'|'ignore',
*      tolerance: number,
*      weight: number
* }} criterion 
* @returns {number}
*/
export function calcDiscountAmountSimilarity(seed, compare, criterion, range) {
    const bin = range / 5
    const diff = Math.abs(seed - compare)

    if (diff <= bin)
        return 0
    else if (diff <= (bin * 2)) {
        if (criterion.matchType === 'close')
            return 0.5 * criterion.weight
    }

    // matchtype == exact and diff not within bin range
    return 1 * criterion.weight
}