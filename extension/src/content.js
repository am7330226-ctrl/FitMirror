function injectFitMirrorButton() {
  // Try to find the main product image
  let mainImage = null;
  
  // Amazon selectors
  const amazonImg = document.querySelector('#landingImage') || document.querySelector('#imgTagWrapperId img');
  if (amazonImg) mainImage = amazonImg;
  
  // Flipkart selectors
  const flipkartImg = document.querySelector('img._396cs4') || document.querySelector('.xXIKqw'); // Class names change often, might need broader selection
  if (!mainImage && flipkartImg) mainImage = flipkartImg;

  if (mainImage && !document.getElementById('fitmirror-tryon-btn')) {
    const btn = document.createElement('button');
    btn.id = 'fitmirror-tryon-btn';
    btn.innerHTML = '⚡ Try On with FitMirror';
    btn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 9999px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.2s;
    `;
    
    // Add hover effect
    btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      let productImgUrl = mainImage.src;
      // Amazon often has hi-res versions in data-old-hires
      if (mainImage.getAttribute('data-old-hires')) {
        productImgUrl = mainImage.getAttribute('data-old-hires');
      }
      
      chrome.runtime.sendMessage({ action: "SELECT_PRODUCT", imageUrl: productImgUrl });
    };

    // Needs to be positioned relative to the image wrapper
    if (mainImage.parentElement) {
      mainImage.parentElement.style.position = 'relative';
      mainImage.parentElement.appendChild(btn);
    }
  }

  // Also add a globally visible floating action button in the bottom right
  if (!document.getElementById('fitmirror-floating-btn')) {
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'fitmirror-floating-btn';
    floatingBtn.innerHTML = '👕 FitMirror Try-On';
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #2563eb, #9333ea);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    floatingBtn.onmouseenter = () => floatingBtn.style.transform = 'translateY(-2px) scale(1.05)';
    floatingBtn.onmouseleave = () => floatingBtn.style.transform = 'translateY(0) scale(1)';

    floatingBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      let productImgUrl = mainImage ? mainImage.src : '';
      if (mainImage && mainImage.getAttribute('data-old-hires')) {
        productImgUrl = mainImage.getAttribute('data-old-hires');
      }
      chrome.runtime.sendMessage({ action: "SELECT_PRODUCT", imageUrl: productImgUrl });
    };

    document.body.appendChild(floatingBtn);
  }
}

// Run on load
window.addEventListener('load', () => {
  setTimeout(injectFitMirrorButton, 1000); // Small delay to let images load
});

// Run periodically to catch dynamic updates
setInterval(injectFitMirrorButton, 2000);
