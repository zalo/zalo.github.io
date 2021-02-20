// Upon pressing the button
var currentText = "";
function AddTextToUrl(){
  
  // Get the Text Input
  let textInput = document.getElementById("searchText");

  // If there is text in the bar
  if (textInput.value != "") {
    // Log that we received text to the page
    LogToPage("Text Input Value: " + textInput.value);
    currentText += textInput.value + "+";

    // Encodes the Accumulated Text to a URL friendly format 
    let URLFriendlyString = encodeURI(currentText.slice(0, -1));

    // Sets the URL of the window
    window.history.replaceState({},
      "HTML URL Manipulation Example",
      "?input=" + URLFriendlyString);

    // Clear the Text Input
    textInput.value = "";
  } else {
    // Alert that the text box is empty
    LogToPage("Text Box is Empty!");
  }

}

// Logs diagnostic info to the page
function LogToPage(str) {
  let info = document.getElementById("info");
  info.innerText = JSON.stringify(str) + "\n" + info.innerText;
}
