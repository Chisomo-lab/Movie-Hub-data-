const categories = {
    home: ["sports", "tv", "movies", "cartoons", "anime"],
    sports: "sports",
    sportstelevision: "sportstelevision",
    tv: "television_inbox",
    movies: "moviesandfilms",
    cartoons: ["animation_unsorted", "more_animation"],
    anime: ["anime", "anime_miscellaneous"]
};

let currentCategory = "home";
const trendingSection = document.getElementById("trending");
const homeSection = document.getElementById("home-videos");
const categorySection = document.getElementById("category-videos");

// Create a video card element
function createVideoCard(video) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">
        <h4>${video.title}</h4>
        <button onclick="playVideo('${video.url}')">Stream</button>
        <button onclick="downloadVideo('${video.url}')">Download</button>
    `;
    return card;
}

// Play video inside app
function playVideo(url) {
    categorySection.innerHTML = `
        <video controls autoplay>
            <source src="${url}" type="video/mp4">
            Your browser does not support HTML5 video.
        </video>
    `;
}

// Download function (opens in new tab)
function downloadVideo(url) {
    window.open(url, "_blank");
}

// Fetch videos from archive.org
async function fetchVideos(identifier, limit=4, page=1) {
    const url = `https://archive.org/advancedsearch.php?q=collection:${identifier}&fl[]=identifier,title,downloads,mediatype&rows=${limit}&page=${page}&output=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if(!data.response.docs) return [];
        return data.response.docs.map(item => ({
            title: item.title,
            thumbnail: `https://archive.org/services/get-item-image.php?identifier=${item.identifier}&mediatype=movies&thumb=1`,
            url: `https://archive.org/download/${item.identifier}/${item.identifier}_archive.mp4` // direct playable link
        }));
    } catch (e) {
        console.error("Error fetching videos:", e);
        return [];
    }
}

// Show trending videos (horizontal scroll)
async function showTrending() {
    trendingSection.innerHTML = "";
    const trendingVideos = await fetchVideos(categories.home[0], 6);
    trendingVideos.forEach(video => trendingSection.appendChild(createVideoCard(video)));
}

// Show home videos (4 per category)
async function showHome() {
    homeSection.innerHTML = "";
    for (let cat in categories) {
        if(cat === "home") continue;
        let catLinks = categories[cat];
        if(!Array.isArray(catLinks)) catLinks = [catLinks];

        for(const link of catLinks){
            const videos = await fetchVideos(link, 4);
            const grid = document.createElement("div");
            grid.className = "video-grid";
            if(link.includes("anime")) grid.classList.add("anime"); // smaller for anime
            videos.forEach(v => grid.appendChild(createVideoCard(v)));
            homeSection.appendChild(grid);
        }
    }
}

// Show selected category with infinite scroll
async function showCategory(category) {
    categorySection.innerHTML = "";
    let catLinks = categories[category];
    if(!Array.isArray(catLinks)) catLinks = [catLinks];

    const grid = document.createElement("div");
    grid.className = "video-grid";
    if(category === "anime") grid.classList.add("anime"); // anime smaller
    categorySection.appendChild(grid);

    let page = 1;
    let loading = false;

    async function loadVideos() {
        if(loading) return;
        loading = true;
        for(const link of catLinks){
            let videos = await fetchVideos(link, 10, page);

            if(category === "sports") {
                // Sort football first, then descending by year
                videos.sort((a, b) => {
                    const titleA = a.title.toLowerCase();
                    const titleB = b.title.toLowerCase();
                    const yearA = parseInt(a.title.match(/\d{4}/));
                    const yearB = parseInt(b.title.match(/\d{4}/));

                    if(titleA.includes("football") && !titleB.includes("football")) return -1;
                    if(!titleA.includes("football") && titleB.includes("football")) return 1;

                    return (yearB || 0) - (yearA || 0);
                });
            }

            videos.forEach(v => grid.appendChild(createVideoCard(v)));
        }
        page++;
        loading = false;
    }

    await loadVideos();

    window.onscroll = async () => {
        if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            await loadVideos();
        }
    }
}

// Nav bar click events
document.querySelectorAll(".nav-links li").forEach(li => {
    li.addEventListener("click", async () => {
        document.querySelectorAll(".nav-links li").forEach(x => x.classList.remove("active"));
        li.classList.add("active");
        currentCategory = li.dataset.category;
        if(currentCategory === "home"){
            categorySection.innerHTML = "";
            await showHome();
        } else {
            homeSection.innerHTML = "";
            await showCategory(currentCategory);
        }
    });
});

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
    e.target.style.color = "#fff"; // letters visible in white
});

document.getElementById("searchInput").addEventListener("keypress", async (e) => {
    if(e.key === "Enter"){
        categorySection.innerHTML = "";
        const query = e.target.value.trim();
        if(!query) return;

        // fetch 50 videos from first category (home)
        const videos = await fetchVideos(categories.home[0], 50);
        const filtered = videos.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));

        const grid = document.createElement("div");
        grid.className = "video-grid";
        filtered.forEach(v => grid.appendChild(createVideoCard(v)));
        categorySection.appendChild(grid);
    }
});

// Initialize
showTrending();
showHome();
