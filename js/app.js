const gamesContainer = document.getElementById("games-container");
const searchInput = document.getElementById("search-input");
const noResultsMessage = document.getElementById("no-results");

let gamesCollection = [];

async function loadGamesData() {
  try {
    const response = await fetch("../data/games.json");

    if (!response.ok) {
      throw new Error(`Fallo de red: ${response.status} ${response.statusText}`);
    }

    gamesCollection = await response.json();
    renderCatalog(gamesCollection);
  } catch (error) {
    console.error("Error crítico durante la carga de juegos:", error);
    if (gamesContainer) {
      gamesContainer.innerHTML = `
        <p style="color: #ef4444; grid-column: 1/-1; text-align: center;">
          No fue posible cargar el catálogo. Comprueba la conexión o la ruta de 'data/games.json'.
        </p>
      `;
    }
  }
}

function renderCatalog(games) {
  if (!gamesContainer) return;
  gamesContainer.innerHTML = "";

  if (games.length === 0) {
    if (noResultsMessage) noResultsMessage.classList.remove("hidden");
    return;
  }

  if (noResultsMessage) noResultsMessage.classList.add("hidden");

  const cardsTemplate = games.map((game) => {
    const isFree = game.price === 0;
    const priceDisplay = isFree ? "Gratis" : `$${game.price.toFixed(2)}`;
    const priceClass = isFree ? "card-price free" : "card-price";

    return `
      <article class="game-card" data-id="${game.id}">
        <img 
          class="game-cover" 
          src="${game.image}" 
          alt="Portada oficial de ${game.title}" 
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/460x215?text=Imagen+No+Disponible'"
        >
        <div class="card-body">
          <h2 class="card-title">${game.title}</h2>
          <span class="card-genre">${game.genre}</span>
          <div class="card-footer">
            <span class="${priceClass}">${priceDisplay}</span>
            <button class="btn-detail" type="button">Ver ficha</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  gamesContainer.innerHTML = cardsTemplate;
}

function filterGames(event) {
  const searchTerm = event.target.value.toLowerCase().trim();

  const matchedGames = gamesCollection.filter((game) => {
    const titleMatch = game.title.toLowerCase().includes(searchTerm);
    const genreMatch = game.genre.toLowerCase().includes(searchTerm);
    return titleMatch || genreMatch;
  });

  renderCatalog(matchedGames);
}

if (searchInput && gamesContainer) {
  searchInput.addEventListener("input", filterGames);
  loadGamesData();
}




/* incio_novedades */


document.addEventListener("DOMContentLoaded", () => {
    const gamesGrid = document.querySelector(".games-grid");

    if (gamesGrid) {
        fetch("./data/games.json")
            .then(response => response.json())
            .then(games => {
                gamesGrid.innerHTML = "";
            
                const ids_novedades = [1, 3, 5, 12];
                const novedades = games.filter(game => ids_novedades.includes(game.id));
                novedades.forEach(game => {
                    const article = document.createElement("article");
                    article.classList.add("game-card");

                    article.innerHTML = `
                        <img src="${game.image}" alt="${game.title}" class="game-cover">
                        <div class="card-body">
                            <h3 class="card-title">${game.title}</h3>
                            <span class="card-genre">${game.genre}</span>
                            <div class="card-footer">
                            </div>
                        </div>
                    `;

                    gamesGrid.appendChild(article);
                });
            })
            .catch(error => console.error("Error al cargar los juegos:", error));
    }
});