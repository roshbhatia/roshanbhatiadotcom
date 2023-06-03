document.getElementById('about-link').addEventListener('click', function () {
    var logoSection = document.getElementById('logo-section');
    var aboutMe = document.getElementById('about-me');
    var navLinks = document.getElementsByClassName('nav-link');

    logoSection.style.transform = 'translateX(-50%)'; // move the logo section to the left
    logoSection.style.transition = 'transform 2s'; // transition over 2 second

    setTimeout(function () {
        aboutMe.style.display = 'block'; // display the about-me section
        aboutMe.classList.add('fade-in'); // apply the fade-in animation
    }, 1000); // wait for the logo section animation to finish before showing the about-me section

    // Hide all nav links
    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].style.display = 'none';
    }

    // Hide the about-link too
    document.getElementById('about-link').style.display = 'none';
});
