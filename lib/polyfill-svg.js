document.addEventListener('DOMContentLoaded', function() {
    // If we are any kind of safari, we hit it with a javascript-powerd
    // link handler
    var webkitUA = /\bAppleWebKit\/(\d+)\b/;
    polyfill_links = (navigator.userAgent.match(webkitUA) || [])[1] > 1;

    if(polyfill_links) {
        var all = document.querySelectorAll('svg a');
        for(var i = 0; i < all.length;  i++) {
            all[i].addEventListener('click', function(e) {
                location.href = this.getAttribute('xlink:href');
                e.preventDefault();
            });
        }
    }
});
