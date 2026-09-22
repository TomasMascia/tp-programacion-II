// Variables globales
let allGames = [];
let cart = JSON.parse(localStorage.getItem("carrito")) || [];
let wishlist = JSON.parse(localStorage.getItem("deseados")) || [];

// DOM
const gamesContainer = document.getElementById("contenedor-juegos");
const searchInput = document.getElementById("buscador-juegos");
const noResults = document.getElementById("sin-resultados");
const toastContainer = document.getElementById("contenedor-notificaciones");

// Detalle del juego
const gameDetailBg = document.getElementById("fondo-juego");
const gameDetailTitle = document.getElementById("titulo-juego");
const gameDetailGenres = document.getElementById("generos-juego");
const gameDetailPrice = document.getElementById("precio-juego");
const gameDetailCover = document.getElementById("imagen-portada-juego");
const gameDetailTrailer = document.getElementById("video-trailer-juego");

// Generador de ruta relativa para detalle de juego según la ubicación actual
function getDetailPageUrl(gameId) {
    const enCarpetaPages = window.location.pathname.includes("/pages/") || window.location.pathname.includes("\\pages\\");
    return enCarpetaPages ? `./detalle-juego.html?id=${gameId}` : `./pages/detalle-juego.html?id=${gameId}`;
}

// Cargar datos desde games.json
async function fetchGamesData() {
    const rutas = ["../data/games.json", "./data/games.json", "/data/games.json"];
    for (const ruta of rutas) {
        try {
            const res = await fetch(ruta);
            if (res.ok) return await res.json();
        } catch (_) { }
    }
    throw new Error("No se pudo localizar el archivo games.json");
}

