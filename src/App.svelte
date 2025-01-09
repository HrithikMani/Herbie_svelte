<script>
	import Dropdown from './Dropdown.svelte';
	import Tab1 from './Tab1.svelte';
	import Tab2 from './Tab2.svelte';
  
	let activeTab = 'tab1'; 
</script>
  
  <div>
	<Dropdown bind:activeTab />
  
	{#if activeTab === 'tab1'}
	  <Tab1 />
	{:else if activeTab === 'tab2'}
	  <Tab2 />
	{/if} 

	
  </div>
  
 
  