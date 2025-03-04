<script>

import { injectSvelteComponent } from '../utils/injectComponent';
</script>
  
  <button on:click={() =>

injectSvelteComponent({
    componentName: 'MainComponent',
    scriptPath: 'build/injected/main-component.js',
    cssPath: 'build/injected/css/main-style.css',
    props: { title: "Hello World" }
})

}>Insert Herbie</button>