async function loadCatalog() {
    const contenedor = document.getElementById("contenedor-juegos") || gamesContainer;
    try {
        allGames = await fetchGamesData();
        renderCatalog(allGames);
    } catch (error) {
        console.error("Error al cargar games.json:", error);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="sin-resultados">
                    <p>No se pudo cargar el catálogo de juegos.</p>
                    <small>Asegúrate de ejecutar el proyecto desde un servidor local (Live Server).</small>
                </div>
            `;
        }
    }
}

// catálogo
function renderCatalog(games) {
    const contenedor = document.getElementById("contenedor-juegos") || gamesContainer;
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const mensajeSinResultados = document.getElementById("sin-resultados") || noResults;

    if (games.length === 0) {
        if (mensajeSinResultados) {
            mensajeSinResultados.classList.remove("oculto");
        }
        return;
    }

    if (mensajeSinResultados) {
        mensajeSinResultados.classList.add("oculto");
    }

    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-juego";

        const generos = Array.isArray(game.genre)
            ? game.genre
            : typeof game.genre === "string"
                ? game.genre.split(",")
                : [];

        const generosHTML = generos
            .map(g => `<span class="etiqueta">${g.trim()}</span>`)
            .join("");

        const precioTexto = Number(game.price) === 0 ? "Gratis" : `$${Number(game.price).toFixed(2)}`;
        const esDeseado = wishlist.includes(game.id);
        const iconoCorazon = esDeseado ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const claseActivo = esDeseado ? "activo" : "";

        tarjeta.innerHTML = `
            <a href="${getDetailPageUrl(game.id)}" class="enlace-tarjeta">
                <div class="imagen-tarjeta">
                    <img src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/460x215?text=Sin+Imagen'">
                </div>
                <div class="info-tarjeta">
                    <h3 class="titulo-tarjeta">${game.title}</h3>
                    <div class="generos-tarjeta">${generosHTML}</div>
                    <p class="precio-tarjeta">${precioTexto}</p>
                    <div class="botones-tarjeta">
                        <button type="button" class="btn-comprar" data-id="${game.id}">
                            <i class="fa-solid fa-cart-plus"></i> Comprar
                        </button>
                        <button type="button" class="btn-deseados ${claseActivo}" data-id="${game.id}" aria-label="Añadir a lista de deseados">
                            <i class="${iconoCorazon}"></i>
                        </button>
                    </div>
                </div>
            </a>
        `;

        fragment.appendChild(tarjeta);
    });

    contenedor.appendChild(fragment);
}


// busqueda y filtrado (complicaciones con el tema de acentos)
function handleSearch(e) {
    const texto = e.target.value.toLowerCase().trim();

    const filtrados = allGames.filter(game => {
        const coincideTitulo = (game.title || "").toLowerCase().includes(texto);
        const generos = Array.isArray(game.genre)
            ? game.genre
            : typeof game.genre === "string"
                ? game.genre.split(",")
                : [];
        const coincideGenero = generos.some(g => g.toLowerCase().includes(texto));
        return coincideTitulo || coincideGenero;
    });

    renderCatalog(filtrados);
}

// tema carrito
function handleCatalogClicks(e) {
    const btnComprar = e.target.closest(".btn-comprar, .btn-add-cart");
    const btnDeseados = e.target.closest(".btn-deseados, .btn-add-wishlist");

    if (btnComprar || btnDeseados) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (btnComprar) {
        const gameId = parseInt(btnComprar.dataset.id, 10);
        addToCart(gameId);
    }

    if (btnDeseados) {
        const gameId = parseInt(btnDeseados.dataset.id, 10);
        toggleWishlist(gameId, btnDeseados);
    }
}

function addToCart(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;

    cart.push(game);
    localStorage.setItem("carrito", JSON.stringify(cart));
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounter();
    showToast(`"${game.title}" agregado al carrito.`);
}

function toggleWishlist(gameId, botonElemento) {
    const game = allGames.find(g => g.id === gameId);
    const indice = wishlist.indexOf(gameId);
    const icono = botonElemento.querySelector("i");

    if (indice === -1) {
        wishlist.push(gameId);
        if (icono) icono.className = "fa-solid fa-heart";
        botonElemento.classList.add("activo");
        if (game) showToast(`"${game.title}" agregado a deseados.`);
    } else {
        wishlist.splice(indice, 1);
        if (icono) icono.className = "fa-regular fa-heart";
        botonElemento.classList.remove("activo");
        if (game) showToast(`"${game.title}" eliminado de deseados.`);
    }

    localStorage.setItem("deseados", JSON.stringify(wishlist));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function updateCartCounter() {
    const contadores = document.querySelectorAll("#contador-carrito");
    contadores.forEach(contador => {
        contador.textContent = `(${cart.length})`;
    });
}

function showToast(mensaje) {
    let contenedor = toastContainer || document.getElementById("contenedor-notificaciones");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "contenedor-notificaciones";
        contenedor.className = "contenedor-notificaciones";
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = "notificacion";
    toast.textContent = mensaje;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// detalle de juego 
async function loadGameDetail() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (!idParam) return;

    const id = parseInt(idParam, 10);

    try {
        const games = await fetchGamesData();
        allGames = games;
        const game = games.find(item => item.id === id);

        if (!game) {
            if (gameDetailTitle) gameDetailTitle.textContent = "Juego no encontrado";
            return;
        }

        renderGameDetail(game);
    } catch (error) {
        console.error("Error al cargar el detalle del juego:", error);
    }
}

function renderGameDetail(game) {
    document.title = `${game.title} - GamesShop`;

    if (gameDetailBg) {
        gameDetailBg.style.backgroundImage = `url('${game.image}')`;
    }

    if (gameDetailCover) {
        gameDetailCover.src = game.image;
        gameDetailCover.alt = game.title;
    }

    if (gameDetailTitle) {
        gameDetailTitle.textContent = game.title;
    }

    if (gameDetailPrice) {
        gameDetailPrice.textContent = Number(game.price) === 0 ? "Gratis" : `$${Number(game.price).toFixed(2)}`;
    }

    if (gameDetailGenres && game.genre) {
        const generos = Array.isArray(game.genre) ? game.genre : game.genre.split(",");
        gameDetailGenres.innerHTML = generos
            .map(g => `<span class="etiqueta">${g.trim()}</span>`)
            .join("");
    }

    if (gameDetailTrailer && game.trailer) {
        let url = game.trailer;
        if (url.includes("watch?v=")) {
            const idVideo = url.split("watch?v=")[1].split("&")[0];
            url = `https://www.youtube.com/embed/${idVideo}`;
        }
        gameDetailTrailer.src = url;
    }

    const btnComprarDetalle = document.querySelector(".botones-detalle .btn-comprar");
    const btnDeseadosDetalle = document.querySelector(".botones-detalle .btn-deseados");

    if (btnComprarDetalle) {
        btnComprarDetalle.onclick = () => addToCart(game.id);
    }

    if (btnDeseadosDetalle) {
        const esDeseado = wishlist.includes(game.id);
        const icono = btnDeseadosDetalle.querySelector("i");
        if (icono) icono.className = esDeseado ? "fa-solid fa-heart" : "fa-regular fa-heart";
        if (esDeseado) btnDeseadosDetalle.classList.add("activo");
        btnDeseadosDetalle.onclick = () => toggleWishlist(game.id, btnDeseadosDetalle);
    }

    setupDetailCarousel();
}

