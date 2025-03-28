<script>
  import SmartLink from "$lib/components/SmartLink.svelte";
</script>
<script context="module">
  export const windowMeta= {
    id: 'home',
    title: '🏠 Home',
    route: '/',
    defaultSize: {width: 800, height: 600}
  };
  </script>
<svelte:head>
	<title>Charlie Dean - Home</title>
	<meta name="description" content="This is where the description goes for SEO" />
</svelte:head>
<h2 class="editorial-headline">Charlie Dean is an artist from Baltimore, Maryland currently living and working in Chicago, Illinois.</h2>
        <p class="paragraph">You have reached his personal website. Selected materials are available for online viewing.</p>
        <SmartLink href="/portfolio" classname="button primary w-button">Open Portfolio</SmartLink>
        <a href="#" class="button w-button">View Client Work</a>
        <figure><img src="/img/donotuse.avif" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px" alt="hello" class="image">
          <figcaption class="caption">I&#x27;m Only Sleeping, 2022</figcaption>
</figure>