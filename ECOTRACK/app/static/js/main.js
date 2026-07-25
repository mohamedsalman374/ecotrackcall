// Custom JavaScript for EcoTrack

document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS Animation Library
    AOS.init({
        once: true, // whether animation should happen only once - while scrolling down
        offset: 50, // offset (in px) from the original trigger point
        duration: 800, // values from 0 to 3000, with step 50ms
        easing: 'ease-in-out-cubic',
    });

    // Sticky Navbar shadow on scroll
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Animated Counters for Statistics Section
    const counters = document.querySelectorAll('.counter');
    let hasAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // ms
            const step = Math.ceil(target / (duration / 16)); // assuming 60fps
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.innerText = current.toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            updateCounter();
        });
    };

    // Intersection Observer for triggering counter animation
    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                animateCounters();
                hasAnimated = true;
            }
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }

    // Contact Form Frontend Validation
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            event.stopPropagation();
            
            if (contactForm.checkValidity()) {
                // Form is valid
                const successMsg = document.getElementById('formSuccessMsg');
                successMsg.classList.remove('d-none');
                contactForm.reset();
                contactForm.classList.remove('was-validated');
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    successMsg.classList.add('d-none');
                }, 5000);
            } else {
                // Form is invalid
                contactForm.classList.add('was-validated');
            }
        }, false);
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    // Close mobile menu if open
                    const navbarCollapse = document.getElementById('navbarNav');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        // We avoid using direct new bootstrap.Collapse to not conflict with loaded bundle.
                        navbarCollapse.classList.remove('show');
                    }
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // Adjust for fixed navbar
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
