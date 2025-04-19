<script context="module" lang="ts">
	export const windowMeta = {
		id: 'contact',
		title: 'Contact',
		route: '/contact',
		icon: 'mail',
		style: 'reader',
		defaultSize: {
			width: 735,
			height: 500
		}
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { goto } from '$app/navigation'; // Import goto

	// Get the form data passed from the server action (or initial load)
	let { form } = $props<{ form?: ActionData }>(); // Correct way to use $props

	// State variables for form fields using runes, initialized from the prop
	let name = $state(form?.name ?? '');
	let email = $state(form?.email ?? '');
	let message = $state(form?.message ?? '');
	let newsletter = $state(form?.newsletter ?? false);
	let submitting = $state(false);
	let actionStatus = $state<'success' | 'error' | null>(null); // State for success/error message

	// Effect to handle form submission results (mainly resetting state now)
	$effect(() => {
        // Sync state with form prop when it changes (e.g., after action returns)
		// This handles repopulating the form on error
		// Note: The effect now correctly depends on the top-level 'form' prop
		name = form?.name ?? name;
		email = form?.email ?? email;
		message = form?.message ?? message;
		newsletter = form?.newsletter ?? newsletter;

		// --- DEBUG LOG --- 
		// console.log('Form prop updated in $effect:', form);
		// --- END DEBUG LOG ---

		if (actionStatus === 'success' || actionStatus === 'error') {
			// Reset submitting state when actionStatus changes
			submitting = false; 
		}

		// No longer need to clear fields or reset actionStatus here,
		// as the form will be hidden on success.
	});

</script>

<svelte:head>
	<title>Contact - Charlie Dean</title>
</svelte:head>

<article>
	<hgroup>
		<h1 class="editorial-headline">Contact</h1>
	</hgroup>
	<div class="prose">
		<p>You can reach me via email at <a href="mailto:charlie@charliedean.com">charlie@charliedean.com</a>, or via the form below.
        My Instagram is <a href="https://www.instagram.com/charlie.f.dean">@charlie.f.dean</a>.</p>
		<div class="container">
			{#if actionStatus !== 'success'}
				<form
					id="contact-form"
					method="POST"
					use:enhance={({ formData }) => {
						submitting = true; // Set submitting state
						actionStatus = null; // Reset status on new submission
						return async ({ result, update }) => {
							// Enhance callback - update will trigger the $effect above
							await update();
							// --- DEBUG LOG in enhance ---
							console.log('Action result in enhance:', result);
							// --- END DEBUG LOG ---

							// Manually set status based on result
							if (result.type === 'success' && result.data?.success) {
								actionStatus = 'success';
								// Navigate on success, passing promptKey and userName
								// Get name directly from submitted form data
								const submittedName = formData.get('name') as string ?? '';
								const targetUrl = `/e-charlie?promptKey=contact&userName=${encodeURIComponent(submittedName)}`;
								console.log('Navigating to:', targetUrl); // Add log
								goto(targetUrl);
							} else if (result.type === 'failure') {
								// Action ran but returned fail(), check result.data.error
								actionStatus = 'error'; // Indicate an error occurred
							} else if (result.type === 'error') {
								// Network/server error before action could run
								console.error('Form submission error:', result.error); // Log the actual error
								actionStatus = 'error'; // Indicate an error occurred
							} else if (result.type === 'redirect') {
								// Handle redirects if necessary
								submitting = false; // Ensure submitting is reset if we don't navigate
							} else {
								// Optional: handle unexpected result types or states without success/error
								submitting = false; // Ensure submitting is reset
							}

							// Note: submitting state is now reset via the $effect watching actionStatus
						};
					}}
				>
					<div class="fax-field-workaround" aria-hidden="true">
						<label for="fax">Fax:</label>
						<input
							type="text"
							id="fax"
							name="fax"
							tabindex="-1"
							autocomplete="off"
							value=''
						/>
					</div>
					<div>
						<label for="name">Name</label>
						<input
							type="text"
							name="name"
							id="name"
							required
							disabled={submitting}
							bind:value={name}
							aria-invalid={!!form?.error}
						/>
					</div>
					<div>
						<label for="email">Email</label>
						<input
							type="email"
							name="email"
							id="email"
							required
							disabled={submitting}
							bind:value={email}
							aria-invalid={!!form?.error}
						/>
					</div>
					<div>
						<label for="message">Message</label>
						<textarea
							name="message"
							id="message"
							required
							disabled={submitting}
							bind:value={message}
							aria-invalid={!!form?.error}
						></textarea>
					</div>
					<div>
						<input
							type="checkbox"
							class="checkbox"
							name="newsletter"
							id="newsletter"
							disabled={submitting}
							bind:checked={newsletter}
						/>
						<label for="newsletter" class="checkbox-label">Subscribe to an occasional newsletter</label>
					</div>
					<button type="submit" class="button primary" disabled={submitting}>
						{#if submitting}
							Sending...
						{:else}
							Send
						{/if}
					</button>
				</form>
			{/if}

			{#if actionStatus === 'error'}
				<div class="status-message error" >
					<!-- Display error from form prop if available (populated by $effect), otherwise a generic message -->
					<strong>Error:</strong> { form?.error ?? 'Submission failed. Please check your input.' }
				</div>
			{/if}

			{#if actionStatus === 'success'}
				<div class="status-message success">
					Message sent successfully. I'll get back to you as soon as possible.
				</div>
			{/if}
		</div>
	</div>
</article>

<style>
	/* --- Honeypot Styling --- */
	/* Make the honeypot absolutely inaccessible to normal users */
	.fax-field-workaround {
		position: absolute !important;
		height: 1px;
		width: 1px;
		overflow: hidden;
		clip: rect(1px, 1px, 1px, 1px);
		white-space: nowrap; /* Prevent line breaks */
		/* Move it far off-screen */
		left: -5000px;
	}
	/* --- End Honeypot Styling --- */


    /* Add styles for your existing classes if needed, e.g., disable state for .button */
    .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    /* You might need similar styles for .checkbox:disabled + .checkbox-label */
    input:disabled, textarea:disabled {
        background-color: #e9ecef; /* Example disabled style */
        cursor: not-allowed;
    }

</style>