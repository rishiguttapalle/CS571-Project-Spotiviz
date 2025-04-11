document.addEventListener("DOMContentLoaded", function () {
    // Function to adjust map iframe size
    function adjustMapSize() {
        const content = document.querySelector('.content');
        const iframe = document.getElementById('map-iframe');
        
        if (iframe && content) {
            // Ensure the iframe properly fits the container
            iframe.style.width = '100%';
            iframe.style.height = '100%';
        }
    }
    
    // Run on page load
    adjustMapSize();
    
    // Run when window is resized
    window.addEventListener('resize', adjustMapSize);
    
    // Highlight the active button in the sidebar
    function highlightActiveButton() {
        const path = window.location.pathname;
        const buttons = document.querySelectorAll('.sidebar button');
        
        buttons.forEach(button => {
            button.classList.remove('active');
        });

        if (path.includes('index.html') || path.endsWith('/') || path.includes('overview.html')) {
            // Highlight Overview button for both home page and overview page
            buttons[0].classList.add('active');
        } else if (path.includes('music_analytics.html')) {
            buttons[1].classList.add('active');
        } else if (path.includes('kpi.html')) {
            buttons[2].classList.add('active');
        } else if (path.includes('settings.html')) {
            buttons[3].classList.add('active');
        }
    }
    
    // Run button highlighting
    highlightActiveButton();

    

});