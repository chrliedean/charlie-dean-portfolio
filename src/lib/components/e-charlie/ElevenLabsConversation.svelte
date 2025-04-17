<script lang="ts">
    import  { Conversation } from '@11labs/client'
    import { onMount, onDestroy } from 'svelte'

    let conversation: Conversation | null = null;

    onMount(async () => {
        conversation = await Conversation.startSession({
            agentId: 'JqxSmuRTrGAN7TCUR3ja'
        });
        console.log('Conversation started')
    })
    onDestroy(async () => {
        if (conversation) {
            await conversation.endSession()
            console.log('Conversation ended')
        }
    })


</script>
