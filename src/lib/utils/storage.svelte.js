/**
 * This is where the reactive data are stored
 * ---------
 * Basic Usage
 * ---------
 * import {systemData} from '$lib/utils/storage.svelte';
 * 
 * for reactivity, use the $effect rune to check for updates and trigger some
 * custom actions. For example:
 * 
 * // this print 'hello' everytime systemData.filtered is reassigned or mutated
 * $effect(()=>{
 *      systemData.filtered.length;
 *      console.log('hello');
 * })
 * 
 */

export let systemData = $state({
    seedCustomer: '',    // the CID of the seed record
    seedCustomerObj:{},
    archived: [],        // the loaded full dataset
    filtered: [],        // a sub set of the archived dataset filtered by the configuration of the similarity criteria controls
    selected: [],        // a sub set of filtered data selected from the similarity distribution chart
    // sliderValue:0,
    // selectedOption:'N',
    maxValue:0,
    criterions: [
        {
            name: 'Age Group',
            matchType: 'close', // can be 'exact', 'close', 'ignore'
            // if match type is 'exact', tolerance value does not matter
            tolerance: 1,   // customers within 1 Age group of the seed customer are included in the filtered data
            weight: 1
        }, {
            name: 'Gender',
            // customers that are the same gender as seed customer are included in the filtered data
            matchType: 'close', // can be 'exact', 'close', 'ignore'
            tolerance: null,
            weight: 1
        }, {
            name: 'Discount Amount (INR)',
            matchType: 'close', // can be 'exact', 'close', 'ignore'
            tolerance: 1,   // customers whose total discount amount is within 1 bin of the seed customer are included in the filtered data
            weight: 1
        }
    ]
})
