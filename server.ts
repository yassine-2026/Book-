import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Groq } from 'groq-sdk';
import PDFDocument from 'pdfkit';
import { Document, Paragraph, HeadingLevel, Packer, TextRun, AlignmentType } from 'docx';
// @ts-ignore
import { ZipArchive } from 'archiver';
import crypto from 'crypto';

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const OUTPUT_DIR = path.join(_dirname, 'static', 'books');
const COVERS_DIR = path.join(_dirname, 'static', 'covers');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

// ========== 30+ LANGUAGES ==========
const LANGUAGES: Record<string, string> = {
    'arabic': 'العربية', 'english': 'English', 'french': 'Français',
    'spanish': 'Español', 'german': 'Deutsch', 'italian': 'Italiano',
    'portuguese': 'Português', 'russian': 'Русский', 'chinese': '中文',
    'japanese': '日本語', 'korean': '한국어', 'hindi': 'हिन्दी',
    'turkish': 'Türkçe', 'urdu': 'اردو', 'malay': 'Bahasa Melayu',
    'indonesian': 'Bahasa Indonesia', 'dutch': 'Nederlands',
    'polish': 'Polski', 'swedish': 'Svenska', 'norwegian': 'Norsk',
    'danish': 'Dansk', 'finnish': 'Suomi', 'greek': 'Ελληνικά',
    'thai': 'ไทย', 'vietnamese': 'Tiếng Việt', 'hebrew': 'עברית',
    'persian': 'فارسی', 'bengali': 'বাংলা', 'tamil': 'தமிழ்',
    'tagalog': 'Tagalog', 'romanian': 'Română', 'ukrainian': 'Українська',
};

// ========== 15 COVER THEMES ==========
const COVER_THEMES: Record<string, any> = {
    'educational': { bg: '#1a237e', accent: '#ffd600', secondary: '#3949ab', pattern: 'books' },
    'story': { bg: '#4a148c', accent: '#ff4081', secondary: '#7b1fa2', pattern: 'stars' },
    'self_help': { bg: '#004d40', accent: '#00e5ff', secondary: '#00695c', pattern: 'sunrise' },
    'technology': { bg: '#0d47a1', accent: '#00e676', secondary: '#1565c0', pattern: 'circuit' },
    'religious': { bg: '#1b5e20', accent: '#ffd700', secondary: '#2e7d32', pattern: 'mosque' },
    'history': { bg: '#3e2723', accent: '#ffab00', secondary: '#4e342e', pattern: 'scroll' },
    'cooking': { bg: '#bf360c', accent: '#ffeb3b', secondary: '#d84315', pattern: 'food' },
    'business': { bg: '#01579b', accent: '#ff6d00', secondary: '#0277bd', pattern: 'chart' },
    'science': { bg: '#311b92', accent: '#00e5ff', secondary: '#4527a0', pattern: 'atoms' },
    'romance': { bg: '#880e4f', accent: '#ff80ab', secondary: '#ad1457', pattern: 'hearts' },
    'horror': { bg: '#212121', accent: '#ff1744', secondary: '#424242', pattern: 'dark' },
    'fantasy': { bg: '#1a237e', accent: '#ffd740', secondary: '#283593', pattern: 'magic' },
    'comedy': { bg: '#f57f17', accent: '#ffffff', secondary: '#f9a825', pattern: 'fun' },
    'travel': { bg: '#006064', accent: '#18ffff', secondary: '#00838f', pattern: 'world' },
    'health': { bg: '#1b5e20', accent: '#69f0ae', secondary: '#2e7d32', pattern: 'leaf' },
};

