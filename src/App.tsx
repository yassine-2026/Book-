import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, Download, Loader2, Sparkles, BookA } from 'lucide-react';
import { LANGUAGES, GENRES } from './constants';

type BookChapter = {
  number: number;
  title: string;
  content: string;
};

type GeneratedBook = {
  book_id: string;
  title: string;
  subtitle: string;
  description: string;
  chapters: BookChapter[];
  cover_url: string;
  downloads: {
    pdf: string;
    docx: string;
    txt: string;
    html: string;
    zip: string;
  };
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedBook | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      topic: formData.get('topic'),
      genre: formData.get('genre'),
      chapters: formData.get('chapters'),
      language: formData.get('language'),
      author: formData.get('author'),
      max_pages: formData.get('max_pages'),
    };

    try {
      const res = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate book');
      }

      setResult(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">AI Book Generator</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-12 gap-12">
        {/* Form Column */}
        <div className="md:col-span-5 space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Create a masterpiece.</h2>
            <p className="text-neutral-500">
              Generate a full professional eBook with a stunning cover in minutes. Powered by Groq & LLaMA.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="topic" className="block text-sm font-medium text-neutral-700">Book Topic</label>
              <input
                id="topic"
                name="topic"
                required
                placeholder="e.g. The Future of Artificial Intelligence"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="genre" className="block text-sm font-medium text-neutral-700">Theme / Genre</label>
                <select
                  id="genre"
                  name="genre"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none"
                  defaultValue="educational"
                >
                  {GENRES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="language" className="block text-sm font-medium text-neutral-700">Language</label>
                <select
                  id="language"
                  name="language"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none"
                  defaultValue="english"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="block text-sm font-medium text-neutral-700">Author Name</label>
              <input
                id="author"
                name="author"
                required
                defaultValue="AI Author"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="chapters" className="block text-sm font-medium text-neutral-700">Chapters (Max 15)</label>
                <input
                  id="chapters"
                  name="chapters"
                  type="number"
                  required
                  min="1"
                  max="15"
                  defaultValue="5"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="max_pages" className="block text-sm font-medium text-neutral-700">Max Pages (Max 100)</label>
                <input
                  id="max_pages"
                  name="max_pages"
                  type="number"
                  required
                  min="1"
                  max="100"
                  defaultValue="100"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Book...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate eBook
                </>
              )}
            </button>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Results Column */}
        <div className="md:col-span-7">
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full min-h-[400px] border-2 border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-neutral-400 bg-white p-8 text-center"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
              <h3 className="text-xl font-medium text-neutral-900 mb-2">Writing your book...</h3>
              <p className="text-neutral-500 max-w-sm">
                This usually takes a minute. The AI is researching, outlining, and writing each chapter from scratch.
              </p>
            </motion.div>
          )}

          {!loading && !result && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-neutral-400 bg-white/50">
              <BookA className="w-12 h-12 mb-4 text-neutral-300" />
              <p>Your generated book will appear here.</p>
            </div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden"
            >
              <div className="p-8 sm:p-10 flex flex-col sm:flex-row gap-8">
                {/* Cover Preview */}
                <div className="shrink-0 w-full sm:w-48 xl:w-56 rounded-xl overflow-hidden shadow-md border border-neutral-100 bg-neutral-100 relative">
                  <div className="aspect-[2/3] w-full">
                    <img 
                      src={result.cover_url} 
                      alt="Book Cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{result.title}</h2>
                    {result.subtitle && <p className="text-lg text-neutral-500 mt-1">{result.subtitle}</p>}
                  </div>
                  
                  <p className="text-neutral-600 leading-relaxed text-sm">
                    {result.description}
                  </p>

                  <div className="pt-4 border-t border-neutral-100 flex flex-wrap gap-2">
                    <a href={result.downloads.pdf} download className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium rounded-lg transition-colors">
                      <FileText className="w-4 h-4" /> PDF
                    </a>
                    <a href={result.downloads.docx} download className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium rounded-lg transition-colors">
                      <FileText className="w-4 h-4" /> DOCX
                    </a>
                    <a href={result.downloads.txt} download className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-medium rounded-lg transition-colors">
                      <FileText className="w-4 h-4" /> TXT
                    </a>
                    <a href={result.downloads.zip} download className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium rounded-lg transition-colors ml-auto">
                      <Download className="w-4 h-4" /> All Formats (ZIP)
                    </a>
                  </div>
                </div>
              </div>

              {/* Chapters Preview */}
              <div className="bg-neutral-50 border-t border-neutral-100 p-8 sm:p-10">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-6">Table of Contents</h3>
                <div className="space-y-4">
                  {result.chapters.map((ch) => (
                    <div key={ch.number} className="flex gap-4 group">
                      <span className="text-neutral-400 font-mono text-sm mt-0.5 w-6">{ch.number}.</span>
                      <div>
                        <h4 className="font-medium text-neutral-900 group-hover:text-indigo-600 transition-colors">{ch.title}</h4>
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {ch.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
