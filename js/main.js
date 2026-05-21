/**
 * MOTOR SIN — Main JavaScript Bundle
 *
 * 1. Neon Steering-Wheel Cursor (triple-layer glow, Canvas2D)
 * 2. Navigation (scroll shadow + mobile hamburger)
 * 3. Hero video async load
 * 4. Scroll reveal
 * 5. Hero entry animation
 * 6. Magnetic buttons
 * 7. Form handler
 * 8. Scroll to top
 * 9. Counting stats
 * 10. 3D Services Cards
 */

/* ==========================================
   1. STEERING WHEEL NEON CURSOR
   Inspired by cursor.html neonCursor effect.
   Triple shadowBlur layers for real neon glow.
   Transparent canvas — never blocks the page.
   ========================================== */
function initNeonCursor() {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let mx = -500, my = -500;
  let cx = -500, cy = -500;
  let velX = 0;
  let rotation = 0;

  window.addEventListener('mousemove', e => {
    velX   = e.clientX - mx;
    mx     = e.clientX;
    my     = e.clientY;
  }, { passive: true });

  // Neon trail — short glowing dots
  const TRAIL = 16;
  const trail = Array.from({ length: TRAIL }, () => ({ x: -500, y: -500 }));

  /* Draw the steering wheel with 3 nested glow passes */
  function drawWheel(x, y, r, rot) {
    const layers = [
      { blur: 44, width: 6,   rgb: '30,111,245',  op: 0.28 },
      { blur: 18, width: 3.5, rgb: '80,160,255',  op: 0.62 },
      { blur:  4, width: 1.8, rgb: '215,232,255', op: 1.00 },
    ];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    for (const L of layers) {
      const c = `rgba(${L.rgb},${L.op})`;
      ctx.save();
      ctx.strokeStyle = c;
      ctx.lineWidth   = L.width;
      ctx.shadowColor = c;
      ctx.shadowBlur  = L.blur;
      ctx.lineCap     = 'round';

      // Outer rim
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // 3 spokes at 90°, 210°, 330°
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.80, Math.sin(a) * r * 0.80);
        ctx.lineTo(Math.cos(a) * r * 0.24, Math.sin(a) * r * 0.24);
        ctx.stroke();
      }

      // Hub ring outer
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.30, 0, Math.PI * 2);
      ctx.lineWidth = L.width * 0.6;
      ctx.stroke();

      // Hub core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.lineWidth = L.width;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lerp position
    cx += (mx - cx) * 0.13;
    cy += (my - cy) * 0.13;

    // Rotation from horizontal velocity
    rotation += velX * 0.024;
    velX *= 0.86;

    // Update trail chain
    trail[0].x = cx; trail[0].y = cy;
    for (let i = 1; i < TRAIL; i++) {
      trail[i].x += (trail[i - 1].x - trail[i].x) * 0.16;
      trail[i].y += (trail[i - 1].y - trail[i].y) * 0.16;
    }

    // Draw continuous neon tail
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let j = 0; j < 3; j++) {
      const gWidth = [10, 5, 2][j];
      const gBlur  = [24, 12, 4][j];
      const gOpac  = [0.3, 0.6, 1.0][j];

      ctx.shadowColor = `rgba(30,111,245,${gOpac})`;
      ctx.shadowBlur  = gBlur;
      ctx.lineWidth   = gWidth;

      for (let i = 1; i < TRAIL - 1; i++) {
        const t = 1 - (i / TRAIL);
        if (t < 0.05) continue;

        ctx.beginPath();
        // Fade out the tail opacity based on distance
        ctx.strokeStyle = `rgba(30,111,245,${t * t * gOpac})`;
        ctx.moveTo(trail[i].x, trail[i].y);
        ctx.lineTo(trail[i+1].x, trail[i+1].y);
        ctx.stroke();
      }
    }

    // Draw main steering wheel at lerped cursor position
    drawWheel(cx, cy, 22, rotation);
  }

  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animate();
  });
}

/* ==========================================
   2. NAVIGATION
   ========================================== */
