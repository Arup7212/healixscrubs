if (!customElements.get('hero-slideshow')) {
  class HeroSlideshow extends HTMLElement {
    constructor() {
      super();
      this.track = this.querySelector('[ref="sliderTrack"]');
      this.dotsContainer = this.querySelector('[ref="dotsContainer"]');
      this.autoplay = this.getAttribute('data-autoplay') === 'true';
      this.autoplaySpeed = parseInt(this.getAttribute('data-autoplay-speed') || '5000', 10);
      this.autoplayTimer = null;
      this.currentSlideIndex = 0;
      this.isInteracting = false;
    }

    connectedCallback() {
      const track = this.track;
      if (!track) return;

      // Sync initial position
      this.handleScroll();

      // Listen to scroll to update dots
      track.addEventListener('scroll', () => this.handleScroll(), { passive: true });

      // Setup dots clicking
      if (this.dotsContainer) {
        const dots = this.dotsContainer.querySelectorAll('.hero-dot');
        dots.forEach(dot => {
          dot.addEventListener('click', (e) => {
            const targetIndex = parseInt(dot.getAttribute('data-slide-index') || '0', 10);
            this.scrollToSlide(targetIndex);
          });
        });
      }

      // Setup autoplay with hover/interaction pause
      if (this.autoplay) {
        this.startAutoplay();
        
        this.addEventListener('mouseenter', () => this.pauseAutoplay());
        this.addEventListener('mouseleave', () => this.resumeAutoplay());
        this.addEventListener('touchstart', () => this.pauseAutoplay(), { passive: true });
        this.addEventListener('touchend', () => this.resumeAutoplay(), { passive: true });
      }

      // Handle resize events to recalculate scroll positions
      this._resizeHandler = () => {
        this.scrollToSlide(this.currentSlideIndex, 'instant');
      };
      window.addEventListener('resize', this._resizeHandler, { passive: true });
    }

    disconnectedCallback() {
      this.stopAutoplay();
      if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
      }
    }

    /**
     * @param {number} index
     * @param {ScrollBehavior} [behavior]
     */
    scrollToSlide(index, behavior = 'smooth') {
      const track = this.track;
      if (!(track instanceof HTMLElement)) return;

      const slides = track.querySelectorAll('.hero-slide');
      if (index < 0 || index >= slides.length) return;
      const targetSlide = slides[index];
      if (!(targetSlide instanceof HTMLElement)) return;
      
      track.scrollTo({
        left: targetSlide.offsetLeft,
        behavior: behavior
      });
      
      this.currentSlideIndex = index;
      this.updateDots(index);
    }

    handleScroll() {
      const track = this.track;
      if (!(track instanceof HTMLElement)) return;
      
      const trackWidth = track.clientWidth || track.offsetWidth;
      if (!trackWidth) return;
      
      const scrollLeft = track.scrollLeft;
      const index = Math.round(scrollLeft / trackWidth);
      
      const slides = track.querySelectorAll('.hero-slide');
      if (index >= 0 && index < slides.length && index !== this.currentSlideIndex) {
        this.currentSlideIndex = index;
        this.updateDots(index);
      }
    }

    /**
     * @param {number} index
     */
    updateDots(index) {
      if (!this.dotsContainer) return;
      const dots = this.dotsContainer.querySelectorAll('.hero-dot');
      dots.forEach((dot, idx) => {
        if (idx === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    startAutoplay() {
      this.stopAutoplay();
      const track = this.track;
      if (!track) return;
      const slides = track.querySelectorAll('.hero-slide');
      if (!slides || slides.length <= 1) return;

      this.autoplayTimer = setInterval(() => {
        if (this.isInteracting) return;
        let nextIndex = this.currentSlideIndex + 1;
        if (nextIndex >= slides.length) {
          nextIndex = 0;
        }
        this.scrollToSlide(nextIndex);
      }, this.autoplaySpeed);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    pauseAutoplay() {
      this.isInteracting = true;
    }

    resumeAutoplay() {
      this.isInteracting = false;
    }
  }
  customElements.define('hero-slideshow', HeroSlideshow);
}
