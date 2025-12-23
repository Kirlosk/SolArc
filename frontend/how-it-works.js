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
// Apply stars
const stars1 = document.getElementById('stars');
const stars2 = document.getElementById('stars2');
const stars3 = document.getElementById('stars3');

if (stars1) stars1.style.boxShadow = generateStars(700);
if (stars2) stars2.style.boxShadow = generateStars(200);
if (stars3) stars3.style.boxShadow = generateStars(100);

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
// Pipeline Steps Animation on Scroll
// ===========================
const pipelineSteps = document.querySelectorAll('.pipeline-step');

const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const step = entry.target;
            const isRight = step.classList.contains('step-right');
            
            anime({
                targets: step,
                opacity: [0, 1],
                translateY: [50, 0],
                translateX: isRight ? [50, 0] : [-50, 0],
                duration: 1000,
                delay: 200,
                easing: 'easeOutCubic',
                complete: () => {
                    step.classList.add('visible');
                }
            });
            
            // Animate step icon
            const icon = step.querySelector('.step-icon');
            if (icon) {
                anime({
                    targets: icon,
                    scale: [0, 1],
                    rotate: ['-180deg', '0deg'],
                    duration: 800,
                    delay: 500,
                    easing: 'easeOutBack'
                });
            }
            
            // Animate list items
            const listItems = step.querySelectorAll('.step-details li');
            anime({
                targets: listItems,
                opacity: [0, 1],
                translateX: isRight ? [30, 0] : [-30, 0],
                duration: 600,
                delay: anime.stagger(100, { start: 700 }),
                easing: 'easeOutCubic'
            });
            
            stepObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
});

pipelineSteps.forEach(step => {
    stepObserver.observe(step);
});

// ===========================
// Timeline Dots Animation
// ===========================
const timelineDots = document.querySelectorAll('.timeline-dot');
let currentDot = 0;

// Initial animation of timeline
anime({
    targets: '.timeline-line',
    scaleX: [0, 1],
    duration: 2000,
    easing: 'easeInOutQuad',
    delay: 1000
});

// Animate dots in sequence
anime({
    targets: timelineDots,
    scale: [0, 1],
    duration: 500,
    delay: anime.stagger(300, { start: 2000 }),
    easing: 'easeOutBack'
});

// Cycle through active dots
function cycleActiveDot() {
    timelineDots.forEach(dot => dot.classList.remove('active'));
    timelineDots[currentDot].classList.add('active');
    
    currentDot = (currentDot + 1) % timelineDots.length;
}

// Start cycling after initial animation
setTimeout(() => {
    cycleActiveDot();
    setInterval(cycleActiveDot, 3000);
}, 3000);

// Click handlers for timeline dots
timelineDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        // Scroll to corresponding step
        const targetStep = pipelineSteps[index];
        if (targetStep) {
            anime({
                targets: 'html, body',
                scrollTop: targetStep.offsetTop - 150,
                duration: 1000,
                easing: 'easeInOutQuad'
            });
        }
        
        // Update active dot
        timelineDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentDot = (index + 1) % timelineDots.length;
    });
    
    // Hover effect
    dot.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.5,
            duration: 250,
            easing: 'easeOutQuad'
        });
    });
    
    dot.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
            anime({
                targets: this,
                scale: 1,
                duration: 250,
                easing: 'easeOutQuad'
            });
        }
    });
});

// ===========================
// Step Content Hover Effects
// ===========================
const stepContents = document.querySelectorAll('.step-content');

stepContents.forEach(content => {
    content.addEventListener('mouseenter', function() {
        const isRight = this.closest('.step-right');
        anime({
            targets: this,
            translateX: isRight ? -10 : 10,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
    
    content.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            translateX: 0,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
});

// ===========================
// CTA Button Animation
// ===========================
const ctaButton = document.querySelector('.cta-section .cta-button');

if (ctaButton) {
    anime({
        targets: ctaButton,
        scale: [1, 1.05, 1],
        boxShadow: [
            '0 8px 32px rgba(0, 212, 255, 0.4)',
            '0 12px 48px rgba(0, 212, 255, 0.8)',
            '0 8px 32px rgba(0, 212, 255, 0.4)'
        ],
        duration: 2000,
        easing: 'easeInOutQuad',
        loop: true
    });
}

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('SolArc How It Works Page Loaded');
    
    // Set initial opacity for list items
    const allListItems = document.querySelectorAll('.step-details li');
    allListItems.forEach(item => {
        item.style.opacity = '0';
    });
});