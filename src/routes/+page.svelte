<script context="module">
  export const windowMeta = {
    id: "home",
    title: "🏠 Home",
    route: "/",
    defaultSize: { width: 800, height: 600 },
    style: "reader",
  };
</script>

<script>
  import SmartLink from "$lib/components/SmartLink.svelte";
</script>

<svelte:head>
  <title>Charlie Dean - Home</title>
  <meta
    name="description"
    content="This is where the description goes for SEO"
  />
</svelte:head>
<article>
  <hgroup>
    <h2 class="editorial-headline">
      Charlie Dean is an artist from Baltimore, Maryland currently living and
      working in Chicago, Illinois.
    </h2>
    <p class="paragraph">
      You have reached his personal website. Selected materials are available
      for online viewing.
    </p>
  </hgroup>
  <div class="prose">
    <SmartLink href="/portfolio" classname="button primary w-button"
      >Open Portfolio</SmartLink
    >
    <SmartLink href="/client-work" classname="button w-button">View Client Work</SmartLink>
    <figure>
      <enhanced:img
        src="/static/img/donotuse.avif"
        alt="hello"
      />
      <figcaption class="caption">I&#x27;m Only Sleeping, 2022</figcaption>
    </figure>
  </div>
</article>
