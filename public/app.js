const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const submitButton = form.querySelector("button");

// Historique de la conversation.
// Pour l'instant, il reste en mémoire tant que la page est ouverte.
const history = [];

function addMessage(text, sender) {
  const messageElement = document.createElement("div");

  messageElement.classList.add("message", sender);
  messageElement.textContent = text;

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) {
    return;
  }

  addMessage(message, "user");

  input.value = "";
  input.disabled = true;
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      // On envoie maintenant le nouveau message
      // ET les messages précédents.
      body: JSON.stringify({
        message: message,
        history: history,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Une erreur est survenue."
      );
    }

    addMessage(data.reply, "bot");

    // Une fois que Gemini a répondu,
    // on ajoute cet échange à l'historique.
    history.push({
      role: "user",
      text: message,
    });

    history.push({
      role: "assistant",
      text: data.reply,
    });
  } catch (error) {
    console.error("Erreur :", error);

    addMessage(
      "Désolé, une erreur est survenue.",
      "bot"
    );
  } finally {
    input.disabled = false;
    submitButton.disabled = false;
    input.focus();
  }
});