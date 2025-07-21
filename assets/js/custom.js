//Homepage Tabs 
function toggleMobileTab(tabNumber) {
    // Remove active class from all mobile tab buttons
    const mobileTabButtons = document.querySelectorAll('.mobile-tab-item .nav-link');
    mobileTabButtons.forEach(button => button.classList.remove('active'));

    // Hide all mobile tab contents
    const mobileTabContents = document.querySelectorAll('.mobile-tab-content');
    mobileTabContents.forEach(content => content.classList.remove('active'));

    // Show selected tab content and activate button
    const selectedButton = document.querySelector(`.mobile-tab-item:nth-child(${tabNumber}) .nav-link`);
    const selectedContent = document.querySelector(`.mobile-tab-item:nth-child(${tabNumber}) .mobile-tab-content`);

    selectedButton.classList.add('active');
    selectedContent.classList.add('active');

    // Initialize slider for the active mobile tab
    initSliderForMobileTab(tabNumber);
}

//Homepage community Slider - Updated to handle both mobile and desktop tabs

// Store slider state for each tab (mobile and desktop)
let sliderStates = {
    mobile: {
        1: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' },
        2: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' },
        3: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' }  // Added tab 3
    },
    desktop: {
        1: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' },
        2: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' },
        3: { currentSlide: 0, visibleSlides: [], currentLocation: 'all' }  // Added tab 3
    }
};

// Auto-slide control variables
let autoSlideInterval = null;
let isSliderPaused = false;

let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;

// Check if mobile view is active
function isMobileView() {
    return window.innerWidth < 768; // Bootstrap's md breakpoint
}

// Get current active mobile tab number
function getActiveMobileTab() {
    const activeTab = document.querySelector('.mobile-tab-item .nav-link.active');
    if (!activeTab) return 1;

    const tabItem = activeTab.closest('.mobile-tab-item');
    const allTabItems = document.querySelectorAll('.mobile-tab-item');

    for (let i = 0; i < allTabItems.length; i++) {
        if (allTabItems[i] === tabItem) {
            return i + 1;
        }
    }
    return 1;
}

// Get current active desktop tab number
function getActiveDesktopTab() {
    const activeTab = document.querySelector('#myTabs .nav-link.active');
    if (!activeTab) return 1;

    const tabId = activeTab.getAttribute('data-bs-target');
    return tabId === '#tab1' ? 1 : 2;
}

// Get slides for specific mobile tab
function getSlidesForMobileTab(tabNumber) {
    const tabContent = document.querySelector(`.mobile-tab-item:nth-child(${tabNumber}) .mobile-tab-content`);
    if (!tabContent) return [];
    return tabContent.querySelectorAll('.slide');
}

// Get slides for specific desktop tab
function getSlidesForDesktopTab(tabNumber) {
    const tabContent = document.querySelector(`#tab${tabNumber}`);
    if (!tabContent) return [];
    return tabContent.querySelectorAll('.slide');
}

// Filter slides based on location for specific tab
function filterSlidesForTab(device, tabNumber, location) {
    const allSlides = device === 'mobile' ? getSlidesForMobileTab(tabNumber) : getSlidesForDesktopTab(tabNumber);
    const state = sliderStates[device][tabNumber];
    state.visibleSlides = [];

    allSlides.forEach((slide, index) => {
        if (location === 'all' || slide.dataset.location === location) {
            slide.classList.remove('hidden');
            state.visibleSlides.push(slide);

            // Hide location name when filtering by specific location
            const locationLabel = slide.querySelector('.location');
            if (locationLabel) {
                locationLabel.style.display = location === 'all' ? 'block' : 'none';
            }
        } else {
            slide.classList.add('hidden');
        }
    });

    return state.visibleSlides;
}

// Create dots for specific tab
function createDotsForTab(device, tabNumber) {
    let tabContent;
    if (device === 'mobile') {
        tabContent = document.querySelector(`.mobile-tab-item:nth-child(${tabNumber}) .mobile-tab-content`);
    } else {
        tabContent = document.querySelector(`#tab${tabNumber}`);
    }

    if (!tabContent) return;

    const sliderDots = tabContent.querySelector('.slider-dots');
    if (!sliderDots) return;

    const state = sliderStates[device][tabNumber];
    sliderDots.innerHTML = '';

    // Only create dots if there are multiple slides
    if (state.visibleSlides.length > 1) {
        state.visibleSlides.forEach((slide, index) => {
            const dot = document.createElement('span');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlideForTab(device, tabNumber, index);
            sliderDots.appendChild(dot);
        });
    }
}

