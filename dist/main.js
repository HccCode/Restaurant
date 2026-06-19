document.addEventListener('DOMContentLoaded', () => {
    // 1. Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW setup failed', err));
    }

    // 2. Intersection Observer para Sticky Header
    const nav = document.getElementById('sticky-navigation');
    const heroSection = document.getElementById('home');

    const observerOptions = {
        root: null,
        threshold: 0.1, // Se activa cuando queda un 10% del Hero visible
        rootMargin: "0px"
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                // El Hero ya no está visible, mostrar navbar
                nav.classList.remove('hidden');
            } else {
                // El Hero está visible, ocultar navbar
                nav.classList.add('hidden');
            }
        });
    }, observerOptions);

    if (heroSection) {
        navObserver.observe(heroSection);
    }

    // 3. Formulario UX - Simulador de Carga
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Estado de carga
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Procesando...";
            submitBtn.style.opacity = "0.7";
            submitBtn.disabled = true;

            // Simulación de envío a servidor (ej. Formspree / API en Render.com)
            setTimeout(() => {
                submitBtn.innerText = "¡Reservación Confirmada!";
                submitBtn.style.backgroundColor = "#4CAF50"; // Verde éxito
                submitBtn.style.opacity = "1";
                form.reset();

                // Restaurar botón después de 3 segundos
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "var(--primary-color)";
                    submitBtn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }
});