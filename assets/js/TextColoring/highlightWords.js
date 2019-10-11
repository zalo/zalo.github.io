fetch('https://zalo.github.io/assets/js/TextColoring/test_colors.json').then(function (response) {
    response.json().then(function (result) {
        var words = document.body.textContent.split(" ");
        var doneWords = {};
        for (var i = 0; i < words.length; i++) {
            var curWord = words[i].trim().toLowerCase();
            if (!(curWord in doneWords) && 
                 (curWord in result)) 
            {
                findAndReplaceDOMText(document.body, {
                    find: " " + words[i] + " ",
                    replace: function (portion, match) {
                        var span = document.createElement("SPAN");
                        span.style.color = result[words[i]];
                        span.innerText = portion.text;
                        return span;
                    }
                });
            }
            doneWords[curWord] = true;
        }
    });
});