// Update slider for specific tab
function updateSliderForTab(device, tabNumber) {
    let tabContent;
    if (device === 'mobile') {
        tabContent = document.querySelector(`.mobile-tab-item:nth-child(${tabNumber}) .mobile-tab-content`);
    } else {
        tabContent = document.querySelector(`#tab${tabNumber}`);
    }

    if (!tabContent) return;

    const sliderTrack = tabContent.querySelector('.slider-track');
    const dots = tabContent.querySelectorAll('.dot');
    const state = sliderStates[device][tabNumber];

    // Calculate the position based on visible slides
    let translateX = 0;
    for (let i = 0; i < state.currentSlide; i++) {
        if (state.visibleSlides[i]) {
            translateX += 100;
        }
    }

    if (sliderTrack) {
        sliderTrack.style.transform = `translateX(-${translateX}%)`;
    }

    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === state.currentSlide);
    });
}

function nextSlideForTab(device, tabNumber) {
    const state = sliderStates[device][tabNumber];
    if (state.visibleSlides.length <= 1) return;

    state.currentSlide = (state.currentSlide + 1) % state.visibleSlides.length;
    updateSliderForTab(device, tabNumber);
}

function prevSlideForTab(device, tabNumber) {
    const state = sliderStates[device][tabNumber];
    if (state.visibleSlides.length <= 1) return;

    state.currentSlide = (state.currentSlide - 1 + state.visibleSlides.length) % state.visibleSlides.length;
    updateSliderForTab(device, tabNumber);
}

function goToSlideForTab(device, tabNumber, index) {
    const state = sliderStates[device][tabNumber];
    state.currentSlide = index;
    updateSliderForTab(device, tabNumber);
}

// Updated changeLocation to work with both mobile and desktop
function changeLocation() {
    // Get the event target to find which dropdown was changed
    const changedSelect = event.target;
    if (!changedSelect || !changedSelect.classList.contains('location-select')) return;

    // Find which tab this select belongs to
    let device, activeTab;

    if (isMobileView()) {
        // Mobile - find which mobile tab contains this select
        const mobileTabContent = changedSelect.closest('.mobile-tab-content');
        if (!mobileTabContent) return;

        const mobileTabItem = mobileTabContent.closest('.mobile-tab-item');
        const allMobileTabItems = document.querySelectorAll('.mobile-tab-item');

        for (let i = 0; i < allMobileTabItems.length; i++) {
            if (allMobileTabItems[i] === mobileTabItem) {
                device = 'mobile';
                activeTab = i + 1;
                break;
            }
        }
    } else {
        // Desktop - find which desktop tab contains this select
        const desktopTabPane = changedSelect.closest('.tab-pane');
        if (!desktopTabPane) return;

        device = 'desktop';
        activeTab = desktopTabPane.id === 'tab1' ? 1 : 2;
    }

    if (!device || !activeTab) return;

    const state = sliderStates[device][activeTab];
    state.currentLocation = changedSelect.value;

    // Filter slides and reset to first slide
    filterSlidesForTab(device, activeTab, state.currentLocation);
    state.currentSlide = 0;

    // Recreate dots and update slider
    createDotsForTab(device, activeTab);
    updateSliderForTab(device, activeTab);
}

// Touch event handlers
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    pauseAutoSlide();
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    resumeAutoSlideAfterDelay();
}

// Mouse event handlers for desktop drag
function handleMouseDown(e) {
    isDragging = true;
    touchStartX = e.clientX;
    pauseAutoSlide();
}

function handleMouseUp(e) {
    if (isDragging) {
        touchEndX = e.clientX;
        handleSwipe();
        isDragging = false;
        resumeAutoSlideAfterDelay();
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
}

function handleSwipe() {
    let device, activeTab;

    if (isMobileView()) {
        device = 'mobile';
        activeTab = getActiveMobileTab();
    } else {
        device = 'desktop';
        activeTab = getActiveDesktopTab();
    }

    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            prevSlideForTab(device, activeTab);
        } else {
            nextSlideForTab(device, activeTab);
        }
    }
}

// Initialize slider for specific mobile tab
function initSliderForMobileTab(tabNumber) {
    const state = sliderStates.mobile[tabNumber];

    // Initialize with all slides for this tab
    filterSlidesForTab('mobile', tabNumber, 'all');
    state.currentSlide = 0;
    createDotsForTab('mobile', tabNumber);
    updateSliderForTab('mobile', tabNumber);
}

// Initialize slider for specific desktop tab
function initSliderForDesktopTab(tabNumber) {
    const state = sliderStates.desktop[tabNumber];

    // Initialize with all slides for this tab
    filterSlidesForTab('desktop', tabNumber, 'all');
    state.currentSlide = 0;
    createDotsForTab('desktop', tabNumber);
    updateSliderForTab('desktop', tabNumber);
}

// Handle Bootstrap tab changes for desktop
function handleBootstrapTabChange(event) {
    const targetTab = event.target.getAttribute('data-bs-target');
    const tabNumber = targetTab === '#tab1' ? 1 : 2;
    initSliderForDesktopTab(tabNumber);
}

