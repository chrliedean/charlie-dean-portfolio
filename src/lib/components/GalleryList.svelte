<script>
	const imageModules = import.meta.glob(
		'/static/img/portfolio/maintenance/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
		{
			eager: true,
			query: {
				enhanced: true
			}
		}
	)
    const images = Object.entries(imageModules).map(([path, module]) => ({
        path,
        module
    }))
</script>
{#each images as { path, module }}
    <enhanced:img src={path} alt="" class="image" />
{/each}
   
