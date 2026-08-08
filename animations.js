(() => {
  "use strict";

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap) return;

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  const q = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const exists = (selector, scope = document) => Boolean(scope.querySelector(selector));

  function animateHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    gsap.from(header, {
      y: -18,
      autoAlpha: 0,
      duration: 0.55,
      ease: "power2.out",
      clearProps: "transform,opacity,visibility"
    });
  }

  function animateHomeHero() {
    const hero = document.querySelector(".hero-immersive");
    if (!hero) return;

    const copy = q(".hero-copy > *", hero);
    const card = hero.querySelector(".scene-card");
    const canvas = hero.closest(".immersive-stage")?.querySelector(".ambient-field");

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (canvas) {
      timeline.from(canvas, { autoAlpha: 0, duration: 0.9 }, 0);
    }

    if (copy.length) {
      timeline.from(copy, {
        y: 24,
        autoAlpha: 0,
        duration: 0.68,
        stagger: 0.075,
        clearProps: "transform,opacity,visibility"
      }, 0.06);
    }

    if (card) {
      timeline.fromTo(card,
        {
          x: 34,
          y: 12,
          autoAlpha: 0,
          rotationY: -9,
          rotationX: 3,
          transformPerspective: 900
        },
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          rotationY: -3,
          rotationX: 1.5,
          transformPerspective: 900,
          duration: 0.85,
          clearProps: "opacity,visibility",
          ease: "power3.out"
        },
        0.18
      );
    }
  }

  function animateProductHero() {
    const stage = document.querySelector(".product-stage");
    if (!stage) return;

    const icon = stage.querySelector(".product-hero > img");
    const content = stage.querySelector(".product-hero > div");
    const contentItems = content ? Array.from(content.children) : [];
    const canvas = stage.querySelector(".ambient-field");

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (canvas) {
      timeline.from(canvas, { autoAlpha: 0, duration: 0.85 }, 0);
    }

    if (icon) {
      timeline.from(icon, {
        scale: 0.82,
        y: 18,
        autoAlpha: 0,
        duration: 0.72,
        clearProps: "transform,opacity,visibility"
      }, 0.05);
    }

    if (contentItems.length) {
      timeline.from(contentItems, {
        y: 22,
        autoAlpha: 0,
        duration: 0.62,
        stagger: 0.07,
        clearProps: "transform,opacity,visibility"
      }, 0.1);
    }
  }

  function revealOnScroll(selector, options = {}) {
    if (!ScrollTrigger) return;

    q(selector).forEach((element, index) => {
      gsap.from(element, {
        y: options.y ?? 24,
        autoAlpha: 0,
        scale: options.scale ?? 1,
        duration: options.duration ?? 0.65,
        delay: options.staggerByIndex ? index * options.staggerByIndex : 0,
        ease: options.ease ?? "power2.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: element,
          start: options.start ?? "top 88%",
          once: true,
          invalidateOnRefresh: true
        }
      });
    });
  }

  function addScrollParallax() {
    if (!ScrollTrigger) return;

    q(".immersive-stage .ambient-field, .product-stage .ambient-field").forEach((canvas) => {
      const stage = canvas.parentElement;
      if (!stage) return;

      gsap.to(canvas, {
        yPercent: 7,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      });
    });
  }

  function addCardHoverDepth() {
    q(".interactive-card").forEach((card) => {
      let active = false;

      const reset = () => {
        active = false;
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          x: 0,
          y: 0,
          duration: 0.38,
          ease: "power2.out",
          overwrite: true
        });
      };

      card.addEventListener("pointerenter", () => {
        active = true;
      });

      card.addEventListener("pointermove", (event) => {
        if (!active || event.pointerType === "touch") return;
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        gsap.to(card, {
          rotationY: px * 2.4,
          rotationX: py * -2,
          transformPerspective: 900,
          x: px * 2,
          y: -3 + py * 1.5,
          duration: 0.28,
          ease: "power2.out",
          overwrite: true
        });
      });

      card.addEventListener("pointerleave", reset);
      card.addEventListener("pointercancel", reset);
    });
  }

  function init() {
    document.documentElement.classList.add("gsap-enhanced");

    animateHeader();
    animateHomeHero();
    animateProductHero();

    revealOnScroll("#products .section-header", { y: 18, duration: 0.58 });
    revealOnScroll("#products .interactive-card", { y: 30, scale: 0.985, duration: 0.7 });
    revealOnScroll(".section.compact .card", { y: 24, duration: 0.62, staggerByIndex: 0.04 });

    addScrollParallax();
    addCardHoverDepth();

    if (ScrollTrigger) {
      window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