app.post('/api/generate-book', async (req, res) => {
    try {
        const { topic, genre = 'educational', chapters: chStr = '5', language = 'arabic', author = 'Author', max_pages = 100 } = req.body;
        
        const chapters_count = Math.min(parseInt(chStr, 10), 15);
        const maxPages = Math.min(parseInt(max_pages, 10), 100);

        if (!topic) {
            return res.status(400).json({ success: false, error: "Topic required" });
        }

        if (!groq) {
            return res.status(500).json({ success: false, error: "GROQ_API_KEY not configured" });
        }

        const lang_name = LANGUAGES[language] || 'English';

        const prompt = `Create a COMPLETE professional ${genre} book in ${lang_name} about "${topic}".
Author: ${author}
Chapters: ${chapters_count}
Maximum pages: ${maxPages}

CRITICAL RULES:
1. Each chapter MUST be 400-800 words of UNIQUE content
2. NO repetition between chapters
3. REAL, accurate information about the topic
4. Professional writing style
5. NO spelling or grammar errors
6. Each chapter should have practical examples

Return ONLY valid JSON (no other text):
{
    "title": "Creative Book Title",
    "subtitle": "Engaging Subtitle",
    "description": "Compelling 2-3 sentence book description",
    "keywords": "keyword1, keyword2, keyword3",
    "chapters": [
        {
            "number": 1,
            "title": "Chapter Title",
            "content": "Full chapter content 400-800 words with examples..."
        }
    ]
}`;
        console.log('Sending prompt to Groq API...');

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_tokens: 8000,
        });

        const text = response.choices[0]?.message?.content || '';
        
        let book_data;
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            book_data = JSON.parse(text.substring(start, end));
        } else {
            return res.status(500).json({ success: false, error: "Failed to generate book content from AI" });
        }

        if (!book_data.chapters || book_data.chapters.length === 0) {
            book_data.chapters = [{ number: 1, title: "Introduction", content: "Content here..." }];
        }
        
        book_data.chapters = book_data.chapters.slice(0, chapters_count);
        
        const book_id = crypto.randomBytes(6).toString('hex');
        
        const cover_path = create_cover_svg(book_data.title, book_data.subtitle || '', author, genre, book_id);
        
        const bookDir = path.join(OUTPUT_DIR, book_id);
        if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

        const pdf_path = await create_pdf(book_data, author, book_id, bookDir);
        const docx_path = await create_docx(book_data, author, book_id, bookDir);
        const txt_path = create_txt(book_data, author, book_id, bookDir);
        const html_path = create_html(book_data, author, book_id, bookDir);

        const zip_path = path.join(bookDir, 'all_formats.zip');
        await create_zip(zip_path, book_data.title, pdf_path, docx_path, txt_path, html_path);
        
        res.json({
            success: true,
            book_id,
            title: book_data.title,
            subtitle: book_data.subtitle || '',
            description: book_data.description || '',
            chapters: book_data.chapters,
            cover_url: `/api/covers/${path.basename(cover_path)}`,
            downloads: {
                pdf: `/api/books/${book_id}/book.pdf`,
                docx: `/api/books/${book_id}/book.docx`,
                txt: `/api/books/${book_id}/book.txt`,
                html: `/api/books/${book_id}/book.html`,
                zip: `/api/books/${book_id}/all_formats.zip`
            }
        });

    } catch (e: any) {
        console.error('Error generating book:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ========== CREATE COVER (SVG) ==========
function create_cover_svg(title: string, subtitle: string, author: string, genre: string, book_id: string): string {
    const theme = COVER_THEMES[genre] || COVER_THEMES['educational'];
    
    const svgContent = `
    <svg width="800" height="1200" viewBox="0 0 800 1200" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="1200" fill="${theme.bg}" />
        <!-- Decorative elements based on pattern -->
        <rect x="20" y="20" width="760" height="1160" fill="none" stroke="${theme.accent}" stroke-width="4" />
        <rect x="30" y="30" width="740" height="1140" fill="none" stroke="${theme.accent}" stroke-width="1" />
        
        <text x="400" y="300" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${theme.accent}" text-anchor="middle" dominant-baseline="middle">
            ${title}
        </text>
        ${subtitle ? `<text x="400" y="380" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${subtitle}</text>` : ''}
        
        <text x="400" y="1050" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">By: ${author}</text>
        
        <rect x="300" y="1100" width="200" height="40" fill="${theme.accent}" rx="5" />
        <text x="400" y="1128" font-family="Arial, sans-serif" font-size="18" fill="${theme.bg}" text-anchor="middle" font-weight="bold">${genre.toUpperCase()}</text>
    </svg>
    `;
    
    const p = path.join(COVERS_DIR, `cover_\${book_id}.svg`);
    fs.writeFileSync(p, svgContent);
    return p;
}

// ========== CREATE PDF ==========
async function create_pdf(book_data: any, author: string, book_id: string, bookDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const p = path.join(bookDir, 'book.pdf');
        const doc = new PDFDocument({ margin: 72, size: 'A4' });
        const stream = fs.createWriteStream(p);
        
        doc.pipe(stream);

        // Title Page
        doc.moveDown(10);
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#1a237e').text(book_data.title, { align: 'center' });
        if (book_data.subtitle) {
            doc.moveDown(1);
            doc.font('Helvetica').fontSize(16).fillColor('#666666').text(book_data.subtitle, { align: 'center' });
        }
        doc.moveDown(4);
        doc.font('Helvetica').fontSize(14).fillColor('#000000').text(`By: \${author}`, { align: 'center' });
        
        doc.addPage();
        
        // TOC
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#4a148c').text('Table of Contents', { align: 'left' });
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(12).fillColor('#000000');
        for (const ch of book_data.chapters) {
            doc.text(`Chapter \${ch.number}: \${ch.title}`);
            doc.moveDown(0.5);
        }
        
        // Chapters
        for (const ch of book_data.chapters) {
            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#4a148c').text(`Chapter \${ch.number}`);
            doc.moveDown(0.5);
            doc.fontSize(14).text(ch.title);
            doc.moveDown(1);
            
            doc.font('Helvetica').fontSize(12).fillColor('#000000');
            const paragraphs = (ch.content || '').split('\\n');
            for (const para of paragraphs) {
                if (para.trim()) {
                    // Quick trick to handle some RTL logic visually in simple cases, 
                    // though real RTL in pdfkit requires a font and shaping which we omit for simplicity.
                    doc.text(para.trim(), { align: 'justify' });
                    doc.moveDown(0.5);
                }
            }
        }
        
        doc.end();
        stream.on('finish', () => resolve(p));
        stream.on('error', reject);
    });
}

