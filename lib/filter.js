document.addEventListener('DOMContentLoaded', function() {
    // Grab component elements
    var searchComponent = document.querySelector('.search');
    if(!searchComponent) {
        return;
    }
    var searchBox = document.getElementById('search-box');
    var clearButtons = qsa(document, '#search-box-clear, .search-box-clear');
    var emptyState = document.getElementById('search-empty-results');

    // The static item index and sections table used to do lookups on items that
    // need filtering. This prevents us from having to hit the DOM every time.
    var index = [];
    var sections = [];

    function qsa(context, query) {
        // Helper function to do a .querySelectorAll and return an actual array
        var nodes = context.querySelectorAll(query);
        return Array.prototype.slice.call(nodes);
    }

    function normalizeText(text) {
        // Helper function to normalize search text and query text to a common
        // domain
        return text
            .trim()  // drop any spurious pre- and postfixed whitespace
            .toLowerCase()  // poor man's casefold
            .replace(/[“”‘’]/g, function(m) {  // Replace typgraphically correct quotes with input-able quotes
                return { '“': '\"', '”': '\"', '‘': '\'', '’': '\''}[m]
            });
    }

    // Construct the index by finding all data items
    qsa(document, searchBox.dataset.items).forEach(function(item) {
        // The values that can be used to find this data item
        var values = [];

        // Grab the values from the css selector in 'data-elements'
        if(searchBox.dataset.elements) {
            qsa(item, searchBox.dataset.elements).forEach(function(value) {
                values.push(normalizeText(value.innerText));
            });
        }

        // Grab the values from data-* attributes named in 'data-attributes'
        if(searchBox.dataset.attributes) {
            searchBox.dataset.attributes.split(/\s*,\s*/).forEach(function(key) {
                var value = item.dataset[key];
                if(value) {
                    values.push(normalizeText(value));
                }
            });
        }

        // Create index entry
        var entry = {
            // Bookkeeping properties
            element: item,  // The DOM node
            matched: true,  // Whether this item is currently matched

            // Matching properties
            values: values,  // The values we query against
            sections: [],  // The sections that this item is part of (filled later)
        };
        // We add the index entry number to the DOM node
        entry.element.dataset.index = index.length;
        // And add the entry to the index
        index.push(entry);
    });

    // Tries to determine the title of a section
    function findSectionTitle(section) {
        // Grab the first header for this section
        var header = qsa(section, 'h2, h3, h4');
        if(header.length) {
            var el = header[0];
            var explicit = qsa(el, '.section-title');
            if(explicit.length) {
                el = explicit[0];
            }
            return el.innerText;
        }
        return undefined;
    }

    // Construct the sections table by walking through all sections and finding
    // the data items contained within the section.
    qsa(document, searchBox.dataset.sections).forEach(function(section) {
        var list = [];
        var title = findSectionTitle(section);
        qsa(section, searchBox.dataset.items).forEach(function(item) {
            var entry = index[item.dataset.index];
            list.push(entry);
            // Update section list for entry
            if(title) {
                entry.sections.push(normalizeText(title));
            }
        });
        sections.push({element: section, items: list});
    });

    function updateVisibility(query) {
        // Updates the `matched` state of index items and adds the
        // `filtered--hidden` class to those data items not matching the query.

        // Normalize the query
        var query = normalizeText(query);
        var queryParts = query.split(/\s+/);

        // Update the index entries and their DOM node
        index.forEach(function(entry) {
            // put all searchable values together
            var searchedValues = [].concat(entry.values, entry.sections);
            entry.matched = queryParts.every(function(q) {
                return searchedValues.some(function(v) {
                    return v.indexOf(q) !== -1;
                });
            });
            if(entry.matched) {
                entry.element.classList.remove('filtered--hidden');
            } else {
                entry.element.classList.add('filtered--hidden');
            }
        });

        // Update the visibility of sections (based on whether all their items)
        // are hidden
        sections.forEach(function(section) {
            if(section.items.some(function(item) { return item.matched })) {
                section.element.classList.remove('filtered--hidden');
            } else {
                section.element.classList.add('filtered--hidden');
            }
        });

        // Update empty results visibility
        if(emptyState && index.length > 0){
            if(index.some(function(item){ return item.matched })) {
                emptyState.classList.remove('empty-results--shown');
            } else {
                emptyState.classList.add('empty-results--shown');
            }
        }
    }

    // Update the index each input event
    searchBox.addEventListener('input', function(event) {
        updateVisibility(searchBox.value);
        event.preventDefault();
    });
    // Special handling for ease-of-use keys
    searchBox.addEventListener('keypress', function(event) {
        if(event.key == 'Escape') {
            // Clear out and de-focus the search box
            searchBox.value = '';
            updateVisibility(searchBox.value);
            searchBox.blur();
            event.preventDefault();
        } else if(event.key == 'Enter') {
            // If we have a single result, we try to follow the first link in
            // the item when the user hits enter
            var found = index.filter(function(e) { return e.matched });
            if(found.length == 1) {
                // Grab links from the item's element, if any
                var links = qsa(found[0].element, 'a[href]');
                if(links.length > 0) {
                    // follow the first link we see
                    event.preventDefault();
                    links[0].click();
                }
            }
        }
    });

    function updateComponent(focus) {
        // Updates the search component state

        // Always clear out active state first
        searchComponent.classList.remove('search--active');

        // Set active state based on focus and whether we have a query
        if(focus || searchBox.value.trim() != '') {
            searchComponent.classList.add('search--active');
        }
    }

    // Focus and blur handlers to update search component
    searchBox.addEventListener('focus', function() {
        updateComponent(true);
    });
    searchBox.addEventListener('blur', function() {
        updateComponent(false);
    });

    // Add handlers for clicking the 'Clear' action
    clearButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            searchBox.value = '';
            updateVisibility(searchBox.value);
            updateComponent(false);
            e.preventDefault();
            return false;
        });
    });

    // Kick off search for the value in the search box (if a value got in there
    // somehow)
    updateVisibility(searchBox.value);
});
