// server.js - VERSION FINALE OPTIMISÉE
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "https://frontend-edu-ia.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

// ✅ Vérification de la clé API
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HF_API_KEY) {
  console.error("❌ Clé Hugging Face manquante dans le fichier .env");
  process.exit(1);
}

console.log("✅ Clé API Hugging Face chargée avec permissions WRITE");

// ✅ Routes
app.get("/", (req, res) => {
  res.send("✅ Serveur EduAI avec Hugging Face opérationnel !");
});

app.get("/api/messages", (req, res) => {
  res.json([
    {
      id: 1,
      question: "Bonjour !",
      response:
        "Bonjour 👋 ! Je suis EduAI, votre tuteur virtuel intelligent. Posez-moi vos questions éducatives !",
      level: "college",
      timestamp: new Date().toISOString(),
    },
  ]);
});

// ✅ Route principale optimisée
app.post("/api/ask", async (req, res) => {
  const { question, level } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Aucune question reçue." });
  }

  try {
    console.log("📤 Question reçue:", question);

    let aiResponse;
    let apiUsed = false;
    let modelUsed = null;

    // Essayer d'abord avec l'API Hugging Face
    try {
      const apiResult = await callHuggingFaceAPI(question);
      if (apiResult.success) {
        aiResponse = apiResult.response;
        modelUsed = apiResult.model;
        apiUsed = true;
        console.log(`✅ Réponse de ${modelUsed}:`, aiResponse);
      }
    } catch (apiError) {
      console.warn("❌ Erreur API Hugging Face:", apiError.message);
    }

    // Si l'API échoue, utiliser une réponse simulée intelligente
    if (!aiResponse) {
      console.log("🔄 Utilisation du mode simulation intelligent...");
      aiResponse = generateIntelligentResponse(question, level);
    }

    res.json({
      response: aiResponse,
      question: question,
      level: level || "college",
      timestamp: new Date().toISOString(),
      api_used: apiUsed,
      model: modelUsed,
    });
  } catch (err) {
    console.error("❌ Erreur serveur :", err);
    const simulatedResponse = generateIntelligentResponse(question, level);
    res.json(simulatedResponse);
  }
});

// ✅ Fonction optimisée pour appeler l'API Hugging Face
async function callHuggingFaceAPI(question) {
  // Modèles optimisés pour l'éducation en français
  const models = [
    {
      name: "microsoft/DialoGPT-medium",
      parameters: { max_length: 150, temperature: 0.7, do_sample: true },
    },
    {
      name: "microsoft/DialoGPT-large",
      parameters: { max_length: 150, temperature: 0.7, do_sample: true },
    },
    {
      name: "facebook/blenderbot-400M-distill",
      parameters: { max_length: 200, temperature: 0.8, do_sample: true },
    },
  ];

  for (const model of models) {
    try {
      console.log(`🔄 Essai avec: ${model.name}`);

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model.name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: question,
            parameters: model.parameters,
            options: {
              wait_for_model: true,
              use_cache: true,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const extractedResponse = extractResponse(data);
        if (extractedResponse && extractedResponse.trim() !== "") {
          return {
            success: true,
            response: cleanResponse(extractedResponse),
            model: model.name,
          };
        }
      } else {
        console.warn(`❌ ${model.name}:`, data.error || "Erreur inconnue");

        // Erreur d'authentification - arrêter immédiatement
        if (data.error && isAuthError(data.error)) {
          throw new Error(`Erreur d'authentification: ${data.error}`);
        }
      }
    } catch (error) {
      console.warn(`❌ Erreur avec ${model.name}:`, error.message);
      if (error.message.includes("authentification")) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { success: false };
}

// ✅ Vérifier si c'est une erreur d'authentification
function isAuthError(error) {
  const authKeywords = [
    "auth",
    "token",
    "credential",
    "permission",
    "unauthorized",
    "forbidden",
  ];
  return authKeywords.some((keyword) => error.toLowerCase().includes(keyword));
}

// ✅ Nettoyer la réponse
function cleanResponse(text) {
  return text
    .replace(/<\|.*?\|>/g, "") // Supprimer les tokens spéciaux
    .replace(/\n+/g, " ") // Remplacer les sauts de ligne multiples
    .trim();
}

// ✅ Fonction pour extraire la réponse
function extractResponse(data) {
  try {
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      return data[0].generated_text;
    } else if (data.generated_text) {
      return data.generated_text;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur extraction réponse:", error);
    return null;
  }
}

// ✅ Fonction pour générer des réponses intelligentes
function generateIntelligentResponse(question, level = "college") {
  const questionLower = question.toLowerCase();

  // Réponses contextuelles
  if (questionLower.includes("bonjour") || questionLower.includes("salut")) {
    const greetings = {
      college:
        "Bonjour ! 👋 Je suis ravi de t'aider dans tes études. Quelle question as-tu aujourd'hui ?",
      lycee:
        "Salut ! 🎓 Prêt(e) à approfondir tes connaissances ? Quelle est ta question ?",
      universite:
        "Bonjour ! 📚 En tant qu'étudiant universitaire, tu as des questions spécifiques ?",
    };
    return greetings[level] || greetings.college;
  }

  if (questionLower.includes("merci")) {
    return "Avec plaisir ! 😊 N'hésite pas si tu as d'autres questions. Je suis là pour t'aider !";
  }

  if (questionLower.includes("math") || questionLower.includes("calcul")) {
    const mathResponses = {
      college:
        "Pour les mathématiques au collège, concentre-toi sur les fractions, pourcentages et géométrie. Un exercice spécifique ?",
      lycee:
        "En maths au lycée, les fonctions et dérivées sont clés. Quel concept veux-tu approfondir ?",
      universite:
        "Les maths universitaires demandent rigueur. Algèbre, analyse ou statistiques ?",
    };
    return mathResponses[level] || mathResponses.college;
  }

  // Réponses générales par niveau
  const generalResponses = {
    college: [
      "Au collège, la régularité est essentielle. N'hésite pas à demander de l'aide !",
      "Pour progresser au collège, crée des fiches de révision et pratique régulièrement.",
      "Au collège, maîtrise les bases avant de passer aux exercices complexes.",
    ],
    lycee: [
      "Au lycée, l'autonomie est cruciale. Organise bien ton temps de révision !",
      "Pour le lycée, consulte les annales du bac pour comprendre les attentes.",
      "Au lycée, développe ton esprit critique dans chaque matière.",
    ],
    universite: [
      "À l'université, l'autonomie et la recherche sont primordiales. Consulte les bibliographies !",
      "Pour réussir à l'université, équilibre cours magistraux et travail personnel.",
      "Les travaux universitaires développent ton analyse. Participe activement aux TD !",
    ],
  };

  const levelResponses = generalResponses[level] || generalResponses.college;
  return levelResponses[Math.floor(Math.random() * levelResponses.length)];
}

// ✅ Route pour ajouter des messages
app.post("/api/messages", async (req, res) => {
  try {
    const { question, response, level } = req.body;

    const newMessage = {
      id: Date.now(),
      question,
      response,
      level: level || "college",
      timestamp: new Date().toISOString(),
    };

    res.json(newMessage);
  } catch (error) {
    console.error("❌ Erreur création message:", error);
    res.status(500).json({ error: "Erreur lors de la création du message" });
  }
});

// ✅ Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `🚀 Serveur EduAI avec Hugging Face WRITE en ligne sur http://localhost:${PORT}`
  )
);
