<script lang="ts">
  let { id, closeWindow } = $props();
</script>

<div class="alert">
  <div class="icon-container"></div> 
  <div class="alert-content">
    <h2>Enter password to continue</h2>
    <span>You're attempting to enter a secure area of the site. Please enter a password.</span>
    <input type="password" placeholder="Password" class="password-input">
    <button class="button primary">Submit</button>
    <button type="button" class="button" onclick={() => closeWindow(id)}>Cancel</button>
  </div>
</div>
