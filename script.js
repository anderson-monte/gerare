document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       MOBILE MENU TOGGLE
       ========================================================================== */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarMenu = document.getElementById('navbar-menu');
    const mobileMenuIcon = mobileMenuBtn.querySelector('i');

    mobileMenuBtn.addEventListener('click', () => {
        navbarMenu.classList.toggle('open');
        if (navbarMenu.classList.contains('open')) {
            mobileMenuIcon.className = 'bi bi-x-lg';
        } else {
            mobileMenuIcon.className = 'bi bi-list';
        }
    });

    // Close menu when clicking links
    document.querySelectorAll('.navbar__link').forEach(link => {
        link.addEventListener('click', () => {
            navbarMenu.classList.remove('open');
            mobileMenuIcon.className = 'bi bi-list';
        });
    });



    /* ==========================================================================
       SCROLL OBSERVER FOR ACTIVE NAVBAR LINKS
       ========================================================================== */
    const sections = document.querySelectorAll('section, footer');
    const navLinks = document.querySelectorAll('.navbar__link');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.35 // 35% of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    
                    // Match link href
                    const href = link.getAttribute('href');
                    if (href === `#${id}` || (id === 'footer' && href === '#footer')) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    /* ==========================================================================
       SIMULATOR LOGIC & COUNTER ANIMATION
       ========================================================================== */
    const weightSlider = document.getElementById('weight-slider');
    const weightValue = document.getElementById('weight-value');
    const fabricButtons = document.querySelectorAll('.fabric-btn');
    const quickSelectors = document.querySelectorAll('.btn-quick');

    // Values Elements
    const valWater = document.getElementById('val-water');
    const valCo2 = document.getElementById('val-co2');
    const valSpace = document.getElementById('val-space');
    const valShirts = document.getElementById('val-shirts');

    // Current animation frames tracking
    let animTracker = {
        water: null,
        co2: null,
        space: null,
        shirts: null
    };

    // Helper to format large numbers
    function formatNumber(num, decimals = 0) {
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Smooth counter animation
    function animateCount(element, start, end, duration, decimals = 0, trackerKey) {
        if (animTracker[trackerKey]) {
            clearInterval(animTracker[trackerKey]);
        }

        const range = end - start;
        if (range === 0) {
            element.textContent = formatNumber(end, decimals);
            return;
        }

        let current = start;
        const stepTime = Math.abs(Math.floor(duration / 30));
        const increment = range / 30;

        animTracker[trackerKey] = setInterval(() => {
            current += increment;
            
            // Check overflow
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                clearInterval(animTracker[trackerKey]);
                element.textContent = formatNumber(end, decimals);
            } else {
                element.textContent = formatNumber(current, decimals);
            }
        }, stepTime);
    }

    // Gather factors and execute calculation
    let currentValues = { water: 0, co2: 0, space: 0, shirts: 0 };

    function calculateImpact() {
        const weight = parseFloat(weightSlider.value);
        weightValue.textContent = weight;

        const activeFabricBtn = document.querySelector('.fabric-btn.active');
        if (!activeFabricBtn) return;

        // Extract coefficients
        const factorWater = parseFloat(activeFabricBtn.getAttribute('data-factor'));
        const factorCo2 = parseFloat(activeFabricBtn.getAttribute('data-co2'));
        const factorSpace = parseFloat(activeFabricBtn.getAttribute('data-space'));
        const factorShirt = parseFloat(activeFabricBtn.getAttribute('data-shirt'));

        // Target outputs
        const targetWater = Math.round(weight * factorWater);
        const targetCo2 = Math.round(weight * factorCo2);
        const targetSpace = parseFloat((weight * factorSpace).toFixed(2));
        const targetShirts = Math.round(weight * factorShirt);

        // Animate count from previous values
        animateCount(valWater, currentValues.water, targetWater, 800, 0, 'water');
        animateCount(valCo2, currentValues.co2, targetCo2, 800, 0, 'co2');
        animateCount(valSpace, currentValues.space, targetSpace, 800, 2, 'space');
        animateCount(valShirts, currentValues.shirts, targetShirts, 800, 0, 'shirts');

        // Update water equivalence text dynamically
        const waterYears = Math.round(targetWater / 115000);
        const waterEquivalenceEl = document.getElementById('water-equivalence');
        if (waterEquivalenceEl) {
            if (waterYears >= 1) {
                waterEquivalenceEl.textContent = `Equivale ao consumo de água de uma pessoa por mais de ${waterYears} anos.`;
            } else {
                const waterMonths = Math.round(targetWater / 9583); // 115000 / 12
                waterEquivalenceEl.textContent = `Equivale ao consumo de água de uma pessoa por ${waterMonths || 1} meses.`;
            }
        }

        // Save current values for next transition
        currentValues = {
            water: targetWater,
            co2: targetCo2,
            space: targetSpace,
            shirts: targetShirts
        };
    }

    // Fabric selections event
    fabricButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            fabricButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateImpact();
        });
    });

    // Slider inputs event
    weightSlider.addEventListener('input', calculateImpact);

    // Quick selection buttons event
    quickSelectors.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            weightSlider.value = val;
            calculateImpact();
        });
    });

    // Run initial calculation on page load
    calculateImpact();


    /* ==========================================================================
       CONNECTIONS MAP SVG INTERACTIVE LOGIC
       ========================================================================== */
    const mapNodes = document.querySelectorAll('.map-node');
    const infoStates = document.querySelectorAll('.info-state');
    const mapInstructions = document.getElementById('map-instructions');

    mapNodes.forEach(node => {
        node.addEventListener('click', () => {
            const infoId = node.getAttribute('data-info');
            const targetInfo = document.getElementById(`info-${infoId}`);

            // Toggle active classes on nodes
            mapNodes.forEach(n => n.classList.remove('active'));
            infoStates.forEach(s => s.classList.remove('active'));

            if (targetInfo) {
                node.classList.add('active');
                targetInfo.classList.add('active');
                mapInstructions.classList.remove('active');
            } else {
                mapInstructions.classList.add('active');
            }
        });
    });

    // Add click handler to map CTA buttons to scroll to form and prefill data
    document.querySelectorAll('.btn-map-cta').forEach(btn => {
        btn.addEventListener('click', () => {
            const activeNode = document.querySelector('.map-node.active');
            const roleSelect = document.getElementById('form-role');
            const msgArea = document.getElementById('form-msg');
            const contactSection = document.getElementById('contact-section');

            if (activeNode) {
                const nodeType = activeNode.classList.contains('node--generator') ? 'gerador' : 'receptor';
                const nodeName = activeNode.querySelector('.node-label').textContent;

                roleSelect.value = nodeType === 'gerador' ? 'receptor' : 'gerador'; // reverse connect proposal
                msgArea.value = `Olá! Vi o ponto "${nodeName}" no mapa interativo e gostaria de propor uma parceria para destinação circular de resíduos têxteis com vocês.`;

                // Scroll to contact form smoothly
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    /* ==========================================================================
       CONTACT FORM SUBMISSION WITH FEEDBACK
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const btnResetForm = document.getElementById('btn-reset-form');
    const submitBtn = contactForm.querySelector('.btn--submit');
    const submitBtnText = submitBtn.querySelector('.btn-text');
    const submitBtnIcon = submitBtn.querySelector('.btn-icon');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Simple validation check
        if (!contactForm.checkValidity()) return;

        // Button loading state animation
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Enviando...';
        submitBtnIcon.innerHTML = '<i class="bi bi-hourglass-split animate-spin"></i>';

        // Mock AJAX delay
        setTimeout(() => {
            // Restore button state
            submitBtn.disabled = false;
            submitBtnText.textContent = 'Enviar Mensagem';
            submitBtnIcon.innerHTML = '<i class="bi bi-send-fill"></i>';

            // Show success animation overlay
            formFeedback.classList.add('show');
            
            // Scroll to the contact section so success card is fully visible
            document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    });

    // Reset Form button
    btnResetForm.addEventListener('click', () => {
        contactForm.reset();
        formFeedback.classList.remove('show');
    });
});
