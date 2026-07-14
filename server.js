const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/api/generate-book', async (req, res) => {
    try {
        const data = req.body;
        const topic = (data.topic || '').trim();
        const chapters = Math.min(parseInt(data.chapters || '5', 10), 10);
        const language = data.language || 'arabic';
        const genre = data.genre || 'educational';
        
        if (!topic) {
            return res.status(400).json({ success: false, error: "Topic required" });
        }
        
        const prompt = `Write a ${genre} book about "${topic}" in ${language}.
        ${chapters} chapters. Each 300-500 words.
        Return ONLY JSON: {"title":"...","chapters":[{"number":1,"title":"...","content":"..."}]}`;
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }
        
        const responseData = await response.json();
        const text = responseData.choices[0].message.content;
        
        let book;
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            book = JSON.parse(text.substring(start, end));
        } else {
            book = { title: topic, chapters: [] };
        }
        
        res.json({
            success: true,
            title: book.title,
            chapters: book.chapters ? book.chapters.slice(0, chapters) : []
        });
        
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node server mimicking Python app listening on port ${PORT}`);
});
