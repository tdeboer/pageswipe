define(['jqui','events','transit'], function() {

	/*
	todo:
	
	*/
	
	$(function() {
	
		var windowWidth,
			windowHeight,
			padding,
			headerHeight,
			that,
			scr = false,
			slideAnimating = false,
			current, // current page
			next, // next page
			prev, // previous page
			nav;
			
	
		$.widget( "custom.swipeable", {
			swipeStart: {},
			swipeStop: {},
			pos: null,
			preventScroll: false,
			
			// default options
			options: {
				selector: '.page',
				navSelector: 'nav',
				scrollSupressionThreshold: 20, // More than this horizontal displacement, and we will suppress scrolling.
				swipeThreshold: 100,  // Swipe horizontal displacement must be more than this to go to next page
				verticalDistanceThreshold: 60, // Swipe vertical displacement must be less than this.
				sliding: false,
				swipeBoundry: 40, // Stop the swipe at this point if there is nothing to swipe to
				disableSwipe: false,
				scrolling: false,
				timer: null
			},
			

			// the constructor
			_create: function() {
				var $el = this.element;
				that = this;
				current = $el.children('.page').first();
				next = $el.children('.page').first().next('.page');
				prev = $el.children('.page').first().prev('.page');
				nav = $(this.options.navSelector);
				headerHeight = $('.header').height() + $('nav').height() + 2;
				
				// load content for second page
				var nextFile = next.attr('data-url');
				next.load(nextFile, function() {
					$(this).data('content', true).show();
					that.windowResized();
				});
				
				
				// setup all pages
				$el.children('.page').each(function() {
					var $page = $(this);
					
					if ($page.is(':empty')) {
						$page.data('content', false);
					}
					
					// add navigation
					var navEl = $('<li><a></a></li>');
					navEl.find('a').attr({
						href: '#'+$page.attr('id'),
						alt: $page.attr('id')
					});
					nav.append(navEl);
					
				});
				
				// some more setup for all pages except the first
				$el.children('.page:gt(0)').each(function() {
					$(this).css('top', headerHeight);
				});
				
				// setup first page
				current.addClass('current').data('content', true);
				nav.find('li:first').addClass('selected');
				
				// bind all listeners
				this._on({
					touchstart: "_touchStart",
					touchmove: "_touchMove",
					touchend: "_touchEnd",
					scrollstart: "_scrollStart"
				});

				$(window).bind({
					scrollstop: this._scrollStop,
					resize: this.windowResized
				});
			},
			
 
			_touchStart: function(event) {
				if (!slideAnimating) {
					this.curPos = parseInt( this.element.css('x') );
					
					// set starting point of the potential swipe
					var data = event.originalEvent.touches[0];
					
					this.swipeStart = { coords: [data.pageX, data.pageY] };
				}
			},
			
			
			_touchMove: function(event) {
				var $el = this.element;
				var data = event.originalEvent.touches[0];
				var start = this.swipeStart;
				var currentTouch = { coords: [data.pageX, data.pageY] };
				var diffX = start.coords[0] - currentTouch.coords[0];
				var diffY = start.coords[1] - currentTouch.coords[1];
				//$('.debug').text('');
				
				if (!slideAnimating) { // check if a page is animating
					console.log('slideanimating:false');
					if (!scr) {console.log('not scrolling');
						if( (Math.abs(diffX) > this.options.scrollSupressionThreshold && Math.abs(diffY) < this.options.verticalDistanceThreshold) || this.options.sliding ) {
							console.log('swiping');
							event.preventDefault();
							diffX = start.coords[0] - currentTouch.coords[0];
							
							var newPos = this.curPos - diffX;
							current.css({ x: newPos });
							
							if (!this.options.sliding) { // todo: what if user slides first left and then right in one movement?
								if (diffX > this.options.scrollSupressionThreshold/2) {
									next.show();
									prev.hide();
								} else if ( diffX < ((this.options.scrollSupressionThreshold/2)*-1) ){
									prev.show();
									next.hide();
								}
							}
							
							this.options.sliding = true;
							this.swipeStop = currentTouch;
						} else if (Math.abs(diffY) >= 5) {console.log('scrolling');
							scr = true;
						}
					}
					
				} else {
					console.log('slideanimating:true');
					// prevent scroll because a page is animating
					event.preventDefault();
					
				}
				
				
				
			},
			
			
			// todo: 
			_touchEnd: function(event) {
				// check if a swipe occurred
				if (this.options.sliding && !slideAnimating) {console.log('swiped:true');
					
					var start = this.swipeStart,
						end = this.swipeStop,
						diff = start.coords[0] - end.coords[0],
						$el = this.element,
						scrolledPassHeader = $(document).scrollTop() > headerHeight;
					
					this.options.sliding = false;
					scr = false;
					slideAnimating = true;
					//$('.debug').text(current.attr('id'));
					
					// snap to point
					if (Math.abs(diff) > this.options.swipeThreshold){console.log('enough swipe');
						if (diff > 0 && next.length) { // swipe to next
							console.log('swipe next');
							current.transition({ x: -1*windowWidth }, function() {
								slideAnimating = false;
								var pageOffset = headerHeight - $(document).scrollTop();
								if (scrolledPassHeader) {
									$(document).scrollTop(headerHeight); // scroll to the point just below the header
									pageOffset = 0;
								}
								next.css({'position': 'relative', 'top': 'auto', 'z-index': '10'});
								current.css({'position': 'fixed', 'top': pageOffset, 'z-index': '0'}).hide();
								
								nav.find('li.selected').removeClass('selected').next().addClass('selected');
								prev = current;
								current = current.next('.page');
								next = next.next('.page');
								next.css({ x: '0' });
								prev.css({ x: '0' });
								prev.removeClass('current');
								current.addClass('current');
								that.loadNeighbours();
							});
							
						} else if (diff < 0 && prev.length) { // swipe to previous
							console.log('swipe prev');
							current.transition({ x: windowWidth }, function() {
								slideAnimating = false;
								var pageOffset = headerHeight - $(document).scrollTop();
								if (scrolledPassHeader) {
									$(document).scrollTop(headerHeight); // scroll to the point just below the header
									pageOffset = 0;
								}
								prev.css({'position': 'relative', 'top': 'auto', 'z-index': '10'}); // todo: changing position is causing a flash of background color
								current.css({'position': 'fixed', 'top': pageOffset, 'z-index': '0'}).hide();
								
								nav.find('li.selected').removeClass('selected').prev().addClass('selected');
								next = current;
								current = current.prev('.page');
								prev = prev.prev('.page');
								next.css({ x: '0' });
								prev.css({ x: '0' });
								next.removeClass('current');
								current.addClass('current');
								that.loadNeighbours();
							});
							
						} else {console.log('no page available');
							// no page available
							this.bounceBack();
						}
					} else {console.log('not enough swipe');
						// not enough swipe
						this.bounceBack();
					}
					
				}
			},
			
			
			bounceBack: function() {
				current.transition({ x: 0 }, function(){
					slideAnimating = false;
				});
			},
			
			
			loadNeighbours: function() {
				if ( !next.data('content') && typeof next.attr('data-url') !== 'undefined' ) {
					var nextFile = next.attr('data-url');
					next.load(nextFile, function() {
						$(this).data('content', true);
						that.fullHeightMinimum();
					});
				}
				
				if ( !prev.data('content') && typeof prev.attr('data-url') !== 'undefined' ) {
					var prevFile = prev.attr('data-url');
					prev.load(prevFile, function() {
						$(this).data('content', true);
						that.fullHeightMinimum();
					});
				}
			},
			
			
			_scrollStart: function(event) {
				//scr = true; // Get's called even before the user actually scrolls
			},
			
			
			_scrollStop: function(event) {
				scr = false;
				
				if ( $(document).scrollTop() > headerHeight ) {
					$('.page:not(.current)').each(function() {
						$(this).css('top', 0);
					});
				} else if ( $(document).scrollTop() < headerHeight ) {
					$('.page:not(.current)').each(function() {
						$(this).css('top', headerHeight-$(document).scrollTop());
					});
				}
			},
			
			
			windowResized: function() {
				windowWidth = $(window).width();
				windowHeight = $(window).height();
				that.fullHeightMinimum();
			},
			
			
			fullHeightMinimum: function() {
				var minPageHeight = windowHeight-headerHeight;
				if (current.outerHeight() < minPageHeight) {
					current.css('min-height', minPageHeight);
				}
				if (next.outerHeight() < minPageHeight) {
					next.css('min-height', minPageHeight);
				}
				if (prev.outerHeight() < minPageHeight) {
					prev.css('min-height', minPageHeight);
				}
			}
			
			
		});
		
		
		
		$("body").swipeable();
		
	});
	
	
	
	
	// Special page outside the swipe interaction
	$('.btn-about').click(function(event) {
		event.preventDefault();
		
		$('.special-page').show();
		
		$('.special-page').css({
			rotateY: '-90deg'
		});
		
		// animate current page
		// todo: ease back (Vera's slides)
		$('.header, nav, .page').transition({
			rotateY: '90deg'
		}, 400, 'linear', function() {
			
			this.css('display', 'none');
			// animate about-page
			$('.special-page').transition({
				rotateY: '0deg'
			}, 400, 'linear');
			
		});
		
	});
	
	// Return to projects
	$('.btn-back').click(function(event) {
		event.preventDefault();
		
		// show about-page
		$('.front').css('display', 'block');
		
		
		$('.front').css({
			rotateY: '-90deg'
		});
		
		// animate current page
		// todo: ease back (Vera's slides)
		$('.special-page').transition({
			rotateY: '90deg'
		}, 400, 'linear', function() {
			
			this.css('display', 'none');
			// animate about-page
			$('.front').transition({
				rotateY: '0deg'
			}, 400, 'linear');
			
		});
		
	});
	

	
});