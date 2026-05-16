require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      const geminiModels = data.models.filter(m => m.name.includes('gemini-1.5')).map(m => m.name);
      console.log('Available Gemini 1.5 Models:', geminiModels);
    } else {
      console.log('Error or no models:', data);
    }
  })
  .catch(err => console.error(err));
