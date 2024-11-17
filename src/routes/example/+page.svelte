<script>
	import Example from '../../lib/components/example.svelte';
	import { systemData } from '$lib/utils/storage.svelte';

	function addItem() {
		const temp = systemData.archived;
		temp.push(temp.length);

		// this reassigned will trigger all $effect that has
		// systemData.archived as dependencies one time
		systemData.archived = temp;
	}
</script>

<button type="button" class="btn btn-primary" onclick={addItem}>click me!</button>
<Example />
