document.getElementById('about-link').addEventListener('click', function () {
    var mainSection = document.getElementById('main-section');
    var aboutMe = document.getElementById('about-me');
  var navLinks = document.getElementsByClassName('nav-link');
    var logo = document.querySelector('.logo');
    var navigation = document.querySelector('.navigation');
  
    mainSection.style.opacity = '0'; // fade out the main section
    mainSection.style.pointerEvents = 'none'; // disable pointer events
  
    // Add fade-out class to logo and navigation
    logo.classList.add('fade-out');
    navigation.classList.add('fade-out');
  
    // Hide all nav links
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].style.opacity = '0';
      navLinks[i].style.pointerEvents = 'none'; // disable pointer events
    }

    // Fetch the Markdown file
    fetch('https://raw.githubusercontent.com/roshbhatia/roshbhatia/main/README.md')
      .then(response => response.text())
      .then(markdown => {
        // Extract the content within the <body> tags
        var bodyContent = extractBodyContent(markdown);
  
        // Convert Markdown within the body to plain text
        var plainText = markdownToPlainText(bodyContent);
  
        // Insert the plain text into the "About Me" section
        aboutMe.innerText = plainText;
  
        // Add fade-in class to the "About Me" section
        aboutMe.classList.remove('hidden');
        aboutMe.classList.add('fade-in');
      });
  
    // Listen for transition end event
    mainSection.addEventListener('transitionend', function () {
      mainSection.style.display = 'none'; // hide the main section
    }, { once: true });
  });
  
  // Function to extract content within the <body> tags
  function extractBodyContent(markdown) {
    var bodyStartIndex = markdown.indexOf('<body>') + '<body>'.length;
    var bodyEndIndex = markdown.indexOf('</body>');
    return markdown.slice(bodyStartIndex, bodyEndIndex);
  }
  
  // Function to convert Markdown to plain text
  function markdownToPlainText(markdown) {
    // Remove Markdown syntax and tags using regular expressions
    var plainText = markdown.replace(/[\*_~#\[\]!\-<>]/g, '');
  
    // Trim leading and trailing spaces
    plainText = plainText.trim();
  
    return plainText;
  }
  