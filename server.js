import express from "express";

const app = express();
const PORT = 3000;

// Permet au serveur de comprendre les données JSON reçues
app.use(express.json());

// Route de test du serveur
app.get("/", (req, res) => {
  res.send("Serveur Gemini Chatbot opérationnel !");
});

// Route qui recevra les messages du chatbot
app.post("/api/chat", (req, res) => {
  const message = req.body.message;

  console.log("Message reçu :", message);

  res.json({
    reply: `Le serveur a bien reçu : ${message}`,
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});