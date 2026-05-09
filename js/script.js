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
  const subjectInput = document.getElementById("subject");
  const messageInput = document.getElementById("message");
  const honeypotInput = document.getElementById("_gotcha");
  const successModal = document.getElementById("successModal");
  const closeModalButton = document.getElementById("closeModal");
  const submitButton = document.getElementById("submitButton");

  const FORM_ENDPOINT = "https://formspree.io/f/mqengzab";
  // Regex robusto para validação local. RFC 5322 completa não cabe em regex,
  // mas este cobre a maioria dos casos reais e descarta erros comuns.
  const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  const MAX_EMAIL_LENGTH = 254;

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

  // Validação do formulário: mensagens inline + estado visual do campo.
  const fieldsToValidate = [
    { input: nameInput, errorId: "nameError" },
    { input: emailInput, errorId: "emailError" },
    { input: subjectInput, errorId: "subjectError" },
    { input: messageInput, errorId: "messageError" },
  ];

  const setFieldError = (input, errorId, message) => {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message || "";
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const clearErrors = () => {
    fieldsToValidate.forEach(({ input, errorId }) => setFieldError(input, errorId, ""));
  };

  // Validação granular do e-mail: separa razões para feedback claro ao usuário.
  const validateEmail = (email) => {
    if (!email) {
      return "Informe seu e-mail.";
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return "E-mail muito longo.";
    }

    if (email.includes("..")) {
      return "E-mail contém pontos consecutivos.";
    }

    if (!EMAIL_PATTERN.test(email)) {
      return "Informe um e-mail válido (ex: nome@dominio.com).";
    }

    return "";
  };

  const validateField = (input) => {
    const value = input.value.trim();

    if (input === nameInput) {
      if (!value) return "Informe seu nome.";
      if (value.length < 2) return "Nome muito curto.";
      return "";
    }

    if (input === emailInput) {
      return validateEmail(value);
    }

    if (input === subjectInput) {
      if (!value) return "Selecione um assunto.";
      return "";
    }

    if (input === messageInput) {
      if (!value) return "Escreva uma mensagem.";
      if (value.length < 10) return "Mensagem muito curta (mínimo 10 caracteres).";
      return "";
    }

    return "";
  };

  const validateForm = () => {
    let isValid = true;

    fieldsToValidate.forEach(({ input, errorId }) => {
      const message = validateField(input);
      setFieldError(input, errorId, message);
      if (message) isValid = false;
    });

    return isValid;
  };

  // Validação em tempo real: feedback ao sair do campo, e limpa ao voltar a digitar.
  fieldsToValidate.forEach(({ input, errorId }) => {
    input.addEventListener("blur", () => {
      const message = validateField(input);
      setFieldError(input, errorId, message);
    });

    const liveEvent = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(liveEvent, () => {
      if (input.classList.contains("is-invalid")) {
        const message = validateField(input);
        setFieldError(input, errorId, message);
      }
    });
  });

  const openModal = () => {
    successModal.classList.remove("hidden");
    closeModalButton.focus();
  };

  const closeModal = () => {
    successModal.classList.add("hidden");
  };

  // Estado do botão durante o envio: evita duplo submit, spinner e aria-busy.
  const setSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("is-loading", isSubmitting);
    submitButton.setAttribute("aria-busy", isSubmitting ? "true" : "false");
    const label = submitButton.querySelector(".btn-label");
    if (label) {
      label.textContent = isSubmitting ? "Enviando..." : "Enviar mensagem";
    }
  };

  // Envio real via Formspree (POST + JSON). Lança erro com status para tratamento granular.
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
      const error = new Error(`Falha no envio (HTTP ${response.status}).`);
      error.status = response.status;
      try {
        error.body = await response.json();
      } catch (_) {
        error.body = null;
      }
      throw error;
    }

    return response.json();
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Honeypot: se preenchido, é bot. Mostra modal de sucesso e descarta silenciosamente.
    if (honeypotInput && honeypotInput.value.trim() !== "") {
      contactForm.reset();
      openModal();
      return;
    }

    const subjectValue = subjectInput.value.trim();
    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      subject: subjectValue,
      message: messageInput.value.trim(),
      _subject: `Portfólio - ${subjectValue}`,
    };

    setSubmitting(true);

    try {
      await sendForm(payload);
      contactForm.reset();
      openModal();
    } catch (error) {
      // Formspree retorna 422 quando rejeita o payload, geralmente por e-mail inválido.
      if (error.status === 422) {
        setFieldError(
          emailInput,
          "emailError",
          "O servidor recusou o e-mail. Verifique se ele está correto."
        );
        emailInput.focus();
      } else {
        setFieldError(
          messageInput,
          "messageError",
          "Não foi possível enviar agora. Tente novamente em instantes ou fale comigo pelo LinkedIn ou WhatsApp."
        );
      }
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
