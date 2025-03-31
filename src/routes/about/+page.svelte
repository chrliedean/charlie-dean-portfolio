<script context="module">
  export const windowMeta = {
    id: "about",
    title: "About",
    route: "/about",
    style: "reader",
    icon: "help",
    defaultSize: { width: 800, height: 600 },
  };
</script>

<svelte:head>
  <title>Charlie Dean - About</title>
  <meta
    name="description"
    content="This is where the description goes for SEO"
  />
</svelte:head>

<article>
  <hgroup>
    <h1 class="editorial-headline">About</h1>
  </hgroup>
  <div class="prose">
    <figure class="max400">
      <enhanced:img
        src="/static/img/pages/charlie.jpg"
        alt="Charlie Dean"
      />
    </figure>
    <p>
      Charlie Dean is an artist and fabricator originally from Baltimore, MD and
      currently living and working in Chicago, IL. A graduate of the School of
      the Art Institute of Chicago, he received his BFA in 2023. Working in
      sculpture, video, and various new media technologies, much of his work
      responds to the way the infrastructure, systems, and artifacts of the
      built world influence our culture and behavior. He has exhibited in
      Chicago at Ars Electronica, SITE Galleries, and the SAIC Galleries, and in
      Baltimore at the Creative Alliance.
    </p>
    <p>
      He is a co-founder of Kiki & Bouba Galleries (currently on hiatus), an
      artist-run traveling gallery and collective.
    </p>

    <p>
      In addition to his studio practice, Dean also works as a freelance
      fabrication artist, set & props designer, videographer, and stagehand.
    </p>
  </div>
</article>
