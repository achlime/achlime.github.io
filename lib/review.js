(function() {

var reviewStates = ['none', 'reviewed', 'todo'];

function qsa(context, query) {
    if(typeof query === 'undefined') {
        query = context;
        context = document;
    }
    // Helper function to do a .querySelectorAll and return an actual array
    var nodes = context.querySelectorAll(query);
    return Array.prototype.slice.call(nodes);
}

function getTopicState(topicId) {
    var state = window.localStorage.getItem('review:topic:' + topicId);
    if(state) {
        return state
    } else {
        return 'none';
    }
}

function setTopicState(topicId, state) {
    var key = 'review:topic:' + topicId;
    if(state == 'none') {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, state);
    }
}

function updateBodyClasses(state) {
    var cl = document.querySelector('body').classList;
    reviewStates.forEach(function(s) { cl.remove('review--' + s) });
    cl.add('review--' + state);
}

function updateLinkClasses(link) {
    var cl = link.classList;
    var topicId = urlId(link);
    if(topicId) {
        reviewStates.forEach(function(s) { cl.remove('review-link--' + s) });
        cl.add('review-link--' + getTopicState(topicId));
    }
}

function urlId(thing) {
    if(typeof thing === 'undefined') {
        thing = window.location;
    }

    var base = window.localStorage.getItem('review:base-url');
    var url = thing.href;

    if(typeof url === 'string' && url.indexOf(base) === 0) {
        return url.substr(base.length);
    }
}


function stripAnchor(url) {
    var anchorIndex = url.indexOf('#');
    if(anchorIndex != -1) {
        return url.substr(0, anchorIndex);
    } else {
        return url;
    }
}


// Review page specific code
document.addEventListener('DOMContentLoaded', function() {
    var body = document.querySelector('body');

    if(window.localStorage.getItem('review:active')) {
        body.classList.add('review');
    }

    qsa('.review-activate').forEach(function(el) {
        el.addEventListener('click', function(event) {
            window.localStorage.setItem('review:active', 'true');
            window.localStorage.setItem('review:base-url', window.location.href.replace('/review.html', ''));
            window.location.reload(false);
            event.preventDefault();
        });
    });

    qsa('.review-deactivate').forEach(function(el) {
        el.addEventListener('click', function(event) {
            // We wipe the review data if there are no flagged topics (checks by
            // the key count part; which needs to be kept in sync with the
            // number of "bookkeeping" keys declared in the previous handler),
            // and a confirmation from the user.
            if(window.localStorage.length == 2 || window.confirm('Deactivate Review mode and clear all review data?')) {
                window.localStorage.clear();
                body.classList.remove('review');
            }
            event.preventDefault();
        });
    });

    // update index
    qsa('.index--review .index-line').forEach(function(entry) {
        var topicId = urlId(entry.querySelector('a'));
        if(getTopicState(topicId) == 'none') {
            entry.parentNode.removeChild(entry);
        }
    });
});

// Active review mode code
document.addEventListener('DOMContentLoaded', function() {
    // Check review mode and abort if not active
    var reviewMode = window.localStorage.getItem('review:active');
    if(!reviewMode) {
        return;
    }

    var body = document.querySelector('body');
    body.classList.add('review');

    qsa('a').forEach(updateLinkClasses);

    // Check if this page is a major topic page
    if(document.querySelector('main > .topic')) {
        var topicId = urlId();
        topicId = stripAnchor(topicId);
        var reviewActions = document.createElement('span');

        function updateUI() {
            // Clear out the actions container
            while(reviewActions.firstChild) {
                reviewActions.removeChild(reviewActions.firstChild);
            }

            // Update all links
            qsa('a').forEach(updateLinkClasses);

            // Update body state
            var currentState = getTopicState(topicId);
            updateBodyClasses(currentState);

            reviewActions.appendChild(document.createTextNode(' ('));

            var first = true;
            reviewStates.forEach(function(newState) {
                if(newState == currentState) {
                    return;
                }
                var action = document.createElement('a');
                action.setAttribute('href', '#');
                action.textContent = {
                    'none': 'Unmark',
                    'reviewed': 'Mark as reviewed',
                    'todo': 'Mark as todo'
                }[newState];
                action.addEventListener('click', function(event) {
                    setTopicState(topicId, newState);
                    updateUI();
                    event.preventDefault();
                });
                if(!first) {
                    reviewActions.appendChild(document.createTextNode(', '));
                }
                reviewActions.appendChild(action);
                first = false;
            })

            reviewActions.appendChild(document.createTextNode(')'));
        }

        updateUI();

        var footer = document.querySelector('footer');
        footer.appendChild(reviewActions);
    }
});

})();
