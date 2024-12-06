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

/**
 * @type {{
 * seedCustomer:string,
 * archived: obj[],
 * filtered: obj[],
 * seedCustomerObj:{'CID': string,'Age Group':string,'Gender':string,'Discount Amount':number,[key:string]:any}
 * criterions: {
 *      name:string,
 *      matchType: 'exact'|'close'|'ignore',
 *      tolerance: number,
 *      weight: number
 * }[],
 * aggregated: {
 *          'CID': string,
 *          'Age Group':number,
 *          'Gender':number,
 *          'Discount Amount':number,
 *          score:number,
 *          'Age Group Match': string,
 *          'Gender Match': string,
 *          'Discount Amount Match': string
 * }[],
 * distanceSorted:{
 *      CID: string,
 *      'Age Group': number,
 *      'Gender': number,
 *      'Discount Amount': number,
 *      score: number,
 * }[],
 * filteredAggregated: {
 *      'CID': string,
 *      'Age Group': string,
 *      'Gender': string,
 *      'Discount Amount': number,
 *      'score': number
 * }[],
 * }}
 */
export let systemData = $state({
    seedCustomer: '',    // the CID of the seed record
    archived: [],        // the loaded full dataset
    filtered: [],        // a sub set of the archived dataset filtered by the configuration of the similarity criteria controls
    seedCustomerObj: { 'CID': '', 'Age Group': '', 'Gender': '', 'Discount Amount': 0 },
    criterions: [
        {
            name: 'Age Group',
            matchType: 'exact', // can be 'exact', 'close', 'ignore'
            // if match type is 'exact', tolerance value does not matter
            tolerance: 1,   // customers within 1 Age group of the seed customer are included in the filtered data
            weight: 1
        }, {
            name: 'Gender',
            // customers that are the same gender as seed customer are included in the filtered data
            matchType: 'exact', // can be 'exact', 'close', 'ignore'
            tolerance: null,
            weight: 1
        }, {
            name: 'Discount Amount',
            matchType: 'exact', // can be 'exact', 'close', 'ignore'
            tolerance: 1,   // customers whose total discount amount is within 1 bin of the seed customer are included in the filtered data
            weight: 1
        }
    ],
    aggregated: [],
    distanceSorted: [],
    filteredAggregated: []
})
