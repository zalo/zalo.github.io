fetch('https://zalo.github.io/assets/js/TextColoring/test_colors.json').then(function (response) {
    response.json().then(function (result) {
        var words = document.body.textContent.split(" ");
        var doneWords = {};
        var curWord = "";
        for (var i = 0; i < words.length; i++) {
            curWord = words[i].replace(/[^A-Za-z0-9\s]/g,"").trim().toLowerCase();
            if ( (curWord.length > 0  ) &&
                !(curWord in doneWords) && 
                 (curWord in result   ))
            {
                findAndReplaceDOMText(document.body, {
                    find: new RegExp("\\b(\\w*"+curWord+"\\w*)\\b", "gi"),
                    replace: function (portion, match) {
                        var span = document.createElement("SPAN");
                        span.style.color = result[curWord];
                        span.innerText = portion.text;
                        return span;
                    }
                });
            }
            doneWords[curWord] = true;
        }
    });
});
