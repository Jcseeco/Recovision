import { systemData } from '../utils/storage.svelte';
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