(function () {
  const API_URL = 'https://ai-concierge-production-4e92.up.railway.app/chat';
  const LEAD_URL = 'https://www.o7digital.com/api/o7-lead';
  const CLIENT_ID = 'gescom';

  const pageLang = (document.documentElement.lang || '').toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const isEnglish = pageLang.startsWith('en') || path.includes('-en') || path.includes('/en/');
  const copy = isEnglish
    ? {
        launcher: 'Need help?',
        subtitle: 'GESCOM assistant · Online',
        hello: 'Hello, I am Sophie. How can I help you with your administrative needs?',
        lead: 'Leave your details so GESCOM can contact you.',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone',
        sendLead: 'Send my details',
        sent: 'Thank you. Your details were sent and GESCOM will contact you soon.',
        input: 'Write your question...',
        error: 'I could not send the message. You can contact GESCOM at gescom.mauricie@gmail.com or +1 (819) 996-1177.',
      }
    : {
        launcher: 'Besoin d’aide ?',
        subtitle: 'Assistante GESCOM · En ligne',
        hello: 'Bonjour, je suis Sophie. Comment puis-je vous aider pour vos besoins administratifs ?',
        lead: 'Laissez vos coordonnées pour que GESCOM puisse vous contacter.',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Courriel',
        phone: 'Téléphone',
        sendLead: 'Envoyer mes coordonnées',
        sent: 'Merci. Vos coordonnées ont été envoyées et GESCOM vous contactera rapidement.',
        input: 'Écrivez votre question...',
        error: 'Je n’ai pas pu envoyer le message. Vous pouvez contacter GESCOM à gescom.mauricie@gmail.com ou au +1 (819) 996-1177.',
      };

  const root = document.createElement('div');
  root.id = 'sophie-chat-root';
  root.innerHTML = `
    <button class="sophie-launcher" type="button" aria-label="Ouvrir le chat Sophie">
      <span class="sophie-launcher__mark">S</span>
      <span class="sophie-launcher__text">${copy.launcher}<br><strong>Sophie</strong></span>
    </button>
    <section class="sophie-panel" aria-label="Chat Sophie">
      <header class="sophie-head">
        <div><h2 class="sophie-title">SOPHIE</h2><p class="sophie-status">${copy.subtitle}</p></div>
        <button class="sophie-close" type="button" aria-label="Fermer">×</button>
      </header>
      <div class="sophie-messages" aria-live="polite"></div>
      <div class="sophie-lead">
        <p>${copy.lead}</p>
        <div class="sophie-grid">
          <input name="firstName" autocomplete="given-name" placeholder="${copy.firstName}">
          <input name="lastName" autocomplete="family-name" placeholder="${copy.lastName}">
          <input name="email" type="email" autocomplete="email" placeholder="${copy.email}">
          <input name="phone" autocomplete="tel" placeholder="${copy.phone}">
        </div>
        <button type="button" class="sophie-send-lead">${copy.sendLead}</button>
      </div>
      <form class="sophie-form">
        <input name="message" autocomplete="off" placeholder="${copy.input}">
        <button type="submit" aria-label="Envoyer">›</button>
      </form>
    </section>`;

  document.body.appendChild(root);

  const messages = root.querySelector('.sophie-messages');
  const form = root.querySelector('.sophie-form');
  const messageInput = form.elements.message;
  const leadBox = root.querySelector('.sophie-lead');
  const transcript = [];

  function addMessage(text, who) {
    transcript.push(`${who}: ${text}`);
    const bubble = document.createElement('div');
    bubble.className = `sophie-msg ${who === 'user' ? 'user' : 'bot'}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  root.querySelector('.sophie-launcher').addEventListener('click', () => root.classList.add('is-open'));
  root.querySelector('.sophie-close').addEventListener('click', () => root.classList.remove('is-open'));

  addMessage(copy.hello, 'bot');

  root.querySelector('.sophie-send-lead').addEventListener('click', async () => {
    const lead = Object.fromEntries(Array.from(leadBox.querySelectorAll('input')).map((input) => [input.name, input.value.trim()]));
    try {
      await fetch(LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteCode: CLIENT_ID, assistantName: 'Sophie', lead, message: transcript.join('\n') }),
      });
    } catch (_) {}
    addMessage(copy.sent, 'bot');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    messageInput.value = '';
    addMessage(message, 'user');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: CLIENT_ID, message, metadata: { page: location.href } }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      addMessage(data.reply || copy.error, 'bot');
    } catch (error) {
      addMessage(copy.error, 'bot');
    }
  });
})();
