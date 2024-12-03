<script>
	let props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="lucide lucide-loader-circle throbber {props?.class}"
	><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg
>

<style>
	.throbber {
		animation: spin linear infinite 500ms;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
