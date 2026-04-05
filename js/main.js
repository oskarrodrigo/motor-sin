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
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
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

      window.addEventListener('languageChanged', (e) => {
          if (dictionary['video-hover-badge']) {
              badge.textContent = dictionary['video-hover-badge'][e.detail.lang];
          }
      });

      let isVideoEnded = false;

      video.addEventListener('ended', () => {
          isVideoEnded = true;
      });
      video.addEventListener('play', () => {
          isVideoEnded = false;
          badge.classList.remove('active');
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
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += '<span style="opacity:0.5; font-family: monospace;">' + char + '</span>';
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
    ca: ['EL TEU COTXE A PUNT', 'CADA PEÇA COMPTA', 'MÀXIMA PRECISIÓ', 'CONTROL ABSOLUT']
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
      const suffix   = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const start    = performance.now();
      const update   = now => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
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
          isHovered = true;
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
          <p>Esta Política de Privacidad describe cómo MOTOR SIN ("nosotros", "nuestro") recopila, utiliza y protege la información personal que nos proporcionas al utilizar nuestro sitio web.</p>
          
          <h3>1. Recopilación de datos</h3>
          <p>Recopilamos información personal (como nombre, teléfono, correo electrónico y matrícula del vehículo) exclusivamente cuando nos la proporcionas voluntariamente mediante nuestros formularios de contacto o solicitud de cita.</p>

          <h3>2. Uso de la información</h3>
          <p>La información recopilada se utiliza únicamente para gestionar tus citas, presupuestos y responder a tus consultas sobre nuestros servicios de taller electromecánico.</p>

          <h3>3. Protección de datos</h3>
          <p>Adoptamos las medidas técnicas y organizativas necesarias para garantizar la seguridad de tus datos personales y evitar su alteración, pérdida o acceso no autorizado, de acuerdo con el Reglamento General de Protección de Datos (RGPD) aplicable en Cataluña y la UE.</p>

          <h3>4. Resolución de dudas y derechos</h3>
          <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición contactando con nosotros a través del correo electrónico oficial: <strong>info@motorsin.cat</strong>.</p>
        `
      },
      ca: {
        title: "Política de Privacitat",
        content: `
          <p>Aquesta Política de Privacitat descriu com MOTOR SIN ("nosaltres", "nostre") recopila, utilitza i protegeix la informació personal que ens proporciones en utilitzar el nostre lloc web.</p>
          
          <h3>1. Recopilació de dades</h3>
          <p>Recopilem informació personal (com nom, telèfon, correu electrònic i matrícula del vehicle) exclusivament quan ens la proporciones voluntàriament mitjançant els nostres formularis de contacte o sol·licitud de cita.</p>

          <h3>2. Ús de la informació</h3>
          <p>La informació recopilada s'utilitza únicament per gestionar les teves cites, pressupostos i respondre les teves consultes sobre els nostres serveis de taller electromecànic.</p>

          <h3>3. Protecció de dades</h3>
          <p>Adoptem les mesures tècniques i organitzatives necessàries per garantir la seguretat de les teves dades personals i evitar la seva alteració, pèrdua o accés no autoritzat, d'acord amb el Reglament General de Protecció de Dades (RGPD) aplicable a Catalunya i la UE.</p>

          <h3>4. Resolució de dubtes i drets</h3>
          <p>Pots exercir els teus drets d'accés, rectificació, cancel·lació i oposició contactant amb nosaltres a través del correu electrònic oficial: <strong>info@motorsin.cat</strong>.</p>
        `
      }
    },
    avis: {
      es: {
        title: "Aviso Legal y Cookies",
        content: `
          <p><strong>Datos de identificación:</strong> Según la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico, se informa que el titular de este sitio web es MOTOR SIN, con domicilio social en la Calle del Centro 18, 25001 Lleida.</p>

          <h3>Propiedad intelectual</h3>
          <p>Todos los contenidos de esta web, incluyendo textos, diseño corporativo, logotipos y vídeos, son propiedad exclusiva de MOTOR SIN o de terceros con los que se ha autorizado su uso. Queda prohibida su reproducción, distribución o modificación sin consentimiento previo.</p>

          <h3>¿Qué son las cookies?</h3>
          <p>Este sitio web utiliza <em>cookies</em> técnicas exclusivamente necesarias para el funcionamiento básico de la navegación. No utilizamos <em>cookies</em> de publicidad de terceros ni vendemos datos de navegación.</p>

          <h3>Contacto legal</h3>
          <p>Para consultas sobre incidencias legales relacionadas con la web, puedes ponerte en contacto vía electrónica enviando un email a: <strong>info@motorsin.cat</strong></p>
        `
      },
      ca: {
        title: "Avís Legal i Cookies",
        content: `
          <p><strong>Dades d'identificació:</strong> Segons la Llei 34/2002 de Serveis de la Societat de la Informació i de Comerç Electrònic, s'informa que el titular d'aquest lloc web és MOTOR SIN, amb domicili social al Carrer del Centre 18, 25001 Lleida.</p>

          <h3>Propietat intel·lectual</h3>
          <p>Tots els continguts d'aquesta web, incloent textos, disseny corporatiu, logotips i vídeos, són propietat exclusiva de MOTOR SIN o de tercers amb els quals s'ha autoritzat el seu ús. Queda prohibida la seva reproducció, distribució o modificació sense consentiment previ.</p>

          <h3>Què són les cookies?</h3>
          <p>Aquest lloc web utilitza <em>cookies</em> tècniques exclusivament necessàries per al funcionament bàsic de la navegació. No fem servir <em>cookies</em> de publicitat de tercers ni venem dades de navegació.</p>

          <h3>Contacte legal</h3>
          <p>Per a consultes sobre incidències legals relacionades amb la web, pots posar-te en contacte via electrònica enviant un email a: <strong>info@motorsin.cat</strong></p>
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
  initScrollTop();
  initCountingStats();
  init3DCards();
  initWhatsAppAnimation();
});

/* ==========================================
   10. 3D SERVICES CARDS
   ========================================== */
function init3DCards() {
  const wrappers = document.querySelectorAll('.service-card-wrapper');
  
  wrappers.forEach(wrapper => {
    const card = wrapper.querySelector('.service-card');
    
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
