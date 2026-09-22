/**
 * APP.JS - GamesShop
 * Carga directa de juegos desde games.json, renderizado, búsqueda, carrito y deseados.
 */

// 1. ESTADO DE LA APLICACIÓN
let allGames = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// 2. REFERENCIAS DEL DOM
const gamesContainer = document.getElementById("games-container");
const searchInput = document.getElementById("search-input");
const noResults = document.getElementById("no-results");
const cartCounter = document.getElementById("cart-counter");
const themeBtn = document.getElementById("theme-page");
const themeIcon = document.getElementById("theme-icon");
const toastContainer = document.getElementById("toast-container");

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
    } catch (error) {
        console.error("Error al cargar games.json:", error);
        
        if (gamesContainer) {
            gamesContainer.innerHTML = `
                <div class="no-results">
                    <p>No se pudo cargar el archivo games.json.</p>
                    <small>Asegúrate de estar usando un servidor local (Live Server).</small>
                </div>
            `;
        }
    }
}

// 4. RENDERIZADO DINÁMICO DE TARJETAS
function renderGames(games) {
    if (!gamesContainer) return; // Si no hay contenedor en esta página, salimos de la función sin error

    gamesContainer.innerHTML = "";

    if (games.length === 0) {
        if (noResults) {
            noResults.classList.remove("hidden");
        }
        return;
    }

    if (noResults) {
        noResults.classList.add("hidden");
    }

    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const card = document.createElement("article");
        card.className = "game-card";

        // Mapeo de los géneros del array
        const badgesHTML = (game.genre || [])
            .map(g => `<span class="badge">${g}</span>`)
            .join("");

        // Tratamiento de precio 0 como Gratis
        const priceLabel = game.price === 0 ? "Gratis" : `$${game.price.toFixed(2)}`;

        // Estado inicial del botón de favoritos
        const isWishlisted = wishlist.includes(game.id);
        const heartIcon = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const heartActiveClass = isWishlisted ? "active" : "";

        card.innerHTML = `
            <div class="card-media">
                <img src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/460x215?text=Sin+Imagen'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${game.title}</h3>
                <div class="card-genres">${badgesHTML}</div>
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
        `;

        fragment.appendChild(card);
    });

    gamesContainer.appendChild(fragment);
}

// 5. MOTOR DE BÚSQUEDA Y FILTRADO
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();

    const filtered = allGames.filter(game => {
        const titleMatch = game.title.toLowerCase().includes(term);
        const genreMatch = (game.genre || []).some(g => g.toLowerCase().includes(term));
        return titleMatch || genreMatch;
    });

    renderGames(filtered);
}

// 6. DELEGACIÓN DE EVENTOS (CARRITO Y DESEADOS)
function handleContainerClicks(e) {
    const cartBtn = e.target.closest(".btn-add-cart");
    const wishlistBtn = e.target.closest(".btn-add-wishlist");

    if (cartBtn) {
        const gameId = parseInt(cartBtn.dataset.id, 10);
        addToCart(gameId);
    }

    if (wishlistBtn) {
        const gameId = parseInt(wishlistBtn.dataset.id, 10);
        toggleWishlist(gameId, wishlistBtn);
    }
}

function addToCart(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;

    cart.push(game);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounter();
    showToast(`"${game.title}" agregado al carrito.`);
}

function toggleWishlist(gameId, buttonElement) {
    const game = allGames.find(g => g.id === gameId);
    const index = wishlist.indexOf(gameId);
    const icon = buttonElement.querySelector("i");

    if (index === -1) {
        wishlist.push(gameId);
        icon.className = "fa-solid fa-heart";
        buttonElement.classList.add("active");
        showToast(`"${game.title}" agregado a deseados.`);
    } else {
        wishlist.splice(index, 1);
        icon.className = "fa-regular fa-heart";
        buttonElement.classList.remove("active");
        showToast(`"${game.title}" eliminado de deseados.`);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function updateCartCounter() {
    if (cartCounter) {
        cartCounter.textContent = `(${cart.length})`;
    }
}

// 7. NOTIFICACIONES EMERGENTES (TOAST)
function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 8. CONTROL DEL TEMA (LIGHT / DARK)
function initTheme() {
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    renderThemeIcon(currentTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    renderThemeIcon(next);
}

function renderThemeIcon(theme) {
    if (!themeIcon) return;
    themeIcon.className = theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
}

// 9. INICIALIZACIÓN
function init() {
    initTheme();
    updateCartCounter();
    loadGames();

    // Listeners protegidos
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }
    if (gamesContainer) {
        gamesContainer.addEventListener("click", handleContainerClicks);
    }
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }
}

document.addEventListener("DOMContentLoaded", init);

//FUNCION PARA ELEGIR LAS NOVEDADES DEL INICIO

/* incio_novedades */


document.addEventListener("DOMContentLoaded", () => {
    const gamesGrid = document.querySelector(".games-grid");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");

    if (gamesGrid) {
        fetch("./data/games.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar el JSON: ${response.status}`);
                }
                return response.json();
            })
            .then(games => {
                gamesGrid.innerHTML = "";
            
                const ids_novedades = [1, 3, 5, 12, 20, 8, 6]; 
                
                let novedades = games.filter(game => 
                    ids_novedades.includes(Number(game.id)) || ids_novedades.includes(game.id)
                );

                if (novedades.length === 0) {
                    novedades = games.slice(0, 6);
                }
                
                novedades.forEach(game => {
                    const article = document.createElement("article");
                    article.classList.add("game-card");

                    // Manejo seguro: detecta si genre es un Array o un String
                    let generosHTML = "";
                    if (Array.isArray(game.genre)) {
                        generosHTML = game.genre.map(genre => `<span class="badge">${genre.trim()}</span>`).join("");
                    } else if (typeof game.genre === "string") {
                        generosHTML = game.genre.split(",").map(genre => `<span class="badge">${genre.trim()}</span>`).join("");
                    } else {
                        generosHTML = `<span class="badge">Sin género</span>`;
                    }

                    article.innerHTML = `
                        <div class="card-media">
                            <img src="${game.image}" alt="${game.title}">
                        </div>
                        <div class="card-body">
                            <h3 class="card-title">${game.title}</h3>
                            <div class="card-genres">
                                ${generosHTML}
                            </div>
                            <div class="card-footer">
                            </div>
                        </div>
                    `;

                    gamesGrid.appendChild(article);
                });
            })
            .catch(error => {
                console.error("Hubo un error en el fetch:", error);
            });
    }

    if (btnPrev && btnNext) {
        const desplazamiento = 310;

        btnNext.addEventListener("click", () => {
            const grid = document.querySelector(".games-grid");
            if (grid) {
                grid.scrollBy({ left: desplazamiento, behavior: "smooth" });
            }
        });

        btnPrev.addEventListener("click", () => {
            const grid = document.querySelector(".games-grid");
            if (grid) {
                grid.scrollBy({ left: -desplazamiento, behavior: "smooth" });
            }
        });
    }
});