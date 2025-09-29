const categories = {
  home: [
    "https://archive.org/details/movies",
    "https://archive.org/details/tv",
    "https://archive.org/details/cartoons",
    "https://archive.org/details/sports",
    "https://archive.org/details/sportstelevision"
  ],
  tv: "https://archive.org/details/tv",
  movies: "https://archive.org/details/movies",
  cartoons: "https://archive.org/details/cartoons",
  sports: "https://archive.org/details/sports",
  sportstelevision: "https://archive.org/details/sportstelevision"
};

let currentCategory = "tv"; // Default category
let page = 1;
let loading = false;

// Fetch videos from Archive.org
async function fetchVideos(url, page = 1) {
  try {
    const response = await fetch(`${url}?page=${page}&output=json`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching videos:", error);
    return { docs: [] };
  }
}

// Render videos
function renderVideos(videos, container, append = false, sortType = null) {
  let videoList = [...videos];

  // Apply sorting if category = sports
  if (sortType === "alpha-desc") {
    videoList.sort((a, b) => {
      let titleA = (a.title || "").toLowerCase();
      let titleB = (b.title || "").toLowerCase();
      return titleB.localeCompare(titleA);
    });
  }

  const videoHTML = videoList.map(video => `
    <div class="video-card">
      <img src="https://archive.org/services/img/${video.identifier}" alt="${video.title}">
      <h3>${video.title || "Untitled"}</h3>
      <div class="buttons">
        <a href="https://archive.org/download/${video.identifier}" target="_blank">Download</a>
        <a href="https://archive.org/details/${video.identifier}" target="_blank">Stream</a>
      </div>
    </div>
  `).join("");

  if (append) {
    container.innerHTML += videoHTML;
  } else {
    container.innerHTML = videoHTML;
  }
}

// Load category
async function loadCategory(category) {
  currentCategory = category;
  page = 1;
  document.getElementById("category-title").textContent = 
    category === "home" ? "🏠 Home" : `📂 ${category.toUpperCase()}`;
  const grid = document.getElementById("video-grid");
  grid.innerHTML = "";

  if (category === "home") {
    // Show 4 videos per category
    for (let cat in categories) {
      if (cat !== "home") {
        const data = await fetchVideos(categories[cat], 1);
        renderVideos(data.docs.slice(0, 4), grid, true);
      }
    }
  } else {
    const data = await fetchVideos(categories[category], page);
    let sortType = category === "sports" ? "alpha-desc" : null;
    renderVideos(data.docs, grid, false, sortType);
  }
}

// Infinite scrolling
window.addEventListener("scroll", async () => {
  if (loading) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loading = true;
    page++;
    const data = await fetchVideos(categories[currentCategory], page);
    let sortType = currentCategory === "sports" ? "alpha-desc" : null;
    renderVideos(data.docs, document.getElementById("video-grid"), true, sortType);
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
      const data = await fetchVideos(categories[cat], 1);
      allVideos = allVideos.concat(data.docs.slice(0, 3));
    }
  }

  renderVideos(allVideos, trendingDiv);
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadTrending();
  await loadCategory("tv"); // Default load TV
});
