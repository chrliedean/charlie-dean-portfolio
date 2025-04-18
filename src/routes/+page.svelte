<script context="module">
  export const windowMeta = {
    id: "home",
    title: "Home",
    icon: "home",
    route: "/",
    defaultSize: { width: 800, height: 600 },
    style: "reader center nopadding",
  };
</script>

<script>
  import SmartLink from "$lib/components/SmartLink.svelte";
</script>

<svelte:head>
  <title>Charlie Dean</title>
  <meta
    name="description"
    content="Charlie Dean is an artist and fabricator working in Chicago, Illinois."
  />
</svelte:head>
<div class="background-container" style="background-image: url('img/pages/homepage.avif');">
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
      <div class="container">
        <SmartLink href="/portfolio" classname="button primary w-button"
          >Open Portfolio</SmartLink
        >
        <SmartLink href="/client-work" classname="button w-button"
          >View Client Work</SmartLink
        >
      </div>
    </div>
  </article>
</div>
