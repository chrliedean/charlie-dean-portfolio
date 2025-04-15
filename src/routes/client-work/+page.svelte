<script context="module">
  export const windowMeta = {
    id: "client-work",
    title: "Client Work",
    route: "/client-work",
    style: "reader",
    icon: "excel",
    defaultSize: { width: 800, height: 600 },
  };
</script>

<script>
  import SmartLink from "$lib/components/SmartLink.svelte";
</script>

<svelte:head>
  <title>Client Work - Charlie Dean</title>
  <meta
    name="description"
    content="Charlie Dean is available for hire for a variety of fabrication, set design, production design, and web design work. Please contact him for more information."
  />
</svelte:head>

<article>
  <hgroup>
    <h1 class="editorial-headline">Client Work</h1>
  </hgroup>
  <div class="prose">
    <p>
      I'm available for a variety of props fabrication, set design, production design,
      and web design work. A more comprehensive list of my past work-for-hire is
      coming to this page soon. For now, please feel free to consult my
      <SmartLink href="/about/cv">CV</SmartLink> for a list of some previous clients
      and projects.
    </p>
    <p>
        Do you have a project you think I could help with? Please reach out-- get in touch at my <SmartLink href="/contact">Contact Page.</SmartLink>
    </p>
    <p>Some selections of past work include:</p>
    <p>
        <SmartLink href="/browser?url=https://www.youtube.com/embed/tNXJvlUI48Q?si=TV2ZyVWfV5JwmJmh">The Trenchies - Talk Show</SmartLink>
        - I was approached by Chicago band The Trenchies to serve as production designer for their music
        video <em>Talk Show.</em> I designed and fabricated a low-rent, public access talk show television set.
    <p>
      <SmartLink href="/browser?url=https://mellfin.org"
        >MELLFIN Website</SmartLink>
       - the Maryland ELL Family Involvement Network approached me to create an updated website to serve 
       as a resource for families and educators of English Language Learners in Maryland. MELLFIN required a 
       website that was easy to update and maintain, and that could be easily extended to support additional 
       resources in the future.
    </p>
  </div>
</article>
