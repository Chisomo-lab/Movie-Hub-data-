const categories = {
    home: [
        "sports",
        "tv",
        "movies",
        "cartoons",
        "anime",
        "sportstelevision" // ✅ added
    ],
    sports: "sports",
    tv: "television_inbox",
    movies: "moviesandfilms",
    cartoons: ["animation_unsorted", "more_animation"],
    anime: ["anime", "anime_miscellaneous"],
    sportstelevision: "sportstelevision" // ✅ new category
};

let currentCategory = "home";
const trendingSection = document.getElementById("trending");
const homeSection = document.getElementById("home-videos");
const categorySection = document.getElementById("category-videos");

// Create a video card HTML element
function createVideoCard(video) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">
        <h4>${video.title}</h4>
        <button onclick="window.open('${video.url || video.link}','_blank')">Stream</button>
        <button onclick="window.open('${video.url || video.link}','_blank')">Download</button>
    `;
    return card;
}

// Fetch videos from archive.org collection
async function fetchVideos(identifier, limit=4, page=1) {
    const url = `https://archive.org/advancedsearch.php?q=collection:${identifier}&fl[]=identifier,title,downloads,mediatype&rows=${limit}&page=${page}&output=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if(!data.response.docs) return [];

        return data.response.docs.map(item => ({
            title: item.title,
            thumbnail: `https://archive.org/services/get-item-image.php?identifier=${item.identifier}&mediatype=movies&thumb=1`,
            url: `https://archive.org/details/${item.identifier}`
        }));
    } catch (e) {
        console.error("Error fetching videos:", e);
        return [];
    }
}

// Show trending
async function showTrending() {
    trendingSection.innerHTML = "";
    const trendingVideos = await fetchVideos(categories.home[0], 6);
    trendingVideos.forEach(video => trendingSection.appendChild(createVideoCard(video)));
}

// Show home videos
async function showHome() {
    homeSection.innerHTML = "";
    for (let cat in categories) {
        if(cat === "home") continue;
        let catLinks = categories[cat];
        if(!Array.isArray(catLinks)) catLinks = [catLinks];

        const header = document.createElement("h3");
        header.textContent = cat.toUpperCase();
        homeSection.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "video-grid";
        homeSection.appendChild(grid);

        for(const link of catLinks){
            const videos = await fetchVideos(link, 4);
            videos.forEach(v => grid.appendChild(createVideoCard(v)));
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
    categorySection.appendChild(grid);

    let page = 1;
    let loading = false;

    async function loadVideos() {
        if(loading) return;
        loading = true;
        for(const link of catLinks){
            let videos = await fetchVideos(link, 10, page);

            if(category === "sports") {
                // ✅ Sports sorted by year ↓ then alphabetically
                videos.sort((a, b) => {
                    const yearA = parseInt((a.title.match(/\d{4}/) || [0])[0]);
                    const yearB = parseInt((b.title.match(/\d{4}/) || [0])[0]);
                    if(yearB !== yearA) return yearB - yearA;
                    return a.title.localeCompare(b.title);
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

// Nav bar click
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

// Search form (hub + archive.org, one grid, deduplicated, loading)
document.getElementById("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = document.getElementById("searchInput").value.toLowerCase();
    categorySection.innerHTML = "";

    // Loading message
    const loading = document.createElement("p");
    loading.textContent = "Searching...";
    loading.style.textAlign = "center";
    loading.style.fontWeight = "bold";
    categorySection.appendChild(loading);

    const grid = document.createElement("div");
    grid.className = "video-grid";

    try {
        let allVideos = [];

        // 1. Hub search
        for (const cat of categories.home) {
            const videos = await fetchVideos(cat, 20);
            allVideos = allVideos.concat(videos);
        }

        // 2. Archive.org search
        const res = await fetch(
            `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,year&sort[]=year+desc&rows=20&page=1&output=json`
        );
        const data = await res.json();
        if(data.response.docs) {
            const archiveVideos = data.response.docs.map(v => ({
                title: v.title,
                link: `https://archive.org/details/${v.identifier}`,
                thumbnail: `https://archive.org/services/get-item-image.php?identifier=${v.identifier}&mediatype=movies&thumb=1`
            }));
            allVideos = allVideos.concat(archiveVideos);
        }

        // Deduplicate by title
        const unique = {};
        const filtered = allVideos.filter(v => {
            const key = v.title.toLowerCase().trim();
            if (unique[key]) return false;
            unique[key] = true;
            return v.title.toLowerCase().includes(query);
        });

        categorySection.innerHTML = ""; // remove loading
        if(filtered.length === 0){
            categorySection.innerHTML = `<p style="text-align:center;">No results found for "${query}"</p>`;
        } else {
            filtered.forEach(v => grid.appendChild(createVideoCard(v)));
            categorySection.appendChild(grid);
        }

    } catch (err) {
        console.error(err);
        categorySection.innerHTML = `<p style="text-align:center; color:red;">Error fetching results</p>`;
    }
});

// Initialize
showTrending();
showHome();
