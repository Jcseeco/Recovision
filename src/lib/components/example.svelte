<script>
	import { systemData } from '../utils/storage.svelte';

	// this triggers once when component is initialized
	// and everytime systemData.archived is mutated or reassigned
	$effect(() => {
		systemData.archived.length;
		console.log('archived!');
	});

	// this does not trigger when systemData.archived is updated
	// because it is dependent on systemData instead
	// however $effect will trigger once when this component is initialized
	$effect(() => {
		systemData;
		console.log('system data!');
	});
</script>

<div>{systemData.archived.join(',')}</div>
