(function () {
  const CHAT_URL = 'https://olivia-ai.o7digital.com/api/olivia/chat';
  const CONVERSATIONS_URL = 'https://olivia-ai.o7digital.com/api/widget/conversations';
  const IDENTITY_URL = 'https://olivia-ai.o7digital.com/api/widget/identity';
  const FORMSPREE_URL = 'https://formspree.io/f/xpqwyozb';
  const CLIENT_CODE = 'gescom';
  const pageLanguage = (document.documentElement.lang || 'fr').toLowerCase();
  const language = pageLanguage.startsWith('en') ? 'en' : pageLanguage.startsWith('es') ? 'es' : 'fr';

  const translations = {
    fr: {
      launcher: 'Besoin d’aide ?',
      openChat: 'Ouvrir le chat Olivia AI',
      close: 'Fermer',
      send: 'Envoyer',
      subtitle: 'Assistante GESCOM · En ligne',
      hello: 'Bonjour, je suis Olivia AI. Comment puis-je vous aider pour vos besoins administratifs ?',
      lead: 'Laissez vos coordonnées et votre besoin afin que GESCOM puisse assurer le suivi.',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Courriel',
      phone: 'Téléphone',
      need: 'Votre besoin (détails de la demande)',
      consent: 'J’accepte de transmettre mes données à GESCOM pour recevoir une réponse.',
      privacy: 'Politique de confidentialité',
      sendLead: 'Envoyer mes coordonnées',
      sent: 'Merci. Vos coordonnées et votre besoin ont été transmis à GESCOM.',
      input: 'Écrivez votre question…',
      required: 'Merci de remplir tous les champs et d’accepter la politique de confidentialité.',
      error: 'Je n’ai pas pu envoyer le message. Vous pouvez contacter GESCOM à gescom.mauricie@gmail.com ou au +1 (819) 996-1177.',
      privacyUrl: '/politique-confidentialite.html',
    },
    en: {
      launcher: 'Need help?',
      openChat: 'Open Olivia AI chat',
      close: 'Close',
      send: 'Send',
      subtitle: 'GESCOM assistant · Online',
      hello: 'Hello, I am Olivia AI. How can I help with your administrative needs?',
      lead: 'Leave your contact details and request so GESCOM can follow up.',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      need: 'Your request (details)',
      consent: 'I agree to share my data with GESCOM to receive a response.',
      privacy: 'Privacy policy',
      sendLead: 'Send my details',
      sent: 'Thank you. Your contact details and request were sent to GESCOM.',
      input: 'Write your question…',
      required: 'Please complete all fields and accept the privacy policy.',
      error: 'I could not send the message. You can contact GESCOM at gescom.mauricie@gmail.com or +1 (819) 996-1177.',
      privacyUrl: '/privacy-policy.html',
    },
    es: {
      launcher: '¿Necesita ayuda?',
      openChat: 'Abrir el chat Olivia AI',
      close: 'Cerrar',
      send: 'Enviar',
      subtitle: 'Asistente GESCOM · En línea',
      hello: 'Hola, soy Olivia AI. ¿Cómo puedo ayudarle con sus necesidades administrativas?',
      lead: 'Deje sus datos y su necesidad para que GESCOM pueda dar seguimiento.',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      need: 'Su necesidad (detalles de la solicitud)',
      consent: 'Acepto compartir mis datos con GESCOM para recibir una respuesta.',
      privacy: 'Política de privacidad',
      sendLead: 'Enviar mis datos',
      sent: 'Gracias. Sus datos y su necesidad fueron enviados a GESCOM.',
      input: 'Escriba su pregunta…',
      required: 'Complete todos los campos y acepte la política de privacidad.',
      error: 'No pude enviar el mensaje. Puede contactar con GESCOM en gescom.mauricie@gmail.com o en el +1 (819) 996-1177.',
      privacyUrl: '/politica-de-privacidad.html',
    },
  };

  const copy = translations[language];
  const visitorKey = `olivia:${CLIENT_CODE}:visitor`;
  const leadKey = `olivia:${CLIENT_CODE}:lead`;
  const visitorId = localStorage.getItem(visitorKey) || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  localStorage.setItem(visitorKey, visitorId);

  function readLead() {
    try {
      return JSON.parse(localStorage.getItem(leadKey) || 'null');
    } catch (_) {
      return null;
    }
  }

  let savedLead = readLead();
  let identityPromise;
  let conversationStatus = 'ai';
  const displayedOperatorMessages = new Set();
  const root = document.createElement('div');
  root.id = 'olivia-chat-root';
  root.innerHTML = `
    <button class="olivia-launcher" type="button" aria-label="${copy.openChat}">
      <span class="olivia-launcher__mark">O</span>
      <span class="olivia-launcher__text">${copy.launcher}<br><strong>Olivia AI</strong></span>
    </button>
    <section class="olivia-panel" aria-label="Olivia AI">
      <header class="olivia-head">
        <div><h2 class="olivia-title">Olivia AI</h2><p class="olivia-status">${copy.subtitle}</p></div>
        <button class="olivia-close" type="button" aria-label="${copy.close}">×</button>
      </header>
      <div class="olivia-messages" aria-live="polite"></div>
      <form class="olivia-lead" hidden>
        <p>${copy.lead}</p>
        <div class="olivia-grid">
          <input name="firstName" autocomplete="given-name" placeholder="${copy.firstName}" required>
          <input name="lastName" autocomplete="family-name" placeholder="${copy.lastName}" required>
          <input name="email" type="email" autocomplete="email" placeholder="${copy.email}" required>
          <input name="phone" autocomplete="tel" placeholder="${copy.phone}" required>
          <textarea name="need" rows="3" placeholder="${copy.need}" required></textarea>
        </div>
        <label class="olivia-consent"><input name="consent" type="checkbox" required><span>${copy.consent} <a href="${copy.privacyUrl}" target="_blank" rel="noopener">${copy.privacy}</a></span></label>
        <p class="olivia-lead-error" role="alert"></p>
        <button type="submit" class="olivia-send-lead">${copy.sendLead}</button>
      </form>
      <form class="olivia-form">
        <input name="message" autocomplete="off" placeholder="${copy.input}" required>
        <button type="submit" aria-label="${copy.send}">›</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const messages = root.querySelector('.olivia-messages');
  const chatForm = root.querySelector('.olivia-form');
  const messageInput = chatForm.elements.message;
  const leadForm = root.querySelector('.olivia-lead');
  const leadError = root.querySelector('.olivia-lead-error');

  function addMessage(text, role) {
    if (!text) return;
    const bubble = document.createElement('div');
    bubble.className = `olivia-msg ${role === 'user' ? 'user' : 'bot'}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function currentMetadata(extra) {
    return {
      page: location.href,
      pageUrl: location.href,
      pageTitle: document.title,
      language,
      locale: pageLanguage,
      lead: savedLead || undefined,
      ...(extra || {}),
    };
  }

  async function getIdentity(refresh) {
    if (refresh) identityPromise = null;
    if (!identityPromise) {
      identityPromise = fetch(IDENTITY_URL, { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.clientCode !== CLIENT_CODE || !data.identity) {
            throw new Error(`Identity ${response.status}`);
          }
          return data.identity;
        })
        .catch((error) => {
          identityPromise = null;
          throw error;
        });
    }
    return identityPromise;
  }

  async function oliviaFetch(url, options, retry) {
    const requestOptions = options || {};
    const identity = await getIdentity(false);
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        ...(requestOptions.headers || {}),
        'X-Olivia-Widget-Identity': identity,
      },
    });
    if (response.status === 401 && retry !== false) {
      await getIdentity(true);
      return oliviaFetch(url, requestOptions, false);
    }
    return response;
  }

  async function saveChannelMessage(content, extraMetadata) {
    const response = await oliviaFetch(CONVERSATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientCode: CLIENT_CODE,
        visitorId,
        visitorName: savedLead ? `${savedLead.firstName} ${savedLead.lastName}`.trim() : '',
        email: savedLead?.email || '',
        phone: savedLead?.phone || '',
        source: 'website',
        language,
        content,
        metadata: currentMetadata(extraMetadata),
      }),
    });
    if (!response.ok) throw new Error(`Channel ${response.status}`);
    const data = await response.json();
    conversationStatus = data.conversation?.status || conversationStatus;
    return data;
  }

  async function saveAiReply(content, model) {
    await oliviaFetch(CONVERSATIONS_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientCode: CLIENT_CODE, visitorId, content, model }),
    });
  }

  async function pollOperatorMessages() {
    try {
      const response = await oliviaFetch(`${CONVERSATIONS_URL}?clientCode=${CLIENT_CODE}&visitorId=${encodeURIComponent(visitorId)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      conversationStatus = data.status || conversationStatus;
      (data.messages || []).filter((item) => item.role === 'operator').forEach((item) => {
        const key = item.id || `${item.created_at || ''}:${item.content}`;
        if (!displayedOperatorMessages.has(key)) {
          displayedOperatorMessages.add(key);
          addMessage(item.content, 'bot');
        }
      });
    } catch (_) {}
  }

  root.querySelector('.olivia-launcher').addEventListener('click', () => root.classList.add('is-open'));
  root.querySelector('.olivia-close').addEventListener('click', () => root.classList.remove('is-open'));
  addMessage(copy.hello, 'bot');
  if (savedLead) leadForm.hidden = true;

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    leadError.textContent = '';
    if (!leadForm.reportValidity()) {
      leadError.textContent = copy.required;
      return;
    }
    const formData = new FormData(leadForm);
    savedLead = {
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      need: String(formData.get('need') || '').trim(),
    };
    const leadText = `${copy.need}: ${savedLead.need}`;
    try {
      await saveChannelMessage(leadText, { type: 'lead', need: savedLead.need });
      localStorage.setItem(leadKey, JSON.stringify(savedLead));
      leadForm.hidden = true;
      addMessage(copy.sent, 'bot');
      fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          firstName: savedLead.firstName,
          lastName: savedLead.lastName,
          email: savedLead.email,
          phone: savedLead.phone,
          need: savedLead.need,
          source: 'Olivia AI GESCOM',
          language,
          page: location.href,
        }),
      }).catch(() => {});
    } catch (_) {
      leadError.textContent = copy.error;
    }
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    messageInput.value = '';
    addMessage(message, 'user');
    try {
      const stored = await saveChannelMessage(message, { type: 'chat' });
      if ((stored.conversation?.status || conversationStatus) !== 'ai') return;
      const response = await oliviaFetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: CLIENT_CODE,
          clientId: CLIENT_CODE,
          message,
          language,
          visitorId,
          metadata: currentMetadata(),
        }),
      });
      if (!response.ok) throw new Error(`AI ${response.status}`);
      const data = await response.json();
      const reply = data.reply || copy.error;
      addMessage(reply, 'bot');
      await saveAiReply(reply, data.model || 'olivia-ai');
    } catch (_) {
      addMessage(copy.error, 'bot');
    }
  });

  pollOperatorMessages();
  getIdentity(false).catch(() => {});
  window.setInterval(pollOperatorMessages, 5000);
})();
if (!document.querySelector('script[data-olivia-floating-theme]')) {
  const oliviaTheme = document.createElement('script');
  oliviaTheme.src = 'https://olivia-ai.o7digital.com/olivia-floating-theme.js';
  oliviaTheme.defer = true;
  oliviaTheme.dataset.oliviaFloatingTheme = 'true';
  document.head.appendChild(oliviaTheme);
}
