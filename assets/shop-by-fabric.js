/**
 * shop-by-fabric.js
 * Smooth Circular Fabric Collection Auto-Slider
 */

class ShopByFabricSlider {
  constructor(sectionElement) {
    this.section = sectionElement;
    this.viewport = this.section.querySelector('.sbf-slider-viewport');
    this.track = this.section.querySelector('.sbf-slider-track');
    this.prevBtn = this.section.querySelector('.sbf-nav-button.prev');
    this.nextBtn = this.section.querySelector('.sbf-nav-button.next');
    
    this.autoplay = this.section.dataset.autoplay === 'true';
    let rawSpeed = parseInt(this.section.dataset.autoplaySpeed, 10) || 4;
    // Ensure speed is in milliseconds (min 2000ms = 2s)
    this.autoplaySpeed = rawSpeed < 100 ? rawSpeed * 1000 : rawSpeed;
    
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;

    this.init();
  }

  init() {
    if (!this.viewport || !this.track) return;

    this.updateCardMetrics();
    this.bindEvents();
    
    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  updateCardMetrics() {
    this.items = Array.from(this.track.querySelectorAll('.sbf-item'));
    if (this.items.length === 0) return;

    const itemWidth = this.items[0].offsetWidth;
    const computedStyle = window.getComputedStyle(this.track);
    const gap = parseInt(computedStyle.gap || '32', 10);

    this.stepSize = itemWidth + gap;
    this.visibleWidth = this.viewport.offsetWidth;
    this.totalTrackWidth = this.items.length * this.stepSize - gap;
    this.maxScroll = Math.max(0, this.totalTrackWidth - this.visibleWidth);
  }

  bindEvents() {
    // Navigation Buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAutoplay();
        this.prevSlide();
        if (this.autoplay) this.startAutoplay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAutoplay();
        this.nextSlide();
        if (this.autoplay) this.startAutoplay();
      });
    }

    // Mouse & Touch Drag Events
    this.viewport.addEventListener('mousedown', this.dragStart.bind(this));
    this.viewport.addEventListener('mousemove', this.dragMove.bind(this));
    this.viewport.addEventListener('mouseup', this.dragEnd.bind(this));
    
    this.section.addEventListener('mouseleave', () => {
      if (this.isDragging) this.dragEnd();
      this.resumeAutoplayIfEnabled();
    });

    this.section.addEventListener('mouseenter', () => this.stopAutoplay());

    this.viewport.addEventListener('touchstart', this.dragStart.bind(this), { passive: true });
    this.viewport.addEventListener('touchmove', this.dragMove.bind(this), { passive: true });
    this.viewport.addEventListener('touchend', this.dragEnd.bind(this));

    // Window Resize
    window.addEventListener('resize', () => {
      this.updateCardMetrics();
      this.slideToIndex(this.currentIndex);
    });
  }

  dragStart(e) {
    this.isDragging = true;
    this.startX = this.getPositionX(e);
    this.stopAutoplay();
    this.track.style.transition = 'none';
  }

  dragMove(e) {
    if (!this.isDragging) return;
    const currentX = this.getPositionX(e);
    const diff = currentX - this.startX;
    this.currentTranslate = this.prevTranslate + diff;

    // Bounds constraint with smooth dampening
    if (this.currentTranslate > 0) {
      this.currentTranslate = this.currentTranslate * 0.3;
    } else if (Math.abs(this.currentTranslate) > this.maxScroll) {
      const overflow = Math.abs(this.currentTranslate) - this.maxScroll;
      this.currentTranslate = -this.maxScroll - overflow * 0.3;
    }

    this.setTrackPosition(this.currentTranslate);
  }

  dragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const movedBy = this.currentTranslate - this.prevTranslate;

    if (movedBy < -40) {
      this.nextSlide();
    } else if (movedBy > 40) {
      this.prevSlide();
    } else {
      this.slideToIndex(this.currentIndex);
    }

    this.resumeAutoplayIfEnabled();
  }

  getPositionX(e) {
    return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  }

  setTrackPosition(translateX) {
    this.track.style.transform = `translateX(${translateX}px)`;
  }

  slideToIndex(index) {
    this.updateCardMetrics();
    const maxIndex = Math.max(0, Math.ceil((this.totalTrackWidth - this.visibleWidth) / this.stepSize));
    
    if (index > maxIndex) {
      this.currentIndex = 0;
    } else if (index < 0) {
      this.currentIndex = maxIndex;
    } else {
      this.currentIndex = index;
    }

    const targetTranslate = -Math.min(this.currentIndex * this.stepSize, this.maxScroll);
    this.track.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.35, 1)';
    this.setTrackPosition(targetTranslate);
    this.prevTranslate = targetTranslate;
    this.currentTranslate = targetTranslate;
  }

  nextSlide() {
    this.slideToIndex(this.currentIndex + 1);
  }

  prevSlide() {
    this.slideToIndex(this.currentIndex - 1);
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  resumeAutoplayIfEnabled() {
    if (this.autoplay && !this.autoplayTimer) {
      this.startAutoplay();
    }
  }
}

// Global initialization
function initShopByFabricSections() {
  document.querySelectorAll('[data-section-type="shop-by-fabric"]').forEach((section) => {
    if (!section.dataset.initialized) {
      new ShopByFabricSlider(section);
      section.dataset.initialized = 'true';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShopByFabricSections);
} else {
  initShopByFabricSections();
}

// Theme Editor Listener
document.addEventListener('shopify:section:load', (event) => {
  const section = event.target.querySelector('[data-section-type="shop-by-fabric"]');
  if (section) {
    new ShopByFabricSlider(section);
  }
});