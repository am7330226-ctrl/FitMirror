function extractProductImage() {
  let img = document.querySelector('#landingImage') || 
            document.querySelector('#imgTagWrapperId img') ||
            document.querySelector('img._396cs4') || 
            document.querySelector('.v2VpsC img') || 
            document.querySelector('img._2r_T1I');
  return img ? img.src : null;
}

function injectTryOnButton() {
  if (document.getElementById('fitmirror-tryon-btn')) return;

  const targetImg = document.querySelector('#landingImage') || 
                    document.querySelector('#imgTagWrapperId img') || 
                    document.querySelector('.v2VpsC img') || 
                    document.querySelector('img._2r_T1I');

  if (targetImg && targetImg.parentElement) {
    const btn = document.createElement('div');
    btn.id = 'fitmirror-tryon-btn';
    btn.innerHTML = '⚡ Try On in FitMirror';
    btn.style.position = 'absolute';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.style.backgroundColor = '#6366f1';
    btn.style.color = 'white';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '20px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';
    btn.style.fontWeight = 'bold';
    btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    btn.style.fontFamily = 'sans-serif';
    btn.style.fontSize = '14px';

    const parentPos = window.getComputedStyle(targetImg.parentElement).position;
    if (parentPos === 'static') {
      targetImg.parentElement.style.position = 'relative';
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const imageUrl = extractProductImage();
      if (imageUrl) {
        chrome.runtime.sendMessage({ action: "SELECT_PRODUCT", imageUrl });
        btn.innerHTML = '✅ Selected!';
        setTimeout(() => { btn.innerHTML = '⚡ Try On in FitMirror'; }, 2000);
      } else {
        alert("FitMirror: Could not extract product image.");
      }
    });

    targetImg.parentElement.appendChild(btn);
  }
}

const observer = new MutationObserver(() => {
  injectTryOnButton();
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('load', injectTryOnButton);
