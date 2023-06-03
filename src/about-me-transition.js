document.getElementById('about-link').addEventListener('click', function () {
    var mainSection = document.getElementById('main-section');
    var aboutMe = document.getElementById('about-me');
    var navLinks = document.getElementsByClassName('nav-link');
    var footer = document.querySelector('footer');
    var logo = document.querySelector('.logo');
    var navigation = document.querySelector('.navigation');

    mainSection.style.opacity = '0'; // fade out the main section
    mainSection.style.pointerEvents = 'none'; // disable pointer events

    // Hide logo and navigation links with fade-out animation
    logo.classList.add('fade-out');
    navigation.classList.add('fade-out');

    // Hide all nav links
    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].style.opacity = '0';
        navLinks[i].style.pointerEvents = 'none'; // disable pointer events
    }

    // Hide footer with fade-out animation
    footer.style.opacity = '0';

    // Listen for transition end event
    mainSection.addEventListener('transitionend', function () {
        aboutMe.classList.remove('hidden'); // make the about-me section visible
        aboutMe.classList.add('fade-in'); // apply the fade-in animation
    }, { once: true });
});
