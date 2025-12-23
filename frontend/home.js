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

// Apply stars
const stars1 = document.getElementById('stars');
const stars2 = document.getElementById('stars2');
const stars3 = document.getElementById('stars3');

if (stars1) stars1.style.boxShadow = generateStars(700);
if (stars2) stars2.style.boxShadow = generateStars(200);
if (stars3) stars3.style.boxShadow = generateStars(100);

// ===========================
// Hero Title SVG Outline Animation
// ===========================
const svgText = document.querySelector('.svg-text');

if (svgText) {
    try {
        const textLength = svgText.getTotalLength ? svgText.getTotalLength() : 2000;
        const pathLength = textLength;
        
        svgText.style.strokeDasharray = pathLength;
        svgText.style.strokeDashoffset = pathLength;
        
        anime({
            targets: svgText,
            strokeDashoffset: [pathLength, -pathLength],
            duration: 8000,
            easing: 'linear',
            loop: true
        });
    } catch (e) {
        // Fallback if getTotalLength not supported on text elements
        const bbox = svgText.getBBox();
        const pathLength = (bbox.width + bbox.height) * 2;
        
        svgText.style.strokeDasharray = pathLength;
        svgText.style.strokeDashoffset = pathLength;
        
        anime({
            targets: svgText,
            strokeDashoffset: [pathLength, -pathLength],
            duration: 8000,
            easing: 'linear',
            loop: true
        });
    }
}

// ===========================
// Hero Subtitle Crimson Text Animation
// ===========================
function animateSubtitleText(element) {
    const textContent = element.textContent;
    element.textContent = "";
    
    textContent.split("").forEach((char, index) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.animationDelay = `${index * 0.05}s`;
        span.style.display = char === " " ? "inline-block" : "inline";
        span.style.width = char === " " ? "0.3em" : "auto";
        element.appendChild(span);
    });
}

const subtitleMain = document.querySelector('.subtitle-main');
const subtitleSecondary = document.querySelector('.subtitle-secondary');

if (subtitleMain) {
    animateSubtitleText(subtitleMain);
    subtitleMain.addEventListener('click', () => animateSubtitleText(subtitleMain));
}

if (subtitleSecondary) {
    setTimeout(() => {
        animateSubtitleText(subtitleSecondary);
    }, 500);
    subtitleSecondary.addEventListener('click', () => animateSubtitleText(subtitleSecondary));
}

// ===========================
// Hero Navigation Links Animation
// ===========================
const heroLinks = document.querySelectorAll('.hero-link');
heroLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.05,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
    
    link.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            scale: 1,
            duration: 300,
            easing: 'easeOutQuad'
        });
    });
});

// ===========================
// Icon Strip Fade-in Animation
// ===========================
const squares = document.querySelectorAll('.square');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            anime({
                targets: entry.target,
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 800,
                easing: 'easeOutCubic'
            });
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.3
});

squares.forEach(square => {
    square.style.opacity = '0';
    observer.observe(square);
});

// ===========================
// Animated Spacer Between Card Rows
// ===========================
const cardSpacer = document.querySelector('.card-spacer-horizontal');

if (cardSpacer) {
    // Create animated squares across the page
    for (let i = 0; i < 8; i++) {
        const animSquare = document.createElement('div');
        animSquare.className = 'anim-square';
        animSquare.style.width = '30px';
        animSquare.style.height = '30px';
        animSquare.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))';
        animSquare.style.borderRadius = '6px';
        animSquare.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.4)';
        cardSpacer.appendChild(animSquare);
    }
    
    const animSquares = cardSpacer.querySelectorAll('.anim-square');
    
    anime({
        targets: animSquares,
        translateY: anime.stagger(['-2.75rem', '2.75rem']),
        rotate: {
            value: anime.stagger(['-.125turn', '.125turn']),
            easing: 'linear'
        },
        loop: true,
        direction: 'alternate',
        duration: 2000,
        easing: 'easeInOutQuad',
        delay: anime.stagger(100)
    });
}

// ===========================
// Powerful Features Heading Animation
// ===========================
function splitTextIntoChars(element) {
    const text = element.textContent;
    element.innerHTML = '';
    
    for (let char of text) {
        const span = document.createElement('span');
        span.className = 'split-char';
        span.textContent = char;
        if (char === ' ') {
            span.style.width = '0.3em';
        }
        element.appendChild(span);
    }
    
    return element.querySelectorAll('.split-char');
}

const featuresHeadingP = document.querySelector('.features-heading p');
if (featuresHeadingP) {
    const chars = splitTextIntoChars(featuresHeadingP);
    
    anime({
        targets: chars,
        translateY: ['0rem', '-1rem', '0rem'],
        loop: true,
        delay: anime.stagger(100),
        duration: 1000,
        easing: 'easeInOutQuad'
    });
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
// ===========================
// CTA Button Pulse Animation
// ===========================
const ctaButton = document.getElementById('startPredictingBtn');

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
    
    ctaButton.addEventListener('click', () => {
        window.location.href = 'forecast.html';
    });
}

// ===========================
// Feature Cards Fade-in on Scroll
// ===========================
const featureCards = document.querySelectorAll('.feature-detail-card');

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            anime({
                targets: entry.target,
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 800,
                delay: index * 150,
                easing: 'easeOutCubic'
            });
            cardObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2
});

featureCards.forEach(card => {
    card.style.opacity = '0';
    cardObserver.observe(card);
});