function initNavigation() {
  const nav        = document.querySelector('.nav');
  const hamburger  = document.querySelector('.nav__hamburger');
  const mobileNav  = document.querySelector('.mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav__link');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ==========================================
   3. HERO VIDEO ASYNC LOAD
   ========================================== */
function initHeroVideo() {
  const video    = document.getElementById('hero-video');
  const skeleton = document.querySelector('.hero__video-skeleton');
  if (!video) return;

  const loadVideo = () => {
    const src = video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
    video.load();
    video.addEventListener('canplay', () => {
      video.currentTime = 0.2; // Skip the gray first frame
      video.classList.add('loaded');
      if (skeleton) skeleton.classList.add('hidden');
    }, { once: true });
    video.addEventListener('error', () => {
      if (skeleton) skeleton.classList.add('hidden');
    }, { once: true });

    // Play on first scroll
    let hasPlayed = false;
    const playOnScroll = () => {
        if (!hasPlayed && window.scrollY > 10) {
            hasPlayed = true;
            video.play().catch(() => {}); // Catch autoplay blockers
            window.removeEventListener('scroll', playOnScroll);
        }
    };
    window.addEventListener('scroll', playOnScroll, { passive: true });

    // Play on click
    video.addEventListener('click', () => {
      video.currentTime = 0;
      video.play();
      hasPlayed = true;
      window.removeEventListener('scroll', playOnScroll);
    });
    
    // -- Option A: Bubble Cursor Badge --
    const wrapper = document.querySelector('.hero__video-wrapper');
    if (wrapper) {
      const badge = document.createElement('div');
      badge.className = 'video-hover-badge';
      badge.setAttribute('data-i18n', 'video-hover-badge');
      const currentLang = localStorage.getItem('lang') || 'es';
      badge.innerHTML = dictionary['video-hover-badge'] ? dictionary['video-hover-badge'][currentLang] : 'ARRANCA EL MOTOR';
      wrapper.appendChild(badge);

      // Mobile Pill Badge (Round Icon only)
      const mobilePill = document.createElement('div');
      mobilePill.className = 'video-mobile-badge';
      mobilePill.innerHTML = `
        <svg style="width:20px;height:20px;margin-left:2px;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
      wrapper.appendChild(mobilePill);

      window.addEventListener('languageChanged', (e) => {
          if (dictionary['video-hover-badge']) {
              badge.textContent = dictionary['video-hover-badge'][e.detail.lang];
          }
      });

      let isVideoEnded = false;

      video.addEventListener('play', () => {
          isVideoEnded = false;
          badge.classList.remove('active');
          if (window.matchMedia('(hover: none)').matches) {
            mobilePill.classList.remove('visible');
          }
      });

      video.addEventListener('pause', () => {
          if (window.matchMedia('(hover: none)').matches) {
            mobilePill.classList.add('visible');
          }
      });

      video.addEventListener('ended', () => {
          isVideoEnded = true;
          if (window.matchMedia('(hover: none)').matches) {
            mobilePill.classList.add('visible');
          }
      });

      wrapper.addEventListener('mousemove', (e) => {
          if (isVideoEnded && window.matchMedia('(hover: hover)').matches) {
              const rect = wrapper.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              // Translació x +25px evita solapar-se amb el volant del canvas (radi de 22px aprox)
              badge.style.transform = `translate(${x}px, ${y}px) translate(25px, -50%)`;
              badge.classList.add('active');
          }
      });

      wrapper.addEventListener('mouseleave', () => {
          badge.classList.remove('active');
      });
    }
  };

  // Carrega ràpid però espera a l'scroll per reproduir
  setTimeout(loadVideo, 100);
}

/* ==========================================
   4. SCROLL REVEAL
   ========================================== */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));

  const tlItems = document.querySelectorAll('.timeline-item');
  const tlObs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 150);
        tlObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  tlItems.forEach(el => tlObs.observe(el));
}

/* ==========================================
   5. HERO ENTRY ANIMATION
   ========================================== */
function initHeroAnimation() {
  const items = [
    document.querySelector('.hero__antetitle'),
    document.querySelector('.hero__title'),
    document.querySelector('.hero__subtitle'),
    document.querySelector('.hero__cta-group'),
  ].filter(Boolean);

  items.forEach((el, i) => {
    setTimeout(() => {
      el.style.transition = `opacity 0.7s ease, transform 0.7s ease`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 200 + i * 120);
  });

  const highlight = document.querySelector('.hero__title .highlight');
  if (highlight) setTimeout(() => highlight.classList.add('animated'), 900);
}

/* ==========================================
   5.5 HERO TEXT SCRAMBLE
   ========================================== */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (to === ' ' || to === '\n') {
          output += to;
        } else {
          if (!char || Math.random() < 0.28) {
            char = this.randomChar();
            this.queue[i].char = char;
          }
          output += '<span style="opacity:0.5; font-family: monospace;">' + char + '</span>';
        }
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

function initHeroScramble() {
  const el = document.querySelector('.scramble-target');
  if (!el) return;

  const phrases = {
    es: ['LÍMITES', 'PROBLEMAS', 'PREOCUPACIONES', 'SORPRESAS', 'ESPERAS'],
    ca: ['SENSE LÍMITS', 'SENSE PROBLEMES', 'SENSE\nPREOCUPACIONS', 'SENSE SORPRESES', 'SENSE ESPERES']
  };

  const fx = new TextScramble(el);
  let counter = 0;
  let currentLang = localStorage.getItem('lang') || 'es';
  let timerId = null;

  const next = () => {
    const list = phrases[currentLang] || phrases['es'];
    fx.setText(list[counter]).then(() => {
      timerId = setTimeout(next, 2500);
    });
    counter = (counter + 1) % list.length;
  };

  // Wait for initial hero animation then start scramble
  setTimeout(next, 2000);

  // Restart loop elegantly on language change
  window.addEventListener('languageChanged', (e) => {
    currentLang = e.detail.lang;
    counter = 0;
    if (timerId) clearTimeout(timerId);
    next();
  });
}

/* ==========================================
   6. MAGNETIC BUTTONS
   ========================================== */
function initMagneticButtons() {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

  document.querySelectorAll('.btn-magnetic, .form-submit, .nav__cta').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width  / 2) * 0.3;
      const y = (e.clientY - rect.top  - rect.height / 2) * 0.3;
      el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform  = 'translate(0,0)';
      el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
      setTimeout(() => { el.style.transition = ''; }, 450);
    });
  });
}

/* ==========================================
   7. (REMOVED) FORM SUBMISSION HANDLER
   ========================================== */

/* ==========================================
   8. SCROLL TO TOP
   ========================================== */
function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Prevent ScrollTop button from covering the footer
  const footer = document.querySelector('.footer');
  if (footer) {
      const footerObs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
              btn.classList.add('lifted-by-footer');
          } else {
              btn.classList.remove('lifted-by-footer');
          }
      }, { rootMargin: '0px', threshold: 0.05 });
      footerObs.observe(footer);
  }
}

/* ==========================================
   9. COUNTING STATS ANIMATION
   ========================================== */
function initCountingStats() {
  const stats = document.querySelectorAll('.stat-item__number[data-target]');
  if (!stats.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el       = entry.target;
      const target   = parseInt(el.getAttribute('data-target'));
      const prefix   = el.getAttribute('data-prefix') || '';
      const suffix   = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const start    = performance.now();
      const update   = now => {
        const p = Math.min((now - start) / duration, 1);
        const currentNum = Math.round((1 - Math.pow(1 - p, 3)) * target);
        el.textContent = prefix + currentNum + suffix;
        if (p < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => obs.observe(el));
}

/* ==========================================
   10. WHATSAPP CAR ANIMATION
   ========================================== */
function initWhatsAppAnimation() {
  const citaBtn  = document.getElementById('cita-btn');
  const carIcon  = citaBtn ? citaBtn.querySelector('.car-icon') : null;
  // Les lletres les demanarem en temps real per si el lang.js les ha reconstruït
  
  if (citaBtn && carIcon && typeof gsap !== 'undefined') {
      const BTN_COLLAPSED_W = 64;   // Ample inicial (cercle)
      const BTN_EXPANDED_W  = 220;  // Ample expandit (pastilla)
      let animTimeline = null;
      let isHovered    = false;
      let phase        = 'idle'; 
      
      function runEnterAnimation() {
          if (animTimeline) animTimeline.kill();
          phase = 'entering';
          const currentLetters = citaBtn.querySelectorAll('.cita-letter');
          
          gsap.set(currentLetters, { opacity: 0, y: 10, x: 0 });
          gsap.set(carIcon, { y: 0, x: 0, scaleX: 1, opacity: 1 });
          animTimeline = gsap.timeline({
              onComplete: () => {
                  phase = 'entered';
                  if (!isHovered) runLeaveAnimation();
              }
          });
          // 1. El botó s'expandeix
          animTimeline.to(citaBtn, { width: BTN_EXPANDED_W, duration: 0.4, ease: 'power2.inOut' }, 0);
          // 2. El cotxe gira i va a l'esquerra
          const reverseX = -(BTN_EXPANDED_W / 2 - 30);
          animTimeline.to(carIcon, { scaleX: -1, x: reverseX, duration: 0.35, ease: 'power2.inOut' }, 0.05);
          // 3. Vibració del motor
          animTimeline.to(carIcon, { y: -3, duration: 0.04, yoyo: true, repeat: 7 }, 0.45);
          // 4. Torna a mirar a la dreta i arranca fort
          animTimeline.to(carIcon, { scaleX: 1, duration: 0.1 }, 0.8);
          animTimeline.to(carIcon, { x: BTN_EXPANDED_W + 60, duration: 0.6, ease: 'power2.in' }, 0.9);
          // 5. Les lletres apareixen quan el cotxe passa
          currentLetters.forEach((letter, idx) => {
              animTimeline.to(letter, {
                  opacity: 1,
                  y: 0,
                  duration: 0.2,
                  ease: 'back.out(1.7)'
              }, 0.95 + (idx * 0.05));
          });
      }
      
      function runLeaveAnimation() {
          if (animTimeline) animTimeline.kill();
          phase = 'leaving';
          const currentLetters = citaBtn.querySelectorAll('.cita-letter');
          
          const tl = gsap.timeline({
              onComplete: () => {
                  phase = 'idle';
                  if (isHovered) runEnterAnimation();
              }
          });
          tl.to(currentLetters, { x: 50, opacity: 0, duration: 0.3, stagger: 0.02 }, 0);
          tl.to(citaBtn, { width: BTN_COLLAPSED_W, duration: 0.4, ease: 'power2.inOut' }, 0.1);
          tl.set(carIcon, { x: 0, scaleX: 1, opacity: 1, y: 40 });
          tl.to(carIcon, { y: 0, duration: 0.4, ease: 'back.out(1.5)' }, 0.3);
      }
      
      citaBtn.addEventListener('mouseenter', () => {
          isHovered = true;
          if (phase === 'idle' || phase === 'leaving') runEnterAnimation();
      });
      citaBtn.addEventListener('mouseleave', () => {
          isHovered = false;
          if (phase === 'entering' || phase === 'entered') runLeaveAnimation();
      });

      // Loop al mòbil cada 10 segons (sense haver de fer hover)
      if (window.matchMedia('(hover: none)').matches) {
          setInterval(() => {
              if (phase === 'idle') {
                  runEnterAnimation();
                  setTimeout(() => {
                      if (phase === 'entered') {
                          runLeaveAnimation();
                      }
                  }, 4000); // Mantenir obert durant 4 segons
              }
          }, 10000); // S'activa automàticament cada 10 segons
      }

      // Prevent WhatsApp button from covering the footer logo
      const footer = document.querySelector('.footer');
      if (footer) {
          const footerObs = new IntersectionObserver((entries) => {
              if (entries[0].isIntersecting) {
                  citaBtn.classList.add('lifted-by-footer');
              } else {
                  citaBtn.classList.remove('lifted-by-footer');
              }
          }, { rootMargin: '0px', threshold: 0.05 });
          footerObs.observe(footer);
      }
  }
}

/* ==========================================
   11. LEGAL MODAL
   ========================================== */
function openLegalModal(type) {
  const modal = document.getElementById('legal-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!modal || !title || !body) return;

  const lang = localStorage.getItem('lang') || 'es';

  const texts = {
    privacitat: {
      es: {
        title: "Política de Privacidad",
        content: `
          <h3>1. Responsable del Tratamiento</h3>
          <p><strong>Identidad:</strong> MOTORSIN, SL<br>
          <strong>NIF:</strong> B25304437<br>
          <strong>Dirección:</strong> C. Centro, nº 18 (25001 Lleida).<br>
          <strong>Email:</strong> sinysol@msn.com</p>

          <h3>2. Finalidad del Tratamiento</h3>
          <p>Los datos personales facilitados (nombre, teléfono, email, matrícula) serán tratados para:</p>
          <ul>
            <li>Gestionar la solicitud de cita previa en el taller.</li>
            <li>Enviar presupuestos e información sobre el estado de la reparación del vehículo.</li>
            <li>Responder a consultas realizadas a través del formulario de contacto o WhatsApp.</li>
          </ul>

          <h3>3. Legitimación</h3>
          <p>El tratamiento de sus datos se basa en el consentimiento explícito del interesado al marcar la casilla de aceptación del formulario y, posteriormente, en la ejecución de una relación precontractual o contractual de servicios mecánicos.</p>

          <h3>4. Conservación de los datos</h3>
          <p>Los datos se conservarán durante el tiempo necesario para la prestación del servicio solicitado y, en todo caso, durante los plazos legales exigidos por la normativa fiscal y mercantil.</p>

          <h3>5. Destinatarios</h3>
          <p>No se cederán datos a terceros, salvo obligación legal o que sea estrictamente necesario para la prestación del servicio (ej. proveedores de software de gestión de taller).</p>

          <h3>6. Derechos</h3>
          <p>El usuario tiene derecho a acceder, rectificar y suprimir los datos, así como otros derechos (limitación y oposición), enviando un correo a sinysol@msn.com, adjuntando copia del DNI para su identificación. También tiene derecho a presentar una reclamación ante la Autoridad de Control competente (<a href="https://www.aepd.es" target="_blank">www.aepd.es</a>) si considera que el tratamiento no se ajusta a la normativa.</p>
        `
      },
      ca: {
        title: "Política de Privacitat",
        content: `
          <h3>1. Responsable del Tractament</h3>
          <p><strong>Identitat:</strong> MOTORSIN, SL<br>
          <strong>NIF:</strong> B25304437<br>
          <strong>Adreça:</strong> C. Centre, núm. 18 (25001 Lleida).<br>
          <strong>Email:</strong> sinysol@msn.com</p>

          <h3>2. Finalitat del Tractament</h3>
          <p>Les dades personals facilitades (nom, telèfon, email, matrícula) seran tractades per a:</p>
          <ul>
            <li>Gestionar la sol·licitud de cita prèvia al taller.</li>
            <li>Enviar pressupostos i informació sobre l'estat de la reparació del vehicle.</li>
            <li>Respondre a consultes realitzades a través del formulari de contacte o WhatsApp.</li>
          </ul>

          <h3>3. Legitimació</h3>
          <p>El tractament de les seves dades es basa en el consentiment explícit de l'interessat en marcar la casella d'acceptació del formulari i, posteriorment, en l'execució d'una relació precontractual o contractual de serveis mecànics.</p>

          <h3>4. Conservació de les dades</h3>
          <p>Les dades es conservaran durant el temps necessari per a la prestació del servei sol·licitat i, en tot cas, durant els terminis legals exigits per la normativa fiscal i mercantil.</p>

          <h3>5. Destinataris</h3>
          <p>No se cediran dades a tercers, excepte obligació legal o que sigui estrictament necessari per a la prestació del servei (ex: proveïdors de programari de gestió de taller).</p>

          <h3>6. Drets</h3>
          <p>L'usuari té dret a accedir, rectificar i suprimir les dades, així com altres drets (limitació i oposició), enviant un correu a sinysol@msn.com, adjuntant còpia del DNI per a la seva identificació. També té dret a presentar una reclamació davant l'Autoritat de Control competent (<a href="https://www.aepd.es" target="_blank">www.aepd.es</a>) si considera que el tractament no s'ajusta a la normativa.</p>
        `
      }
    },
    avis: {
      es: {
        title: "Aviso Legal",
        content: `
          <h3>1. Datos Identificativos</h3>
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se exponen los datos identificativos del titular:</p>
          <p><strong>Titular:</strong> MOTORSIN, SL<br>
          <strong>NIF/CIF:</strong> B25304437<br>
          <strong>Domicilio:</strong> C. Centro, nº 18 (25001 Lleida).<br>
          <strong>Correo electrónico:</strong> sinysol@msn.com<br>
          <strong>Teléfono:</strong> 973 21 11 89 / 629 93 41 24<br>
          <strong>Datos de registro:</strong> Inscrita en el Registro Mercantil de Lleida.</p>

          <h3>2. Propiedad Intelectual</h3>
          <p>El código fuente, los diseños gráficos, las imágenes, las fotografías, los sonidos, las animaciones, el software, los textos, así como la información y los contenidos que se recogen en este sitio web están protegidos por la legislación española sobre los derechos de propiedad intelectual e industrial a favor de MOTOR SIN. No se permite la reproducción y/o publicación, total o parcial, del sitio web, ni su tratamiento informático, su distribución, difusión, ni modificación o transformación sin el permiso previo y por escrito de MOTOR SIN.</p>

          <h3>3. Exclusión de Responsabilidad</h3>
          <p>MOTOR SIN no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de la falta de disponibilidad, mantenimiento y efectivo funcionamiento de la web o de sus servicios y contenidos.</p>
        `
      },
      ca: {
        title: "Avís Legal",
        content: `
          <h3>1. Dades Identificatives</h3>
          <p>En compliment de l'article 10 de la Llei 34/2002, d'11 de juliol, de Serveis de la Societat de la Informació i Comerç Electrònic (LSSI-CE), s'exposen les dades identificatives del titular:</p>
          <p><strong>Titular:</strong> MOTORSIN, SL<br>
          <strong>NIF/CIF:</strong> B25304437<br>
          <strong>Domicili:</strong> C. Centre, núm. 18 (25001 Lleida).<br>
          <strong>Correu electrònic:</strong> sinysol@msn.com<br>
          <strong>Telèfon:</strong> 973 21 11 89 / 629 93 41 24<br>
          <strong>Dades de registre:</strong> Inscrita al Registre Mercantil de Lleida.</p>

          <h3>2. Propietat Intel·lectual</h3>
          <p>El codi font, els dissenys gràfics, les imatges, les fotografies, els sons, les animacions, el programari, els textos, així com la informació i els continguts que es recullen en aquest lloc web estan protegits per la legislació espanyola sobre els drets de propietat intel·lectual i industrial a favor de MOTOR SIN. No es permet la reproducció i/o publicació, total o parcial, del lloc web, ni el seu tractament informàtic, la seva distribució, difusió, ni modificació o transformació sense el permís previ i per escrit de MOTOR SIN.</p>

          <h3>3. Exclusió de Responsabilitat</h3>
          <p>MOTOR SIN no es fa responsable dels danys i perjudicis de qualsevol naturalesa que poguessin derivar-se de la manca de disponibilitat, manteniment i efectiu funcionament del web o dels seus serveis i continguts.</p>
        `
      }
    },
    cookies: {
      es: {
        title: "Política de Cookies",
        content: `
          <p>Este sitio web utiliza únicamente cookies técnicas y de personalización propias, que son aquellas que permiten al usuario la navegación a través de la página web y la utilización de las diferentes opciones o servicios que en ella existen (como controlar el tráfico y la comunicación de datos).</p>
          <p>Al no utilizar cookies de terceros ni cookies con fines publicitarios o de seguimiento (tracking), según el artículo 22.2 de la LSSI, no es necesario obtener el consentimiento ni mostrar un banner de advertencia complejo, aunque se informa de su existencia para la transparencia del usuario.</p>
          <p>El usuario puede configurar su navegador para bloquear estas cookies, pero es posible que algunas funcionalidades de la web dejen de funcionar correctamente.</p>
        `
      },
      ca: {
        title: "Política de Cookies",
        content: `
          <p>Aquest lloc web utilitza només cookies tècniques i de personalització pròpies, que són aquelles que permeten a l'usuari la navegació a través de la pàgina web i la utilització de les diferents opcions o serveis que en ella existeixen (com controlar el trànsit i la comunicació de dades).</p>
          <p>En no utilitzar cookies de tercers ni cookies amb finalitats publicitàries o de seguiment (tracking), segons l'article 22.2 de la LSSI, no és necessari obtenir el consentiment ni mostrar un bàner d'advertència complex, tot i que s'informa de la seva existència per a la transparència de l'usuari.</p>
          <p>L'usuari pot configurar el seu navegador per bloquejar aquestes cookies, però és possible que algunes funcionalitats de la web deixin de funcionar correctament.</p>
        `
      }
    }
  };

  title.textContent = texts[type][lang].title;
  body.innerHTML = texts[type][lang].content;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLegalModal() {
  const modal = document.getElementById('legal-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

window.openLegalModal = openLegalModal;
window.closeLegalModal = closeLegalModal;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLegalModal();
});

/* ==========================================
   INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  initNeonCursor();
  initNavigation();
  initHeroVideo();
  initHeroAnimation();
  initHeroScramble();
  initScrollReveal();
  initMagneticButtons();
  initFormHandler();
  initScrollTop();
  initCountingStats();
  init3DCards();
  initWhatsAppAnimation();
});

/* ==========================================
   7. FORM HANDLER (AJAX — sense redireccions FormSubmit)
   ========================================== */
function initFormHandler() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const successEl = form.querySelector('.form-success');
  const submitBtn = form.querySelector('#form-submit-btn');

  // Elements que amagarem quan l'enviament tingui exit
  const hideOnSuccess = [
    form.querySelector('.form-title-wrap'),
    form.querySelector('.form-grid'),
    form.querySelector('.form-checkbox'),
    submitBtn,
    form.querySelector('.form-legal-footer')
  ];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Estat de carrega al boto
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
      submitBtn.style.cursor = 'wait';
    }

    const formData = new FormData(form);

    try {
      const response = await fetch('https://formsubmit.co/ajax/oskar.rodrigo@gmail.com', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        // Amaga els camps del formulari
        hideOnSuccess.forEach(el => {
          if (el) el.style.display = 'none';
        });
        // Mostra el missatge d'exit personalitzat
        if (successEl) successEl.classList.add('active');
        form.reset();
      } else {
        throw new Error('Error en la resposta del servidor');
      }
    } catch (err) {
      // Restaura el boto si hi ha error
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = '';
      }
      const lang = localStorage.getItem('lang') || 'es';
      const msg = lang === 'ca'
        ? 'Hi ha hagut un error. Torna-ho a intentar o contacta\'ns per WhatsApp.'
        : 'Ha habido un error. Inténtalo de nuevo o contacta con nosotros por WhatsApp.';
      alert(msg);
    }
  });
}


function init3DCards() {
  const wrappers = document.querySelectorAll('.service-card-wrapper');
  
  // Mobile IntersectionObserver per poder ensenyar efectes d'entrada sense hover
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.35 });

  wrappers.forEach(wrapper => {
    const card = wrapper.querySelector('.service-card');
    
    if (window.matchMedia('(hover: none)').matches) {
      obs.observe(card);
    }

    wrapper.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(hover: none)').matches) return;
      
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Calculate rotation based on center (0,0) with a max tilt
      const rotateX = -(y / rect.height) * 30; // Max 15 deg tilt
      const rotateY = (x / rect.width) * 30;
      
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    wrapper.addEventListener('mouseleave', () => {
      card.style.transform = `rotateX(0deg) rotateY(0deg)`;
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
    });
    
    wrapper.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s linear';
    });
  });
}
