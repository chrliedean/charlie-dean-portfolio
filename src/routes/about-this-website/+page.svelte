<script context="module">
  export const windowMeta = {
    id: "about-this-website",
    title: "About This Website",
    route: "/about-this-website",
    resizable: false,
    icon: "website",
    defaultSize: {
      width: 300,
    },
    style: "reader",
  };
</script>

<script>
  import { version, dev } from "$app/environment";
</script>

<svelte:head>
  <title>About This Website - Charlie Dean</title>
</svelte:head>
<article>
  <hgroup class="compact">
    <div class="columns">
      <div class="column">
        <h2>charliedean.com</h2>
        <p>Version {version}</p>
      </div>
      <div class="column">
        <img src="/img/square-logo-cd.png" alt="logo" />
      </div>
    </div>
  </hgroup>
  <div class="prose sans">
    <p>
      charliedean.com is built with <a href="https://svelte.dev" target="_blank"
        >Svelte</a
      >. It's hosted with
      <a href="https://vercel.com" target="_blank">Vercel</a>
      and serves video from
      <a href="https://cloudflare.com" target="_blank">Cloudflare Stream</a>.
    </p>
    <h3>Acknowledgements</h3>
    <ul>
      <li>
        <a href="https://videojs.com" target="_blank">Video.js</a> - I use it to
        play videos on the site.
      </li>
      <li>
        <a href="https://swallowmygraphicdesign.com/" target="_blank"
          >Michael Feeney</a
        >
        and his fantastic
        <a
          href="https://www.figma.com/community/file/966779730364082883"
          target="_blank">Mac OS9 UI Kit.</a
        >
      </li>
      <li>
        <a href="https://rapport.cloud" target="_blank">Rapport</a> - powers
        E-Charlie along with
        <a href="https://elevenlabs.io" target="_blank">ElevenLabs</a>
        and a certain
        <a href="https://openai.com" target="_blank">large language model</a>.
      </li>
      <li>
        <a href="https://github.com/EHowardHill" target="_blank">Ethan Hill</a>
        for making a nice collection of the Mac OS9
        <a
          href="https://github.com/EHowardHill/Mac-OS-9-Platinum-Sounds"
          target="_blank">Platinum Sounds</a
        >.
      </li>
    </ul>
  </div>
</article>
