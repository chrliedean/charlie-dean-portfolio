<script context="module">
  export const windowMeta = {
  id: 'portfolio',
  title: 'Portfolio',
  route: '/portfolio',
  defaultSize: {width: 600, height: 400},
  icon: 'folder',
  style: 'nopadding'
};
</script>
<script lang="ts">
  import { onMount } from "svelte";
  import SmartLink from "$lib/components/SmartLink.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import { formatDate } from "$lib/utils";
  import { portfolioStore } from "$lib/stores/portfolioStore";
  import { goto } from "$app/navigation";
  
  // When loaded normally, SvelteKit injects load data as the 'data' prop.
  export let data: { posts: any[] } | null = null;
  
  // The posts array (fetched from the server or onMount)
  let posts: any[] = [];
  
  // If load data is provided, update posts and store it.
  $: if (data && data.posts) {
    posts = data.posts;
    portfolioStore.set(data);
  }
  
  onMount(async () => {
    // If posts are not provided (e.g. opened dynamically) then fetch them.
    if (!posts.length) {
      try {
        console.log("Fetching posts from API");
        const res = await fetch("/api/portfolio-files");
        if (res.ok) {
          const fetchedPosts = await res.json();
          posts = fetchedPosts;
          portfolioStore.set({ posts: fetchedPosts });
          console.log("Posts fetched successfully:", posts);
        } else {
          console.error("Failed to fetch posts, status:", res.status);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    } else {
      console.log("Using server-provided posts:", posts);
    }
  });
  
  // Sorting state:
  let sortKey: string = "date";  // default sort key
  let sortOrder: "desc" | "asc" = "desc";
  
  // Create a reactive sortedPosts array.
  $: sortedPosts = [...posts].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    
    // If sorting by date, compare Date objects.
    if (sortKey === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  
  // Function to handle header clicks.
  function toggleSort(key: string) {

    //Gets all cells who's class match key
    const cells = document.querySelectorAll(`th.${key}, td.${key}`);

    // Remove active class from all cells
    document.querySelectorAll("th, td").forEach(cell => {
      cell.classList.remove("active");
    });
    // Add active class to the clicked cells
    cells.forEach(cell => {
      cell.classList.add("active");
    });

    if (sortKey === key) {
      // Same column: toggle sort order.
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      // New column: set key and default to ascending.
      sortKey = key;
      sortOrder = "asc";
      
    }
  }

  function removeFocusClass() {
    const cells = document.querySelectorAll("th, td");
    cells.forEach(cell => {
      cell.classList.remove("active");
    });
  }
</script>

<section>
  {#if sortedPosts.length > 0}
    <table class="file-list">
      <thead>
        <tr>
          <!-- Attach a click handler to sort by title -->
          <th scope="col" class="title" colspan="2" tabindex="0" onclick={() => toggleSort("title")} >
            Name 
          </th>
          <!-- Sort by date -->
          <th scope="col" class= "date" tabindex="0" onclick={() => toggleSort("date")} >
            Date Modified 
          </th>
          <!-- Sort by kind (medium) -->
          <th scope="col" class="medium" tabindex="0" onclick={() => toggleSort("categories")} >
            Kind 
          </th>
          <!-- Sort by size -->
          <th scope="col" class="size" tabindex="0" onclick={() => toggleSort("size")} onfocus={() => toggleSort("size")}>
            Size
            </th>
          <th scope="col" class="sorticon" tabindex="0"></th>
        </tr>
      </thead>
      <tbody>
        {#each sortedPosts as post (post.id)}
          <tr class="file" tabindex="0" onfocus={removeFocusClass} onblur={removeFocusClass} ondblclick={() => goto(post.route)}>
            <td class="icon title"> 
              <Icon size="1.5em" name={post.icon}/>
            </td>
            <th scope="row" class="text title">
              <SmartLink href={post.route} classname="title">
                <span>{post.title}</span>
              </SmartLink>
            </th>
            <td class="date">{formatDate(post.date ?? '')}</td>
            <td class="medium">{post.categories[0]}</td>
            <td class="size">{post.size} 0 K</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>Loading portfolio items...</p>
  {/if}
</section>

