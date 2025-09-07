# <img alt="Logo" src="https://github.com/kevinneuman/openai-chat/blob/main/public/icons/logo16.png" style="width: 16px; height: auto;"> openai-chat

A cost-effective, mobile-first chat UI, designed with OpenAI API, Next.js, and Tailwind CSS, uses credits for a cheaper alternative to costly subscriptions.

## Features

✨ **Image Support**: Upload and analyze images with GPT-5

- 📎 Drag & drop images directly into the chat
- 📋 Paste images from clipboard (Ctrl/Cmd + V)
- 🖼️ Support for multiple image formats (PNG, JPG, GIF, WebP, etc.)
- 🔍 Ask questions about uploaded images
- 👁️ View full-size images by clicking on them

**Model**: GPT-5 - The best AI model for all tasks

## Getting Started

First, create a

```
.env.local
```

file in the root and add [your API key](https://platform.openai.com/account/api-keys) to it

```
OPENAI_API_KEY=<key>
```

_**Note:**_ API key can also be provided from UI but it's much less secure

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Image Upload Instructions

1. **GPT-5 Ready**: Your app uses GPT-5 which supports image analysis
2. **Upload Images**:
   - Click the image upload area in the chat input
   - Drag and drop images directly into the upload area
   - Copy and paste images from your clipboard (Ctrl/Cmd + V)
3. **Ask Questions**: Type your question about the uploaded image(s) and send
4. **View Images**: Click on any image in the chat to view it full-size

**Supported Image Formats**: PNG, JPEG, GIF, WebP
**File Size Limit**: 20MB per image