// Auto-slide control functions
function startAutoSlide() {
    if (autoSlideInterval) return;

    autoSlideInterval = setInterval(() => {
        if (!isSliderPaused) {
            let device, activeTab;

            if (isMobileView()) {
                device = 'mobile';
                // Check which tab system is active
                const homepageTab = document.querySelector('#myTabs .nav-link.active');
                const livingTab = document.querySelector('#myTabs1 .nav-link.active');
                
                if (livingTab) {
                    activeTab = getActiveMobileTab1();
                } else if (homepageTab) {
                    activeTab = getActiveMobileTab();
                } else {
                    return; // No active tabs found
                }
            } else {
                device = 'desktop';
                // Check which tab system is active
                const homepageTab = document.querySelector('#myTabs .nav-link.active');
                const livingTab = document.querySelector('#myTabs1 .nav-link.active');
                
                if (livingTab) {
                    activeTab = getActiveDesktopTab1();
                } else if (homepageTab) {
                    activeTab = getActiveDesktopTab();
                } else {
                    return; // No active tabs found
                }
            }

            // Only proceed if sliderStates exists for this device/tab combination
            // This prevents errors when tabs don't have sliders
            if (sliderStates && 
                sliderStates[device] && 
                sliderStates[device][activeTab] && 
                sliderStates[device][activeTab].visibleSlides && 
                sliderStates[device][activeTab].visibleSlides.length > 1) {
                
                nextSlideForTab(device, activeTab);
            }
            // If no slider state exists, just skip this iteration (no error)
        }
    }, 5000);
}

function pauseAutoSlide() {
    isSliderPaused = true;
}

function resumeAutoSlide() {
    isSliderPaused = false;
}

function resumeAutoSlideAfterDelay() {
    setTimeout(() => {
        if (!isSliderPaused) {
            resumeAutoSlide();
        }
    }, 3000);
}

// Set up hover pause events for slider containers
function setupHoverPause() {
    const sliderContainers = document.querySelectorAll('.slider-container');
    sliderContainers.forEach(container => {
        container.addEventListener('mouseenter', pauseAutoSlide);
        container.addEventListener('mouseleave', resumeAutoSlide);
    });
}

// Set up swipe events for a specific slider wrapper
function setupSwipeEvents(wrapper) {
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrapper.addEventListener('mousedown', handleMouseDown);
}

// Initialize all sliders
function initAllSliders() {
    // Set up touch and mouse events for all slider wrappers
    const sliderWrappers = document.querySelectorAll('.slider-wrapper');
    sliderWrappers.forEach(setupSwipeEvents);

    // Global mouse events for desktop drag
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    // Set up Bootstrap tab change listeners for desktop
    const desktopTabButtons = document.querySelectorAll('#myTabs .nav-link');
    desktopTabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', handleBootstrapTabChange);
    });

    // Set up location change listeners for all dropdowns
    const locationSelects = document.querySelectorAll('.location-select');
    locationSelects.forEach(select => {
        select.addEventListener('change', changeLocation);
    });

    // Set up hover pause functionality
    setupHoverPause();

    // Initialize the active tabs
    initSliderForMobileTab(1); // Mobile first tab
    initSliderForDesktopTab(1); // Desktop first tab

    // Start auto-slide
    startAutoSlide();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    initAllSliders();
});


let currentDesktopCard = 0;

function expandDesktopCard(cardIndex) {
    const cards = document.querySelectorAll('.desktop-card');
    cards.forEach((card, index) => {
        if (index === cardIndex) {
            card.classList.add('expanded');
            card.classList.remove('collapsed');
        } else {
            card.classList.add('collapsed');
            card.classList.remove('expanded');
        }
    });
    currentDesktopCard = cardIndex;
}

// Desktop event listeners
document.addEventListener('click', function (e) {
    // Handle expand arrow clicks
    if (e.target.closest('.expand-arrow')) {
        const target = parseInt(e.target.closest('.expand-arrow').dataset.target);
        expandDesktopCard(target);
    }

    // Handle preview thumbnail clicks
    if (e.target.closest('.card-preview')) {
        const target = parseInt(e.target.closest('.card-preview').dataset.target);
        expandDesktopCard(target);
    }

    // Handle collapsed card clicks
    if (e.target.closest('.desktop-card.collapsed')) {
        const cardIndex = parseInt(e.target.closest('.desktop-card').dataset.card);
        expandDesktopCard(cardIndex);
    }
});

// Mobile functionality
let currentMobileSlide = 0;
const totalSlides = 2;

