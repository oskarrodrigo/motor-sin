/**
 * MOTOR SIN — Main JavaScript Bundle
 *
 * 1. Neon Steering-Wheel Cursor (triple-layer glow, Canvas2D)
 * 2. Navigation (scroll shadow + mobile hamburger)
 * 3. Hero video async load
 * 4. Scroll reveal
 * 5. Hero entry animation
 * 6. Magnetic buttons
 * 8. Scroll to top
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
      { blur: 44, width: 6,   rgb: '192,0,26',    op: 0.28 },
      { blur: 18, width: 3.5, rgb: '255,60,80',   op: 0.62 },
      { blur:  4, width: 1.8, rgb: '255,200,205', op: 1.00 },
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

      ctx.shadowColor = `rgba(192,0,26,${gOpac})`;
      ctx.shadowBlur  = gBlur;
      ctx.lineWidth   = gWidth;

      for (let i = 1; i < TRAIL - 1; i++) {
        const t = 1 - (i / TRAIL);
        if (t < 0.05) continue;

        ctx.beginPath();
        // Fade out the tail opacity based on distance
        ctx.strokeStyle = `rgba(192,0,26,${t * t * gOpac})`;
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
    // WebM (VP9) si el navegador el suporta; si no (iPhone/iPad antics), MP4 H.264
    const webm = video.getAttribute('data-src');
    const mp4  = video.getAttribute('data-src-mp4');
    const canWebm = webm && video.canPlayType('video/webm; codecs="vp9"') !== '';
    const src = canWebm ? webm : (mp4 || webm);
    if (!src) return;
    video.src = src;
    video.load();
    video.addEventListener('canplay', () => {
      video.currentTime = 0.2; // Skip the gray first frame
      video.classList.add('loaded');
      if (skeleton) skeleton.classList.add('hidden');
    }, { once: true });
    video.addEventListener('error', () => {
      // Si el vídeo no es pot reproduir, deixem visible el poster
      video.classList.add('loaded');
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

  document.querySelectorAll('.btn-magnetic, .nav__cta').forEach(el => {
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
          <p><strong>Identidad:</strong> Sin i Solé Motors, SL<br>
          <strong>NIF:</strong> B25304437<br>
          <strong>Dirección:</strong> C. Centro, nº 18 (25001 Lleida).<br>
          <strong>Email:</strong> sinysole@msn.com</p>
 
          <h3>2. Finalidad del Tratamiento</h3>
          <p>Esta web no recoge datos personales mediante formularios. Los datos que nos facilites por WhatsApp o en el propio taller (nombre, teléfono, matrícula y datos del vehículo) se tratarán para:</p>
          <ul>
            <li>Gestionar tu cita en el taller.</li>
            <li>Enviarte presupuestos e información sobre el estado de la reparación de tu vehículo.</li>
            <li>Responder a tus consultas.</li>
          </ul>
 
          <h3>3. Legitimación</h3>
          <p>El tratamiento se basa en la aplicación de medidas precontractuales a petición tuya (cuando nos consultas o pides cita), en la ejecución del contrato de reparación y en el cumplimiento de las obligaciones legales que nos sean aplicables, como las fiscales.</p>
 
          <h3>4. Conservación de los datos</h3>
          <p>Los datos se conservarán durante el tiempo necesario para la prestación del servicio solicitado y, en todo caso, durante los plazos legales exigidos por la normativa fiscal y mercantil.</p>
 
          <h3>5. Destinatarios</h3>
          <p>No se cederán datos a terceros, salvo obligación legal. Para prestar el servicio contamos con los siguientes proveedores, que actúan como encargados del tratamiento:</p>
          <ul>
            <li><strong>Alojamiento web:</strong> Cloudflare, Inc. sirve esta web y trata datos técnicos de conexión (como la dirección IP) para mostrarla y protegerla frente a ataques. Cloudflare está adherida al Marco de Privacidad de Datos UE-EE. UU. y aplica cláusulas contractuales tipo de la Comisión Europea.</li>
            <li><strong>Software de gestión del taller</strong>, cuando sea necesario para gestionar tu cita o reparación.</li>
          </ul>
          <p>Si nos escribes por WhatsApp, la conversación se realiza a través de WhatsApp Ireland Limited y queda sujeta también a sus propias condiciones y política de privacidad.</p>

          <h3>6. Derechos</h3>
          <p>Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición y portabilidad de tus datos escribiendo a sinysole@msn.com. Si tenemos dudas razonables sobre tu identidad, podremos pedirte información adicional para confirmarla.</p>
          <p>También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>) si consideras que el tratamiento no se ajusta a la normativa.</p>
        `
      },
      ca: {
        title: "Política de Privacitat",
        content: `
          <h3>1. Responsable del Tractament</h3>
          <p><strong>Identitat:</strong> Sin i Solé Motors, SL<br>
          <strong>NIF:</strong> B25304437<br>
          <strong>Adreça:</strong> C. Centre, núm. 18 (25001 Lleida).<br>
          <strong>Email:</strong> sinysole@msn.com</p>
 
          <h3>2. Finalitat del Tractament</h3>
          <p>Aquest web no recull dades personals mitjançant formularis. Les dades que ens facilitis per WhatsApp o al mateix taller (nom, telèfon, matrícula i dades del vehicle) es tractaran per a:</p>
          <ul>
            <li>Gestionar la teva cita al taller.</li>
            <li>Enviar-te pressupostos i informació sobre l'estat de la reparació del teu vehicle.</li>
            <li>Respondre les teves consultes.</li>
          </ul>
 
          <h3>3. Legitimació</h3>
          <p>El tractament es basa en l'aplicació de mesures precontractuals a petició teva (quan ens consultes o demanes cita), en l'execució del contracte de reparació i en el compliment de les obligacions legals que ens siguin aplicables, com les fiscals.</p>
 
          <h3>4. Conservació de les dades</h3>
          <p>Les dades es conservaran durant el temps necessari per a la prestació del servei sol·licitat i, en tot cas, durant els terminis legals exigits per la normativa fiscal i mercantil.</p>
 
          <h3>5. Destinataris</h3>
          <p>No se cediran dades a tercers, excepte per obligació legal. Per prestar el servei comptem amb els proveïdors següents, que actuen com a encarregats del tractament:</p>
          <ul>
            <li><strong>Allotjament web:</strong> Cloudflare, Inc. serveix aquest web i tracta dades tècniques de connexió (com l'adreça IP) per mostrar-lo i protegir-lo d'atacs. Cloudflare està adherida al Marc de Privacitat de Dades UE-EUA i aplica clàusules contractuals tipus de la Comissió Europea.</li>
            <li><strong>Programari de gestió del taller</strong>, quan sigui necessari per gestionar la teva cita o reparació.</li>
          </ul>
          <p>Si ens escrius per WhatsApp, la conversa es fa a través de WhatsApp Ireland Limited i queda subjecta també a les seves pròpies condicions i política de privacitat.</p>

          <h3>6. Drets</h3>
          <p>Pots exercir en qualsevol moment els teus drets d'accés, rectificació, supressió, limitació del tractament, oposició i portabilitat de les teves dades escrivint a sinysole@msn.com. Si tenim dubtes raonables sobre la teva identitat, et podrem demanar informació addicional per confirmar-la.</p>
          <p>També tens dret a presentar una reclamació davant l'Agència Espanyola de Protecció de Dades (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>) si consideres que el tractament no s'ajusta a la normativa.</p>
        `
      }
    },
    avis: {
      es: {
        title: "Aviso Legal",
        content: `
          <h3>1. Datos Identificativos</h3>
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se exponen los datos identificativos del titular:</p>
          <p><strong>Titular:</strong> Sin i Solé Motors, SL<br>
          <strong>NIF/CIF:</strong> B25304437<br>
          <strong>Domicilio:</strong> C. Centro, nº 18 (25001 Lleida).<br>
          <strong>Correo electrónico:</strong> sinysole@msn.com<br>
          <strong>Teléfono:</strong> 629 93 41 24<br>
          <strong>Datos de registro:</strong> Inscrita en el Registro Mercantil de Lleida.</p>
 
          <h3>2. Propiedad Intelectual</h3>
          <p>El código fuente, los diseños gráficos, las imágenes, las fotografías, los sonidos, las animaciones, el software, los textos, así como la información y los contenidos que se recogen en este sitio web están protegidos por la legislación española sobre los derechos de propiedad intelectual e industrial a favor de Sin i Solé Motors, SL. No se permite la reproducción y/o publicación, total o parcial, del sitio web, ni su tratamiento informático, su distribución, difusión, ni modificación o transformación sin el permiso previo y por escrito de Sin i Solé Motors, SL.</p>
 
          <h3>3. Exclusión de Responsabilidad</h3>
          <p>Sin i Solé Motors, SL no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de la falta de disponibilidad, mantenimiento y efectivo funcionamiento de la web o de sus servicios y contenidos.</p>
        `
      },
      ca: {
        title: "Avís Legal",
        content: `
          <h3>1. Dades Identificatives</h3>
          <p>En compliment de l'article 10 de la Llei 34/2002, d'11 de juliol, de Serveis de la Societat de la Informació i Comerç Electrònic (LSSI-CE), s'exposen les dades identificatives del titular:</p>
          <p><strong>Titular:</strong> Sin i Solé Motors, SL<br>
          <strong>NIF/CIF:</strong> B25304437<br>
          <strong>Domicili:</strong> C. Centre, núm. 18 (25001 Lleida).<br>
          <strong>Correu electrònic:</strong> sinysole@msn.com<br>
          <strong>Telèfon:</strong> 629 93 41 24<br>
          <strong>Dades de registre:</strong> Inscrita al Registre Mercantil de Lleida.</p>
 
          <h3>2. Propietat Intel·lectual</h3>
          <p>El codi font, els dissenys gràfics, les imatges, les fotografies, els sons, les animacions, el programari, els textos, així com la informació i els continguts que es recullen en aquest lloc web estan protegits per la legislació espanyola sobre els drets de propietat intel·lectual i industrial a favor de Sin i Solé Motors, SL. No es permet la reproducció i/o publicació, total o parcial, del lloc web, ni el seu tractament informàtic, la seva distribució, difusió, ni modificació o transformació sense el permís previ i per escrit de Sin i Solé Motors, SL.</p>
 
          <h3>3. Exclusió de Responsabilitat</h3>
          <p>Sin i Solé Motors, SL no es fa responsable dels danys i perjudicis de qualsevol naturalesa que poguessin derivar-se de la manca de disponibilitat, manteniment i efectiu funcionament del web o dels seus serveis i continguts.</p>
        `
      }
    },
    cookies: {
      es: {
        title: "Política de Cookies",
        content: `
          <p>Este sitio web no utiliza cookies publicitarias ni de análisis o seguimiento. Solo utiliza los elementos técnicos que se indican a continuación, necesarios para su funcionamiento, por lo que, según el artículo 22.2 de la LSSI, no es necesario solicitar tu consentimiento para ellos.</p>
          <div class="modal-table-wrap">
            <table class="modal-table">
              <thead><tr><th>Nombre</th><th>Titular</th><th>Finalidad</th><th>Duración</th></tr></thead>
              <tbody>
                <tr><td><code>lang</code> (almacenamiento local)</td><td>Propio</td><td>Recordar el idioma que eliges (castellano o catalán).</td><td>Hasta que lo borres desde tu navegador.</td></tr>
                <tr><td><code>__cf_bm</code> y similares</td><td>Cloudflare</td><td>Cookies técnicas de seguridad que el proveedor de alojamiento puede instalar para proteger la web frente a bots y ataques.</td><td>Hasta 30 minutos.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Puedes configurar tu navegador para bloquear o eliminar estos datos, aunque es posible que algunas funcionalidades de la web dejen de funcionar correctamente.</p>
        `
      },
      ca: {
        title: "Política de Cookies",
        content: `
          <p>Aquest lloc web no utilitza cookies publicitàries ni d'anàlisi o seguiment. Només utilitza els elements tècnics que s'indiquen a continuació, necessaris per al seu funcionament, de manera que, segons l'article 22.2 de la LSSI, no cal demanar el teu consentiment per a aquests elements.</p>
          <div class="modal-table-wrap">
            <table class="modal-table">
              <thead><tr><th>Nom</th><th>Titular</th><th>Finalitat</th><th>Durada</th></tr></thead>
              <tbody>
                <tr><td><code>lang</code> (emmagatzematge local)</td><td>Propi</td><td>Recordar l'idioma que tries (castellà o català).</td><td>Fins que l'esborris des del navegador.</td></tr>
                <tr><td><code>__cf_bm</code> i similars</td><td>Cloudflare</td><td>Cookies tècniques de seguretat que el proveïdor d'allotjament pot instal·lar per protegir el web de bots i atacs.</td><td>Fins a 30 minuts.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Pots configurar el teu navegador per bloquejar o eliminar aquestes dades, tot i que és possible que algunes funcionalitats del web deixin de funcionar correctament.</p>
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
  init3DCards();
  initWhatsAppAnimation();
});


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
