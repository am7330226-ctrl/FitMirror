import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, Download, Share2, History, User, Shirt, Plus } from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('tryon'); // tryon, wardrobe, history
  
  // Try-On State
  const [selfie, setSelfie] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [productTitle, setProductTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const wardrobeInputRef = useRef(null);

  // Wardrobe & History State
  const [savedModels, setSavedModels] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load stored state
    chrome.storage.local.get(['selfie', 'pendingProductImage', 'pendingProductTitle', 'savedModels', 'history'], (result) => {
      if (result.selfie) setSelfie(result.selfie);
      if (result.savedModels) setSavedModels(result.savedModels);
      if (result.history) setHistory(result.history);
      
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
        setActiveTab('tryon');
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
        
        // Also save to wardrobe if it's new
        setSavedModels(prev => {
          const newModels = [base64Str, ...prev.filter(m => m !== base64Str)].slice(0, 10);
          chrome.storage.local.set({ savedModels: newModels });
          return newModels;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWardrobeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result;
        setSavedModels(prev => {
          const newModels = [base64Str, ...prev].slice(0, 10);
          chrome.storage.local.set({ savedModels: newModels });
          return newModels;
        });
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
        // Save to history
        const historyItem = {
          id: Date.now(),
          resultUrl: data.resultUrl,
          garmentUrl: productImage,
          productTitle: productTitle || 'Generated Try-On',
          date: new Date().toLocaleDateString()
        };
        setHistory(prev => {
          const newHistory = [historyItem, ...prev].slice(0, 20);
          chrome.storage.local.set({ history: newHistory });
          return newHistory;
        });
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

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || 'fitmirror-tryon.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const shareImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'fitmirror-tryon.png', { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My FitMirror Try-On',
          text: 'Check out this outfit I tried on with FitMirror!'
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        alert('Image copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-800 p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          FitMirror
        </h1>
        
        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-lg p-1 mt-3">
          <button 
            onClick={() => setActiveTab('tryon')} 
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'tryon' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shirt size={14} /> Try-On
          </button>
          <button 
            onClick={() => setActiveTab('wardrobe')} 
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'wardrobe' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <User size={14} /> Wardrobe
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <History size={14} /> History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center gap-6">
        
        {/* TAB: TRY-ON */}
        {activeTab === 'tryon' && (
          <>
            <div className="w-full max-w-sm flex gap-4">
              {/* Selfie Section */}
              <div className="flex-1">
                <h2 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1"><User size={14} /> You</span>
                </h2>
                <div 
                  className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-600 bg-slate-800 aspect-[3/4] flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selfie ? (
                    <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud size={24} className="text-slate-500" />
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleSelfieUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              {/* Product Section */}
              <div className="flex-1">
                <h2 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Shirt size={14} /> Garment
                </h2>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-[3/4] flex items-center justify-center p-1">
                  {productImage ? (
                    <img src={productImage} alt="Product" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="text-slate-500 text-[10px] text-center px-2">
                      Click "Try On" on a product page
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="w-full max-w-sm p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={loading || !selfie || !productImage}
              className="w-full max-w-sm py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-400 shadow-lg"
            >
              {loading ? <><Sparkles size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate Try-On</>}
            </button>

            {resultImage && (
              <div className="w-full max-w-sm mt-2 flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                  <img src={resultImage} alt="Try-On Result" className="w-full h-auto" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadImage(resultImage)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Download size={16} /> Download
                  </button>
                  <button onClick={() => shareImage(resultImage)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: WARDROBE */}
        {activeTab === 'wardrobe' && (
          <div className="w-full max-w-sm">
            <button 
              onClick={() => wardrobeInputRef.current?.click()}
              className="w-full py-3 mb-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border-dashed"
            >
              <Plus size={16} /> Add New Model
            </button>
            <input type="file" ref={wardrobeInputRef} onChange={handleWardrobeUpload} accept="image/*" className="hidden" />

            <div className="grid grid-cols-2 gap-4">
              {savedModels.map((model, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setSelfie(model);
                    chrome.storage.local.set({ selfie: model });
                    setActiveTab('tryon');
                  }}
                  className={`relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer border-2 transition-all ${selfie === model ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-transparent hover:border-slate-500'}`}
                >
                  <img src={model} className="w-full h-full object-cover" />
                  {selfie === model && (
                    <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1 shadow-lg">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {savedModels.length === 0 && (
                <div className="col-span-2 text-center text-slate-500 py-8 text-sm">
                  Your wardrobe is empty. Upload some photos!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div className="w-full max-w-sm flex flex-col gap-6">
            {history.map((item) => (
              <div key={item.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
                <div className="relative">
                  <img src={item.resultUrl} className="w-full h-auto" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg">
                    <img src={item.garmentUrl} className="w-10 h-10 object-contain rounded" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-1">{item.date}</p>
                  <p className="text-sm font-medium line-clamp-1 mb-3">{item.productTitle}</p>
                  <div className="flex gap-2">
                    <button onClick={() => downloadImage(item.resultUrl)} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-xs flex justify-center items-center gap-1.5">
                      <Download size={14} /> Download
                    </button>
                    <button onClick={() => shareImage(item.resultUrl)} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-xs flex justify-center items-center gap-1.5">
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm">
                No try-ons yet. Go generate some!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
