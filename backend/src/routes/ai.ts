import express from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// AI Chat endpoint
router.post('/chat', [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isObject(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { message, context = {} } = req.body;

  // This is a placeholder for AI integration
  // In production, you would integrate with OpenAI, Google AI, or another AI service
  const aiResponse = await processAIMessage(message, context, req.user?.id);

  res.json({
    success: true,
    data: {
      response: aiResponse,
      timestamp: new Date().toISOString(),
    },
  });
}));

// Symptom checker endpoint
router.post('/symptom-checker', [
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('symptoms.*').notEmpty().withMessage('Each symptom must not be empty'),
  body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { symptoms, age, gender } = req.body;

  // This is a placeholder for AI symptom analysis
  const analysis = await analyzeSymptoms(symptoms, { age, gender });

  res.json({
    success: true,
    data: {
      analysis,
      recommendations: generateRecommendations(analysis),
      urgency: determineUrgency(analysis),
      timestamp: new Date().toISOString(),
    },
  });
}));

// Health tips endpoint
router.get('/health-tips', asyncHandler(async (req, res) => {
  const { category, limit = 10 } = req.query;

  const tips = await getHealthTips(category as string, Number(limit));

  res.json({
    success: true,
    data: {
      tips,
      category: category || 'general',
    },
  });
}));

// Medication information endpoint
router.get('/medication/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;

  const medicationInfo = await getMedicationInfo(name);

  if (!medicationInfo) {
    return res.status(404).json({
      success: false,
      message: 'Medication information not found',
    });
  }

  res.json({
    success: true,
    data: {
      medication: medicationInfo,
    },
  });
}));

// Helper functions (placeholders for AI integration)
async function processAIMessage(message: string, context: any, userId?: string): Promise<string> {
  // This is a placeholder - in production, integrate with AI service
  const responses = [
    "I understand your concern. Let me help you with that.",
    "Based on your symptoms, I recommend consulting with a healthcare provider.",
    "That's a common condition. Here are some general guidelines...",
    "I can provide general health information, but for specific medical advice, please consult a doctor.",
    "It's important to monitor your symptoms and seek medical attention if they worsen.",
    "I recommend keeping track of your symptoms and discussing them with your healthcare provider.",
  ];
  
  // Simple keyword-based responses for demo
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('headache')) {
    return "Headaches can have various causes. Common triggers include stress, dehydration, lack of sleep, or tension. Try drinking water, resting in a dark room, or gentle neck stretches. If the headache is severe, persistent, or accompanied by other symptoms like fever or vision changes, please consult a healthcare provider immediately.";
  } else if (lowerMessage.includes('fever')) {
    return "Fever is often a sign of infection. For adults, a temperature above 100.4°F (38°C) is considered a fever. Rest, stay hydrated, and monitor your temperature. If fever persists for more than 3 days or is very high (above 103°F), seek medical attention.";
  } else if (lowerMessage.includes('blood pressure')) {
    return "To help lower blood pressure naturally: maintain a healthy weight, exercise regularly, reduce sodium intake, limit alcohol, quit smoking, manage stress, and eat a diet rich in fruits, vegetables, and whole grains. Regular monitoring and consultation with your doctor is important.";
  } else if (lowerMessage.includes('emergency')) {
    return "In a medical emergency, call emergency services immediately. Signs of emergency include: severe chest pain, difficulty breathing, severe bleeding, loss of consciousness, severe allergic reactions, or signs of stroke (facial drooping, arm weakness, speech difficulties).";
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

async function analyzeSymptoms(symptoms: string[], context: { age?: number; gender?: string }): Promise<any> {
  // This is a placeholder for AI symptom analysis
  return {
    possibleConditions: [
      {
        condition: "Common Cold",
        probability: 0.7,
        description: "Viral infection affecting the upper respiratory tract",
      },
      {
        condition: "Allergic Reaction",
        probability: 0.3,
        description: "Immune system response to allergens",
      },
    ],
    severity: "mild",
    confidence: 0.8,
  };
}

function generateRecommendations(analysis: any): string[] {
  return [
    "Get plenty of rest",
    "Stay hydrated by drinking water",
    "Monitor your symptoms",
    "Consider over-the-counter medications for symptom relief",
    "Consult a healthcare provider if symptoms worsen",
  ];
}

function determineUrgency(analysis: any): 'low' | 'medium' | 'high' {
  if (analysis.severity === 'severe') return 'high';
  if (analysis.severity === 'moderate') return 'medium';
  return 'low';
}

async function getHealthTips(category?: string, limit: number = 10): Promise<any[]> {
  const tips = [
    {
      id: 1,
      title: "Stay Hydrated",
      description: "Drink at least 8 glasses of water daily",
      category: "general",
    },
    {
      id: 2,
      title: "Get Enough Sleep",
      description: "Aim for 7-8 hours of quality sleep each night",
      category: "general",
    },
    {
      id: 3,
      title: "Exercise Regularly",
      description: "Engage in at least 30 minutes of physical activity daily",
      category: "fitness",
    },
    {
      id: 4,
      title: "Eat a Balanced Diet",
      description: "Include fruits, vegetables, whole grains, and lean proteins",
      category: "nutrition",
    },
    {
      id: 5,
      title: "Manage Stress",
      description: "Practice relaxation techniques like meditation or deep breathing",
      category: "mental-health",
    },
  ];

  if (category) {
    return tips.filter(tip => tip.category === category).slice(0, limit);
  }

  return tips.slice(0, limit);
}

async function getMedicationInfo(name: string): Promise<any | null> {
  // This is a placeholder for medication database lookup
  const medications = {
    'paracetamol': {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      dosage: '500-1000mg every 4-6 hours',
      sideEffects: ['Nausea', 'Rash', 'Liver damage (with overdose)'],
      interactions: ['Warfarin', 'Alcohol'],
      warnings: ['Do not exceed 4000mg per day', 'Consult doctor if pregnant'],
    },
    'ibuprofen': {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      dosage: '200-400mg every 4-6 hours',
      sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
      interactions: ['Aspirin', 'Blood thinners'],
      warnings: ['Take with food', 'Avoid if you have stomach ulcers'],
    },
  };

  return medications[name.toLowerCase()] || null;
}

export default router;
