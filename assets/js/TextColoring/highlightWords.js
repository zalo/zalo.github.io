fetch('https://zalo.github.io/assets/js/TextColoring/test_colors.json').then(function (response) {
    response.json().then(function (result) {
        var words = document.body.textContent.split(" ");
        var doneWords = {};
        var curWord = "";
        for (var i = 0; i < words.length; i++) {
            curWord = words[i].trim().toLowerCase();
            if (!(curWord in doneWords) && 
                 (curWord in result)) 
            {
                findAndReplaceDOMText(document.body, {
                    find: words[i] + " ",
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
