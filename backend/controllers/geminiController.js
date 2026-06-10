const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.searchGemini = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in the backend' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a helpful AI assistant for an Enterprise Budget Management System. Answer the following user query clearly and concisely:\n\n${query}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error('Error in Gemini search:', error);
    res.status(500).json({ message: 'Failed to process search query with Gemini', error: error.message });
  }
};
