import os, json, uuid, io
from flask import Flask, render_template, request, jsonify, send_file
from groq import Groq

app = Flask(__name__)

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate-book', methods=['POST'])
def generate_book():
    try:
        data = request.get_json(force=True)
        topic = data.get('topic', '').strip()
        chapters = min(int(data.get('chapters', 5)), 10)
        language = data.get('language', 'arabic')
        genre = data.get('genre', 'educational')
        
        if not topic:
            return jsonify({"success": False, "error": "Topic required"}), 400
        
        if not client:
            return jsonify({"success": False, "error": "GROQ_API_KEY not set"}), 500
        
        prompt = f"""Write a {genre} book about "{topic}" in {language}.
        {chapters} chapters. Each chapter 300-500 words.
        Return ONLY JSON: {{"title":"...","chapters":[{{"number":1,"title":"...","content":"..."}}]}}"""
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            temperature=0.8,
            max_tokens=4000
        )
        
        text = response.choices[0].message.content
        
        # Extract JSON
        start = text.find('{')
        end = text.rfind('}') + 1
        if start >= 0 and end > start:
            book = json.loads(text[start:end])
        else:
            book = {"title": topic, "chapters": [{"number":1,"title":"Introduction","content":"Content..."}]}
        
        # Generate simple cover text
        cover_text = f"📚 {book['title']}\n\n{genre.upper()}"
        
        return jsonify({
            "success": True,
            "title": book['title'],
            "chapters": book['chapters'][:chapters],
            "cover_text": cover_text
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "groq": bool(GROQ_API_KEY)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
