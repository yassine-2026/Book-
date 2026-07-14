const express = require('express');
const app = express();

app.get('*', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Python App Ready</title>
            <style>
                body { background: #0a0a0a; color: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                h1 { color: #8b5cf6; }
                p { color: #888; max-width: 500px; line-height: 1.5; }
            </style>
        </head>
        <body>
            <h1>🐍 Python App Ready for Render</h1>
            <p>Your Python files (app.py, requirements.txt, render.yaml, templates/index.html) have been generated correctly.</p>
            <p>Since AI Studio preview runs Node.js natively, this is a placeholder page. To deploy to Render:</p>
            <p style="text-align: left; background: #111; padding: 20px; border-radius: 10px; border: 1px solid #333; margin-top: 20px;">
                1. Push this project to GitHub<br>
                2. Connect your repo in Render<br>
                3. The <b>render.yaml</b> file will automatically configure the Python environment!<br>
            </p>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dummy Node server listening on port ${PORT}`);
});