function setupDetailCarousel() {
    const contenedor = document.querySelector(".carrusel-juego");
    if (!contenedor) return;

    const items = contenedor.querySelectorAll(".item-carrusel");
    const btnPrev = document.getElementById("btn-anterior-carrusel");
    const btnNext = document.getElementById("btn-siguiente-carrusel");

    if (items.length === 0) return;

    let indiceActual = 0;

    function mostrarSlide(indice) {
        items[indiceActual].classList.remove("activo");
        indiceActual = indice;

        if (indiceActual >= items.length) indiceActual = 0;
        else if (indiceActual < 0) indiceActual = items.length - 1;

        items[indiceActual].classList.add("activo");
    }

    if (btnNext) btnNext.onclick = () => mostrarSlide(indiceActual + 1);
    if (btnPrev) btnPrev.onclick = () => mostrarSlide(indiceActual - 1);
}

// carrusel principal 
async function loadHomeFeatured() {
    const contenedorInicio = document.getElementById("carrusel-items-inicio");
    const carruselGrid = document.querySelector(".carrusel-juegos") || document.querySelector(".games-grid");

    if (!contenedorInicio && !carruselGrid) return;

    try {
        const games = await fetchGamesData();
        allGames = games;

        const idsDestacados = [1, 3, 5, 12, 20, 8, 6];
        let destacados = games.filter(g => idsDestacados.includes(Number(g.id)));

        if (destacados.length === 0) {
            destacados = games.slice(0, 6);
        }

        // carrusel completo
        if (contenedorInicio) {
            contenedorInicio.innerHTML = "";
            const btnPrev = document.getElementById("btn-anterior-inicio");
            const btnNext = document.getElementById("btn-siguiente-inicio");

            destacados.forEach((game, index) => {
                const slide = document.createElement("div");
                slide.className = `item-carrusel ${index === 0 ? "activo" : ""}`;

                const generos = Array.isArray(game.genre)
                    ? game.genre
                    : typeof game.genre === "string"
                        ? game.genre.split(",")
                        : [];

                const generosHTML = generos.map(g => `<span class="etiqueta">${g.trim()}</span>`).join("");
                const precioTexto = Number(game.price) === 0 ? "Gratis" : `$${Number(game.price).toFixed(2)}`;
                const esDeseado = wishlist.includes(game.id);

                slide.innerHTML = `
                    <a href="${getDetailPageUrl(game.id)}" class="enlace-portada-slide" title="Ver detalle de ${game.title}">
                        <img src="${game.image}" alt="${game.title}" class="imagen-slide-completo" onerror="this.src='https://via.placeholder.com/1920x1080?text=Sin+Imagen'">
                    </a>
                    <div class="capa-oscura-slide"></div>
                    <div class="info-slide">
                        <h2 class="titulo-slide">
                            <a href="${getDetailPageUrl(game.id)}">${game.title}</a>
                        </h2>
                        <div class="generos-tarjeta">${generosHTML}</div>
                        
                        <p class="precio-slide">${precioTexto}</p>
                        <div class="acciones-slide">
                            <button type="button" class="btn-comprar btn-comprar-carrusel" data-id="${game.id}">
                                <i class="fa-solid fa-cart-plus"></i> Comprar
                            </button>
                            <button type="button" class="btn-deseados btn-deseados-carrusel ${esDeseado ? 'activo' : ''}" data-id="${game.id}" aria-label="Añadir a lista de deseos">
                                <i class="${esDeseado ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;

                contenedorInicio.appendChild(slide);
            });

            // carrusel igual que el de detalle juego
            const items = contenedorInicio.querySelectorAll(".item-carrusel");
            if (items.length > 0) {
                let indiceActual = 0;

                function mostrarSlide(indice) {
                    items[indiceActual].classList.remove("activo");
                    indiceActual = indice;

                    if (indiceActual >= items.length) indiceActual = 0;
                    else if (indiceActual < 0) indiceActual = items.length - 1;

                    items[indiceActual].classList.add("activo");
                }

                let temporizador = setInterval(() => {
                    mostrarSlide(indiceActual + 1);
                }, 15000);

                function resetTemporizador() {
                    clearInterval(temporizador);
                    temporizador = setInterval(() => {
                        mostrarSlide(indiceActual + 1);
                    }, 5000);
                }

                if (btnNext) {
                    btnNext.onclick = () => {
                        mostrarSlide(indiceActual + 1);
                        resetTemporizador();
                    };
                }
                if (btnPrev) {
                    btnPrev.onclick = () => {
                        mostrarSlide(indiceActual - 1);
                        resetTemporizador();
                    };
                }

                // Delegación de eventos para comprar y deseados en el carrusel de inicio
                contenedorInicio.addEventListener("click", (e) => {
                    const btnComprar = e.target.closest(".btn-comprar-carrusel");
                    if (btnComprar) {
                        e.preventDefault();
                        e.stopPropagation();
                        const gameId = parseInt(btnComprar.dataset.id, 10);
                        addToCart(gameId);
                        return;
                    }

                    const btnDeseado = e.target.closest(".btn-deseados-carrusel");
                    if (btnDeseado) {
                        e.preventDefault();
                        e.stopPropagation();
                        const gameId = parseInt(btnDeseado.dataset.id, 10);
                        toggleWishlist(gameId, btnDeseado);
                        return;
                    }
                });
            }
        }

        if (carruselGrid) {
            carruselGrid.innerHTML = "";
            destacados.forEach(game => {
                const tarjeta = document.createElement("article");
                tarjeta.className = "tarjeta-juego";

                const generos = Array.isArray(game.genre)
                    ? game.genre
                    : typeof game.genre === "string"
                        ? game.genre.split(",")
                        : [];

                const generosHTML = generos.map(g => `<span class="etiqueta">${g.trim()}</span>`).join("");
                const precioTexto = Number(game.price) === 0 ? "Gratis" : `$${Number(game.price).toFixed(2)}`;

                tarjeta.innerHTML = `
                    <a href="${getDetailPageUrl(game.id)}" class="enlace-tarjeta">
                        <div class="imagen-tarjeta">
                            <img src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/460x215?text=Sin+Imagen'">
                        </div>
                        <div class="info-tarjeta">
                            <h3 class="titulo-tarjeta">${game.title}</h3>
                            <div class="generos-tarjeta">${generosHTML}</div>
                            <p class="precio-tarjeta">${precioTexto}</p>
                        </div>
                    </a>
                `;

                carruselGrid.appendChild(tarjeta);
            });

            const btnPrevOld = document.getElementById("btn-prev");
            const btnNextOld = document.getElementById("btn-next");
            if (btnPrevOld && btnNextOld && !btnNextOld.dataset.initialized) {
                btnNextOld.dataset.initialized = "true";
                const desplazamiento = 300;
                btnNextOld.addEventListener("click", () => carruselGrid.scrollBy({ left: desplazamiento, behavior: "smooth" }));
                btnPrevOld.addEventListener("click", () => carruselGrid.scrollBy({ left: -desplazamiento, behavior: "smooth" }));
            }
        }
    } catch (error) {
        console.error("Error al cargar novedades en inicio:", error);
    }
}

// temas claro y oscuro
function initTheme() {
    const temaActual = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", temaActual);
    renderThemeIcon(temaActual);
}

function toggleTheme() {
    const actual = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const siguiente = actual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", siguiente);
    localStorage.setItem("theme", siguiente);
    renderThemeIcon(siguiente);
}

function renderThemeIcon(tema) {
    const iconos = document.querySelectorAll("#icono-tema, #boton-tema i, #boton-tema-movil i");
    iconos.forEach(icono => {
        icono.className = tema === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
    });
}

// incializacion de todo
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateCartCounter();

    // Botones
    const botonesTema = document.querySelectorAll("#boton-tema, #boton-tema-movil");
    botonesTema.forEach(btn => btn.addEventListener("click", toggleTheme));

    // Buscador
    const inputBuscador = document.getElementById("buscador-juegos");
    if (inputBuscador) inputBuscador.addEventListener("input", handleSearch);

    // Carga de catálogo
    const contenedorCatalogo = document.getElementById("contenedor-juegos");
    if (contenedorCatalogo) {
        contenedorCatalogo.addEventListener("click", handleCatalogClicks);
        loadCatalog();
    }

    // Carga de detalle de juego
    if (document.getElementById("fondo-juego") || document.getElementById("titulo-juego")) {
        loadGameDetail();
    }

    // Carga de novedades en el inicio
    if (document.getElementById("carrusel-items-inicio") || document.querySelector(".carrusel-juegos")) {
        loadHomeFeatured();
    }
});