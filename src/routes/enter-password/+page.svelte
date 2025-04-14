<script context="module">
  export const windowMeta= {
id: 'enter-password',
title: 'Enter Password',
route: 'enter-password',
style: 'alert',
resizable: false,
  };
</script>
<script lang="ts">
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  import { soundCommand } from '$lib/components/SoundEffects.svelte';

  // Retrieve the closeWindow function and windowId from context.
  const closeWindow = getContext('windowManager') as (id: string) => void;
  const windowId = getContext('windowId') as string;

  let password = '';

  onMount(() => {
    soundCommand.set('sosumi');
  });
</script>


<div class="alert">
  <div class="icon-container"></div> 
  <div class="alert-content">
    <h2>Enter password to continue</h2>
    <span>You're attempting to enter a secure area of the site. Please enter a password.</span>
    <input type="password" placeholder="Password" class="password-input">
    <button class="button primary">Submit</button>
    <button type="button" class="button" onclick={()=>closeWindow(windowId)}>Cancel</button>
  </div>
</div>