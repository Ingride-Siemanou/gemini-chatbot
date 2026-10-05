const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const submitButton = form.querySelector("button");

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
      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Une erreur est survenue."
      );
    }

    addMessage(data.reply, "bot");
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