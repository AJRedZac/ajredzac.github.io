// Navegación móvil compartida por todas las páginas.
// Sustituye al bloque inline que estaba duplicado y añade el estado ARIA
// que el botón no reportaba.
(function () {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');

    if (!toggle || !menu) {
        return;
    }

    function setOpen(bolOpen) {
        menu.classList.toggle('open', bolOpen);
        toggle.setAttribute('aria-expanded', String(bolOpen));
    }

    setOpen(menu.classList.contains('open'));

    toggle.addEventListener('click', () => {
        setOpen(!menu.classList.contains('open'));
    });

    // Escape cierra el menú y devuelve el foco al botón que lo abrió.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });
})();
