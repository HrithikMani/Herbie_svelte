<script>
	import { fade } from 'svelte/transition';
	import Dropdown from './components/Dropdown.svelte';
	import Tab1 from './tabs/Tab1.svelte';
	import Tab2 from './tabs/Tab2.svelte';
	import Tab3 from './tabs/Tab3.svelte';
	import Tab4 from './tabs/Tab4.svelte';
	import Tab5 from './tabs/Tab5.svelte';
	import Tab6 from './tabs/Tab6.svelte';
  
	let activeTab = 'tab1'; // Default active tab
  
	// Map activeTab to components
	const components = {
	  tab1: Tab1,
	  tab2: Tab2,
	  tab3: Tab3,
	  tab4: Tab4,
	  tab5: Tab5,
	  tab6: Tab6
	};
  
	// Reactive assignment to update CurrentTab
	$: CurrentTab = components[activeTab];
  </script>
  
  <div>
	<!-- Dropdown for selecting tabs -->
	<Dropdown bind:activeTab />
  
	<!-- Dynamically render the selected tab with a wrapper for the transition -->
	{#if CurrentTab}
	  <div transition:fade>
		<svelte:component this={CurrentTab} />
	  </div>
	{/if}
  </div>
  

  