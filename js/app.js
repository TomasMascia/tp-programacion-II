// 1. ESTADO DE LA APLICACIÓN
let allGames = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// 2. REFERENCIAS DEL DOM
const gamesContainer = document.getElementById("games-container");
const searchInput = document.getElementById("search-input");
const noResults = document.getElementById("no-results");
const themeBtn = document.getElementById("theme-page");
const themeIcon = document.getElementById("theme-icon");

// 3. CARGA ASÍNCRONA DE DATOS
async function loadGames() {
    try {
        // Carga el json ubicado en la raíz del proyecto
        const response = await fetch("../data/games.json");

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        allGames = await response.json();
        renderGames(allGames);
        openGames();
    } catch (error) {
        console.error("Error al cargar games.json:", error);
        gamesContainer.innerHTML = `
            <div class="no-results">
                <p>No se pudo cargar el archivo games.json.</p>
                <small>Asegúrate de estar usando un servidor local (Live Server).</small>
            </div>
        `;
    }
}

// 4. RENDERIZADO DINÁMICO DE TARJETAS
function renderGames(games) {
    gamesContainer.innerHTML = "";

    if (games.length === 0) {
        noResults.classList.remove("hidden");
        return;
    }

    noResults.classList.add("hidden");

    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const card = document.createElement("article");
        card.className = "game-card";

        // Mapeo de los géneros del array
        const badgesHTML = (game.genre || [])
            .map(g => `<span class="badge">${g}</span>`)
            .join("");

        const genres = game.genre;
        // Tratamiento de precio 0 como Gratis
        const priceLabel = game.price === 0 ? "Gratis" : `$${game.price.toFixed(2)}`;

        // Estado inicial del botón de favoritos
        const isWishlisted = wishlist.includes(game.id);
        const heartIcon = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const heartActiveClass = isWishlisted ? "active" : "";

        card.innerHTML = `
        <a class="total-card">
            <div class="card-media">
                <img src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/460x215?text=Sin+Imagen'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${game.title}</h3>
                <div class="card-genres">
                ${genres.map(g => {
            return `<span class="badge">${g}</span>`
        }).join("")}</div>
                <p class="card-price">${priceLabel}</p>
                <div class="card-actions">
                    <button type="button" class="btn-add-cart" data-id="${game.id}">
                        <i class="fa-solid fa-cart-plus"></i> Comprar
                    </button>
                    <button type="button" class="btn-add-wishlist ${heartActiveClass}" data-id="${game.id}" aria-label="Añadir a lista de deseados">
                        <i class="${heartIcon}"></i>
                    </button>
                </div>
            </div>
        </a>
        `;

        fragment.appendChild(card);
    });

    gamesContainer.appendChild(fragment);
}


function openGames() {
    const cardsGames = document.querySelectorAll(".total-card");
    console.log(cardsGames);
    cardsGames.forEach(game => {
        game.addEventListener("click", (e) => {
            const titulo = game.querySelector(".card-genres");
            console.log(titulo.textContent);
        });
    })

}



// INICIALIZACIÓN
function init() {
    loadGames();

    // Listeners
    searchInput.addEventListener("input", handleSearch);
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
}

document.addEventListener("DOMContentLoaded", init);