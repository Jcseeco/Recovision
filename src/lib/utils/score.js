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
 * returns the customer ID with similarity distance of each criterion and the total distance
 * @param {{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,[key:string]:any}} seed 
 * @param {{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,[key:string]:any}[]} dataset 
 * @param {{
 *      name:string,
 *      matchType: 'exact'|'close'|'ignore',
 *      tolerance: number,
 *      weight: number
 * }[]} criterions
 * @param {boolean} sort
 * @returns {{'CID': string,
 *          'Age Group':number,
 *          'Gender':number,
 *          'Discount Amount':number,
 *          score:number,
 *          'Age Group Match': string,
 *          'Gender Match': string,
 *          'Discount Amount Match': string}}
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

        const [ageDist, ageMatch] = calcAgeSimimlarity(seed['Age Group'], data['Age Group'], criterionDict['Age Group'])
        const [genderDist, genderMatch] = calcGenderSimilarity(seed['Gender'], data['Gender'], criterionDict['Gender'])
        const [discountDist, discountDistMatch] = calcDiscountAmountSimilarity(seed['Discount Amount'], data['Discount Amount'], criterionDict['Discount Amount'], range)

        let score = 0
        if (criterionDict['Age Group'].matchType !== 'ignore')
            score += ageDist
        if (criterionDict['Gender'].matchType !== 'ignore')
            score += genderDist
        if (criterionDict['Discount Amount'].matchType !== 'ignore')
            score += discountDist

        result.push({
            CID: data.CID,
            'Age Group': ageDist,
            'Age Group Match': ageMatch,
            'Gender': genderDist,
            'Gender Match': genderMatch,
            'Discount Amount': discountDist,
            'Discount Amount Match': discountDistMatch,
            score: score
        })
    }

    // sort from least to greatest distance score
    if (sort)
        result = d3sort(result, d => d.score)

    return result
}

export const ageGroupIndex = {
    'under 18': 0,
    '18-25': 1,
    '25-45': 2,
    '45-60': 3,
    '60 and above': 4
}

/**
 * returns weighted distance and match type between seed age group and compare age group
 * @param {string} seedAgeGroup 
 * @param {string} compareAgeGroup 
 * @param {{
 *      name:string,
 *      matchType: 'exact'|'close'|'ignore',
 *      tolerance: number,
 *      weight: number
 * }} criterion 
 * @returns {[number,'exact'|'within'|'out'|'ignored']}
 */
export function calcAgeSimimlarity(seedAgeGroup, compareAgeGroup, criterion) {
    if (criterion.matchType === 'ignore')
        return [1 * criterion.weight, 'ignored']

    // calc group distance
    const dist = Math.abs(ageGroupIndex[seedAgeGroup] - ageGroupIndex[compareAgeGroup])

    if (dist === 0)
        return [0, 'exact']
    else if (dist === 1)
        return [0.5 * criterion.weight, 'within']
    else
        return [1 * criterion.weight, 'out']
}

/**
 * returns weighted distance and match type between seed gender and compare gender
 * @param {string} seedGender 
 * @param {string} compareGender 
 * @param {{
*      name:string,
*      matchType: 'exact'|'close'|'ignore',
*      tolerance: number,
*      weight: number
* }} criterion 
* @returns {[number,'exact'|'within'|'out'|'ignored']}
*/
export function calcGenderSimilarity(seedGender, compareGender, criterion) {
    if (criterion.matchType === 'ignore')
        return [1 * criterion.weight, 'ignored']

    if (seedGender === compareGender)
        return [0, 'exact']
    else
        return [1 * criterion.weight, 'out']
}

/**
 * returns weighted distance and match type between seed discount amount and compare discount amount
 * @param {number} seed 
 * @param {number} compare
 * @param {number} range - range of discount amount for normalization
 * @param {{
*      name:string,
*      matchType: 'exact'|'close'|'ignore',
*      tolerance: number,
*      weight: number
* }} criterion 
* @returns {[number,'exact'|'within'|'out'|'ignored']}
*/
export function calcDiscountAmountSimilarity(seed, compare, criterion, range) {
    const bin = range / 5
    const diff = Math.abs(seed - compare)

    if (criterion.matchType === 'ignore')
        return [1 * criterion.weight, 'ignored']

    if (diff <= bin)
        return [0, 'exact']
    else if (diff <= (bin * 2)) {
        if (criterion.matchType === 'close')
            return [0.5 * criterion.weight, 'within']
    }

    // matchtype == exact and diff not within bin range
    return [1 * criterion.weight, 'out']
}