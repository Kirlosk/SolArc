// ===========================
// Generate Star Shadows
// ===========================
function generateStars(count) {
    let shadows = [];
    for (let i = 0; i < count; i++) {
        shadows.push(`${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`);
    }
    return shadows.join(', ');
}
// Add to each JS file
window.addEventListener('scroll', () => {
    const logo = document.querySelector('.solcast-logo');
    if (window.scrollY > 100) {
        logo.classList.add('fade');
    } else {
        logo.classList.remove('fade');
    }
});
window.addEventListener('scroll', () => {
    const logo = document.querySelector('.solcast-logo');
    if (logo) {
        const scrolled = window.scrollY;
        const opacity = Math.max(0, 1 - (scrolled / 500));
        logo.style.opacity = opacity;
    }
});
// Apply stars
const stars1 = document.getElementById('stars');
const stars2 = document.getElementById('stars2');
const stars3 = document.getElementById('stars3');

if (stars1) stars1.style.boxShadow = generateStars(700);
if (stars2) stars2.style.boxShadow = generateStars(200);
if (stars3) stars3.style.boxShadow = generateStars(100);

// ===========================
// Fade-in Sections on Scroll
// ===========================
const fadeInSections = document.querySelectorAll('.fade-in-section');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            anime({
                targets: entry.target,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 800,
                delay: 200,
                easing: 'easeOutCubic',
                complete: () => {
                    entry.target.classList.add('visible');
                }
            });
            sectionObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
});

fadeInSections.forEach(section => {
    sectionObserver.observe(section);
});

// ===========================
// Card Hover Enhancements
// ===========================
const aboutCards = document.querySelectorAll('.about-card');

aboutCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.02,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
    
    card.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            scale: 1,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
});

// ===========================
// Contact Links Animation
// ===========================
const contactLinks = document.querySelectorAll('.contact-link');

contactLinks.forEach((link, index) => {
    // Initial staggered fade-in
    anime({
        targets: link,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: 1500 + (index * 100),
        easing: 'easeOutCubic'
    });
    
    // Hover animation
    link.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.05,
            duration: 250,
            easing: 'easeOutQuad'
        });
    });
    
    link.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            scale: 1,
            duration: 250,
            easing: 'easeOutQuad'
        });
    });
});

// ===========================
// Page Title Animation
// ===========================
const pageTitle = document.querySelector('.page-title');
if (pageTitle) {
    anime({
        targets: pageTitle,
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 1000,
        easing: 'easeOutCubic'
    });
}

// ===========================
// Subtitle Animation
// ===========================
const pageSubtitle = document.querySelector('.page-subtitle');
if (pageSubtitle) {
    anime({
        targets: pageSubtitle,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 1000,
        delay: 300,
        easing: 'easeOutCubic'
    });
}

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('SolArc About Page Loaded');
    
    // Set initial opacity for contact links
    contactLinks.forEach(link => {
        link.style.opacity = '0';
    });
});