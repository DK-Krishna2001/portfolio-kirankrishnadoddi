// js/main.js
// Portfolio Interactive Controls, Animations & Form Verification

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. Navigation Header Scroll Effect ---
  const header = document.getElementById('main-header');
  const scrollThreshold = 50;

  window.addEventListener('scroll', () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- 2. Mobile Menu Navigation ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close mobile menu when clicking a navigation link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // --- 3. Scroll Spy Navigation Highlight ---
  const sections = document.querySelectorAll('section');
  
  function scrollSpy() {
    let currentActive = '';
    const scrollPos = window.scrollY + 150; // offset for nav header height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentActive = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentActive}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', scrollSpy);
  scrollSpy(); // run once initially

  // --- 4. Interactive Pipeline Visualizer (Removed) ---

  // --- 5. Project Description Tabs Handler (Trisoul AI) ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');

      // Reset active tabs
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      // Activate clicked
      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabTarget}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // --- 6. Scroll-Driven Animation Fallback for Unsupporting Browsers (e.g. Firefox) ---
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    console.log('Scroll-Driven animations not natively supported. Initializing IntersectionObserver fallback...');
    
    const elementsToAnimate = [
      ...document.querySelectorAll('.section-container > *'),
      ...document.querySelectorAll('.project-card'),
      ...document.querySelectorAll('.skill-category-card')
    ];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add custom entry animation style classes
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
          entry.target.style.transition = 'opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)';
          observer.unobserve(entry.target); // trigger animation only once
        }
      });
    }, {
      root: null,
      threshold: 0.05,
      rootMargin: '0px 0px -50px 0px'
    });

    elementsToAnimate.forEach(el => {
      // Set initial styles for fallback animation
      el.style.opacity = '0';
      if (el.classList.contains('project-card')) {
        el.style.transform = 'translateY(50px) rotateX(-8deg) scale(0.97)';
      } else {
        el.style.transform = 'translateY(30px)';
      }
      observer.observe(el);
    });
  }

  // --- 7. Contact Form Handler with Validation ---
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success-msg');
  const errorMsg = document.getElementById('form-error-msg');
  const submitBtn = document.getElementById('btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isFormValid = true;
    const inputs = form.querySelectorAll('input:not([name="company"]), textarea');
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Trigger validity check
    inputs.forEach(input => {
      // Using standard HTML5 validity
      if (!input.checkValidity()) {
        isFormValid = false;
        
        // Custom classes to force visual warning
        input.classList.add('invalid-shake');
        setTimeout(() => input.classList.remove('invalid-shake'), 500);
      }
    });

    if (isFormValid) {
      submitBtn.disabled = true;
      const btnSpan = submitBtn.querySelector('span');
      const btnIcon = submitBtn.querySelector('i');
      const originalText = btnSpan.textContent;

      btnSpan.textContent = 'Sending...';
      btnIcon.className = 'fa-solid fa-spinner fa-spin';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.ok !== true) {
          throw new Error(result.error || 'Unable to send message.');
        }

        successMsg.style.display = 'flex';
        form.reset();
        setTimeout(() => {
          successMsg.style.display = 'none';
        }, 5000);
      } catch (error) {
        errorMsg.style.display = 'flex';
      } finally {
        btnSpan.textContent = originalText;
        btnIcon.className = 'fa-solid fa-paper-plane';
        submitBtn.disabled = false;
      }
    }
  });

  // Clear errors when typing
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      if (input.checkValidity()) {
        input.classList.remove('invalid-shake');
      }
    });
  });



  // --- 9. Floating Theme Customizer ---
  const customizerToggle = document.getElementById('customizer-toggle');
  const themeCustomizer = document.getElementById('theme-customizer');
  const colorOpts = document.querySelectorAll('.color-opt');

  // Toggle Customizer Panel
  customizerToggle.addEventListener('click', () => {
    themeCustomizer.classList.toggle('open');
  });

  // Close Customizer panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!themeCustomizer.contains(e.target)) {
      themeCustomizer.classList.remove('open');
    }
  });

  // Theme definition map
  const themes = {
    cyber: {
      '--color-accent': '#10b981',
      '--color-secondary': '#06b6d4',
      '--border-glow': 'rgba(6, 182, 212, 0.4)'
    },
    vapor: {
      '--color-accent': '#d946ef',
      '--color-secondary': '#8b5cf6',
      '--border-glow': 'rgba(217, 70, 239, 0.4)'
    },
    solar: {
      '--color-accent': '#f59e0b',
      '--color-secondary': '#ef4444',
      '--border-glow': 'rgba(245, 158, 11, 0.4)'
    },
    matrix: {
      '--color-accent': '#22c55e',
      '--color-secondary': '#10b981',
      '--border-glow': 'rgba(34, 197, 94, 0.4)'
    }
  };

  // Apply Selected Theme variables to root
  function applyTheme(themeName) {
    const themeVars = themes[themeName] || themes.cyber;
    Object.keys(themeVars).forEach(key => {
      document.documentElement.style.setProperty(key, themeVars[key]);
    });

    // Update active class in customizer buttons
    colorOpts.forEach(opt => {
      if (opt.getAttribute('data-theme') === themeName) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    // Persist in localStorage
    localStorage.setItem('portfolio-accent-theme', themeName);
  }

  // Option buttons event listener
  colorOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.getAttribute('data-theme');
      applyTheme(theme);
    });
  });

  // Keyboard accessibility for customizer elements (div, span)
  const addKeyboardTrigger = (el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  };
  addKeyboardTrigger(customizerToggle);
  colorOpts.forEach(addKeyboardTrigger);

  // Init Theme from storage
  const savedTheme = localStorage.getItem('portfolio-accent-theme') || 'cyber';
  applyTheme(savedTheme);

  // --- 10. 3D Perspective Card Tilt Effect ---
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // Cursor position relative to card
      const y = e.clientY - rect.top;

      const width = rect.width;
      const height = rect.height;

      // Calculate rotation angles based on cursor offset from card center
      // Max rotation: 10 degrees for professional look
      const rotY = ((x / width) - 0.5) * 20; 
      const rotX = -((y / height) - 0.5) * 20; 

      // Apply 3D transform rotation & scaling
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      // Smoothly animate back to default state
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });

  // --- 11. AI Engineer Typing Effect ---
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) {
    const cursor = tagline.querySelector('.cursor-blink');
    const roles = [
      'AI/ML Engineer & Data Scientist',
      'Building Production-Grade AI Systems',
      'Agentic AI & LLM Architect',
      'ML Research Engineer @ UB'
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseEnd = 2500;
    const pauseStart = 500;

    function typeRole() {
      const current = roles[roleIndex];
      
      if (!isDeleting) {
        // Typing forward
        const textNode = tagline.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = current.substring(0, charIndex + 1);
        }
        charIndex++;
        
        if (charIndex >= current.length) {
          isDeleting = false;
          setTimeout(() => {
            isDeleting = true;
            typeRole();
          }, pauseEnd);
          return;
        }
        setTimeout(typeRole, typeSpeed);
      } else {
        // Deleting
        const textNode = tagline.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = current.substring(0, charIndex - 1);
        }
        charIndex--;
        
        if (charIndex <= 0) {
          isDeleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          setTimeout(typeRole, pauseStart);
          return;
        }
        setTimeout(typeRole, deleteSpeed);
      }
    }

    // Start the typing effect after a short delay
    setTimeout(() => {
      // Ensure initial text node exists
      const firstText = tagline.childNodes[0];
      if (!firstText || firstText.nodeType !== Node.TEXT_NODE) {
        tagline.insertBefore(document.createTextNode(roles[0]), tagline.firstChild);
      }
      charIndex = roles[0].length;
      setTimeout(() => {
        isDeleting = true;
        typeRole();
      }, pauseEnd);
    }, 1500);
  }

  // --- 12. Staggered Skill Tag Reveal ---
  const skillCards = document.querySelectorAll('.skill-category-card');
  
  if (skillCards.length && 'IntersectionObserver' in window) {
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const tags = entry.target.querySelectorAll('.skill-tag-item');
          tags.forEach((tag, i) => {
            tag.style.opacity = '0';
            tag.style.transform = 'translateX(-12px)';
            tag.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`;
            requestAnimationFrame(() => {
              tag.style.opacity = '1';
              tag.style.transform = 'translateX(0)';
            });
          });
          skillObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    skillCards.forEach(card => skillObserver.observe(card));
  }

});
