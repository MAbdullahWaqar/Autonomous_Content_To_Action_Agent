const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const apiKey = env.match(/GOOGLE_GENERATIVE_AI_API_KEY="?([^"\n]+)/)[1];
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      const valid = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
      console.log('Valid models for generateContent:');
      console.log(valid.join('\n'));
    }
  });
