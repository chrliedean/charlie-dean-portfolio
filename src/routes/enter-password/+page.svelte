<script lang="ts">
  import { getContext } from 'svelte';
  
  // Retrieve the closeWindow function from the context
  const { closeWindow } = getContext('windowManager') as { closeWindow: (id: string) => void };
  const windowId = getContext('windowId') as string;
  // Get id from props (if you're still passing it as a prop)
  console.log("id: ", windowId);
</script>

<div class="alert">
  <div class="icon-container"></div> 
  <div class="alert-content">
    <h2>Enter password to continue</h2>
    <span>You're attempting to enter a secure area of the site. Please enter a password.</span>
    <input type="password" placeholder="Password" class="password-input">
    <button class="button primary">Submit</button>
    <button type="button" class="button" onclick={() => closeWindow(windowId)}>Cancel</button>
  </div>
</div>