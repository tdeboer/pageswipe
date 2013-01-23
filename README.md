<h1>Pageswipe</h1>
<h2>Jquery UI widget</h2>

The pages are as wide as the viewport and are underneath next to eachother.
Swipe horizontally through pages.
One navigation with all the pages, updating when sliding.
Load pages asynchronous.

<h3>How to use</h3>
- include jquery.ui.pageswipe.js
- include or import pageswipe.css or _pageswipe.scss
- call the plugin on the container of the pages. i.e. $('.wrapper').swipeable(); 

<h3>Todo</h3>
- modernizr checks
- navigate directly to project by hash in url
- prevent touchmove code queueing up by canceling actions or regulating events firing
- optimize for slower android devices
- explore posibility for hardware acceleration
- navigate directly to project by hash in url
- write documentation