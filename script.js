document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       MOBILE MENU TOGGLE
       ========================================================================== */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarMenu = document.getElementById('navbar-menu');
    const mobileMenuIcon = mobileMenuBtn.querySelector('i');

    // Centraliza a abertura/fechamento do menu, mantendo ARIA e ícone em sincronia
    const setMenuState = (isOpen, focusToggle = false) => {
        navbarMenu.classList.toggle('open', isOpen);
        mobileMenuIcon.className = isOpen ? 'bi bi-x-lg' : 'bi bi-list';
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        if (!isOpen && focusToggle) mobileMenuBtn.focus();
    };

    mobileMenuBtn.addEventListener('click', () => {
        setMenuState(!navbarMenu.classList.contains('open'));
    });

    // Ativação por teclado (Enter/Espaço) para o botão customizado
    mobileMenuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMenuState(!navbarMenu.classList.contains('open'));
        }
    });

    // Close menu when clicking links
    document.querySelectorAll('.navbar__link').forEach(link => {
        link.addEventListener('click', () => {
            setMenuState(false);
        });
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbarMenu.classList.contains('open')) {
            setMenuState(false, true);
        }
    });



    /* ==========================================================================
       SCROLLSPY FOR ACTIVE NAVBAR LINKS
       ========================================================================== */
    const navLinks = Array.from(document.querySelectorAll('.navbar__link'));
    const navbar = document.querySelector('.navbar');

    // Map each nav link to its target element (skip links without a target)
    const spyTargets = navLinks
        .map(link => {
            const href = link.getAttribute('href');
            const target = href && href.length > 1 ? document.querySelector(href) : null;
            return target ? { link, target, top: 0 } : null;
        })
        .filter(Boolean);

    let activeLink = document.querySelector('.navbar__link.active');

    // A section becomes active once its top crosses ~40% of the viewport
    // (below the fixed navbar), so activation happens when the section is
    // actually reaching the middle of the screen.
    const getFocusLine = () => {
        const navHeight = navbar ? navbar.offsetHeight : 0;
        return window.scrollY + navHeight + window.innerHeight * 0.4;
    };

    const measureTargets = () => {
        spyTargets.forEach(item => {
            item.top = item.target.getBoundingClientRect().top + window.scrollY;
        });
    };

    const updateActiveLink = () => {
        if (!spyTargets.length) return;

        const focusLine = getFocusLine();
        let current = spyTargets[0];

        spyTargets.forEach(item => {
            if (item.top <= focusLine) {
                current = item;
            }
        });

        // At the very bottom of the page, always highlight the last link
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (isAtBottom) {
            current = spyTargets[spyTargets.length - 1];
        }

        if (!current || current.link === activeLink) return;

        navLinks.forEach(link => link.classList.remove('active'));
        current.link.classList.add('active');
        activeLink = current.link;
    };

    // Initial state (fixes wrong link on page load)
    measureTargets();
    updateActiveLink();

    window.addEventListener('scroll', updateActiveLink, { passive: true });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            measureTargets();
            updateActiveLink();
        }, 150);
    });

    // Re-measure after images/fonts finish loading (they can shift section offsets)
    window.addEventListener('load', () => {
        measureTargets();
        updateActiveLink();
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            measureTargets();
            updateActiveLink();
        });
    }

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

    function selectMapNode(node) {
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
    }

    mapNodes.forEach(node => {
        node.addEventListener('click', () => selectMapNode(node));

        // Keyboard accessibility (Enter or Space)
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectMapNode(node);
            }
        });
    });

    // Add click handler to map CTA buttons to scroll to form and prefill data
    document.querySelectorAll('.btn-map-cta').forEach(btn => {
        btn.addEventListener('click', () => {
            const activeNode = document.querySelector('.map-node.active');
            const msgArea = document.getElementById('form-msg');
            const roleSelect = document.getElementById('form-role');
            const contactSection = document.getElementById('contact-section');

            if (activeNode) {
                const isGenerator = activeNode.classList.contains('node--generator');
                const nodeName = activeNode.querySelector('.node-label').textContent;

                if (roleSelect) {
                    roleSelect.value = isGenerator ? 'Receptor (Ateliê / Designer / Marca)' : 'Gerador (Fábrica / Confecção)';
                }
                if (msgArea) {
                    msgArea.value = `Olá! Vi o ponto "${nodeName}" no mapa interativo e gostaria de propor uma parceria para destinação circular de resíduos têxteis com vocês.`;
                }

                // Scroll to contact form smoothly
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    /* ==========================================================================
       CONTACT FORM PHONE MASK
       ========================================================================== */
    const formPhone = document.getElementById('form-phone');
    if (formPhone) {
        formPhone.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);

            if (val.length > 6) {
                val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
            } else if (val.length > 2) {
                val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
            } else if (val.length > 0) {
                val = `(${val}`;
            }
            e.target.value = val;
        });
    }


    /* ==========================================================================
       CONTACT FORM SUBMISSION VIA WEB3FORMS WITH FEEDBACK
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const btnResetForm = document.getElementById('btn-reset-form');
    const submitBtn = contactForm ? contactForm.querySelector('.btn--submit') : null;
    const submitBtnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const submitBtnIcon = submitBtn ? submitBtn.querySelector('.btn-icon') : null;

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Native HTML5 validity check
            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            // Button loading state
            submitBtn.disabled = true;
            submitBtnText.textContent = 'Enviando...';
            submitBtnIcon.innerHTML = '<i class="bi bi-hourglass-split animate-spin"></i>';

            try {
                const formData = new FormData(contactForm);
                const object = Object.fromEntries(formData);
                const json = JSON.stringify(object);

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });

                const result = await response.json();

                if (response.status === 200) {
                    // Success: show feedback card
                    formFeedback.classList.add('show');
                    document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
                } else {
                    // Fallback alert if access_key is not configured yet or fails
                    alert(result.message || 'Houve um erro ao enviar. Verifique se a sua chave do Web3Forms foi configurada.');
                }
            } catch (error) {
                console.error('Erro de envio:', error);
                alert('Não foi possível enviar a mensagem no momento. Por favor, tente novamente mais tarde ou envie um e-mail para ola@geraretextil.com.br');
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtnText.textContent = 'Enviar Mensagem';
                submitBtnIcon.innerHTML = '<i class="bi bi-send-fill"></i>';
            }
        });
    }

    // Reset Form button
    if (btnResetForm) {
        btnResetForm.addEventListener('click', () => {
            contactForm.reset();
            formFeedback.classList.remove('show');
        });
    }
});
