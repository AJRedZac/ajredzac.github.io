// Tinte de acento por sección: LED ASTRAY vira la paleta a rojo, el resto
// vuelve al morado. Extraído de los <script> inline de index.html.
// La navegación móvil vive en js/navbar.js.
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("section");
    const root = document.documentElement;

    function updateColors() {
        const scrollY = window.scrollY;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                if (section.classList.contains("led-astray-section")) {
                    root.style.setProperty("--primary-color", "#BA181B"); // Rojo
                    root.style.setProperty("--primary-color-highlight", "#E84A4D");
                } else {
                    root.style.setProperty("--primary-color", "#6647FF"); // Morado
                    root.style.setProperty("--primary-color-highlight", "#AA99FF");
                }
            }
        });
    }

    window.addEventListener("scroll", updateColors, { passive: true });
    updateColors();
});
