// constantes para guardar los elementos del DOM por su ID
const gamesContainer = document.getElementById("games-container");
const searchInput = document.getElementById("search-input");
const noResultsMessage = document.getElementById("no-results");

// Crea una lista la cual esta vacia pero se va a llenar por los 40 juegos del JSON, para poder filtrar los juegos y mostrarlos en el catalogo
let gamesCollection = [];

// función asíncrona para cargar los datos de los juegos desde un archivo JSON
async function loadGamesData() {
  try {
    const response = await fetch("../data/games.json");
    console.log(response);

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

// función para renderizar el catálogo de juegos en el contenedor
function renderCatalog(games) {
  if (!gamesContainer) return; //si gamesContainer esta no existe sale de renderCatalog

  gamesContainer.innerHTML = ""; // limpia el contenedor de juegos

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
        <div class="container-image">
          <img class="image" src="${game.image}" alt="Portada oficial de ${game.title}" loading="lazy"
            onerror="this.src='https://via.placeholder.com/460x215?text=Imagen+No+Disponible'">
        </div>
        <div class="card-body">
          <h2 class="card-title">${game.title}</h2>
          ${game.genre.map(g => `<span class="card-genre">${g}</span>`).join("")}
          
          <div class="card-footer">
            <span class="${priceClass}">${priceDisplay}</span>
            <button class="btn-detail" type="button">Info</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  gamesContainer.innerHTML = cardsTemplate;
}


// función para filtrar los juegos según el término de búsqueda ingresado por el usuario
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