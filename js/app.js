// Variables globales
let allGames = [];
let cart = JSON.parse(localStorage.getItem("carrito")) || [];
let wishlist = JSON.parse(localStorage.getItem("deseados")) || [];

// DOM
const gamesContainer = document.getElementById("contenedor-juegos");
const searchInput = document.getElementById("buscador-juegos");
const noResults = document.getElementById("sin-resultados");
const toastContainer = document.getElementById("contenedor-notificaciones");
const contenedorDeseados = document.getElementById("contenedor-deseados");

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

// Cargar datos desde games.json con caché para navegación instantánea
async function fetchGamesData() {
    if (allGames && allGames.length > 0) return allGames;

    try {
        const cached = sessionStorage.getItem("gamesData");
        if (cached) {
            const data = JSON.parse(cached);
            if (Array.isArray(data) && data.length > 0) {
                allGames = data;
                return data;
            }
        }
    } catch (_) { }

    const enCarpetaPages = window.location.pathname.includes("/pages/") || window.location.pathname.includes("\\pages\\");
    const rutaPrincipal = enCarpetaPages ? "../data/games.json" : "./data/games.json";
    const rutas = [rutaPrincipal, "./data/games.json", "../data/games.json", "/data/games.json"];
    const rutasUnicas = [...new Set(rutas)];

    for (const ruta of rutasUnicas) {
        try {
            const res = await fetch(ruta);
            if (res.ok) {
                const data = await res.json();
                allGames = data;
                try {
                    sessionStorage.setItem("gamesData", JSON.stringify(data));
                } catch (_) { }
                return data;
            }
        } catch (_) { }
    }
    throw new Error("No se pudo localizar el archivo games.json");
}

