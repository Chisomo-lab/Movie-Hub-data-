async function showCategory(category) {
    categorySection.innerHTML = "";
    let catLinks = categories[category];
    if(!Array.isArray(catLinks)) catLinks = [catLinks];

    const grid = document.createElement("div");
    grid.className = "video-grid";
    if(category === "anime") grid.classList.add("anime"); // Anime grid smaller
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

// For Home section, add anime class if video is anime
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
