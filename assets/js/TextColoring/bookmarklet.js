
// Add this as your bookmarklet:
// javascript:{var s=document.createElement("script");s.src="https://zalo.github.io/assets/js/TextColoring/bookmarklet.js",document.body.appendChild(s);};void(0);

// Execute on a delay in-case the body hasn't been constructed yet...
setTimeout(function() {
    var i, s, ss = [
      'https://cdnjs.cloudflare.com/ajax/libs/findAndReplaceDOMText/0.4.6/findAndReplaceDOMText.min.js', 
      'https://zalo.github.io/assets/js/TextColoring/highlightWords.js'];
    for (i = 0; i != ss.length; i++) {
      s = document.createElement('script');
      s.src = ss[i];
      document.body.appendChild(s);
    }
  }, 100);