function goToSlide(slideIndex) {
    const slider = document.getElementById('mobileSlider');
    const percentage = slideIndex * -50; // Each slide is 50% width
    slider.style.transform = `translateX(${percentage}%)`;

    // Update navigation dots
    document.querySelectorAll('.mobile-nav-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });

    currentMobileSlide = slideIndex;
}

function nextSlide() {
    const nextSlide = (currentMobileSlide + 1) % totalSlides;
    goToSlide(nextSlide);
}

function prevSlide() {
    const prevSlide = (currentMobileSlide - 1 + totalSlides) % totalSlides;
    goToSlide(prevSlide);
}

// Mobile touch events
let startX = 0;
let currentX = 0;

const mobileContainer = document.getElementById('mobileContainer');
const mobileSlider = document.getElementById('mobileSlider');

mobileContainer.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    isDragging = true;
    mobileSlider.style.transition = 'none';
});

mobileContainer.addEventListener('touchmove', function (e) {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    const currentTransform = currentMobileSlide * -50;
    const newTransform = currentTransform + (deltaX / window.innerWidth) * 100;

    // Limit the drag range
    const maxTransform = 0;
    const minTransform = -(totalSlides - 1) * 50;
    const clampedTransform = Math.max(minTransform, Math.min(maxTransform, newTransform));

    mobileSlider.style.transform = `translateX(${clampedTransform}%)`;
});

mobileContainer.addEventListener('touchend', function (e) {
    if (!isDragging) return;

    isDragging = false;
    mobileSlider.style.transition = 'transform 0.4s ease-out';

    const deltaX = currentX - startX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
            prevSlide();
        } else {
            nextSlide();
        }
    } else {
        goToSlide(currentMobileSlide);
    }
});

document.addEventListener('click', function (e) {
    if (e.target.closest('.mobile-nav-dot')) {
        const slideIndex = parseInt(e.target.closest('.mobile-nav-dot').dataset.slide);
        goToSlide(slideIndex);
    }
});

expandDesktopCard(0);
goToSlide(0);


function toggleMobileTabLiving(tabNumber) {
    const mobileTabButtons1 = document.querySelectorAll('.multi-living .mobile-tab-item .nav-link');
    mobileTabButtons1.forEach(button => button.classList.remove('active'));
    
    const mobileTabContents1 = document.querySelectorAll('.multi-living .mobile-tab-content');
    mobileTabContents1.forEach(content => content.classList.remove('active'));
    
    const selectedButton1 = document.querySelector(`.multi-living .mobile-tab-item:nth-child(${tabNumber}) .nav-link`);
    const selectedContent1 = document.querySelector(`.multi-living .mobile-tab-item:nth-child(${tabNumber}) .mobile-tab-content`);
    
    if (selectedButton1 && selectedContent1) {
        selectedButton1.classList.add('active');
        selectedContent1.classList.add('active');
    }
}

function getActiveMobileTab1() {
    const activeTab1 = document.querySelector('.multi-living .mobile-tab-item .nav-link.active');
    if (!activeTab1) return 1;
    
    const tabItem1 = activeTab1.closest('.mobile-tab-item');
    const allTabItems1 = document.querySelectorAll('.multi-living .mobile-tab-item');
    
    for (let i = 0; i < allTabItems1.length; i++) {
        if (allTabItems1[i] === tabItem1) {
            return i + 1;
        }
    }
    return 1;
}

function getActiveDesktopTab1() {
    const activeTab = document.querySelector('#myTabs1 .nav-link.active');
    if (!activeTab) return 1;
    
    const tabId = activeTab.getAttribute('data-bs-target');
    switch(tabId) {
        case '#tab10': return 1;
        case '#tab20': return 2;
        case '#tab30': return 3;
        default: return 1;
    }
}

function isMobileView() {
    return window.innerWidth < 992;
}




const { ScrollObserver, valueAtPercentage } = aat

const cardsContainer = document.querySelector('.cards')
const cards = document.querySelectorAll('.card')
cardsContainer.style.setProperty('--cards-count', cards.length)
cardsContainer.style.setProperty(
  '--card-height',
  `${cards[0].clientHeight}px`
)
Array.from(cards).forEach((card, index) => {
  const offsetTop = 20 + index * 20
  card.style.paddingTop = `${offsetTop}px`
  if (index === cards.length - 1) {
    return
  }
  const toScale = 1 - (cards.length - 1 - index) * 0.1
  const nextCard = cards[index + 1]
  const cardInner = card.querySelector('.card__inner')
  ScrollObserver.Element(nextCard, {
    offsetTop,
    offsetBottom: window.innerHeight - card.clientHeight
  }).onScroll(({ percentageY }) => {
    cardInner.style.scale = valueAtPercentage({
      from: 1,
      to: toScale,
      percentage: percentageY
    })
    cardInner.style.filter = `brightness(${valueAtPercentage({
      from: 1,
      to: 0.6,
      percentage: percentageY
    })})`
  })
})