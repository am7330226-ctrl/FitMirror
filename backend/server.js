import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, handle_file } from "@gradio/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Chrome Extension origins
app.use(cors({
  origin: '*' 
}));

// Accept large base64 image data payloads
app.use(express.json({ limit: '50mb' }));

app.post('/api/try-on', async (req, res) => {
  try {
    const { selfie, garmentUrl } = req.body;
    
    if (!selfie || !garmentUrl) {
      return res.status(400).json({ error: 'Selfie and garment URL are required.' });
    }

    console.log('Connecting to free Hugging Face IDM-VTON Space...');
    const hfToken = process.env.HF_TOKEN;
    const client = await Client.connect("yisol/IDM-VTON", hfToken ? { hf_token: hfToken } : {});
    
    // Convert data URIs to Blobs, or use handle_file for remote URLs
    const selfieInput = selfie.startsWith('data:') ? await (await fetch(selfie)).blob() : handle_file(selfie);
    const garmentInput = garmentUrl.startsWith('data:') ? await (await fetch(garmentUrl)).blob() : handle_file(garmentUrl);

    console.log('Generating Try-On (this may take 30-60s on the free queue)...');
    
    const output = await client.predict("/tryon", [
      { background: selfieInput, layers: [], composite: null }, // Human image dict
      garmentInput, // Garment image
      "a clothing item from an e-commerce platform", // garment_des
      true, // is_checked (use auto-mask)
      false, // is_checked_crop
      30, // denoise_steps
      42 // seed
    ]);
    
    // Gradio returns data array: [ { url: 'result.png' }, { url: 'mask.png' } ]
    const resultUrl = output.data[0]?.url || output.data[0];
    
    console.log('Successfully generated Try-On!');
    return res.status(200).json({ success: true, resultUrl });
  } catch (error) {
    console.error('Hugging Face Gradio Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during try-on generation.' });
  }
});

app.listen(PORT, () => {
  console.log(`FitMirror backend running on port ${PORT}`);
});
