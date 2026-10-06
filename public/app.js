const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const submitButton = form.querySelector('button[type="submit"]');

const toolsButton = document.getElementById("tools-button");
const toolsMenu = document.getElementById("tools-menu");
const fileButton = document.getElementById("file-button");
const fileInput = document.getElementById("file-input");

const history = [];

function addMessage(text, sender) {
  const messageElement = document.createElement("div");

  messageElement.classList.add("message", sender);
  messageElement.textContent = text;

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}

toolsButton.addEventListener("click", () => {
  toolsMenu.classList.toggle("open");
});

fileButton.addEventListener("click", () => {
  fileInput.click();
  toolsMenu.classList.remove("open");
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) {
    return;
  }

  addMessage(`Fichier sélectionné : ${file.name}`, "user");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".tools-wrapper")) {
    toolsMenu.classList.remove("open");
  }
});

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