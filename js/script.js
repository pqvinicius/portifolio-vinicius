document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.getElementById("siteHeader");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  const sections = document.querySelectorAll("main section[id]");
  const contactForm = document.getElementById("contactForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const successModal = document.getElementById("successModal");
  const closeModalButton = document.getElementById("closeModal");
  const submitButton = contactForm.querySelector('button[type="submit"]');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const FORM_ENDPOINT = "https://formspree.io/f/mqengzab";
  const SUBMIT_LABEL_DEFAULT = "Enviar mensagem";
  const SUBMIT_LABEL_SENDING = "Enviando...";

  // Tema claro/escuro: aplica a preferência salva e mantém o ícone sincronizado.
  const applyTheme = (theme) => {
    const isDarkTheme = theme === "dark";
    body.classList.toggle("dark-theme", isDarkTheme);
    themeIcon.textContent = isDarkTheme ? "☀" : "☾";
    localStorage.setItem("theme", theme);
  };

  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const nextTheme = body.classList.contains("dark-theme") ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // Menu mobile: alterna a lista de links e atualiza aria-expanded para acessibilidade.
  const closeMobileMenu = () => {
    navLinks.classList.remove("active");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = navLinks.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = navLinks.contains(event.target) || menuToggle.contains(event.target);

    if (!clickedInsideMenu) {
      closeMobileMenu();
    }
  });

  // Scroll suave: intercepta âncoras internas e desloca até a seção correspondente.
  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      event.preventDefault();
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu();
    });
  });

  // Header shrink: destaca o cabeçalho quando a página sai do topo.
  const updateHeaderState = () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState);

  // Link ativo: usa IntersectionObserver para marcar a seção visível no menu.
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0.01,
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // Validação do formulário: mostra erros por campo e simula o envio com modal.
  const setError = (fieldId, message) => {
    const errorElement = document.getElementById(`${fieldId}Error`);
    errorElement.textContent = message;
  };

  const clearErrors = () => {
    setError("name", "");
    setError("email", "");
    setError("message", "");
  };

  const validateForm = () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    let isValid = true;

    clearErrors();

    if (!name) {
      setError("name", "Informe seu nome.");
      isValid = false;
    }

    if (!email) {
      setError("email", "Informe seu e-mail.");
      isValid = false;
    } else if (!emailPattern.test(email)) {
      setError("email", "Informe um e-mail válido.");
      isValid = false;
    }

    if (!message) {
      setError("message", "Escreva uma mensagem.");
      isValid = false;
    }

    return isValid;
  };

  const openModal = () => {
    successModal.classList.remove("hidden");
    closeModalButton.focus();
  };

  const closeModal = () => {
    successModal.classList.add("hidden");
  };

  // Estado do botão durante o envio: evita duplo submit e dá feedback visual.
  const setSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? SUBMIT_LABEL_SENDING : SUBMIT_LABEL_DEFAULT;
  };

  // Envio real via Formspree (POST + JSON). Em caso de falha, exibe erro inline.
  const sendForm = async (payload) => {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Falha no envio (HTTP ${response.status}).`);
    }

    return response.json();
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      _subject: "Nova mensagem pelo portfólio",
    };

    setSubmitting(true);

    try {
      await sendForm(payload);
      contactForm.reset();
      openModal();
    } catch (error) {
      setError(
        "message",
        "Não foi possível enviar agora. Tente novamente em instantes ou fale comigo pelo LinkedIn ou WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  });

  closeModalButton.addEventListener("click", closeModal);

  successModal.addEventListener("click", (event) => {
    if (event.target === successModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !successModal.classList.contains("hidden")) {
      closeModal();
    }
  });
});