// ========== CREATE DOCX ==========
async function create_docx(book_data: any, author: string, book_id: string, bookDir: string): Promise<string> {
    const p = path.join(bookDir, 'book.docx');
    
    const children = [];
    
    children.push(new Paragraph({
        text: book_data.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
    }));
    
    if (book_data.subtitle) {
        children.push(new Paragraph({
            text: book_data.subtitle,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
        }));
    }
    
    children.push(new Paragraph({
        text: `By: \${author}`,
        alignment: AlignmentType.CENTER,
    }));
    
    // Add page break here ideally, but simplified for now
    
    children.push(new Paragraph({
        text: 'Table of Contents',
        heading: HeadingLevel.HEADING_1,
    }));
    
    for (const ch of book_data.chapters) {
        children.push(new Paragraph({
            text: `Chapter \${ch.number}: \${ch.title}`,
        }));
    }
    
    for (const ch of book_data.chapters) {
        children.push(new Paragraph({
            text: `Chapter \${ch.number}: \${ch.title}`,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
        }));
        
        const paragraphs = (ch.content || '').split('\\n');
        for (const para of paragraphs) {
            if (para.trim()) {
                children.push(new Paragraph({
                    text: para.trim(),
                }));
            }
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(p, buffer);
    return p;
}

// ========== CREATE TXT ==========
function create_txt(book_data: any, author: string, book_id: string, bookDir: string): string {
    const p = path.join(bookDir, 'book.txt');
    let content = `\${book_data.title}\\nBy: \${author}\\n==================================================\\n\\n`;
    for (const ch of book_data.chapters) {
        content += `CHAPTER \${ch.number}: \${ch.title}\\n------------------------------\\n\${ch.content}\\n\\n`;
    }
    fs.writeFileSync(p, content);
    return p;
}

// ========== CREATE HTML ==========
function create_html(book_data: any, author: string, book_id: string, bookDir: string): string {
    const p = path.join(bookDir, 'book.html');
    let content = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>\${book_data.title}</title>
<style>
body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.8;background:#fafafa; direction: auto;}
h1{color:#1a237e;text-align:center;font-size:2em}
h2{color:#4a148c;margin-top:40px}
.chapter{margin:30px 0;padding:25px;background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
.cover{text-align:center;padding:100px 0;background:linear-gradient(135deg,#1a237e,#4a148c);color:#fff;border-radius:20px;margin-bottom:50px}
</style></head>
<body>
<div class="cover">
<h1 style="color:#fff">\${book_data.title}</h1>
<p style="font-size:1.2em">By: \${author}</p>
</div>
`;
    for (const ch of book_data.chapters) {
        content += `<div class="chapter"><h2>Chapter \${ch.number}: \${ch.title}</h2><p>\${(ch.content || '').replace(/\\n/g, '<br>')}</p></div>`;
    }
    content += '</body></html>';
    fs.writeFileSync(p, content);
    return p;
}

// ========== CREATE ZIP ==========
async function create_zip(zip_path: string, title: string, pdf_path: string, docx_path: string, txt_path: string, html_path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zip_path);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        archive.file(pdf_path, { name: `\${title}.pdf` });
        archive.file(docx_path, { name: `\${title}.docx` });
        archive.file(txt_path, { name: `\${title}.txt` });
        archive.file(html_path, { name: `\${title}.html` });

        archive.finalize();
    });
}


app.use('/api/books', express.static(OUTPUT_DIR));
app.use('/api/covers', express.static(COVERS_DIR));

app.get('/api/health', (req, res) => {
    res.json({
        status: "ok",
        groq: !!GROQ_API_KEY,
        languages: Object.keys(LANGUAGES).length,
        themes: Object.keys(COVER_THEMES).length
    });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:\${PORT}`);
  });
}

startServer();
