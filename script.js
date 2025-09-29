// Exact Archive.org category links
const categories = {
  home: [
    "https://archive.org/details/moviesandfilms",
    "https://archive.org/details/television_inbox",
    "https://archive.org/details/animationandcartoons",
    "https://archive.org/details/anime",
    "https://archive.org/details/sports",
    "https://archive.org/details/sportstelevision"
  ],
  tv: "https://archive.org/details/television_inbox",
  movies: "https://archive.org/details/moviesandfilms",
  cartoons: "https://archive.org/details/animationandcartoons",
  anime: "https://archive.org/details/anime",
  sports: "https://archive.org/details/sports",
  sportstelevision: "https://archive.org/details/sportstelevision"
};

let currentCategory = "tv"; // Default category
let page = 1;
let loading = false;

// Fetch and parse JSON data from Archive.org
async function fetchVideos(url, page = 1) {
  try {
    const response = await fetch(`${url}?page=${page}&output=json`);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleanText = text.replace(/^[^{]+/, "").replace(/[^}]+$/, "");
      data = JSON.parse(cleanText);
    }
    return data?.response?.docs || [];
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

// Render videos into a container
function renderVideos(videos, container, append = false, sortType = null) {
  let list = [...videos];

  if (sortType === "alpha-desc") {
    list.sort((a, b) => (b.title || "").toLowerCase().localeCompare((a.title || "").toLowerCase()));
  }

  const html = list.map(video => {
    const thumb = video.identifier 
      ? `https://archive.org/services/img/${video.identifier}` 
      : "https://via.placeholder.com/140x160?text=No+Thumbnail";
    return `
      <div class="video-card">
        <img src="${thumb}" alt="${video.title || "Untitled"}">
        <h3>${video.title || "Untitled"}</h3>
        <div class="buttons">
          <a href="https://archive.org/download/${video.identifier}" target="_blank">Download</a>
          <a href="https://archive.org/details/${video.identifier}" target="_blank">Stream</a>
        </div>
      </div>
    `;
  }).join("");

  if (append) container.innerHTML += html;
  else container.innerHTML = html;
}

// Load category videos
async function loadCategory(category) {
  currentCategory = category;
  page = 1;
  const grid = document.getElementById("video-grid");
  document.getElementById("category-title").textContent = 
    category === "home" ? "🏠 Home" : `📂 ${category.toUpperCase()}`;
  grid.innerHTML = "";

  if (category === "home") {
    // Show 4 videos per sub-category
    for (let cat in categories) {
      if (cat !== "home") {
        const videos = await fetchVideos(categories[cat]);
        renderVideos(videos.slice(0, 4), grid, true);
      }
    }
  } else {
    const videos = await fetchVideos(categories[category], page);
    const sortType = category === "sports" ? "alpha-desc" : null;
    renderVideos(videos, grid, false, sortType);
  }
}

// Infinite scrolling
window.addEventListener("scroll", async () => {
  if (loading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loading = true;
    page++;
    const videos = await fetchVideos(categories[currentCategory], page);
    const sortType = currentCategory === "sports" ? "alpha-desc" : null;
    renderVideos(videos, document.getElementById("video-grid"), true, sortType);
    loading = false;
  }
});

// Trending global mix
async function loadTrending() {
  const trendingDiv = document.getElementById("trending-videos");
  trendingDiv.innerHTML = "";
  let allVideos = [];
  for (let cat in categories) {
    if (cat !== "home") {
      const videos = await fetchVideos(categories[cat]);
      allVideos = allVideos.concat(videos.slice(0, 3));
    }
  }
  renderVideos(allVideos, trendingDiv);
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadTrending();
  await loadCategory("tv"); // Default category
});
