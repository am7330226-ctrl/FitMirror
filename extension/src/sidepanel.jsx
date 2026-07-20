import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import './index.css';

function App() {
  const [selfie, setSelfie] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [productTitle, setProductTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load stored selfie
    chrome.storage.local.get(['selfie', 'pendingProductImage', 'pendingProductTitle'], (result) => {
      if (result.selfie) setSelfie(result.selfie);
      if (result.pendingProductImage) {
        setProductImage(result.pendingProductImage);
        if (result.pendingProductTitle) setProductTitle(result.pendingProductTitle);
        // Clear pending once loaded
        chrome.storage.local.remove(['pendingProductImage', 'pendingProductTitle']);
      }
    });

    // Listen for real-time updates from background
    const messageListener = (request) => {
      if (request.action === "UPDATE_PRODUCT_IMAGE") {
        setProductImage(request.imageUrl);
        setProductTitle(request.productTitle);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleSelfieUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result;
        setSelfie(base64Str);
        chrome.storage.local.set({ selfie: base64Str });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selfie || !productImage) {
      setError("Please provide both a selfie and select a garment.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const response = await fetch('http://localhost:5000/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfie, garmentUrl: productImage, garment_des: productTitle })
      });

      const data = await response.json();
      if (data.success) {
        setResultImage(data.resultUrl);
      } else {
        setError(data.error || "Failed to generate try-on.");
      }
    } catch (err) {
      setError("Network error connecting to backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center gap-6 font-sans">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
        FitMirror
      </h1>

      {/* Selfie Section */}
      <div className="w-full max-w-sm">
        <h2 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <UploadCloud size={16} /> Your Photo
        </h2>
        <div 
          className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-slate-600 bg-slate-800/50 backdrop-blur-sm aspect-[3/4] flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {selfie ? (
            <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 text-sm flex flex-col items-center">
              <UploadCloud size={32} className="mb-2 opacity-50" />
              <span>Click to upload</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleSelfieUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Product Image Section */}
      <div className="w-full max-w-sm">
        <h2 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <ImageIcon size={16} /> Selected Garment
        </h2>
        <div className="rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700 aspect-square flex items-center justify-center p-2">
          {productImage ? (
            <img src={productImage} alt="Product" className="max-w-full max-h-full object-contain rounded" />
          ) : (
            <span className="text-slate-500 text-sm text-center">
              Navigate to a product page and click<br/>"⚡ Try On with FitMirror"
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-sm p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate Button */}
      <button 
        onClick={handleGenerate}
        disabled={loading || !selfie || !productImage}
        className="w-full max-w-sm py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg"
      >
        {loading ? (
          <span className="animate-pulse flex items-center gap-2">
            <Sparkles size={18} className="animate-spin" /> Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={18} /> Generate Try-On
          </span>
        )}
      </button>

      {/* Result Section */}
      {resultImage && (
        <div className="w-full max-w-sm mt-4">
          <h2 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <Sparkles size={16} /> Result
          </h2>
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <img src={resultImage} alt="Try-On Result" className="w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
