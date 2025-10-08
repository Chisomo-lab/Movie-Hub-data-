document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-container");

  // Sample games (you can add more)
  const games = [
    {
      title: "Friday Night Funkin'",
      embed: "https://itch.io/embed/792778",
      link: "https://ninja-muffin24.itch.io/funkin"
    },
    {
      title: "Tiny Crate",
      embed: "https://itch.io/embed/1907025",
      link: "https://venbrux.itch.io/tiny-crate"
    },
    {
      title: "A Dark Forest",
      embed: "https://itch.io/embed/1907027",
      link: "https://mcgonagall.itch.io/a-dark-forest"
    },
    {
      title: "ROTA: Bend Gravity",
      embed: "https://itch.io/embed/1907026",
      link: "https://benj.itch.io/rota"
    },
    {
      title: "SuperTux Classic",
      embed: "https://itch.io/embed/1907024",
      link: "https://supertux.itch.io/supertux"
    }
  ];

  // Render games
  games.forEach(game => {
    const card = document.createElement("div");
    card.classList.add("game-card");
    card.innerHTML = `
      <h3>${game.title}</h3>
      <iframe src="${game.embed}" frameborder="0"></iframe>
      <div class="buttons">
        <a href="${game.embed}" target="_blank" class="play-btn">▶ Play</a>
        <a href="${game.link}" target="_blank" class="download-btn">⬇ Download</a>
      </div>
    `;
    gameContainer.appendChild(card);
  });
});