let isCatalogLoading = false;
async function loadCatalog() {
    const contenedor = document.getElementById("contenedor-juegos");
    if (!contenedor || isCatalogLoading) return;
    isCatalogLoading = true;

    try {
        if (!allGames || allGames.length === 0) {
            allGames = await fetchGamesData();
        }

        const inputBuscador = document.getElementById("buscador-juegos");
        const textoBuscador = inputBuscador ? inputBuscador.value.trim() : "";

        if (textoBuscador) {
            handleSearch({ target: inputBuscador });
        } else {
            renderCatalog(allGames);
        }
    } catch (error) {
        console.error("Error al cargar games.json:", error);
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <p>No se pudo cargar el catálogo de juegos.</p>
                <small>Asegúrate de ejecutar el proyecto desde un servidor local (Live Server).</small>
            </div>
        `;
    } finally {
        isCatalogLoading = false;
    }
}

// catálogo
function renderCatalog(games) {
    const contenedor = document.getElementById("contenedor-juegos") || document.getElementById("contenedor-deseados");
    if (!contenedor) return;

    wishlist = JSON.parse(localStorage.getItem("deseados")) || [];

    const mensajeSinResultados = document.getElementById("sin-resultados");

    if (!games || games.length === 0) {
        contenedor.innerHTML = "";
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

    contenedor.innerHTML = "";
    contenedor.appendChild(fragment);
}

// busqueda y filtrado (complicaciones con el tema de acentos)
function handleSearch(e) {
    const texto = (e && e.target ? e.target.value : "").toLowerCase().trim();

    if (!allGames || allGames.length === 0) return;

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

    const estasEnWIshlist = document.getElementById("contenedor-deseados");
    if (estasEnWIshlist) {
        MostrarDeseados();
    }

}

//filtro y busqueda deseados
function ordenFiltroDeseados() {
    if (!contenedorDeseados || wishlist.length === 0) return;

    const limpiarTexto = (texto) => (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const busqueda = document.getElementById("buscador-deseados");
    const filtro = document.getElementById("ordenar-deseados");

    const busca = busqueda ? limpiarTexto(busqueda.value.trim()) : "";
    const orden = filtro ? filtro.value : "defecto";

    localStorage.setItem("ordenDeseados", orden);

    let juegosDeseados = allGames.filter(game => wishlist.includes(game.id));

    if (busca !== "") {
        juegosDeseados = juegosDeseados.filter(game => {
            const coincideTitulo = limpiarTexto(game.title).includes(busca);
            const generos = Array.isArray(game.genre)
                ? game.genre
                : typeof game.genre === "string"
                    ? game.genre.split(",")
                    : [];
            const coincideGenero = generos.some(g => limpiarTexto(g).includes(busca));
            return coincideTitulo || coincideGenero;
        });

        if (juegosDeseados.length === 0) {
            contenedorDeseados.innerHTML = `
            <div class="deseoNoEncontrado">
                <p>No guardaste ese juego o juegos de esa categoría</p>
                <a href="./catalogo.html" class="volver">¿Te gustaría buscarlo en el catálogo?</a>
            </div>
            `;
            return;
        }
    }
    
    

    if(orden === "titulo"){
        juegosDeseados.sort((a, b) => a.title.localeCompare(b.title));
    } else if(orden === "reciente"){
        juegosDeseados.sort((a, b) => wishlist.indexOf(b.id) - wishlist.indexOf(a.id))
    }else if(orden === "precio-asc"){
        juegosDeseados.sort((a,b) => Number(a.price) - Number(b.price));
    }else if(orden === "precio-desc"){
        juegosDeseados.sort((a,b) => Number(b.price) - Number(a.price));
    }else if(orden === "antiguo"){
        juegosDeseados.sort((a, b) => wishlist.indexOf(a.id) - wishlist.indexOf(b.id));
    }

    renderCatalog(juegosDeseados);

}


// Mostrar lista deseados
function MostrarDeseados() {
    if (!contenedorDeseados) return;
    const controlesDeseados = document.querySelector(".controles-deseados");

    if (wishlist.length === 0) {
        contenedorDeseados.innerHTML = `
        <div class="listaVacia">
            <p>¿Aun no encontraste nada que te guste?</p>
            <a href="./catalogo.html" class="volver">Aqui puedes seguir buscando!</a>
        </div>
        `;
        if(controlesDeseados) controlesDeseados.style.display = "none";
    } else {
        if(controlesDeseados) controlesDeseados.style.display = "flex";
        ordenFiltroDeseados();
    }
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
        if (toast.parentNode) {
            toast.remove();
        }

    }, 3500);
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
    const actual = document.documentElement.getAttribute("data-theme") || "dark";
    const siguiente = actual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", siguiente);
    localStorage.setItem("theme", siguiente);
    renderThemeIcon(siguiente);
}

function renderThemeIcon(tema) {
    const iconos = document.querySelectorAll("#icono-tema, #boton-tema i");
    iconos.forEach(icono => {
        if (tema === "dark") {
            icono.className = "fa-solid fa-moon";

            icono.style.color = "#ffffff";
        } else {
            icono.className = "fa-solid fa-sun";
            icono.style.color = "";
        }
    });
}

// incializacion de todo
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateCartCounter();

    // Botones de tema
    const botonesTema = document.querySelectorAll("#boton-tema");
    botonesTema.forEach(btn => {
        if (!btn.dataset.initialized) {
            btn.dataset.initialized = "true";
            btn.addEventListener("click", toggleTheme);
        }
    });

    // Menú de navegación en móvil
    const botonMenuMovil = document.getElementById("boton-tema-movil");
    const menuNavegacion = document.querySelector(".menu-navegacion");
    if (botonMenuMovil && menuNavegacion && !botonMenuMovil.dataset.initialized) {
        botonMenuMovil.dataset.initialized = "true";
        botonMenuMovil.addEventListener("click", (e) => {
            e.stopPropagation();
            menuNavegacion.classList.toggle("activo");
            botonMenuMovil.classList.toggle("activo");
        });

        // Cerrar al clickear fuera del menú
        document.addEventListener("click", (e) => {
            if (!menuNavegacion.contains(e.target) && !botonMenuMovil.contains(e.target)) {
                menuNavegacion.classList.remove("activo");
                botonMenuMovil.classList.remove("activo");
            }
        });

        // Cerrar al clickear en cualquier enlace del menú
        menuNavegacion.querySelectorAll("a").forEach(enlace => {
            enlace.addEventListener("click", () => {
                menuNavegacion.classList.remove("activo");
                botonMenuMovil.classList.remove("activo");
            });
        });
    }

    // Buscador
    const inputBuscador = document.getElementById("buscador-juegos");
    if (inputBuscador && !inputBuscador.dataset.initialized) {
        inputBuscador.dataset.initialized = "true";
        inputBuscador.addEventListener("input", handleSearch);
    }

    // Carga de catálogo
    const contenedorCatalogo = document.getElementById("contenedor-juegos");
    if (contenedorCatalogo && !contenedorCatalogo.dataset.initialized) {
        contenedorCatalogo.dataset.initialized = "true";
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

    // Carga Lista Deseados
    if (contenedorDeseados) {
        contenedorDeseados.addEventListener("click", handleCatalogClicks);

        const buscadorDeseados = document.getElementById("buscador-deseados");
        const filtroDeseados = document.getElementById("ordenar-deseados");

        if(filtroDeseados && localStorage.getItem("ordenDeseados")){
            filtroDeseados.value = localStorage.getItem("ordenDeseados");
        }

        if(buscadorDeseados) buscadorDeseados.addEventListener("input", ordenFiltroDeseados);
        if(filtroDeseados) filtroDeseados.addEventListener("change", ordenFiltroDeseados);

        fetchGamesData().then(games => {
            allGames = games;
            MostrarDeseados();
        });
    }
});

// Sincronización al navegar hacia atrás o adelante (historial o bfcache del navegador)
window.addEventListener("pageshow", () => {
    cart = JSON.parse(localStorage.getItem("carrito")) || [];
    wishlist = JSON.parse(localStorage.getItem("deseados")) || [];
    updateCartCounter();

    const contenedorCatalogo = document.getElementById("contenedor-juegos");
    if (contenedorCatalogo && allGames && allGames.length > 0) {
        const inputBuscador = document.getElementById("buscador-juegos");
        const texto = inputBuscador ? inputBuscador.value.trim() : "";
        if (texto) {
            handleSearch({ target: inputBuscador });
        } else {
            // Actualizar botones de deseados existentes sin destruir el DOM
            const botonesDeseados = contenedorCatalogo.querySelectorAll(".btn-deseados");
            if (botonesDeseados.length > 0) {
                botonesDeseados.forEach(btn => {
                    const id = parseInt(btn.dataset.id, 10);
                    const esDeseado = wishlist.includes(id);
                    const icono = btn.querySelector("i");
                    if (esDeseado) {
                        btn.classList.add("activo");
                        if (icono) icono.className = "fa-solid fa-heart";
                    } else {
                        btn.classList.remove("activo");
                        if (icono) icono.className = "fa-regular fa-heart";
                    }
                });
            } else {
                renderCatalog(allGames);
            }
        }
    }
});


//-----------------perfil y gestión de cuenta
document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('profile-container');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    // Elementos de la zona de perfil y edición
    const profileForm = document.getElementById('profile-form');
    const profileNicknameInput = document.getElementById('profile-nickname-input');
    const profileEmailInput = document.getElementById('profile-email-input');
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const changePasswordForm = document.getElementById('change-password-form');
    const profileWishlistContainer = document.getElementById('profile-wishlist-container');
    
    const btnLogout = document.getElementById('btn-logout');

    // 1. Verificar si hay un usuario logueado al cargar la página
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));

    if (usuarioLogueado) {
        if (authContainer) authContainer.classList.add('form-hidden');
        if (profileContainer) profileContainer.classList.remove('form-hidden');
        
        // Rellenar datos en los inputs del perfil
        if (profileNicknameInput) profileNicknameInput.value = usuarioLogueado.nickname;
        if (profileEmailInput) profileEmailInput.value = usuarioLogueado.email;

        // Cargar lista de deseados del usuario
        cargarListaDeseadosPerfil();
    } else {
        if (authContainer) authContainer.classList.remove('form-hidden');
        if (profileContainer) profileContainer.classList.add('form-hidden');
    }

    // 2. Alternar formularios de Login / Registro dentro de la autenticación
    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('form-hidden');
            registerBox.classList.remove('form-hidden');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerBox.classList.add('form-hidden');
            loginBox.classList.remove('form-hidden');
        });
    }

    // 3. Manejar el Registro
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nickname = document.getElementById('reg-nickname').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(email)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return;
            }

            let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const usuarioExistente = usuarios.find(user => user.email === email);
            if (usuarioExistente) {
                alert('Este correo ya está registrado.');
                return;
            }

            const nuevoUsuario = { nickname, email, password };
            usuarios.push(nuevoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));

            alert('¡Registro exitoso! Ahora inicia sesión.');
            registerForm.reset();
            registerBox.classList.add('form-hidden');
            loginBox.classList.remove('form-hidden');
        });
    }

    // 4. Manejar el Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const usuarioEncontrado = usuarios.find(user => user.email === email && user.password === password);

            if (usuarioEncontrado) {
                localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioEncontrado));
                window.location.reload();
            } else {
                alert('Correo o contraseña incorrectos.');
            }
        });
    }

    // 5. Habilitar la edición de datos personales y alternar botones
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', () => {
            profileNicknameInput.removeAttribute('disabled');
            profileEmailInput.removeAttribute('disabled');
            profileNicknameInput.focus();

            // Ocultar botón de modificar y mostrar botón de guardar cambios
            btnEditProfile.classList.add('form-hidden');
            btnSaveProfile.classList.remove('form-hidden');
        });
    }

    // 6. Guardar cambios de datos personales
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevoNickname = profileNicknameInput.value;
            const nuevoEmail = profileEmailInput.value;

            let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            let usuarioActual = JSON.parse(localStorage.getItem('usuarioLogueado'));

            const correoOcupado = usuarios.find(user => user.email === nuevoEmail && user.email !== usuarioActual.email);
            if (correoOcupado) {
                alert('Este correo ya está en uso por otra cuenta.');
                return;
            }

            usuarios = usuarios.map(user => {
                if (user.email === usuarioActual.email) {
                    return { ...user, nickname: nuevoNickname, email: nuevoEmail };
                }
                return user;
            });

            usuarioActual.nickname = nuevoNickname;
            usuarioActual.email = nuevoEmail;

            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioActual));

            alert('Datos actualizados correctamente.');
            window.location.reload();
        });
    }

    // 6.1. Cambiar contraseña desde el perfil
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;

            let usuarioActual = JSON.parse(localStorage.getItem('usuarioLogueado'));
            let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

            if (usuarioActual.password !== currentPassword) {
                alert('La contraseña actual es incorrecta.');
                return;
            }

            usuarios = usuarios.map(user => {
                if (user.email === usuarioActual.email) {
                    return { ...user, password: newPassword };
                }
                return user;
            });

            usuarioActual.password = newPassword;

            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioActual));

            alert('¡Contraseña actualizada con éxito!');
            changePasswordForm.reset();
        });
    }

    function cargarListaDeseadosPerfil() {
        if (!profileWishlistContainer) return;

        const rawDeseados = localStorage.getItem('deseados');
        const deseados = JSON.parse(rawDeseados) || [];
        
        console.log("CONTENIDOS EXACTOS DE 'deseados':", deseados);

        if (deseados.length === 0) {
            profileWishlistContainer.innerHTML = '<p style="color: var(--color-texto-secundario); font-size: 0.9rem; text-align: center; padding: 10px;">No tienes juegos en tu lista de deseados.</p>';
            return;
        }

        profileWishlistContainer.innerHTML = '';
        deseados.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.03); padding: 8px 12px; border-radius: 8px; gap: 10px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 8px;';
            
            let nombreJuego = 'Juego sin título';
            let imagenSrc = '../assets/images/icono.png';
            let precioJuego = 'Consultar';

            if (item !== null && item !== undefined) {
                if (typeof item === 'string' || typeof item === 'number') {
                    nombreJuego = String(item);
                } else if (typeof item === 'object') {
                    nombreJuego = item.nombre || item.titulo || item.title || item.name || item.game || item.gameName || item.text || item.label || JSON.stringify(item);

                    imagenSrc = item.imagen || item.img || item.portada || item.image || item.foto || item.thumbnail || item.poster || item.logo || '../assets/images/icono.png';
                    
                    const precioVal = item.precio !== undefined ? item.precio : (item.price !== undefined ? item.price : null);
                    if (precioVal !== null && precioVal !== '' && precioVal !== undefined) {
                        precioJuego = `$${precioVal}`;
                    }
                }
            }

            itemElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; width: 85%;">
                    <img src="${imagenSrc}" alt="${nombreJuego}" style="width: 50px; height: 38px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" onerror="this.src='../assets/images/icono.png'">
                    <div style="display: flex; flex-direction: column; overflow: hidden; width: 100%;">
                        <span style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;" title="${nombreJuego}">${nombreJuego}</span>
                        <span style="color: var(--color-primario); font-weight: bold; font-size: 0.85rem;">${precioJuego}</span>
                    </div>
                </div>
                <button type="button" class="btn-remove-wishlist" data-index="${index}" title="Eliminar de deseados" style="background: transparent; border: none; color: #ff5252; cursor: pointer; font-size: 1rem; padding: 5px; flex-shrink: 0;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            profileWishlistContainer.appendChild(itemElement);
        });

        // Eventos para eliminar elementos
        const deleteButtons = profileWishlistContainer.querySelectorAll('.btn-remove-wishlist');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                let deseadosArr = JSON.parse(localStorage.getItem('deseados')) || [];
                deseadosArr.splice(index, 1);
                localStorage.setItem('deseados', JSON.stringify(deseadosArr));
                cargarListaDeseadosPerfil();
            });
        });
    }
    
    // 7. Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogueado');
            window.location.reload();
        });
    }

    // 8. Botones para mostrar / ocultar contraseña
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = button.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
});