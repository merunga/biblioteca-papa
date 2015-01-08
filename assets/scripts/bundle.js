// Avoid `console` errors in browsers that lack a console.
(function() {
    'use strict';

    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.


// Avoid `console` errors in browsers that lack a console.
(function() {
    'use strict';

    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.
/*
 * SmartMenus jQuery v0.9.7
 * http://www.smartmenus.org/
 *
 * Copyright 2014 Vasil Dinkov, Vadikom Web Ltd.
 * http://vadikom.com/
 *
 * Released under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

(function($) {

	var menuTrees = [],
		IE = !!window.createPopup, // detect it for the iframe shim
		mouse = false, // optimize for touch by default - we will detect for mouse input
		mouseDetectionEnabled = false;

	// Handle detection for mouse input (i.e. desktop browsers, tablets with a mouse, etc.)
	function initMouseDetection(disable) {
		var eNS = '.smartmenus_mouse';
		if (!mouseDetectionEnabled && !disable) {
			// if we get two consecutive mousemoves within 2 pixels from each other and within 300ms, we assume a real mouse/cursor is present
			// in practice, this seems like impossible to trick unintentianally with a real mouse and a pretty safe detection on touch devices (even with older browsers that do not support touch events)
			var firstTime = true,
				lastMove = null;
			$(document).bind(getEventsNS([
				['mousemove', function(e) {
					var thisMove = { x: e.pageX, y: e.pageY, timeStamp: new Date().getTime() };
					if (lastMove) {
						var deltaX = Math.abs(lastMove.x - thisMove.x),
							deltaY = Math.abs(lastMove.y - thisMove.y);
	 					if ((deltaX > 0 || deltaY > 0) && deltaX <= 2 && deltaY <= 2 && thisMove.timeStamp - lastMove.timeStamp <= 300) {
							mouse = true;
							// if this is the first check after page load, check if we are not over some item by chance and call the mouseenter handler if yes
							if (firstTime) {
								var $a = $(e.target).closest('a');
								if ($a.is('a')) {
									$.each(menuTrees, function() {
										if ($.contains(this.$root[0], $a[0])) {
											this.itemEnter({ currentTarget: $a[0] });
											return false;
										}
									});
								}
								firstTime = false;
							}
						}
					}
					lastMove = thisMove;
				}],
				[touchEvents() ? 'touchstart' : 'pointerover pointermove pointerout MSPointerOver MSPointerMove MSPointerOut', function(e) {
					if (isTouchEvent(e.originalEvent)) {
						mouse = false;
					}
				}]
			], eNS));
			mouseDetectionEnabled = true;
		} else if (mouseDetectionEnabled && disable) {
			$(document).unbind(eNS);
			mouseDetectionEnabled = false;
		}
	}

	function isTouchEvent(e) {
		return !/^(4|mouse)$/.test(e.pointerType);
	}

	// we use this just to choose between toucn and pointer events when we need to, not for touch screen detection
	function touchEvents() {
		return 'ontouchstart' in window;
	}

	// returns a jQuery bind() ready object
	function getEventsNS(defArr, eNS) {
		if (!eNS) {
			eNS = '';
		}
		var obj = {};
		$.each(defArr, function(index, value) {
			obj[value[0].split(' ').join(eNS + ' ') + eNS] = value[1];
		});
		return obj;
	}

	$.SmartMenus = function(elm, options) {
		this.$root = $(elm);
		this.opts = options;
		this.rootId = ''; // internal
		this.$subArrow = null;
		this.subMenus = []; // all sub menus in the tree (UL elms) in no particular order (only real - e.g. UL's in mega sub menus won't be counted)
		this.activatedItems = []; // stores last activated A's for each level
		this.visibleSubMenus = []; // stores visible sub menus UL's
		this.showTimeout = 0;
		this.hideTimeout = 0;
		this.scrollTimeout = 0;
		this.clickActivated = false;
		this.zIndexInc = 0;
		this.$firstLink = null; // we'll use these for some tests
		this.$firstSub = null; // at runtime so we'll cache them
		this.disabled = false;
		this.$disableOverlay = null;
		this.isTouchScrolling = false;
		this.init();
	};

	$.extend($.SmartMenus, {
		hideAll: function() {
			$.each(menuTrees, function() {
				this.menuHideAll();
			});
		},
		destroy: function() {
			while (menuTrees.length) {
				menuTrees[0].destroy();
			}
			initMouseDetection(true);
		},
		prototype: {
			init: function(refresh) {
				var self = this;

				if (!refresh) {
					menuTrees.push(this);

					this.rootId = (new Date().getTime() + Math.random() + '').replace(/\D/g, '');

					if (this.$root.hasClass('sm-rtl')) {
						this.opts.rightToLeftSubMenus = true;
					}

					// init root (main menu)
					var eNS = '.smartmenus';
					this.$root
						.data('smartmenus', this)
						.attr('data-smartmenus-id', this.rootId)
						.dataSM('level', 1)
						.bind(getEventsNS([
							['mouseover focusin', $.proxy(this.rootOver, this)],
							['mouseout focusout', $.proxy(this.rootOut, this)]
						], eNS))
						.delegate('a', getEventsNS([
							['mouseenter', $.proxy(this.itemEnter, this)],
							['mouseleave', $.proxy(this.itemLeave, this)],
							['mousedown', $.proxy(this.itemDown, this)],
							['focus', $.proxy(this.itemFocus, this)],
							['blur', $.proxy(this.itemBlur, this)],
							['click', $.proxy(this.itemClick, this)],
							['touchend', $.proxy(this.itemTouchEnd, this)]
						], eNS));

					// hide menus on tap or click outside the root UL
					eNS += this.rootId;
					if (this.opts.hideOnClick) {
						$(document).bind(getEventsNS([
							['touchstart', $.proxy(this.docTouchStart, this)],
							['touchmove', $.proxy(this.docTouchMove, this)],
							['touchend', $.proxy(this.docTouchEnd, this)],
							// for Opera Mobile < 11.5, webOS browser, etc. we'll check click too
							['click', $.proxy(this.docClick, this)]
						], eNS));
					}
					// hide sub menus on resize
					$(window).bind(getEventsNS([['resize orientationchange', $.proxy(this.winResize, this)]], eNS));

					if (this.opts.subIndicators) {
						this.$subArrow = $('<span/>').addClass('sub-arrow');
						if (this.opts.subIndicatorsText) {
							this.$subArrow.html(this.opts.subIndicatorsText);
						}
					}

					// make sure mouse detection is enabled
					initMouseDetection();
				}

				// init sub menus
				this.$firstSub = this.$root.find('ul').each(function() { self.menuInit($(this)); }).eq(0);

				this.$firstLink = this.$root.find('a').eq(0);

				// find current item
				if (this.opts.markCurrentItem) {
					var reDefaultDoc = /(index|default)\.[^#\?\/]*/i,
						reHash = /#.*/,
						locHref = window.location.href.replace(reDefaultDoc, ''),
						locHrefNoHash = locHref.replace(reHash, '');
					this.$root.find('a').each(function() {
						var href = this.href.replace(reDefaultDoc, ''),
							$this = $(this);
						if (href == locHref || href == locHrefNoHash) {
							$this.addClass('current');
							if (self.opts.markCurrentTree) {
								$this.parent().parentsUntil('[data-smartmenus-id]', 'li').children('a').addClass('current');
							}
						}
					});
				}
			},
			destroy: function() {
				this.menuHideAll();
				var eNS = '.smartmenus';
				this.$root
					.removeData('smartmenus')
					.removeAttr('data-smartmenus-id')
					.removeDataSM('level')
					.unbind(eNS)
					.undelegate(eNS);
				eNS += this.rootId;
				$(document).unbind(eNS);
				$(window).unbind(eNS);
				if (this.opts.subIndicators) {
					this.$subArrow = null;
				}
				var self = this;
				$.each(this.subMenus, function() {
					if (this.hasClass('mega-menu')) {
						this.find('ul').removeDataSM('in-mega');
					}
					if (this.dataSM('shown-before')) {
						if (self.opts.subMenusMinWidth || self.opts.subMenusMaxWidth) {
							this.css({ width: '', minWidth: '', maxWidth: '' }).removeClass('sm-nowrap');
						}
						if (this.dataSM('scroll-arrows')) {
							this.dataSM('scroll-arrows').remove();
						}
						this.css({ zIndex: '', top: '', left: '', marginLeft: '', marginTop: '', display: '' });
					}
					if (self.opts.subIndicators) {
						this.dataSM('parent-a').removeClass('has-submenu').children('span.sub-arrow').remove();
					}
					this.removeDataSM('shown-before')
						.removeDataSM('ie-shim')
						.removeDataSM('scroll-arrows')
						.removeDataSM('parent-a')
						.removeDataSM('level')
						.removeDataSM('beforefirstshowfired')
						.parent().removeDataSM('sub');
				});
				if (this.opts.markCurrentItem) {
					this.$root.find('a.current').removeClass('current');
				}
				this.$root = null;
				this.$firstLink = null;
				this.$firstSub = null;
				if (this.$disableOverlay) {
					this.$disableOverlay.remove();
					this.$disableOverlay = null;
				}
				menuTrees.splice($.inArray(this, menuTrees), 1);
			},
			disable: function(noOverlay) {
				if (!this.disabled) {
					this.menuHideAll();
					// display overlay over the menu to prevent interaction
					if (!noOverlay && !this.opts.isPopup && this.$root.is(':visible')) {
						var pos = this.$root.offset();
						this.$disableOverlay = $('<div class="sm-jquery-disable-overlay"/>').css({
							position: 'absolute',
							top: pos.top,
							left: pos.left,
							width: this.$root.outerWidth(),
							height: this.$root.outerHeight(),
							zIndex: this.getStartZIndex(true),
							opacity: 0
						}).appendTo(document.body);
					}
					this.disabled = true;
				}
			},
			docClick: function(e) {
				if (this.isTouchScrolling) {
					this.isTouchScrolling = false;
					return;
				}
				// hide on any click outside the menu or on a menu link
				if (this.visibleSubMenus.length && !$.contains(this.$root[0], e.target) || $(e.target).is('a')) {
					this.menuHideAll();
				}
			},
			docTouchEnd: function(e) {
				if (!this.lastTouch) {
					return;
				}
				if (this.visibleSubMenus.length && (this.lastTouch.x2 === undefined || this.lastTouch.x1 == this.lastTouch.x2) && (this.lastTouch.y2 === undefined || this.lastTouch.y1 == this.lastTouch.y2) && (!this.lastTouch.target || !$.contains(this.$root[0], this.lastTouch.target))) {
					if (this.hideTimeout) {
						clearTimeout(this.hideTimeout);
						this.hideTimeout = 0;
					}
					// hide with a delay to prevent triggering accidental unwanted click on some page element
					var self = this;
					this.hideTimeout = setTimeout(function() { self.menuHideAll(); }, 350);
				}
				this.lastTouch = null;
			},
			docTouchMove: function(e) {
				if (!this.lastTouch) {
					return;
				}
				var touchPoint = e.originalEvent.touches[0];
				this.lastTouch.x2 = touchPoint.pageX;
				this.lastTouch.y2 = touchPoint.pageY;
			},
			docTouchStart: function(e) {
				var touchPoint = e.originalEvent.touches[0];
				this.lastTouch = { x1: touchPoint.pageX, y1: touchPoint.pageY, target: touchPoint.target };
			},
			enable: function() {
				if (this.disabled) {
					if (this.$disableOverlay) {
						this.$disableOverlay.remove();
						this.$disableOverlay = null;
					}
					this.disabled = false;
				}
			},
			getClosestMenu: function(elm) {
				var $closestMenu = $(elm).closest('ul');
				while ($closestMenu.dataSM('in-mega')) {
					$closestMenu = $closestMenu.parent().closest('ul');
				}
				return $closestMenu[0] || null;
			},
			getHeight: function($elm) {
				return this.getOffset($elm, true);
			},
			// returns precise width/height float values
			getOffset: function($elm, height) {
				var old;
				if ($elm.css('display') == 'none') {
					old = { position: $elm[0].style.position, visibility: $elm[0].style.visibility };
					$elm.css({ position: 'absolute', visibility: 'hidden' }).show();
				}
				var box = $elm[0].getBoundingClientRect && $elm[0].getBoundingClientRect(),
					val = box && (height ? box.height || box.bottom - box.top : box.width || box.right - box.left);
				if (!val && val !== 0) {
					val = height ? $elm[0].offsetHeight : $elm[0].offsetWidth;
				}
				if (old) {
					$elm.hide().css(old);
				}
				return val;
			},
			getStartZIndex: function(root) {
				var zIndex = parseInt(this[root ? '$root' : '$firstSub'].css('z-index'));
				if (!root && isNaN(zIndex)) {
					zIndex = parseInt(this.$root.css('z-index'));
				}
				return !isNaN(zIndex) ? zIndex : 1;
			},
			getTouchPoint: function(e) {
				return e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0] || e;
			},
			getViewport: function(height) {
				var name = height ? 'Height' : 'Width',
					val = document.documentElement['client' + name],
					val2 = window['inner' + name];
				if (val2) {
					val = Math.min(val, val2);
				}
				return val;
			},
			getViewportHeight: function() {
				return this.getViewport(true);
			},
			getViewportWidth: function() {
				return this.getViewport();
			},
			getWidth: function($elm) {
				return this.getOffset($elm);
			},
			handleEvents: function() {
				return !this.disabled && this.isCSSOn();
			},
			handleItemEvents: function($a) {
				return this.handleEvents() && !this.isLinkInMegaMenu($a);
			},
			isCollapsible: function() {
				return this.$firstSub.css('position') == 'static';
			},
			isCSSOn: function() {
				return this.$firstLink.css('display') == 'block';
			},
			isFixed: function() {
				var isFixed = this.$root.css('position') == 'fixed';
				if (!isFixed) {
					this.$root.parentsUntil('body').each(function() {
						if ($(this).css('position') == 'fixed') {
							isFixed = true;
							return false;
						}
					});
				}
				return isFixed;
			},
			isLinkInMegaMenu: function($a) {
				return !$a.parent().parent().dataSM('level');
			},
			isTouchMode: function() {
				return !mouse || this.isCollapsible();
			},
			itemActivate: function($a) {
				var $li = $a.parent(),
					$ul = $li.parent(),
					level = $ul.dataSM('level');
				// if for some reason the parent item is not activated (e.g. this is an API call to activate the item), activate all parent items first
				if (level > 1 && (!this.activatedItems[level - 2] || this.activatedItems[level - 2][0] != $ul.dataSM('parent-a')[0])) {
					var self = this;
					$($ul.parentsUntil('[data-smartmenus-id]', 'ul').get().reverse()).add($ul).each(function() {
						self.itemActivate($(this).dataSM('parent-a'));
					});
				}
				// hide any visible deeper level sub menus
				if (this.visibleSubMenus.length > level) {
					this.menuHideSubMenus(!this.activatedItems[level - 1] || this.activatedItems[level - 1][0] != $a[0] ? level - 1 : level);
				}
				// save new active item and sub menu for this level
				this.activatedItems[level - 1] = $a;
				this.visibleSubMenus[level - 1] = $ul;
				if (this.$root.triggerHandler('activate.smapi', $a[0]) === false) {
					return;
				}
				// show the sub menu if this item has one
				var $sub = $li.dataSM('sub');
				if ($sub && (this.isTouchMode() || (!this.opts.showOnClick || this.clickActivated))) {
					this.menuShow($sub);
				}
			},
			itemBlur: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				this.$root.triggerHandler('blur.smapi', $a[0]);
			},
			itemClick: function(e) {
				if (this.isTouchScrolling) {
					this.isTouchScrolling = false;
					e.stopPropagation();
					return false;
				}
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				$a.removeDataSM('mousedown');
				if (this.$root.triggerHandler('click.smapi', $a[0]) === false) {
					return false;
				}
				var $sub = $a.parent().dataSM('sub');
				if (this.isTouchMode()) {
					// undo fix: prevent the address bar on iPhone from sliding down when expanding a sub menu
					if ($a.dataSM('href')) {
						$a.attr('href', $a.dataSM('href')).removeDataSM('href');
					}
					// if the sub is not visible
					if ($sub && (!$sub.dataSM('shown-before') || !$sub.is(':visible'))) {
						// try to activate the item and show the sub
						this.itemActivate($a);
						// if "itemActivate" showed the sub, prevent the click so that the link is not loaded
						// if it couldn't show it, then the sub menus are disabled with an !important declaration (e.g. via mobile styles) so let the link get loaded
						if ($sub.is(':visible')) {
							return false;
						}
					}
				} else if (this.opts.showOnClick && $a.parent().parent().dataSM('level') == 1 && $sub) {
					this.clickActivated = true;
					this.menuShow($sub);
					return false;
				}
				if ($a.hasClass('disabled')) {
					return false;
				}
				if (this.$root.triggerHandler('select.smapi', $a[0]) === false) {
					return false;
				}
			},
			itemDown: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				$a.dataSM('mousedown', true);
			},
			itemEnter: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				if (!this.isTouchMode()) {
					if (this.showTimeout) {
						clearTimeout(this.showTimeout);
						this.showTimeout = 0;
					}
					var self = this;
					this.showTimeout = setTimeout(function() { self.itemActivate($a); }, this.opts.showOnClick && $a.parent().parent().dataSM('level') == 1 ? 1 : this.opts.showTimeout);
				}
				this.$root.triggerHandler('mouseenter.smapi', $a[0]);
			},
			itemFocus: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				// fix (the mousedown check): in some browsers a tap/click produces consecutive focus + click events so we don't need to activate the item on focus
				if ((!this.isTouchMode() || !$a.dataSM('mousedown')) && (!this.activatedItems.length || this.activatedItems[this.activatedItems.length - 1][0] != $a[0])) {
					this.itemActivate($a);
				}
				this.$root.triggerHandler('focus.smapi', $a[0]);
			},
			itemLeave: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				if (!this.isTouchMode()) {
					if ($a[0].blur) {
						$a[0].blur();
					}
					if (this.showTimeout) {
						clearTimeout(this.showTimeout);
						this.showTimeout = 0;
					}
				}
				$a.removeDataSM('mousedown');
				this.$root.triggerHandler('mouseleave.smapi', $a[0]);
			},
			itemTouchEnd: function(e) {
				var $a = $(e.currentTarget);
				if (!this.handleItemEvents($a)) {
					return;
				}
				// prevent the address bar on iPhone from sliding down when expanding a sub menu
				var $sub = $a.parent().dataSM('sub');
				if ($a.attr('href').charAt(0) !== '#' && $sub && (!$sub.dataSM('shown-before') || !$sub.is(':visible'))) {
					$a.dataSM('href', $a.attr('href'));
					$a.attr('href', '#');
				}
			},
			menuFixLayout: function($ul) {
				// fixes a menu that is being shown for the first time
				if (!$ul.dataSM('shown-before')) {
					$ul.hide().dataSM('shown-before', true);
				}
			},
			menuHide: function($sub) {
				if (this.$root.triggerHandler('beforehide.smapi', $sub[0]) === false) {
					return;
				}
				$sub.stop(true, true);
				if ($sub.is(':visible')) {
					var complete = function() {
						// unset z-index
						$sub.css('z-index', '');
					};
					// if sub is collapsible (mobile view)
					if (this.isCollapsible()) {
						if (this.opts.collapsibleHideFunction) {
							this.opts.collapsibleHideFunction.call(this, $sub, complete);
						} else {
							$sub.hide(this.opts.collapsibleHideDuration, complete);
						}
					} else {
						if (this.opts.hideFunction) {
							this.opts.hideFunction.call(this, $sub, complete);
						} else {
							$sub.hide(this.opts.hideDuration, complete);
						}
					}
					// remove IE iframe shim
					if ($sub.dataSM('ie-shim')) {
						$sub.dataSM('ie-shim').remove();
					}
					// deactivate scrolling if it is activated for this sub
					if ($sub.dataSM('scroll')) {
						this.menuScrollStop($sub);
						$sub.css({ 'touch-action': '', '-ms-touch-action': '' })
							.unbind('.smartmenus_scroll').removeDataSM('scroll').dataSM('scroll-arrows').hide();
					}
					// unhighlight parent item
					$sub.dataSM('parent-a').removeClass('highlighted');
					var level = $sub.dataSM('level');
					this.activatedItems.splice(level - 1, 1);
					this.visibleSubMenus.splice(level - 1, 1);
					this.$root.triggerHandler('hide.smapi', $sub[0]);
				}
			},
			menuHideAll: function() {
				if (this.showTimeout) {
					clearTimeout(this.showTimeout);
					this.showTimeout = 0;
				}
				// hide all subs
				this.menuHideSubMenus();
				// hide root if it's popup
				if (this.opts.isPopup) {
					this.$root.stop(true, true);
					if (this.$root.is(':visible')) {
						if (this.opts.hideFunction) {
							this.opts.hideFunction.call(this, this.$root);
						} else {
							this.$root.hide(this.opts.hideDuration);
						}
						// remove IE iframe shim
						if (this.$root.dataSM('ie-shim')) {
							this.$root.dataSM('ie-shim').remove();
						}
					}
				}
				this.activatedItems = [];
				this.visibleSubMenus = [];
				this.clickActivated = false;
				// reset z-index increment
				this.zIndexInc = 0;
			},
			menuHideSubMenus: function(level) {
				if (!level)
					level = 0;
				for (var i = this.visibleSubMenus.length - 1; i > level; i--) {
					this.menuHide(this.visibleSubMenus[i]);
				}
			},
			menuIframeShim: function($ul) {
				// create iframe shim for the menu
				if (IE && this.opts.overlapControlsInIE && !$ul.dataSM('ie-shim')) {
					$ul.dataSM('ie-shim', $('<iframe/>').attr({ src: 'javascript:0', tabindex: -9 })
						.css({ position: 'absolute', top: 'auto', left: '0', opacity: 0, border: '0' })
					);
				}
			},
			menuInit: function($ul) {
				if (!$ul.dataSM('in-mega')) {
					this.subMenus.push($ul);
					// mark UL's in mega drop downs (if any) so we can neglect them
					if ($ul.hasClass('mega-menu')) {
						$ul.find('ul').dataSM('in-mega', true);
					}
					// get level (much faster than, for example, using parentsUntil)
					var level = 2,
						par = $ul[0];
					while ((par = par.parentNode.parentNode) != this.$root[0]) {
						level++;
					}
					// cache stuff
					$ul.dataSM('parent-a', $ul.prevAll('a').eq(-1))
						.dataSM('level', level)
						.parent().dataSM('sub', $ul);
					// add sub indicator to parent item
					if (this.opts.subIndicators) {
						$ul.dataSM('parent-a').addClass('has-submenu')[this.opts.subIndicatorsPos](this.$subArrow.clone());
					}
				}
			},
			menuPosition: function($sub) {
				var $a = $sub.dataSM('parent-a'),
					$ul = $sub.parent().parent(),
					level = $sub.dataSM('level'),
					subW = this.getWidth($sub),
					subH = this.getHeight($sub),
					itemOffset = $a.offset(),
					itemX = itemOffset.left,
					itemY = itemOffset.top,
					itemW = this.getWidth($a),
					itemH = this.getHeight($a),
					$win = $(window),
					winX = $win.scrollLeft(),
					winY = $win.scrollTop(),
					winW = this.getViewportWidth(),
					winH = this.getViewportHeight(),
					horizontalParent = $ul.hasClass('sm') && !$ul.hasClass('sm-vertical'),
					subOffsetX = level == 2 ? this.opts.mainMenuSubOffsetX : this.opts.subMenusSubOffsetX,
					subOffsetY = level == 2 ? this.opts.mainMenuSubOffsetY : this.opts.subMenusSubOffsetY,
					x, y;
				if (horizontalParent) {
					x = this.opts.rightToLeftSubMenus ? itemW - subW - subOffsetX : subOffsetX;
					y = this.opts.bottomToTopSubMenus ? -subH - subOffsetY : itemH + subOffsetY;
				} else {
					x = this.opts.rightToLeftSubMenus ? subOffsetX - subW : itemW - subOffsetX;
					y = this.opts.bottomToTopSubMenus ? itemH - subOffsetY - subH : subOffsetY;
				}
				if (this.opts.keepInViewport && !this.isCollapsible()) {
					var absX = itemX + x,
						absY = itemY + y;
					if (this.opts.rightToLeftSubMenus && absX < winX) {
						x = horizontalParent ? winX - absX + x : itemW - subOffsetX;
					} else if (!this.opts.rightToLeftSubMenus && absX + subW > winX + winW) {
						x = horizontalParent ? winX + winW - subW - absX + x : subOffsetX - subW;
					}
					if (!horizontalParent) {
						if (subH < winH && absY + subH > winY + winH) {
							y += winY + winH - subH - absY;
						} else if (subH >= winH || absY < winY) {
							y += winY - absY;
						}
					}
					// do we need scrolling?
					// 0.49 used for better precision when dealing with float values
					if (horizontalParent && (absY + subH > winY + winH + 0.49 || absY < winY) || !horizontalParent && subH > winH + 0.49) {
						var self = this;
						if (!$sub.dataSM('scroll-arrows')) {
							$sub.dataSM('scroll-arrows', $([$('<span class="scroll-up"><span class="scroll-up-arrow"></span></span>')[0], $('<span class="scroll-down"><span class="scroll-down-arrow"></span></span>')[0]])
								.bind({
									mouseenter: function() {
										$sub.dataSM('scroll').up = $(this).hasClass('scroll-up');
										self.menuScroll($sub);
									},
									mouseleave: function(e) {
										self.menuScrollStop($sub);
										self.menuScrollOut($sub, e);
									},
									'mousewheel DOMMouseScroll': function(e) { e.preventDefault(); }
								})
								.insertAfter($sub)
							);
						}
						// bind scroll events and save scroll data for this sub
						var eNS = '.smartmenus_scroll';
						$sub.dataSM('scroll', {
								step: 1,
								// cache stuff for faster recalcs later
								itemH: itemH,
								subH: subH,
								arrowDownH: this.getHeight($sub.dataSM('scroll-arrows').eq(1))
							})
							.bind(getEventsNS([
								['mouseover', function(e) { self.menuScrollOver($sub, e); }],
								['mouseout', function(e) { self.menuScrollOut($sub, e); }],
								['mousewheel DOMMouseScroll', function(e) { self.menuScrollMousewheel($sub, e); }]
							], eNS))
							.dataSM('scroll-arrows').css({ top: 'auto', left: '0', marginLeft: x + (parseInt($sub.css('border-left-width')) || 0), width: subW - (parseInt($sub.css('border-left-width')) || 0) - (parseInt($sub.css('border-right-width')) || 0), zIndex: $sub.css('z-index') })
								.eq(horizontalParent && this.opts.bottomToTopSubMenus ? 0 : 1).show();
						// when a menu tree is fixed positioned we allow scrolling via touch too
						// since there is no other way to access such long sub menus if no mouse is present
						if (this.isFixed()) {
							$sub.css({ 'touch-action': 'none', '-ms-touch-action': 'none' })
								.bind(getEventsNS([
									[touchEvents() ? 'touchstart touchmove touchend' : 'pointerdown pointermove pointerup MSPointerDown MSPointerMove MSPointerUp', function(e) {
										self.menuScrollTouch($sub, e);
									}]
								], eNS));
						}
					}
				}
				$sub.css({ top: 'auto', left: '0', marginLeft: x, marginTop: y - itemH });
				// IE iframe shim
				this.menuIframeShim($sub);
				if ($sub.dataSM('ie-shim')) {
					$sub.dataSM('ie-shim').css({ zIndex: $sub.css('z-index'), width: subW, height: subH, marginLeft: x, marginTop: y - itemH });
				}
			},
			menuScroll: function($sub, once, step) {
				var data = $sub.dataSM('scroll'),
					$arrows = $sub.dataSM('scroll-arrows'),
					y = parseFloat($sub.css('margin-top')),
					end = data.up ? data.upEnd : data.downEnd,
					diff;
				if (!once && data.velocity) {
					data.velocity *= 0.9;
					diff = data.velocity;
					if (diff < 0.5) {
						this.menuScrollStop($sub);
						return;
					}
				} else {
					diff = step || (once || !this.opts.scrollAccelerate ? this.opts.scrollStep : Math.floor(data.step));
				}
				// hide any visible deeper level sub menus
				var level = $sub.dataSM('level');
				if (this.visibleSubMenus.length > level) {
					this.menuHideSubMenus(level - 1);
				}
				var newY = data.up && end <= y || !data.up && end >= y ? y : (Math.abs(end - y) > diff ? y + (data.up ? diff : -diff) : end);
				$sub.add($sub.dataSM('ie-shim')).css('margin-top', newY);
				// show opposite arrow if appropriate
				if (mouse && (data.up && newY > data.downEnd || !data.up && newY < data.upEnd)) {
					$arrows.eq(data.up ? 1 : 0).show();
				}
				// if we've reached the end
				if (newY == end) {
					if (mouse) {
						$arrows.eq(data.up ? 0 : 1).hide();
					}
					this.menuScrollStop($sub);
				} else if (!once) {
					if (this.opts.scrollAccelerate && data.step < this.opts.scrollStep) {
						data.step += 0.5;
					}
					var self = this;
					this.scrollTimeout = setTimeout(function() { self.menuScroll($sub); }, this.opts.scrollInterval);
				}
			},
			menuScrollMousewheel: function($sub, e) {
				if (this.getClosestMenu(e.target) == $sub[0]) {
					e = e.originalEvent;
					var up = (e.wheelDelta || -e.detail) > 0;
					if ($sub.dataSM('scroll-arrows').eq(up ? 0 : 1).is(':visible')) {
						$sub.dataSM('scroll').up = up;
						this.menuScroll($sub, true);
					}
				}
				e.preventDefault();
			},
			menuScrollOut: function($sub, e) {
				if (mouse) {
					if (!/^scroll-(up|down)/.test((e.relatedTarget || '').className) && ($sub[0] != e.relatedTarget && !$.contains($sub[0], e.relatedTarget) || this.getClosestMenu(e.relatedTarget) != $sub[0])) {
						$sub.dataSM('scroll-arrows').css('visibility', 'hidden');
					}
				}
			},
			menuScrollOver: function($sub, e) {
				if (mouse) {
					if (!/^scroll-(up|down)/.test(e.target.className) && this.getClosestMenu(e.target) == $sub[0]) {
						this.menuScrollRefreshData($sub);
						var data = $sub.dataSM('scroll');
						$sub.dataSM('scroll-arrows').eq(0).css('margin-top', data.upEnd).end()
							.eq(1).css('margin-top', data.downEnd + data.subH - data.arrowDownH).end()
							.css('visibility', 'visible');
					}
				}
			},
			menuScrollRefreshData: function($sub) {
				var data = $sub.dataSM('scroll'),
					$win = $(window),
					vportY = $win.scrollTop() - $sub.dataSM('parent-a').offset().top - data.itemH;
				$.extend(data, {
					upEnd: vportY,
					downEnd: vportY + this.getViewportHeight() - data.subH
				});
			},
			menuScrollStop: function($sub) {
				if (this.scrollTimeout) {
					clearTimeout(this.scrollTimeout);
					this.scrollTimeout = 0;
					$.extend($sub.dataSM('scroll'), {
						step: 1,
						velocity: 0
					});
					return true;
				}
			},
			menuScrollTouch: function($sub, e) {
				e = e.originalEvent;
				if (isTouchEvent(e)) {
					var touchPoint = this.getTouchPoint(e);
					// neglect event if we touched a visible deeper level sub menu
					if (this.getClosestMenu(touchPoint.target) == $sub[0]) {
						var data = $sub.dataSM('scroll');
						if (/(start|down)$/i.test(e.type)) {
							if (this.menuScrollStop($sub)) {
								// if we were scrolling, just stop and don't activate any link on the first touch
								e.preventDefault();
								this.isTouchScrolling = true;
							} else {
								this.isTouchScrolling = false;
							}
							// update scroll data since the user might have zoomed, etc.
							this.menuScrollRefreshData($sub);
							// extend it with the touch properties
							$.extend(data, {
								touchY: touchPoint.pageY,
								touchTimestamp: e.timeStamp,
								velocity: 0
							});
						} else if (/move$/i.test(e.type)) {
							var prevY = data.touchY;
							if (prevY !== undefined && prevY != touchPoint.pageY) {
								this.isTouchScrolling = true;
								$.extend(data, {
									up: prevY < touchPoint.pageY,
									touchY: touchPoint.pageY,
									touchTimestamp: e.timeStamp,
									velocity: data.velocity + Math.abs(touchPoint.pageY - prevY) * 0.5
								});
								this.menuScroll($sub, true, Math.abs(data.touchY - prevY));
							}
							e.preventDefault();
						} else { // touchend/pointerup
							if (data.touchY !== undefined) {
								// check if we need to scroll
								if (e.timeStamp - data.touchTimestamp < 120 && data.velocity > 0) {
									data.velocity *= 0.5;
									this.menuScrollStop($sub);
									this.menuScroll($sub);
									e.preventDefault();
								}
								delete data.touchY;
							}
						}
					}
				}
			},
			menuShow: function($sub) {
				if (!$sub.dataSM('beforefirstshowfired')) {
					$sub.dataSM('beforefirstshowfired', true);
					if (this.$root.triggerHandler('beforefirstshow.smapi', $sub[0]) === false) {
						return;
					}
				}
				if (this.$root.triggerHandler('beforeshow.smapi', $sub[0]) === false) {
					return;
				}
				this.menuFixLayout($sub);
				$sub.stop(true, true);
				if (!$sub.is(':visible')) {
					// set z-index
					$sub.css('z-index', this.zIndexInc = (this.zIndexInc || this.getStartZIndex()) + 1);
					// highlight parent item
					if (this.opts.keepHighlighted || this.isCollapsible()) {
						$sub.dataSM('parent-a').addClass('highlighted');
					}
					// min/max-width fix - no way to rely purely on CSS as all UL's are nested
					if (this.opts.subMenusMinWidth || this.opts.subMenusMaxWidth) {
						$sub.css({ width: 'auto', minWidth: '', maxWidth: '' }).addClass('sm-nowrap');
						if (this.opts.subMenusMinWidth) {
						 	$sub.css('min-width', this.opts.subMenusMinWidth);
						}
						if (this.opts.subMenusMaxWidth) {
						 	var noMaxWidth = this.getWidth($sub);
						 	$sub.css('max-width', this.opts.subMenusMaxWidth);
							if (noMaxWidth > this.getWidth($sub)) {
								$sub.removeClass('sm-nowrap').css('width', this.opts.subMenusMaxWidth);
							}
						}
					}
					this.menuPosition($sub);
					// insert IE iframe shim
					if ($sub.dataSM('ie-shim')) {
						$sub.dataSM('ie-shim').insertBefore($sub);
					}
					var complete = function() {
						// fix: "overflow: hidden;" is not reset on animation complete in jQuery < 1.9.0 in Chrome when global "box-sizing: border-box;" is used
						$sub.css('overflow', '');
					};
					// if sub is collapsible (mobile view)
					if (this.isCollapsible()) {
						if (this.opts.collapsibleShowFunction) {
							this.opts.collapsibleShowFunction.call(this, $sub, complete);
						} else {
							$sub.show(this.opts.collapsibleShowDuration, complete);
						}
					} else {
						if (this.opts.showFunction) {
							this.opts.showFunction.call(this, $sub, complete);
						} else {
							$sub.show(this.opts.showDuration, complete);
						}
					}
					// save new sub menu for this level
					this.visibleSubMenus[$sub.dataSM('level') - 1] = $sub;
					this.$root.triggerHandler('show.smapi', $sub[0]);
				}
			},
			popupHide: function(noHideTimeout) {
				if (this.hideTimeout) {
					clearTimeout(this.hideTimeout);
					this.hideTimeout = 0;
				}
				var self = this;
				this.hideTimeout = setTimeout(function() {
					self.menuHideAll();
				}, noHideTimeout ? 1 : this.opts.hideTimeout);
			},
			popupShow: function(left, top) {
				if (!this.opts.isPopup) {
					alert('SmartMenus jQuery Error:\n\nIf you want to show this menu via the "popupShow" method, set the isPopup:true option.');
					return;
				}
				if (this.hideTimeout) {
					clearTimeout(this.hideTimeout);
					this.hideTimeout = 0;
				}
				this.menuFixLayout(this.$root);
				this.$root.stop(true, true);
				if (!this.$root.is(':visible')) {
					this.$root.css({ left: left, top: top });
					// IE iframe shim
					this.menuIframeShim(this.$root);
					if (this.$root.dataSM('ie-shim')) {
						this.$root.dataSM('ie-shim').css({ zIndex: this.$root.css('z-index'), width: this.getWidth(this.$root), height: this.getHeight(this.$root), left: left, top: top }).insertBefore(this.$root);
					}
					// show menu
					var self = this,
						complete = function() {
							self.$root.css('overflow', '');
						};
					if (this.opts.showFunction) {
						this.opts.showFunction.call(this, this.$root, complete);
					} else {
						this.$root.show(this.opts.showDuration, complete);
					}
					this.visibleSubMenus[0] = this.$root;
				}
			},
			refresh: function() {
				this.menuHideAll();
				this.$root.find('ul').each(function() {
						var $this = $(this);
						if ($this.dataSM('scroll-arrows')) {
							$this.dataSM('scroll-arrows').remove();
						}
					})
					.removeDataSM('in-mega')
					.removeDataSM('shown-before')
					.removeDataSM('ie-shim')
					.removeDataSM('scroll-arrows')
					.removeDataSM('parent-a')
					.removeDataSM('level')
					.removeDataSM('beforefirstshowfired');
				this.$root.find('a.has-submenu').removeClass('has-submenu')
					.parent().removeDataSM('sub');
				if (this.opts.subIndicators) {
					this.$root.find('span.sub-arrow').remove();
				}
				if (this.opts.markCurrentItem) {
					this.$root.find('a.current').removeClass('current');
				}
				this.subMenus = [];
				this.init(true);
			},
			rootOut: function(e) {
				if (!this.handleEvents() || this.isTouchMode() || e.target == this.$root[0]) {
					return;
				}
				if (this.hideTimeout) {
					clearTimeout(this.hideTimeout);
					this.hideTimeout = 0;
				}
				if (!this.opts.showOnClick || !this.opts.hideOnClick) {
					var self = this;
					this.hideTimeout = setTimeout(function() { self.menuHideAll(); }, this.opts.hideTimeout);
				}
			},
			rootOver: function(e) {
				if (!this.handleEvents() || this.isTouchMode() || e.target == this.$root[0]) {
					return;
				}
				if (this.hideTimeout) {
					clearTimeout(this.hideTimeout);
					this.hideTimeout = 0;
				}
			},
			winResize: function(e) {
				if (!this.handleEvents()) {
					// we still need to resize the disable overlay if it's visible
					if (this.$disableOverlay) {
						var pos = this.$root.offset();
	 					this.$disableOverlay.css({
							top: pos.top,
							left: pos.left,
							width: this.$root.outerWidth(),
							height: this.$root.outerHeight()
						});
					}
					return;
				}
				// hide sub menus on resize - on mobile do it only on orientation change
				if (!this.isCollapsible() && (!('onorientationchange' in window) || e.type == 'orientationchange')) {
					if (this.activatedItems.length) {
						this.activatedItems[this.activatedItems.length - 1][0].blur();
					}
					this.menuHideAll();
				}
			}
		}
	});

	$.fn.dataSM = function(key, val) {
		if (val) {
			return this.data(key + '_smartmenus', val);
		}
		return this.data(key + '_smartmenus');
	}

	$.fn.removeDataSM = function(key) {
		return this.removeData(key + '_smartmenus');
	}

	$.fn.smartmenus = function(options) {
		if (typeof options == 'string') {
			var args = arguments,
				method = options;
			Array.prototype.shift.call(args);
			return this.each(function() {
				var smartmenus = $(this).data('smartmenus');
				if (smartmenus && smartmenus[method]) {
					smartmenus[method].apply(smartmenus, args);
				}
			});
		}
		var opts = $.extend({}, $.fn.smartmenus.defaults, options);
		return this.each(function() {
			new $.SmartMenus(this, opts);
		});
	}

	// default settings
	$.fn.smartmenus.defaults = {
		isPopup:		false,		// is this a popup menu (can be shown via the popupShow/popupHide methods) or a permanent menu bar
		mainMenuSubOffsetX:	0,		// pixels offset from default position
		mainMenuSubOffsetY:	0,		// pixels offset from default position
		subMenusSubOffsetX:	0,		// pixels offset from default position
		subMenusSubOffsetY:	0,		// pixels offset from default position
		subMenusMinWidth:	'10em',		// min-width for the sub menus (any CSS unit) - if set, the fixed width set in CSS will be ignored
		subMenusMaxWidth:	'20em',		// max-width for the sub menus (any CSS unit) - if set, the fixed width set in CSS will be ignored
		subIndicators: 		true,		// create sub menu indicators - creates a SPAN and inserts it in the A
		subIndicatorsPos: 	'prepend',	// position of the SPAN relative to the menu item content ('prepend', 'append')
		subIndicatorsText:	'+',		// [optionally] add text in the SPAN (e.g. '+') (you may want to check the CSS for the sub indicators too)
		scrollStep: 		30,		// pixels step when scrolling long sub menus that do not fit in the viewport height
		scrollInterval:		30,		// interval between each scrolling step
		scrollAccelerate:	true,		// accelerate scrolling or use a fixed step
		showTimeout:		250,		// timeout before showing the sub menus
		hideTimeout:		500,		// timeout before hiding the sub menus
		showDuration:		0,		// duration for show animation - set to 0 for no animation - matters only if showFunction:null
		showFunction:		null,		// custom function to use when showing a sub menu (the default is the jQuery 'show')
							// don't forget to call complete() at the end of whatever you do
							// e.g.: function($ul, complete) { $ul.fadeIn(250, complete); }
		hideDuration:		0,		// duration for hide animation - set to 0 for no animation - matters only if hideFunction:null
		hideFunction:		function($ul, complete) { $ul.fadeOut(200, complete); },	// custom function to use when hiding a sub menu (the default is the jQuery 'hide')
							// don't forget to call complete() at the end of whatever you do
							// e.g.: function($ul, complete) { $ul.fadeOut(250, complete); }
		collapsibleShowDuration:0,		// duration for show animation for collapsible sub menus - matters only if collapsibleShowFunction:null
		collapsibleShowFunction:function($ul, complete) { $ul.slideDown(200, complete); },	// custom function to use when showing a collapsible sub menu
							// (i.e. when mobile styles are used to make the sub menus collapsible)
		collapsibleHideDuration:0,		// duration for hide animation for collapsible sub menus - matters only if collapsibleHideFunction:null
		collapsibleHideFunction:function($ul, complete) { $ul.slideUp(200, complete); },	// custom function to use when hiding a collapsible sub menu
							// (i.e. when mobile styles are used to make the sub menus collapsible)
		showOnClick:		false,		// show the first-level sub menus onclick instead of onmouseover (matters only for mouse input)
		hideOnClick:		true,		// hide the sub menus on click/tap anywhere on the page
		keepInViewport:		true,		// reposition the sub menus if needed to make sure they always appear inside the viewport
		keepHighlighted:	true,		// keep all ancestor items of the current sub menu highlighted (adds the 'highlighted' class to the A's)
		markCurrentItem:	false,		// automatically add the 'current' class to the A element of the item linking to the current URL
		markCurrentTree:	true,		// add the 'current' class also to the A elements of all ancestor items of the current item
		rightToLeftSubMenus:	false,		// right to left display of the sub menus (check the CSS for the sub indicators' position)
		bottomToTopSubMenus:	false,		// bottom to top display of the sub menus
		overlapControlsInIE:	true		// make sure sub menus appear on top of special OS controls in IE (i.e. SELECT, OBJECT, EMBED, etc.)
	};

})(jQuery);
/*
 * SmartMenus jQuery Bootstrap Addon - v0.1.1
 * http://www.smartmenus.org/
 *
 * Copyright 2014 Vasil Dinkov, Vadikom Web Ltd.
 * http://vadikom.com/
 *
 * Released under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

(function($) {

	// init ondomready
	$(function() {

		// init all menus
		$('ul.navbar-nav').each(function() {
				var $this = $(this);
				$this.addClass('sm').smartmenus({

						// these are some good default options that should work for all
						// you can, of course, tweak these as you like
						subMenusSubOffsetX: 2,
						subMenusSubOffsetY: -6,
						subIndicatorsPos: 'append',
						subIndicatorsText: '...',
						collapsibleShowFunction: null,
						collapsibleHideFunction: null,
						rightToLeftSubMenus: $this.hasClass('navbar-right'),
						bottomToTopSubMenus: $this.closest('.navbar').hasClass('navbar-fixed-bottom')
					})
					// set Bootstrap's "active" class to SmartMenus "current" items (should someone decide to enable markCurrentItem: true)
					.find('a.current').parent().addClass('active');
			})
			.bind({
				// set/unset proper Bootstrap classes for some menu elements
				'show.smapi': function(e, menu) {
					var $menu = $(menu),
						$scrollArrows = $menu.dataSM('scroll-arrows'),
						obj = $(this).data('smartmenus');
					if ($scrollArrows) {
						// they inherit border-color from body, so we can use its background-color too
						$scrollArrows.css('background-color', $(document.body).css('background-color'));
					}
					$menu.parent().addClass('open' + (obj.isCollapsible() ? ' collapsible' : ''));
				},
				'hide.smapi': function(e, menu) {
					$(menu).parent().removeClass('open collapsible');
				},
				// click the parent item to toggle the sub menus (and reset deeper levels and other branches on click)
				'click.smapi': function(e, item) {
					var obj = $(this).data('smartmenus');
					if (obj.isCollapsible()) {
						var $item = $(item),
							$sub = $item.parent().dataSM('sub');
						if ($sub && $sub.dataSM('shown-before') && $sub.is(':visible')) {
							obj.itemActivate($item);
							obj.menuHide($sub);
							return false;
						}
					}
				}
			});

	});

	// fix collapsible menu detection for Bootstrap 3
	$.SmartMenus.prototype.isCollapsible = function() {
		return this.$firstLink.parent().css('float') != 'left';
	};

})(jQuery);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdWdpbnMuanMiLCJtYWluLmpzIiwieWpxdWVyeS5zbWFydG1lbnVzLmpzIiwiempxdWVyeS5zbWFydG1lbnVzLmJvb3RzdHJhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQUE7QURBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FFekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDam5DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBdm9pZCBgY29uc29sZWAgZXJyb3JzIGluIGJyb3dzZXJzIHRoYXQgbGFjayBhIGNvbnNvbGUuXG4oZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1ldGhvZDtcbiAgICB2YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIHZhciBtZXRob2RzID0gW1xuICAgICAgICAnYXNzZXJ0JywgJ2NsZWFyJywgJ2NvdW50JywgJ2RlYnVnJywgJ2RpcicsICdkaXJ4bWwnLCAnZXJyb3InLFxuICAgICAgICAnZXhjZXB0aW9uJywgJ2dyb3VwJywgJ2dyb3VwQ29sbGFwc2VkJywgJ2dyb3VwRW5kJywgJ2luZm8nLCAnbG9nJyxcbiAgICAgICAgJ21hcmtUaW1lbGluZScsICdwcm9maWxlJywgJ3Byb2ZpbGVFbmQnLCAndGFibGUnLCAndGltZScsICd0aW1lRW5kJyxcbiAgICAgICAgJ3RpbWVsaW5lJywgJ3RpbWVsaW5lRW5kJywgJ3RpbWVTdGFtcCcsICd0cmFjZScsICd3YXJuJ1xuICAgIF07XG4gICAgdmFyIGxlbmd0aCA9IG1ldGhvZHMubGVuZ3RoO1xuICAgIHZhciBjb25zb2xlID0gKHdpbmRvdy5jb25zb2xlID0gd2luZG93LmNvbnNvbGUgfHwge30pO1xuXG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIG1ldGhvZCA9IG1ldGhvZHNbbGVuZ3RoXTtcblxuICAgICAgICAvLyBPbmx5IHN0dWIgdW5kZWZpbmVkIG1ldGhvZHMuXG4gICAgICAgIGlmICghY29uc29sZVttZXRob2RdKSB7XG4gICAgICAgICAgICBjb25zb2xlW21ldGhvZF0gPSBub29wO1xuICAgICAgICB9XG4gICAgfVxufSgpKTtcblxuLy8gUGxhY2UgYW55IGpRdWVyeS9oZWxwZXIgcGx1Z2lucyBpbiBoZXJlLiIsIiIsIi8qXG4gKiBTbWFydE1lbnVzIGpRdWVyeSB2MC45LjdcbiAqIGh0dHA6Ly93d3cuc21hcnRtZW51cy5vcmcvXG4gKlxuICogQ29weXJpZ2h0IDIwMTQgVmFzaWwgRGlua292LCBWYWRpa29tIFdlYiBMdGQuXG4gKiBodHRwOi8vdmFkaWtvbS5jb20vXG4gKlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuICogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuXG4oZnVuY3Rpb24oJCkge1xuXG5cdHZhciBtZW51VHJlZXMgPSBbXSxcblx0XHRJRSA9ICEhd2luZG93LmNyZWF0ZVBvcHVwLCAvLyBkZXRlY3QgaXQgZm9yIHRoZSBpZnJhbWUgc2hpbVxuXHRcdG1vdXNlID0gZmFsc2UsIC8vIG9wdGltaXplIGZvciB0b3VjaCBieSBkZWZhdWx0IC0gd2Ugd2lsbCBkZXRlY3QgZm9yIG1vdXNlIGlucHV0XG5cdFx0bW91c2VEZXRlY3Rpb25FbmFibGVkID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGRldGVjdGlvbiBmb3IgbW91c2UgaW5wdXQgKGkuZS4gZGVza3RvcCBicm93c2VycywgdGFibGV0cyB3aXRoIGEgbW91c2UsIGV0Yy4pXG5cdGZ1bmN0aW9uIGluaXRNb3VzZURldGVjdGlvbihkaXNhYmxlKSB7XG5cdFx0dmFyIGVOUyA9ICcuc21hcnRtZW51c19tb3VzZSc7XG5cdFx0aWYgKCFtb3VzZURldGVjdGlvbkVuYWJsZWQgJiYgIWRpc2FibGUpIHtcblx0XHRcdC8vIGlmIHdlIGdldCB0d28gY29uc2VjdXRpdmUgbW91c2Vtb3ZlcyB3aXRoaW4gMiBwaXhlbHMgZnJvbSBlYWNoIG90aGVyIGFuZCB3aXRoaW4gMzAwbXMsIHdlIGFzc3VtZSBhIHJlYWwgbW91c2UvY3Vyc29yIGlzIHByZXNlbnRcblx0XHRcdC8vIGluIHByYWN0aWNlLCB0aGlzIHNlZW1zIGxpa2UgaW1wb3NzaWJsZSB0byB0cmljayB1bmludGVudGlhbmFsbHkgd2l0aCBhIHJlYWwgbW91c2UgYW5kIGEgcHJldHR5IHNhZmUgZGV0ZWN0aW9uIG9uIHRvdWNoIGRldmljZXMgKGV2ZW4gd2l0aCBvbGRlciBicm93c2VycyB0aGF0IGRvIG5vdCBzdXBwb3J0IHRvdWNoIGV2ZW50cylcblx0XHRcdHZhciBmaXJzdFRpbWUgPSB0cnVlLFxuXHRcdFx0XHRsYXN0TW92ZSA9IG51bGw7XG5cdFx0XHQkKGRvY3VtZW50KS5iaW5kKGdldEV2ZW50c05TKFtcblx0XHRcdFx0Wydtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0dmFyIHRoaXNNb3ZlID0geyB4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZLCB0aW1lU3RhbXA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpIH07XG5cdFx0XHRcdFx0aWYgKGxhc3RNb3ZlKSB7XG5cdFx0XHRcdFx0XHR2YXIgZGVsdGFYID0gTWF0aC5hYnMobGFzdE1vdmUueCAtIHRoaXNNb3ZlLngpLFxuXHRcdFx0XHRcdFx0XHRkZWx0YVkgPSBNYXRoLmFicyhsYXN0TW92ZS55IC0gdGhpc01vdmUueSk7XG5cdCBcdFx0XHRcdFx0aWYgKChkZWx0YVggPiAwIHx8IGRlbHRhWSA+IDApICYmIGRlbHRhWCA8PSAyICYmIGRlbHRhWSA8PSAyICYmIHRoaXNNb3ZlLnRpbWVTdGFtcCAtIGxhc3RNb3ZlLnRpbWVTdGFtcCA8PSAzMDApIHtcblx0XHRcdFx0XHRcdFx0bW91c2UgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHQvLyBpZiB0aGlzIGlzIHRoZSBmaXJzdCBjaGVjayBhZnRlciBwYWdlIGxvYWQsIGNoZWNrIGlmIHdlIGFyZSBub3Qgb3ZlciBzb21lIGl0ZW0gYnkgY2hhbmNlIGFuZCBjYWxsIHRoZSBtb3VzZWVudGVyIGhhbmRsZXIgaWYgeWVzXG5cdFx0XHRcdFx0XHRcdGlmIChmaXJzdFRpbWUpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgJGEgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdhJyk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCRhLmlzKCdhJykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdCQuZWFjaChtZW51VHJlZXMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoJC5jb250YWlucyh0aGlzLiRyb290WzBdLCAkYVswXSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLml0ZW1FbnRlcih7IGN1cnJlbnRUYXJnZXQ6ICRhWzBdIH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGZpcnN0VGltZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGxhc3RNb3ZlID0gdGhpc01vdmU7XG5cdFx0XHRcdH1dLFxuXHRcdFx0XHRbdG91Y2hFdmVudHMoKSA/ICd0b3VjaHN0YXJ0JyA6ICdwb2ludGVyb3ZlciBwb2ludGVybW92ZSBwb2ludGVyb3V0IE1TUG9pbnRlck92ZXIgTVNQb2ludGVyTW92ZSBNU1BvaW50ZXJPdXQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYgKGlzVG91Y2hFdmVudChlLm9yaWdpbmFsRXZlbnQpKSB7XG5cdFx0XHRcdFx0XHRtb3VzZSA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fV1cblx0XHRcdF0sIGVOUykpO1xuXHRcdFx0bW91c2VEZXRlY3Rpb25FbmFibGVkID0gdHJ1ZTtcblx0XHR9IGVsc2UgaWYgKG1vdXNlRGV0ZWN0aW9uRW5hYmxlZCAmJiBkaXNhYmxlKSB7XG5cdFx0XHQkKGRvY3VtZW50KS51bmJpbmQoZU5TKTtcblx0XHRcdG1vdXNlRGV0ZWN0aW9uRW5hYmxlZCA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGlzVG91Y2hFdmVudChlKSB7XG5cdFx0cmV0dXJuICEvXig0fG1vdXNlKSQvLnRlc3QoZS5wb2ludGVyVHlwZSk7XG5cdH1cblxuXHQvLyB3ZSB1c2UgdGhpcyBqdXN0IHRvIGNob29zZSBiZXR3ZWVuIHRvdWNuIGFuZCBwb2ludGVyIGV2ZW50cyB3aGVuIHdlIG5lZWQgdG8sIG5vdCBmb3IgdG91Y2ggc2NyZWVuIGRldGVjdGlvblxuXHRmdW5jdGlvbiB0b3VjaEV2ZW50cygpIHtcblx0XHRyZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gd2luZG93O1xuXHR9XG5cblx0Ly8gcmV0dXJucyBhIGpRdWVyeSBiaW5kKCkgcmVhZHkgb2JqZWN0XG5cdGZ1bmN0aW9uIGdldEV2ZW50c05TKGRlZkFyciwgZU5TKSB7XG5cdFx0aWYgKCFlTlMpIHtcblx0XHRcdGVOUyA9ICcnO1xuXHRcdH1cblx0XHR2YXIgb2JqID0ge307XG5cdFx0JC5lYWNoKGRlZkFyciwgZnVuY3Rpb24oaW5kZXgsIHZhbHVlKSB7XG5cdFx0XHRvYmpbdmFsdWVbMF0uc3BsaXQoJyAnKS5qb2luKGVOUyArICcgJykgKyBlTlNdID0gdmFsdWVbMV07XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG9iajtcblx0fVxuXG5cdCQuU21hcnRNZW51cyA9IGZ1bmN0aW9uKGVsbSwgb3B0aW9ucykge1xuXHRcdHRoaXMuJHJvb3QgPSAkKGVsbSk7XG5cdFx0dGhpcy5vcHRzID0gb3B0aW9ucztcblx0XHR0aGlzLnJvb3RJZCA9ICcnOyAvLyBpbnRlcm5hbFxuXHRcdHRoaXMuJHN1YkFycm93ID0gbnVsbDtcblx0XHR0aGlzLnN1Yk1lbnVzID0gW107IC8vIGFsbCBzdWIgbWVudXMgaW4gdGhlIHRyZWUgKFVMIGVsbXMpIGluIG5vIHBhcnRpY3VsYXIgb3JkZXIgKG9ubHkgcmVhbCAtIGUuZy4gVUwncyBpbiBtZWdhIHN1YiBtZW51cyB3b24ndCBiZSBjb3VudGVkKVxuXHRcdHRoaXMuYWN0aXZhdGVkSXRlbXMgPSBbXTsgLy8gc3RvcmVzIGxhc3QgYWN0aXZhdGVkIEEncyBmb3IgZWFjaCBsZXZlbFxuXHRcdHRoaXMudmlzaWJsZVN1Yk1lbnVzID0gW107IC8vIHN0b3JlcyB2aXNpYmxlIHN1YiBtZW51cyBVTCdzXG5cdFx0dGhpcy5zaG93VGltZW91dCA9IDA7XG5cdFx0dGhpcy5oaWRlVGltZW91dCA9IDA7XG5cdFx0dGhpcy5zY3JvbGxUaW1lb3V0ID0gMDtcblx0XHR0aGlzLmNsaWNrQWN0aXZhdGVkID0gZmFsc2U7XG5cdFx0dGhpcy56SW5kZXhJbmMgPSAwO1xuXHRcdHRoaXMuJGZpcnN0TGluayA9IG51bGw7IC8vIHdlJ2xsIHVzZSB0aGVzZSBmb3Igc29tZSB0ZXN0c1xuXHRcdHRoaXMuJGZpcnN0U3ViID0gbnVsbDsgLy8gYXQgcnVudGltZSBzbyB3ZSdsbCBjYWNoZSB0aGVtXG5cdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdHRoaXMuJGRpc2FibGVPdmVybGF5ID0gbnVsbDtcblx0XHR0aGlzLmlzVG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmluaXQoKTtcblx0fTtcblxuXHQkLmV4dGVuZCgkLlNtYXJ0TWVudXMsIHtcblx0XHRoaWRlQWxsOiBmdW5jdGlvbigpIHtcblx0XHRcdCQuZWFjaChtZW51VHJlZXMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLm1lbnVIaWRlQWxsKCk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdFx0d2hpbGUgKG1lbnVUcmVlcy5sZW5ndGgpIHtcblx0XHRcdFx0bWVudVRyZWVzWzBdLmRlc3Ryb3koKTtcblx0XHRcdH1cblx0XHRcdGluaXRNb3VzZURldGVjdGlvbih0cnVlKTtcblx0XHR9LFxuXHRcdHByb3RvdHlwZToge1xuXHRcdFx0aW5pdDogZnVuY3Rpb24ocmVmcmVzaCkge1xuXHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdFx0aWYgKCFyZWZyZXNoKSB7XG5cdFx0XHRcdFx0bWVudVRyZWVzLnB1c2godGhpcyk7XG5cblx0XHRcdFx0XHR0aGlzLnJvb3RJZCA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSArIE1hdGgucmFuZG9tKCkgKyAnJykucmVwbGFjZSgvXFxEL2csICcnKTtcblxuXHRcdFx0XHRcdGlmICh0aGlzLiRyb290Lmhhc0NsYXNzKCdzbS1ydGwnKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5vcHRzLnJpZ2h0VG9MZWZ0U3ViTWVudXMgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIGluaXQgcm9vdCAobWFpbiBtZW51KVxuXHRcdFx0XHRcdHZhciBlTlMgPSAnLnNtYXJ0bWVudXMnO1xuXHRcdFx0XHRcdHRoaXMuJHJvb3Rcblx0XHRcdFx0XHRcdC5kYXRhKCdzbWFydG1lbnVzJywgdGhpcylcblx0XHRcdFx0XHRcdC5hdHRyKCdkYXRhLXNtYXJ0bWVudXMtaWQnLCB0aGlzLnJvb3RJZClcblx0XHRcdFx0XHRcdC5kYXRhU00oJ2xldmVsJywgMSlcblx0XHRcdFx0XHRcdC5iaW5kKGdldEV2ZW50c05TKFtcblx0XHRcdFx0XHRcdFx0Wydtb3VzZW92ZXIgZm9jdXNpbicsICQucHJveHkodGhpcy5yb290T3ZlciwgdGhpcyldLFxuXHRcdFx0XHRcdFx0XHRbJ21vdXNlb3V0IGZvY3Vzb3V0JywgJC5wcm94eSh0aGlzLnJvb3RPdXQsIHRoaXMpXVxuXHRcdFx0XHRcdFx0XSwgZU5TKSlcblx0XHRcdFx0XHRcdC5kZWxlZ2F0ZSgnYScsIGdldEV2ZW50c05TKFtcblx0XHRcdFx0XHRcdFx0Wydtb3VzZWVudGVyJywgJC5wcm94eSh0aGlzLml0ZW1FbnRlciwgdGhpcyldLFxuXHRcdFx0XHRcdFx0XHRbJ21vdXNlbGVhdmUnLCAkLnByb3h5KHRoaXMuaXRlbUxlYXZlLCB0aGlzKV0sXG5cdFx0XHRcdFx0XHRcdFsnbW91c2Vkb3duJywgJC5wcm94eSh0aGlzLml0ZW1Eb3duLCB0aGlzKV0sXG5cdFx0XHRcdFx0XHRcdFsnZm9jdXMnLCAkLnByb3h5KHRoaXMuaXRlbUZvY3VzLCB0aGlzKV0sXG5cdFx0XHRcdFx0XHRcdFsnYmx1cicsICQucHJveHkodGhpcy5pdGVtQmx1ciwgdGhpcyldLFxuXHRcdFx0XHRcdFx0XHRbJ2NsaWNrJywgJC5wcm94eSh0aGlzLml0ZW1DbGljaywgdGhpcyldLFxuXHRcdFx0XHRcdFx0XHRbJ3RvdWNoZW5kJywgJC5wcm94eSh0aGlzLml0ZW1Ub3VjaEVuZCwgdGhpcyldXG5cdFx0XHRcdFx0XHRdLCBlTlMpKTtcblxuXHRcdFx0XHRcdC8vIGhpZGUgbWVudXMgb24gdGFwIG9yIGNsaWNrIG91dHNpZGUgdGhlIHJvb3QgVUxcblx0XHRcdFx0XHRlTlMgKz0gdGhpcy5yb290SWQ7XG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5oaWRlT25DbGljaykge1xuXHRcdFx0XHRcdFx0JChkb2N1bWVudCkuYmluZChnZXRFdmVudHNOUyhbXG5cdFx0XHRcdFx0XHRcdFsndG91Y2hzdGFydCcsICQucHJveHkodGhpcy5kb2NUb3VjaFN0YXJ0LCB0aGlzKV0sXG5cdFx0XHRcdFx0XHRcdFsndG91Y2htb3ZlJywgJC5wcm94eSh0aGlzLmRvY1RvdWNoTW92ZSwgdGhpcyldLFxuXHRcdFx0XHRcdFx0XHRbJ3RvdWNoZW5kJywgJC5wcm94eSh0aGlzLmRvY1RvdWNoRW5kLCB0aGlzKV0sXG5cdFx0XHRcdFx0XHRcdC8vIGZvciBPcGVyYSBNb2JpbGUgPCAxMS41LCB3ZWJPUyBicm93c2VyLCBldGMuIHdlJ2xsIGNoZWNrIGNsaWNrIHRvb1xuXHRcdFx0XHRcdFx0XHRbJ2NsaWNrJywgJC5wcm94eSh0aGlzLmRvY0NsaWNrLCB0aGlzKV1cblx0XHRcdFx0XHRcdF0sIGVOUykpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBoaWRlIHN1YiBtZW51cyBvbiByZXNpemVcblx0XHRcdFx0XHQkKHdpbmRvdykuYmluZChnZXRFdmVudHNOUyhbWydyZXNpemUgb3JpZW50YXRpb25jaGFuZ2UnLCAkLnByb3h5KHRoaXMud2luUmVzaXplLCB0aGlzKV1dLCBlTlMpKTtcblxuXHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuc3ViSW5kaWNhdG9ycykge1xuXHRcdFx0XHRcdFx0dGhpcy4kc3ViQXJyb3cgPSAkKCc8c3Bhbi8+JykuYWRkQ2xhc3MoJ3N1Yi1hcnJvdycpO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5zdWJJbmRpY2F0b3JzVGV4dCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLiRzdWJBcnJvdy5odG1sKHRoaXMub3B0cy5zdWJJbmRpY2F0b3JzVGV4dCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gbWFrZSBzdXJlIG1vdXNlIGRldGVjdGlvbiBpcyBlbmFibGVkXG5cdFx0XHRcdFx0aW5pdE1vdXNlRGV0ZWN0aW9uKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBpbml0IHN1YiBtZW51c1xuXHRcdFx0XHR0aGlzLiRmaXJzdFN1YiA9IHRoaXMuJHJvb3QuZmluZCgndWwnKS5lYWNoKGZ1bmN0aW9uKCkgeyBzZWxmLm1lbnVJbml0KCQodGhpcykpOyB9KS5lcSgwKTtcblxuXHRcdFx0XHR0aGlzLiRmaXJzdExpbmsgPSB0aGlzLiRyb290LmZpbmQoJ2EnKS5lcSgwKTtcblxuXHRcdFx0XHQvLyBmaW5kIGN1cnJlbnQgaXRlbVxuXHRcdFx0XHRpZiAodGhpcy5vcHRzLm1hcmtDdXJyZW50SXRlbSkge1xuXHRcdFx0XHRcdHZhciByZURlZmF1bHREb2MgPSAvKGluZGV4fGRlZmF1bHQpXFwuW14jXFw/XFwvXSovaSxcblx0XHRcdFx0XHRcdHJlSGFzaCA9IC8jLiovLFxuXHRcdFx0XHRcdFx0bG9jSHJlZiA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UocmVEZWZhdWx0RG9jLCAnJyksXG5cdFx0XHRcdFx0XHRsb2NIcmVmTm9IYXNoID0gbG9jSHJlZi5yZXBsYWNlKHJlSGFzaCwgJycpO1xuXHRcdFx0XHRcdHRoaXMuJHJvb3QuZmluZCgnYScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgaHJlZiA9IHRoaXMuaHJlZi5yZXBsYWNlKHJlRGVmYXVsdERvYywgJycpLFxuXHRcdFx0XHRcdFx0XHQkdGhpcyA9ICQodGhpcyk7XG5cdFx0XHRcdFx0XHRpZiAoaHJlZiA9PSBsb2NIcmVmIHx8IGhyZWYgPT0gbG9jSHJlZk5vSGFzaCkge1xuXHRcdFx0XHRcdFx0XHQkdGhpcy5hZGRDbGFzcygnY3VycmVudCcpO1xuXHRcdFx0XHRcdFx0XHRpZiAoc2VsZi5vcHRzLm1hcmtDdXJyZW50VHJlZSkge1xuXHRcdFx0XHRcdFx0XHRcdCR0aGlzLnBhcmVudCgpLnBhcmVudHNVbnRpbCgnW2RhdGEtc21hcnRtZW51cy1pZF0nLCAnbGknKS5jaGlsZHJlbignYScpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLm1lbnVIaWRlQWxsKCk7XG5cdFx0XHRcdHZhciBlTlMgPSAnLnNtYXJ0bWVudXMnO1xuXHRcdFx0XHR0aGlzLiRyb290XG5cdFx0XHRcdFx0LnJlbW92ZURhdGEoJ3NtYXJ0bWVudXMnKVxuXHRcdFx0XHRcdC5yZW1vdmVBdHRyKCdkYXRhLXNtYXJ0bWVudXMtaWQnKVxuXHRcdFx0XHRcdC5yZW1vdmVEYXRhU00oJ2xldmVsJylcblx0XHRcdFx0XHQudW5iaW5kKGVOUylcblx0XHRcdFx0XHQudW5kZWxlZ2F0ZShlTlMpO1xuXHRcdFx0XHRlTlMgKz0gdGhpcy5yb290SWQ7XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnVuYmluZChlTlMpO1xuXHRcdFx0XHQkKHdpbmRvdykudW5iaW5kKGVOUyk7XG5cdFx0XHRcdGlmICh0aGlzLm9wdHMuc3ViSW5kaWNhdG9ycykge1xuXHRcdFx0XHRcdHRoaXMuJHN1YkFycm93ID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRcdCQuZWFjaCh0aGlzLnN1Yk1lbnVzLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5oYXNDbGFzcygnbWVnYS1tZW51JykpIHtcblx0XHRcdFx0XHRcdHRoaXMuZmluZCgndWwnKS5yZW1vdmVEYXRhU00oJ2luLW1lZ2EnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuZGF0YVNNKCdzaG93bi1iZWZvcmUnKSkge1xuXHRcdFx0XHRcdFx0aWYgKHNlbGYub3B0cy5zdWJNZW51c01pbldpZHRoIHx8IHNlbGYub3B0cy5zdWJNZW51c01heFdpZHRoKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuY3NzKHsgd2lkdGg6ICcnLCBtaW5XaWR0aDogJycsIG1heFdpZHRoOiAnJyB9KS5yZW1vdmVDbGFzcygnc20tbm93cmFwJyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5kYXRhU00oJ3Njcm9sbC1hcnJvd3MnKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmRhdGFTTSgnc2Nyb2xsLWFycm93cycpLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5jc3MoeyB6SW5kZXg6ICcnLCB0b3A6ICcnLCBsZWZ0OiAnJywgbWFyZ2luTGVmdDogJycsIG1hcmdpblRvcDogJycsIGRpc3BsYXk6ICcnIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc2VsZi5vcHRzLnN1YkluZGljYXRvcnMpIHtcblx0XHRcdFx0XHRcdHRoaXMuZGF0YVNNKCdwYXJlbnQtYScpLnJlbW92ZUNsYXNzKCdoYXMtc3VibWVudScpLmNoaWxkcmVuKCdzcGFuLnN1Yi1hcnJvdycpLnJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnJlbW92ZURhdGFTTSgnc2hvd24tYmVmb3JlJylcblx0XHRcdFx0XHRcdC5yZW1vdmVEYXRhU00oJ2llLXNoaW0nKVxuXHRcdFx0XHRcdFx0LnJlbW92ZURhdGFTTSgnc2Nyb2xsLWFycm93cycpXG5cdFx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdwYXJlbnQtYScpXG5cdFx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdsZXZlbCcpXG5cdFx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdiZWZvcmVmaXJzdHNob3dmaXJlZCcpXG5cdFx0XHRcdFx0XHQucGFyZW50KCkucmVtb3ZlRGF0YVNNKCdzdWInKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGlmICh0aGlzLm9wdHMubWFya0N1cnJlbnRJdGVtKSB7XG5cdFx0XHRcdFx0dGhpcy4kcm9vdC5maW5kKCdhLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuJHJvb3QgPSBudWxsO1xuXHRcdFx0XHR0aGlzLiRmaXJzdExpbmsgPSBudWxsO1xuXHRcdFx0XHR0aGlzLiRmaXJzdFN1YiA9IG51bGw7XG5cdFx0XHRcdGlmICh0aGlzLiRkaXNhYmxlT3ZlcmxheSkge1xuXHRcdFx0XHRcdHRoaXMuJGRpc2FibGVPdmVybGF5LnJlbW92ZSgpO1xuXHRcdFx0XHRcdHRoaXMuJGRpc2FibGVPdmVybGF5ID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRtZW51VHJlZXMuc3BsaWNlKCQuaW5BcnJheSh0aGlzLCBtZW51VHJlZXMpLCAxKTtcblx0XHRcdH0sXG5cdFx0XHRkaXNhYmxlOiBmdW5jdGlvbihub092ZXJsYXkpIHtcblx0XHRcdFx0aWYgKCF0aGlzLmRpc2FibGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5tZW51SGlkZUFsbCgpO1xuXHRcdFx0XHRcdC8vIGRpc3BsYXkgb3ZlcmxheSBvdmVyIHRoZSBtZW51IHRvIHByZXZlbnQgaW50ZXJhY3Rpb25cblx0XHRcdFx0XHRpZiAoIW5vT3ZlcmxheSAmJiAhdGhpcy5vcHRzLmlzUG9wdXAgJiYgdGhpcy4kcm9vdC5pcygnOnZpc2libGUnKSkge1xuXHRcdFx0XHRcdFx0dmFyIHBvcyA9IHRoaXMuJHJvb3Qub2Zmc2V0KCk7XG5cdFx0XHRcdFx0XHR0aGlzLiRkaXNhYmxlT3ZlcmxheSA9ICQoJzxkaXYgY2xhc3M9XCJzbS1qcXVlcnktZGlzYWJsZS1vdmVybGF5XCIvPicpLmNzcyh7XG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHRcdFx0XHRcdFx0XHR0b3A6IHBvcy50b3AsXG5cdFx0XHRcdFx0XHRcdGxlZnQ6IHBvcy5sZWZ0LFxuXHRcdFx0XHRcdFx0XHR3aWR0aDogdGhpcy4kcm9vdC5vdXRlcldpZHRoKCksXG5cdFx0XHRcdFx0XHRcdGhlaWdodDogdGhpcy4kcm9vdC5vdXRlckhlaWdodCgpLFxuXHRcdFx0XHRcdFx0XHR6SW5kZXg6IHRoaXMuZ2V0U3RhcnRaSW5kZXgodHJ1ZSksXG5cdFx0XHRcdFx0XHRcdG9wYWNpdHk6IDBcblx0XHRcdFx0XHRcdH0pLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLmRpc2FibGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGRvY0NsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGlmICh0aGlzLmlzVG91Y2hTY3JvbGxpbmcpIHtcblx0XHRcdFx0XHR0aGlzLmlzVG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gaGlkZSBvbiBhbnkgY2xpY2sgb3V0c2lkZSB0aGUgbWVudSBvciBvbiBhIG1lbnUgbGlua1xuXHRcdFx0XHRpZiAodGhpcy52aXNpYmxlU3ViTWVudXMubGVuZ3RoICYmICEkLmNvbnRhaW5zKHRoaXMuJHJvb3RbMF0sIGUudGFyZ2V0KSB8fCAkKGUudGFyZ2V0KS5pcygnYScpKSB7XG5cdFx0XHRcdFx0dGhpcy5tZW51SGlkZUFsbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZG9jVG91Y2hFbmQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0aWYgKCF0aGlzLmxhc3RUb3VjaCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy52aXNpYmxlU3ViTWVudXMubGVuZ3RoICYmICh0aGlzLmxhc3RUb3VjaC54MiA9PT0gdW5kZWZpbmVkIHx8IHRoaXMubGFzdFRvdWNoLngxID09IHRoaXMubGFzdFRvdWNoLngyKSAmJiAodGhpcy5sYXN0VG91Y2gueTIgPT09IHVuZGVmaW5lZCB8fCB0aGlzLmxhc3RUb3VjaC55MSA9PSB0aGlzLmxhc3RUb3VjaC55MikgJiYgKCF0aGlzLmxhc3RUb3VjaC50YXJnZXQgfHwgISQuY29udGFpbnModGhpcy4kcm9vdFswXSwgdGhpcy5sYXN0VG91Y2gudGFyZ2V0KSkpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5oaWRlVGltZW91dCkge1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuXHRcdFx0XHRcdFx0dGhpcy5oaWRlVGltZW91dCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIGhpZGUgd2l0aCBhIGRlbGF5IHRvIHByZXZlbnQgdHJpZ2dlcmluZyBhY2NpZGVudGFsIHVud2FudGVkIGNsaWNrIG9uIHNvbWUgcGFnZSBlbGVtZW50XG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFx0XHRcdHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBzZWxmLm1lbnVIaWRlQWxsKCk7IH0sIDM1MCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5sYXN0VG91Y2ggPSBudWxsO1xuXHRcdFx0fSxcblx0XHRcdGRvY1RvdWNoTW92ZTogZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRpZiAoIXRoaXMubGFzdFRvdWNoKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB0b3VjaFBvaW50ID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF07XG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoLngyID0gdG91Y2hQb2ludC5wYWdlWDtcblx0XHRcdFx0dGhpcy5sYXN0VG91Y2gueTIgPSB0b3VjaFBvaW50LnBhZ2VZO1xuXHRcdFx0fSxcblx0XHRcdGRvY1RvdWNoU3RhcnQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0dmFyIHRvdWNoUG9pbnQgPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXTtcblx0XHRcdFx0dGhpcy5sYXN0VG91Y2ggPSB7IHgxOiB0b3VjaFBvaW50LnBhZ2VYLCB5MTogdG91Y2hQb2ludC5wYWdlWSwgdGFyZ2V0OiB0b3VjaFBvaW50LnRhcmdldCB9O1xuXHRcdFx0fSxcblx0XHRcdGVuYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuJGRpc2FibGVPdmVybGF5KSB7XG5cdFx0XHRcdFx0XHR0aGlzLiRkaXNhYmxlT3ZlcmxheS5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdHRoaXMuJGRpc2FibGVPdmVybGF5ID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Z2V0Q2xvc2VzdE1lbnU6IGZ1bmN0aW9uKGVsbSkge1xuXHRcdFx0XHR2YXIgJGNsb3Nlc3RNZW51ID0gJChlbG0pLmNsb3Nlc3QoJ3VsJyk7XG5cdFx0XHRcdHdoaWxlICgkY2xvc2VzdE1lbnUuZGF0YVNNKCdpbi1tZWdhJykpIHtcblx0XHRcdFx0XHQkY2xvc2VzdE1lbnUgPSAkY2xvc2VzdE1lbnUucGFyZW50KCkuY2xvc2VzdCgndWwnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gJGNsb3Nlc3RNZW51WzBdIHx8IG51bGw7XG5cdFx0XHR9LFxuXHRcdFx0Z2V0SGVpZ2h0OiBmdW5jdGlvbigkZWxtKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmdldE9mZnNldCgkZWxtLCB0cnVlKTtcblx0XHRcdH0sXG5cdFx0XHQvLyByZXR1cm5zIHByZWNpc2Ugd2lkdGgvaGVpZ2h0IGZsb2F0IHZhbHVlc1xuXHRcdFx0Z2V0T2Zmc2V0OiBmdW5jdGlvbigkZWxtLCBoZWlnaHQpIHtcblx0XHRcdFx0dmFyIG9sZDtcblx0XHRcdFx0aWYgKCRlbG0uY3NzKCdkaXNwbGF5JykgPT0gJ25vbmUnKSB7XG5cdFx0XHRcdFx0b2xkID0geyBwb3NpdGlvbjogJGVsbVswXS5zdHlsZS5wb3NpdGlvbiwgdmlzaWJpbGl0eTogJGVsbVswXS5zdHlsZS52aXNpYmlsaXR5IH07XG5cdFx0XHRcdFx0JGVsbS5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgdmlzaWJpbGl0eTogJ2hpZGRlbicgfSkuc2hvdygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBib3ggPSAkZWxtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAmJiAkZWxtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuXHRcdFx0XHRcdHZhbCA9IGJveCAmJiAoaGVpZ2h0ID8gYm94LmhlaWdodCB8fCBib3guYm90dG9tIC0gYm94LnRvcCA6IGJveC53aWR0aCB8fCBib3gucmlnaHQgLSBib3gubGVmdCk7XG5cdFx0XHRcdGlmICghdmFsICYmIHZhbCAhPT0gMCkge1xuXHRcdFx0XHRcdHZhbCA9IGhlaWdodCA/ICRlbG1bMF0ub2Zmc2V0SGVpZ2h0IDogJGVsbVswXS5vZmZzZXRXaWR0aDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAob2xkKSB7XG5cdFx0XHRcdFx0JGVsbS5oaWRlKCkuY3NzKG9sZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbDtcblx0XHRcdH0sXG5cdFx0XHRnZXRTdGFydFpJbmRleDogZnVuY3Rpb24ocm9vdCkge1xuXHRcdFx0XHR2YXIgekluZGV4ID0gcGFyc2VJbnQodGhpc1tyb290ID8gJyRyb290JyA6ICckZmlyc3RTdWInXS5jc3MoJ3otaW5kZXgnKSk7XG5cdFx0XHRcdGlmICghcm9vdCAmJiBpc05hTih6SW5kZXgpKSB7XG5cdFx0XHRcdFx0ekluZGV4ID0gcGFyc2VJbnQodGhpcy4kcm9vdC5jc3MoJ3otaW5kZXgnKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuICFpc05hTih6SW5kZXgpID8gekluZGV4IDogMTtcblx0XHRcdH0sXG5cdFx0XHRnZXRUb3VjaFBvaW50OiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHJldHVybiBlLnRvdWNoZXMgJiYgZS50b3VjaGVzWzBdIHx8IGUuY2hhbmdlZFRvdWNoZXMgJiYgZS5jaGFuZ2VkVG91Y2hlc1swXSB8fCBlO1xuXHRcdFx0fSxcblx0XHRcdGdldFZpZXdwb3J0OiBmdW5jdGlvbihoZWlnaHQpIHtcblx0XHRcdFx0dmFyIG5hbWUgPSBoZWlnaHQgPyAnSGVpZ2h0JyA6ICdXaWR0aCcsXG5cdFx0XHRcdFx0dmFsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50WydjbGllbnQnICsgbmFtZV0sXG5cdFx0XHRcdFx0dmFsMiA9IHdpbmRvd1snaW5uZXInICsgbmFtZV07XG5cdFx0XHRcdGlmICh2YWwyKSB7XG5cdFx0XHRcdFx0dmFsID0gTWF0aC5taW4odmFsLCB2YWwyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsO1xuXHRcdFx0fSxcblx0XHRcdGdldFZpZXdwb3J0SGVpZ2h0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0Vmlld3BvcnQodHJ1ZSk7XG5cdFx0XHR9LFxuXHRcdFx0Z2V0Vmlld3BvcnRXaWR0aDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFZpZXdwb3J0KCk7XG5cdFx0XHR9LFxuXHRcdFx0Z2V0V2lkdGg6IGZ1bmN0aW9uKCRlbG0pIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0T2Zmc2V0KCRlbG0pO1xuXHRcdFx0fSxcblx0XHRcdGhhbmRsZUV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAhdGhpcy5kaXNhYmxlZCAmJiB0aGlzLmlzQ1NTT24oKTtcblx0XHRcdH0sXG5cdFx0XHRoYW5kbGVJdGVtRXZlbnRzOiBmdW5jdGlvbigkYSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5oYW5kbGVFdmVudHMoKSAmJiAhdGhpcy5pc0xpbmtJbk1lZ2FNZW51KCRhKTtcblx0XHRcdH0sXG5cdFx0XHRpc0NvbGxhcHNpYmxlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuJGZpcnN0U3ViLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJztcblx0XHRcdH0sXG5cdFx0XHRpc0NTU09uOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuJGZpcnN0TGluay5jc3MoJ2Rpc3BsYXknKSA9PSAnYmxvY2snO1xuXHRcdFx0fSxcblx0XHRcdGlzRml4ZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgaXNGaXhlZCA9IHRoaXMuJHJvb3QuY3NzKCdwb3NpdGlvbicpID09ICdmaXhlZCc7XG5cdFx0XHRcdGlmICghaXNGaXhlZCkge1xuXHRcdFx0XHRcdHRoaXMuJHJvb3QucGFyZW50c1VudGlsKCdib2R5JykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGlmICgkKHRoaXMpLmNzcygncG9zaXRpb24nKSA9PSAnZml4ZWQnKSB7XG5cdFx0XHRcdFx0XHRcdGlzRml4ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGlzRml4ZWQ7XG5cdFx0XHR9LFxuXHRcdFx0aXNMaW5rSW5NZWdhTWVudTogZnVuY3Rpb24oJGEpIHtcblx0XHRcdFx0cmV0dXJuICEkYS5wYXJlbnQoKS5wYXJlbnQoKS5kYXRhU00oJ2xldmVsJyk7XG5cdFx0XHR9LFxuXHRcdFx0aXNUb3VjaE1vZGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gIW1vdXNlIHx8IHRoaXMuaXNDb2xsYXBzaWJsZSgpO1xuXHRcdFx0fSxcblx0XHRcdGl0ZW1BY3RpdmF0ZTogZnVuY3Rpb24oJGEpIHtcblx0XHRcdFx0dmFyICRsaSA9ICRhLnBhcmVudCgpLFxuXHRcdFx0XHRcdCR1bCA9ICRsaS5wYXJlbnQoKSxcblx0XHRcdFx0XHRsZXZlbCA9ICR1bC5kYXRhU00oJ2xldmVsJyk7XG5cdFx0XHRcdC8vIGlmIGZvciBzb21lIHJlYXNvbiB0aGUgcGFyZW50IGl0ZW0gaXMgbm90IGFjdGl2YXRlZCAoZS5nLiB0aGlzIGlzIGFuIEFQSSBjYWxsIHRvIGFjdGl2YXRlIHRoZSBpdGVtKSwgYWN0aXZhdGUgYWxsIHBhcmVudCBpdGVtcyBmaXJzdFxuXHRcdFx0XHRpZiAobGV2ZWwgPiAxICYmICghdGhpcy5hY3RpdmF0ZWRJdGVtc1tsZXZlbCAtIDJdIHx8IHRoaXMuYWN0aXZhdGVkSXRlbXNbbGV2ZWwgLSAyXVswXSAhPSAkdWwuZGF0YVNNKCdwYXJlbnQtYScpWzBdKSkge1xuXHRcdFx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdFx0XHQkKCR1bC5wYXJlbnRzVW50aWwoJ1tkYXRhLXNtYXJ0bWVudXMtaWRdJywgJ3VsJykuZ2V0KCkucmV2ZXJzZSgpKS5hZGQoJHVsKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0c2VsZi5pdGVtQWN0aXZhdGUoJCh0aGlzKS5kYXRhU00oJ3BhcmVudC1hJykpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGhpZGUgYW55IHZpc2libGUgZGVlcGVyIGxldmVsIHN1YiBtZW51c1xuXHRcdFx0XHRpZiAodGhpcy52aXNpYmxlU3ViTWVudXMubGVuZ3RoID4gbGV2ZWwpIHtcblx0XHRcdFx0XHR0aGlzLm1lbnVIaWRlU3ViTWVudXMoIXRoaXMuYWN0aXZhdGVkSXRlbXNbbGV2ZWwgLSAxXSB8fCB0aGlzLmFjdGl2YXRlZEl0ZW1zW2xldmVsIC0gMV1bMF0gIT0gJGFbMF0gPyBsZXZlbCAtIDEgOiBsZXZlbCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gc2F2ZSBuZXcgYWN0aXZlIGl0ZW0gYW5kIHN1YiBtZW51IGZvciB0aGlzIGxldmVsXG5cdFx0XHRcdHRoaXMuYWN0aXZhdGVkSXRlbXNbbGV2ZWwgLSAxXSA9ICRhO1xuXHRcdFx0XHR0aGlzLnZpc2libGVTdWJNZW51c1tsZXZlbCAtIDFdID0gJHVsO1xuXHRcdFx0XHRpZiAodGhpcy4kcm9vdC50cmlnZ2VySGFuZGxlcignYWN0aXZhdGUuc21hcGknLCAkYVswXSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHNob3cgdGhlIHN1YiBtZW51IGlmIHRoaXMgaXRlbSBoYXMgb25lXG5cdFx0XHRcdHZhciAkc3ViID0gJGxpLmRhdGFTTSgnc3ViJyk7XG5cdFx0XHRcdGlmICgkc3ViICYmICh0aGlzLmlzVG91Y2hNb2RlKCkgfHwgKCF0aGlzLm9wdHMuc2hvd09uQ2xpY2sgfHwgdGhpcy5jbGlja0FjdGl2YXRlZCkpKSB7XG5cdFx0XHRcdFx0dGhpcy5tZW51U2hvdygkc3ViKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGl0ZW1CbHVyOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHZhciAkYSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcblx0XHRcdFx0aWYgKCF0aGlzLmhhbmRsZUl0ZW1FdmVudHMoJGEpKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuJHJvb3QudHJpZ2dlckhhbmRsZXIoJ2JsdXIuc21hcGknLCAkYVswXSk7XG5cdFx0XHR9LFxuXHRcdFx0aXRlbUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGlmICh0aGlzLmlzVG91Y2hTY3JvbGxpbmcpIHtcblx0XHRcdFx0XHR0aGlzLmlzVG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcblx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgJGEgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdGlmICghdGhpcy5oYW5kbGVJdGVtRXZlbnRzKCRhKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkYS5yZW1vdmVEYXRhU00oJ21vdXNlZG93bicpO1xuXHRcdFx0XHRpZiAodGhpcy4kcm9vdC50cmlnZ2VySGFuZGxlcignY2xpY2suc21hcGknLCAkYVswXSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciAkc3ViID0gJGEucGFyZW50KCkuZGF0YVNNKCdzdWInKTtcblx0XHRcdFx0aWYgKHRoaXMuaXNUb3VjaE1vZGUoKSkge1xuXHRcdFx0XHRcdC8vIHVuZG8gZml4OiBwcmV2ZW50IHRoZSBhZGRyZXNzIGJhciBvbiBpUGhvbmUgZnJvbSBzbGlkaW5nIGRvd24gd2hlbiBleHBhbmRpbmcgYSBzdWIgbWVudVxuXHRcdFx0XHRcdGlmICgkYS5kYXRhU00oJ2hyZWYnKSkge1xuXHRcdFx0XHRcdFx0JGEuYXR0cignaHJlZicsICRhLmRhdGFTTSgnaHJlZicpKS5yZW1vdmVEYXRhU00oJ2hyZWYnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHN1YiBpcyBub3QgdmlzaWJsZVxuXHRcdFx0XHRcdGlmICgkc3ViICYmICghJHN1Yi5kYXRhU00oJ3Nob3duLWJlZm9yZScpIHx8ICEkc3ViLmlzKCc6dmlzaWJsZScpKSkge1xuXHRcdFx0XHRcdFx0Ly8gdHJ5IHRvIGFjdGl2YXRlIHRoZSBpdGVtIGFuZCBzaG93IHRoZSBzdWJcblx0XHRcdFx0XHRcdHRoaXMuaXRlbUFjdGl2YXRlKCRhKTtcblx0XHRcdFx0XHRcdC8vIGlmIFwiaXRlbUFjdGl2YXRlXCIgc2hvd2VkIHRoZSBzdWIsIHByZXZlbnQgdGhlIGNsaWNrIHNvIHRoYXQgdGhlIGxpbmsgaXMgbm90IGxvYWRlZFxuXHRcdFx0XHRcdFx0Ly8gaWYgaXQgY291bGRuJ3Qgc2hvdyBpdCwgdGhlbiB0aGUgc3ViIG1lbnVzIGFyZSBkaXNhYmxlZCB3aXRoIGFuICFpbXBvcnRhbnQgZGVjbGFyYXRpb24gKGUuZy4gdmlhIG1vYmlsZSBzdHlsZXMpIHNvIGxldCB0aGUgbGluayBnZXQgbG9hZGVkXG5cdFx0XHRcdFx0XHRpZiAoJHN1Yi5pcygnOnZpc2libGUnKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMub3B0cy5zaG93T25DbGljayAmJiAkYS5wYXJlbnQoKS5wYXJlbnQoKS5kYXRhU00oJ2xldmVsJykgPT0gMSAmJiAkc3ViKSB7XG5cdFx0XHRcdFx0dGhpcy5jbGlja0FjdGl2YXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0dGhpcy5tZW51U2hvdygkc3ViKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCRhLmhhc0NsYXNzKCdkaXNhYmxlZCcpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLiRyb290LnRyaWdnZXJIYW5kbGVyKCdzZWxlY3Quc21hcGknLCAkYVswXSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aXRlbURvd246IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0dmFyICRhID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXHRcdFx0XHRpZiAoIXRoaXMuaGFuZGxlSXRlbUV2ZW50cygkYSkpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JGEuZGF0YVNNKCdtb3VzZWRvd24nLCB0cnVlKTtcblx0XHRcdH0sXG5cdFx0XHRpdGVtRW50ZXI6IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0dmFyICRhID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXHRcdFx0XHRpZiAoIXRoaXMuaGFuZGxlSXRlbUV2ZW50cygkYSkpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCF0aGlzLmlzVG91Y2hNb2RlKCkpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5zaG93VGltZW91dCkge1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuc2hvd1RpbWVvdXQpO1xuXHRcdFx0XHRcdFx0dGhpcy5zaG93VGltZW91dCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdFx0XHR0aGlzLnNob3dUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgc2VsZi5pdGVtQWN0aXZhdGUoJGEpOyB9LCB0aGlzLm9wdHMuc2hvd09uQ2xpY2sgJiYgJGEucGFyZW50KCkucGFyZW50KCkuZGF0YVNNKCdsZXZlbCcpID09IDEgPyAxIDogdGhpcy5vcHRzLnNob3dUaW1lb3V0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLiRyb290LnRyaWdnZXJIYW5kbGVyKCdtb3VzZWVudGVyLnNtYXBpJywgJGFbMF0pO1xuXHRcdFx0fSxcblx0XHRcdGl0ZW1Gb2N1czogZnVuY3Rpb24oZSkge1xuXHRcdFx0XHR2YXIgJGEgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdGlmICghdGhpcy5oYW5kbGVJdGVtRXZlbnRzKCRhKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBmaXggKHRoZSBtb3VzZWRvd24gY2hlY2spOiBpbiBzb21lIGJyb3dzZXJzIGEgdGFwL2NsaWNrIHByb2R1Y2VzIGNvbnNlY3V0aXZlIGZvY3VzICsgY2xpY2sgZXZlbnRzIHNvIHdlIGRvbid0IG5lZWQgdG8gYWN0aXZhdGUgdGhlIGl0ZW0gb24gZm9jdXNcblx0XHRcdFx0aWYgKCghdGhpcy5pc1RvdWNoTW9kZSgpIHx8ICEkYS5kYXRhU00oJ21vdXNlZG93bicpKSAmJiAoIXRoaXMuYWN0aXZhdGVkSXRlbXMubGVuZ3RoIHx8IHRoaXMuYWN0aXZhdGVkSXRlbXNbdGhpcy5hY3RpdmF0ZWRJdGVtcy5sZW5ndGggLSAxXVswXSAhPSAkYVswXSkpIHtcblx0XHRcdFx0XHR0aGlzLml0ZW1BY3RpdmF0ZSgkYSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy4kcm9vdC50cmlnZ2VySGFuZGxlcignZm9jdXMuc21hcGknLCAkYVswXSk7XG5cdFx0XHR9LFxuXHRcdFx0aXRlbUxlYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHZhciAkYSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcblx0XHRcdFx0aWYgKCF0aGlzLmhhbmRsZUl0ZW1FdmVudHMoJGEpKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghdGhpcy5pc1RvdWNoTW9kZSgpKSB7XG5cdFx0XHRcdFx0aWYgKCRhWzBdLmJsdXIpIHtcblx0XHRcdFx0XHRcdCRhWzBdLmJsdXIoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuc2hvd1RpbWVvdXQpIHtcblx0XHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnNob3dUaW1lb3V0KTtcblx0XHRcdFx0XHRcdHRoaXMuc2hvd1RpbWVvdXQgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQkYS5yZW1vdmVEYXRhU00oJ21vdXNlZG93bicpO1xuXHRcdFx0XHR0aGlzLiRyb290LnRyaWdnZXJIYW5kbGVyKCdtb3VzZWxlYXZlLnNtYXBpJywgJGFbMF0pO1xuXHRcdFx0fSxcblx0XHRcdGl0ZW1Ub3VjaEVuZDogZnVuY3Rpb24oZSkge1xuXHRcdFx0XHR2YXIgJGEgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cdFx0XHRcdGlmICghdGhpcy5oYW5kbGVJdGVtRXZlbnRzKCRhKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBwcmV2ZW50IHRoZSBhZGRyZXNzIGJhciBvbiBpUGhvbmUgZnJvbSBzbGlkaW5nIGRvd24gd2hlbiBleHBhbmRpbmcgYSBzdWIgbWVudVxuXHRcdFx0XHR2YXIgJHN1YiA9ICRhLnBhcmVudCgpLmRhdGFTTSgnc3ViJyk7XG5cdFx0XHRcdGlmICgkYS5hdHRyKCdocmVmJykuY2hhckF0KDApICE9PSAnIycgJiYgJHN1YiAmJiAoISRzdWIuZGF0YVNNKCdzaG93bi1iZWZvcmUnKSB8fCAhJHN1Yi5pcygnOnZpc2libGUnKSkpIHtcblx0XHRcdFx0XHQkYS5kYXRhU00oJ2hyZWYnLCAkYS5hdHRyKCdocmVmJykpO1xuXHRcdFx0XHRcdCRhLmF0dHIoJ2hyZWYnLCAnIycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudUZpeExheW91dDogZnVuY3Rpb24oJHVsKSB7XG5cdFx0XHRcdC8vIGZpeGVzIGEgbWVudSB0aGF0IGlzIGJlaW5nIHNob3duIGZvciB0aGUgZmlyc3QgdGltZVxuXHRcdFx0XHRpZiAoISR1bC5kYXRhU00oJ3Nob3duLWJlZm9yZScpKSB7XG5cdFx0XHRcdFx0JHVsLmhpZGUoKS5kYXRhU00oJ3Nob3duLWJlZm9yZScsIHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudUhpZGU6IGZ1bmN0aW9uKCRzdWIpIHtcblx0XHRcdFx0aWYgKHRoaXMuJHJvb3QudHJpZ2dlckhhbmRsZXIoJ2JlZm9yZWhpZGUuc21hcGknLCAkc3ViWzBdKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JHN1Yi5zdG9wKHRydWUsIHRydWUpO1xuXHRcdFx0XHRpZiAoJHN1Yi5pcygnOnZpc2libGUnKSkge1xuXHRcdFx0XHRcdHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0Ly8gdW5zZXQgei1pbmRleFxuXHRcdFx0XHRcdFx0JHN1Yi5jc3MoJ3otaW5kZXgnLCAnJyk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHQvLyBpZiBzdWIgaXMgY29sbGFwc2libGUgKG1vYmlsZSB2aWV3KVxuXHRcdFx0XHRcdGlmICh0aGlzLmlzQ29sbGFwc2libGUoKSkge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5jb2xsYXBzaWJsZUhpZGVGdW5jdGlvbikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm9wdHMuY29sbGFwc2libGVIaWRlRnVuY3Rpb24uY2FsbCh0aGlzLCAkc3ViLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkc3ViLmhpZGUodGhpcy5vcHRzLmNvbGxhcHNpYmxlSGlkZUR1cmF0aW9uLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuaGlkZUZ1bmN0aW9uKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub3B0cy5oaWRlRnVuY3Rpb24uY2FsbCh0aGlzLCAkc3ViLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkc3ViLmhpZGUodGhpcy5vcHRzLmhpZGVEdXJhdGlvbiwgY29tcGxldGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyByZW1vdmUgSUUgaWZyYW1lIHNoaW1cblx0XHRcdFx0XHRpZiAoJHN1Yi5kYXRhU00oJ2llLXNoaW0nKSkge1xuXHRcdFx0XHRcdFx0JHN1Yi5kYXRhU00oJ2llLXNoaW0nKS5yZW1vdmUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gZGVhY3RpdmF0ZSBzY3JvbGxpbmcgaWYgaXQgaXMgYWN0aXZhdGVkIGZvciB0aGlzIHN1YlxuXHRcdFx0XHRcdGlmICgkc3ViLmRhdGFTTSgnc2Nyb2xsJykpIHtcblx0XHRcdFx0XHRcdHRoaXMubWVudVNjcm9sbFN0b3AoJHN1Yik7XG5cdFx0XHRcdFx0XHQkc3ViLmNzcyh7ICd0b3VjaC1hY3Rpb24nOiAnJywgJy1tcy10b3VjaC1hY3Rpb24nOiAnJyB9KVxuXHRcdFx0XHRcdFx0XHQudW5iaW5kKCcuc21hcnRtZW51c19zY3JvbGwnKS5yZW1vdmVEYXRhU00oJ3Njcm9sbCcpLmRhdGFTTSgnc2Nyb2xsLWFycm93cycpLmhpZGUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gdW5oaWdobGlnaHQgcGFyZW50IGl0ZW1cblx0XHRcdFx0XHQkc3ViLmRhdGFTTSgncGFyZW50LWEnKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0ZWQnKTtcblx0XHRcdFx0XHR2YXIgbGV2ZWwgPSAkc3ViLmRhdGFTTSgnbGV2ZWwnKTtcblx0XHRcdFx0XHR0aGlzLmFjdGl2YXRlZEl0ZW1zLnNwbGljZShsZXZlbCAtIDEsIDEpO1xuXHRcdFx0XHRcdHRoaXMudmlzaWJsZVN1Yk1lbnVzLnNwbGljZShsZXZlbCAtIDEsIDEpO1xuXHRcdFx0XHRcdHRoaXMuJHJvb3QudHJpZ2dlckhhbmRsZXIoJ2hpZGUuc21hcGknLCAkc3ViWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG1lbnVIaWRlQWxsOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKHRoaXMuc2hvd1RpbWVvdXQpIHtcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGhpcy5zaG93VGltZW91dCk7XG5cdFx0XHRcdFx0dGhpcy5zaG93VGltZW91dCA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gaGlkZSBhbGwgc3Vic1xuXHRcdFx0XHR0aGlzLm1lbnVIaWRlU3ViTWVudXMoKTtcblx0XHRcdFx0Ly8gaGlkZSByb290IGlmIGl0J3MgcG9wdXBcblx0XHRcdFx0aWYgKHRoaXMub3B0cy5pc1BvcHVwKSB7XG5cdFx0XHRcdFx0dGhpcy4kcm9vdC5zdG9wKHRydWUsIHRydWUpO1xuXHRcdFx0XHRcdGlmICh0aGlzLiRyb290LmlzKCc6dmlzaWJsZScpKSB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vcHRzLmhpZGVGdW5jdGlvbikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm9wdHMuaGlkZUZ1bmN0aW9uLmNhbGwodGhpcywgdGhpcy4kcm9vdCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLiRyb290LmhpZGUodGhpcy5vcHRzLmhpZGVEdXJhdGlvbik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQvLyByZW1vdmUgSUUgaWZyYW1lIHNoaW1cblx0XHRcdFx0XHRcdGlmICh0aGlzLiRyb290LmRhdGFTTSgnaWUtc2hpbScpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuJHJvb3QuZGF0YVNNKCdpZS1zaGltJykucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuYWN0aXZhdGVkSXRlbXMgPSBbXTtcblx0XHRcdFx0dGhpcy52aXNpYmxlU3ViTWVudXMgPSBbXTtcblx0XHRcdFx0dGhpcy5jbGlja0FjdGl2YXRlZCA9IGZhbHNlO1xuXHRcdFx0XHQvLyByZXNldCB6LWluZGV4IGluY3JlbWVudFxuXHRcdFx0XHR0aGlzLnpJbmRleEluYyA9IDA7XG5cdFx0XHR9LFxuXHRcdFx0bWVudUhpZGVTdWJNZW51czogZnVuY3Rpb24obGV2ZWwpIHtcblx0XHRcdFx0aWYgKCFsZXZlbClcblx0XHRcdFx0XHRsZXZlbCA9IDA7XG5cdFx0XHRcdGZvciAodmFyIGkgPSB0aGlzLnZpc2libGVTdWJNZW51cy5sZW5ndGggLSAxOyBpID4gbGV2ZWw7IGktLSkge1xuXHRcdFx0XHRcdHRoaXMubWVudUhpZGUodGhpcy52aXNpYmxlU3ViTWVudXNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudUlmcmFtZVNoaW06IGZ1bmN0aW9uKCR1bCkge1xuXHRcdFx0XHQvLyBjcmVhdGUgaWZyYW1lIHNoaW0gZm9yIHRoZSBtZW51XG5cdFx0XHRcdGlmIChJRSAmJiB0aGlzLm9wdHMub3ZlcmxhcENvbnRyb2xzSW5JRSAmJiAhJHVsLmRhdGFTTSgnaWUtc2hpbScpKSB7XG5cdFx0XHRcdFx0JHVsLmRhdGFTTSgnaWUtc2hpbScsICQoJzxpZnJhbWUvPicpLmF0dHIoeyBzcmM6ICdqYXZhc2NyaXB0OjAnLCB0YWJpbmRleDogLTkgfSlcblx0XHRcdFx0XHRcdC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAnYXV0bycsIGxlZnQ6ICcwJywgb3BhY2l0eTogMCwgYm9yZGVyOiAnMCcgfSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudUluaXQ6IGZ1bmN0aW9uKCR1bCkge1xuXHRcdFx0XHRpZiAoISR1bC5kYXRhU00oJ2luLW1lZ2EnKSkge1xuXHRcdFx0XHRcdHRoaXMuc3ViTWVudXMucHVzaCgkdWwpO1xuXHRcdFx0XHRcdC8vIG1hcmsgVUwncyBpbiBtZWdhIGRyb3AgZG93bnMgKGlmIGFueSkgc28gd2UgY2FuIG5lZ2xlY3QgdGhlbVxuXHRcdFx0XHRcdGlmICgkdWwuaGFzQ2xhc3MoJ21lZ2EtbWVudScpKSB7XG5cdFx0XHRcdFx0XHQkdWwuZmluZCgndWwnKS5kYXRhU00oJ2luLW1lZ2EnLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gZ2V0IGxldmVsIChtdWNoIGZhc3RlciB0aGFuLCBmb3IgZXhhbXBsZSwgdXNpbmcgcGFyZW50c1VudGlsKVxuXHRcdFx0XHRcdHZhciBsZXZlbCA9IDIsXG5cdFx0XHRcdFx0XHRwYXIgPSAkdWxbMF07XG5cdFx0XHRcdFx0d2hpbGUgKChwYXIgPSBwYXIucGFyZW50Tm9kZS5wYXJlbnROb2RlKSAhPSB0aGlzLiRyb290WzBdKSB7XG5cdFx0XHRcdFx0XHRsZXZlbCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBjYWNoZSBzdHVmZlxuXHRcdFx0XHRcdCR1bC5kYXRhU00oJ3BhcmVudC1hJywgJHVsLnByZXZBbGwoJ2EnKS5lcSgtMSkpXG5cdFx0XHRcdFx0XHQuZGF0YVNNKCdsZXZlbCcsIGxldmVsKVxuXHRcdFx0XHRcdFx0LnBhcmVudCgpLmRhdGFTTSgnc3ViJywgJHVsKTtcblx0XHRcdFx0XHQvLyBhZGQgc3ViIGluZGljYXRvciB0byBwYXJlbnQgaXRlbVxuXHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuc3ViSW5kaWNhdG9ycykge1xuXHRcdFx0XHRcdFx0JHVsLmRhdGFTTSgncGFyZW50LWEnKS5hZGRDbGFzcygnaGFzLXN1Ym1lbnUnKVt0aGlzLm9wdHMuc3ViSW5kaWNhdG9yc1Bvc10odGhpcy4kc3ViQXJyb3cuY2xvbmUoKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudVBvc2l0aW9uOiBmdW5jdGlvbigkc3ViKSB7XG5cdFx0XHRcdHZhciAkYSA9ICRzdWIuZGF0YVNNKCdwYXJlbnQtYScpLFxuXHRcdFx0XHRcdCR1bCA9ICRzdWIucGFyZW50KCkucGFyZW50KCksXG5cdFx0XHRcdFx0bGV2ZWwgPSAkc3ViLmRhdGFTTSgnbGV2ZWwnKSxcblx0XHRcdFx0XHRzdWJXID0gdGhpcy5nZXRXaWR0aCgkc3ViKSxcblx0XHRcdFx0XHRzdWJIID0gdGhpcy5nZXRIZWlnaHQoJHN1YiksXG5cdFx0XHRcdFx0aXRlbU9mZnNldCA9ICRhLm9mZnNldCgpLFxuXHRcdFx0XHRcdGl0ZW1YID0gaXRlbU9mZnNldC5sZWZ0LFxuXHRcdFx0XHRcdGl0ZW1ZID0gaXRlbU9mZnNldC50b3AsXG5cdFx0XHRcdFx0aXRlbVcgPSB0aGlzLmdldFdpZHRoKCRhKSxcblx0XHRcdFx0XHRpdGVtSCA9IHRoaXMuZ2V0SGVpZ2h0KCRhKSxcblx0XHRcdFx0XHQkd2luID0gJCh3aW5kb3cpLFxuXHRcdFx0XHRcdHdpblggPSAkd2luLnNjcm9sbExlZnQoKSxcblx0XHRcdFx0XHR3aW5ZID0gJHdpbi5zY3JvbGxUb3AoKSxcblx0XHRcdFx0XHR3aW5XID0gdGhpcy5nZXRWaWV3cG9ydFdpZHRoKCksXG5cdFx0XHRcdFx0d2luSCA9IHRoaXMuZ2V0Vmlld3BvcnRIZWlnaHQoKSxcblx0XHRcdFx0XHRob3Jpem9udGFsUGFyZW50ID0gJHVsLmhhc0NsYXNzKCdzbScpICYmICEkdWwuaGFzQ2xhc3MoJ3NtLXZlcnRpY2FsJyksXG5cdFx0XHRcdFx0c3ViT2Zmc2V0WCA9IGxldmVsID09IDIgPyB0aGlzLm9wdHMubWFpbk1lbnVTdWJPZmZzZXRYIDogdGhpcy5vcHRzLnN1Yk1lbnVzU3ViT2Zmc2V0WCxcblx0XHRcdFx0XHRzdWJPZmZzZXRZID0gbGV2ZWwgPT0gMiA/IHRoaXMub3B0cy5tYWluTWVudVN1Yk9mZnNldFkgOiB0aGlzLm9wdHMuc3ViTWVudXNTdWJPZmZzZXRZLFxuXHRcdFx0XHRcdHgsIHk7XG5cdFx0XHRcdGlmIChob3Jpem9udGFsUGFyZW50KSB7XG5cdFx0XHRcdFx0eCA9IHRoaXMub3B0cy5yaWdodFRvTGVmdFN1Yk1lbnVzID8gaXRlbVcgLSBzdWJXIC0gc3ViT2Zmc2V0WCA6IHN1Yk9mZnNldFg7XG5cdFx0XHRcdFx0eSA9IHRoaXMub3B0cy5ib3R0b21Ub1RvcFN1Yk1lbnVzID8gLXN1YkggLSBzdWJPZmZzZXRZIDogaXRlbUggKyBzdWJPZmZzZXRZO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHggPSB0aGlzLm9wdHMucmlnaHRUb0xlZnRTdWJNZW51cyA/IHN1Yk9mZnNldFggLSBzdWJXIDogaXRlbVcgLSBzdWJPZmZzZXRYO1xuXHRcdFx0XHRcdHkgPSB0aGlzLm9wdHMuYm90dG9tVG9Ub3BTdWJNZW51cyA/IGl0ZW1IIC0gc3ViT2Zmc2V0WSAtIHN1YkggOiBzdWJPZmZzZXRZO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLm9wdHMua2VlcEluVmlld3BvcnQgJiYgIXRoaXMuaXNDb2xsYXBzaWJsZSgpKSB7XG5cdFx0XHRcdFx0dmFyIGFic1ggPSBpdGVtWCArIHgsXG5cdFx0XHRcdFx0XHRhYnNZID0gaXRlbVkgKyB5O1xuXHRcdFx0XHRcdGlmICh0aGlzLm9wdHMucmlnaHRUb0xlZnRTdWJNZW51cyAmJiBhYnNYIDwgd2luWCkge1xuXHRcdFx0XHRcdFx0eCA9IGhvcml6b250YWxQYXJlbnQgPyB3aW5YIC0gYWJzWCArIHggOiBpdGVtVyAtIHN1Yk9mZnNldFg7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICghdGhpcy5vcHRzLnJpZ2h0VG9MZWZ0U3ViTWVudXMgJiYgYWJzWCArIHN1YlcgPiB3aW5YICsgd2luVykge1xuXHRcdFx0XHRcdFx0eCA9IGhvcml6b250YWxQYXJlbnQgPyB3aW5YICsgd2luVyAtIHN1YlcgLSBhYnNYICsgeCA6IHN1Yk9mZnNldFggLSBzdWJXO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIWhvcml6b250YWxQYXJlbnQpIHtcblx0XHRcdFx0XHRcdGlmIChzdWJIIDwgd2luSCAmJiBhYnNZICsgc3ViSCA+IHdpblkgKyB3aW5IKSB7XG5cdFx0XHRcdFx0XHRcdHkgKz0gd2luWSArIHdpbkggLSBzdWJIIC0gYWJzWTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoc3ViSCA+PSB3aW5IIHx8IGFic1kgPCB3aW5ZKSB7XG5cdFx0XHRcdFx0XHRcdHkgKz0gd2luWSAtIGFic1k7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIGRvIHdlIG5lZWQgc2Nyb2xsaW5nP1xuXHRcdFx0XHRcdC8vIDAuNDkgdXNlZCBmb3IgYmV0dGVyIHByZWNpc2lvbiB3aGVuIGRlYWxpbmcgd2l0aCBmbG9hdCB2YWx1ZXNcblx0XHRcdFx0XHRpZiAoaG9yaXpvbnRhbFBhcmVudCAmJiAoYWJzWSArIHN1YkggPiB3aW5ZICsgd2luSCArIDAuNDkgfHwgYWJzWSA8IHdpblkpIHx8ICFob3Jpem9udGFsUGFyZW50ICYmIHN1YkggPiB3aW5IICsgMC40OSkge1xuXHRcdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFx0XHRcdFx0aWYgKCEkc3ViLmRhdGFTTSgnc2Nyb2xsLWFycm93cycpKSB7XG5cdFx0XHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJywgJChbJCgnPHNwYW4gY2xhc3M9XCJzY3JvbGwtdXBcIj48c3BhbiBjbGFzcz1cInNjcm9sbC11cC1hcnJvd1wiPjwvc3Bhbj48L3NwYW4+JylbMF0sICQoJzxzcGFuIGNsYXNzPVwic2Nyb2xsLWRvd25cIj48c3BhbiBjbGFzcz1cInNjcm9sbC1kb3duLWFycm93XCI+PC9zcGFuPjwvc3Bhbj4nKVswXV0pXG5cdFx0XHRcdFx0XHRcdFx0LmJpbmQoe1xuXHRcdFx0XHRcdFx0XHRcdFx0bW91c2VlbnRlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdzY3JvbGwnKS51cCA9ICQodGhpcykuaGFzQ2xhc3MoJ3Njcm9sbC11cCcpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzZWxmLm1lbnVTY3JvbGwoJHN1Yik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0bW91c2VsZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzZWxmLm1lbnVTY3JvbGxTdG9wKCRzdWIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzZWxmLm1lbnVTY3JvbGxPdXQoJHN1YiwgZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0J21vdXNld2hlZWwgRE9NTW91c2VTY3JvbGwnOiBmdW5jdGlvbihlKSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0Lmluc2VydEFmdGVyKCRzdWIpXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQvLyBiaW5kIHNjcm9sbCBldmVudHMgYW5kIHNhdmUgc2Nyb2xsIGRhdGEgZm9yIHRoaXMgc3ViXG5cdFx0XHRcdFx0XHR2YXIgZU5TID0gJy5zbWFydG1lbnVzX3Njcm9sbCc7XG5cdFx0XHRcdFx0XHQkc3ViLmRhdGFTTSgnc2Nyb2xsJywge1xuXHRcdFx0XHRcdFx0XHRcdHN0ZXA6IDEsXG5cdFx0XHRcdFx0XHRcdFx0Ly8gY2FjaGUgc3R1ZmYgZm9yIGZhc3RlciByZWNhbGNzIGxhdGVyXG5cdFx0XHRcdFx0XHRcdFx0aXRlbUg6IGl0ZW1ILFxuXHRcdFx0XHRcdFx0XHRcdHN1Ykg6IHN1YkgsXG5cdFx0XHRcdFx0XHRcdFx0YXJyb3dEb3duSDogdGhpcy5nZXRIZWlnaHQoJHN1Yi5kYXRhU00oJ3Njcm9sbC1hcnJvd3MnKS5lcSgxKSlcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LmJpbmQoZ2V0RXZlbnRzTlMoW1xuXHRcdFx0XHRcdFx0XHRcdFsnbW91c2VvdmVyJywgZnVuY3Rpb24oZSkgeyBzZWxmLm1lbnVTY3JvbGxPdmVyKCRzdWIsIGUpOyB9XSxcblx0XHRcdFx0XHRcdFx0XHRbJ21vdXNlb3V0JywgZnVuY3Rpb24oZSkgeyBzZWxmLm1lbnVTY3JvbGxPdXQoJHN1YiwgZSk7IH1dLFxuXHRcdFx0XHRcdFx0XHRcdFsnbW91c2V3aGVlbCBET01Nb3VzZVNjcm9sbCcsIGZ1bmN0aW9uKGUpIHsgc2VsZi5tZW51U2Nyb2xsTW91c2V3aGVlbCgkc3ViLCBlKTsgfV1cblx0XHRcdFx0XHRcdFx0XSwgZU5TKSlcblx0XHRcdFx0XHRcdFx0LmRhdGFTTSgnc2Nyb2xsLWFycm93cycpLmNzcyh7IHRvcDogJ2F1dG8nLCBsZWZ0OiAnMCcsIG1hcmdpbkxlZnQ6IHggKyAocGFyc2VJbnQoJHN1Yi5jc3MoJ2JvcmRlci1sZWZ0LXdpZHRoJykpIHx8IDApLCB3aWR0aDogc3ViVyAtIChwYXJzZUludCgkc3ViLmNzcygnYm9yZGVyLWxlZnQtd2lkdGgnKSkgfHwgMCkgLSAocGFyc2VJbnQoJHN1Yi5jc3MoJ2JvcmRlci1yaWdodC13aWR0aCcpKSB8fCAwKSwgekluZGV4OiAkc3ViLmNzcygnei1pbmRleCcpIH0pXG5cdFx0XHRcdFx0XHRcdFx0LmVxKGhvcml6b250YWxQYXJlbnQgJiYgdGhpcy5vcHRzLmJvdHRvbVRvVG9wU3ViTWVudXMgPyAwIDogMSkuc2hvdygpO1xuXHRcdFx0XHRcdFx0Ly8gd2hlbiBhIG1lbnUgdHJlZSBpcyBmaXhlZCBwb3NpdGlvbmVkIHdlIGFsbG93IHNjcm9sbGluZyB2aWEgdG91Y2ggdG9vXG5cdFx0XHRcdFx0XHQvLyBzaW5jZSB0aGVyZSBpcyBubyBvdGhlciB3YXkgdG8gYWNjZXNzIHN1Y2ggbG9uZyBzdWIgbWVudXMgaWYgbm8gbW91c2UgaXMgcHJlc2VudFxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuaXNGaXhlZCgpKSB7XG5cdFx0XHRcdFx0XHRcdCRzdWIuY3NzKHsgJ3RvdWNoLWFjdGlvbic6ICdub25lJywgJy1tcy10b3VjaC1hY3Rpb24nOiAnbm9uZScgfSlcblx0XHRcdFx0XHRcdFx0XHQuYmluZChnZXRFdmVudHNOUyhbXG5cdFx0XHRcdFx0XHRcdFx0XHRbdG91Y2hFdmVudHMoKSA/ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCcgOiAncG9pbnRlcmRvd24gcG9pbnRlcm1vdmUgcG9pbnRlcnVwIE1TUG9pbnRlckRvd24gTVNQb2ludGVyTW92ZSBNU1BvaW50ZXJVcCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2VsZi5tZW51U2Nyb2xsVG91Y2goJHN1YiwgZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdFx0XHRcdF0sIGVOUykpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQkc3ViLmNzcyh7IHRvcDogJ2F1dG8nLCBsZWZ0OiAnMCcsIG1hcmdpbkxlZnQ6IHgsIG1hcmdpblRvcDogeSAtIGl0ZW1IIH0pO1xuXHRcdFx0XHQvLyBJRSBpZnJhbWUgc2hpbVxuXHRcdFx0XHR0aGlzLm1lbnVJZnJhbWVTaGltKCRzdWIpO1xuXHRcdFx0XHRpZiAoJHN1Yi5kYXRhU00oJ2llLXNoaW0nKSkge1xuXHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdpZS1zaGltJykuY3NzKHsgekluZGV4OiAkc3ViLmNzcygnei1pbmRleCcpLCB3aWR0aDogc3ViVywgaGVpZ2h0OiBzdWJILCBtYXJnaW5MZWZ0OiB4LCBtYXJnaW5Ub3A6IHkgLSBpdGVtSCB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG1lbnVTY3JvbGw6IGZ1bmN0aW9uKCRzdWIsIG9uY2UsIHN0ZXApIHtcblx0XHRcdFx0dmFyIGRhdGEgPSAkc3ViLmRhdGFTTSgnc2Nyb2xsJyksXG5cdFx0XHRcdFx0JGFycm93cyA9ICRzdWIuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJyksXG5cdFx0XHRcdFx0eSA9IHBhcnNlRmxvYXQoJHN1Yi5jc3MoJ21hcmdpbi10b3AnKSksXG5cdFx0XHRcdFx0ZW5kID0gZGF0YS51cCA/IGRhdGEudXBFbmQgOiBkYXRhLmRvd25FbmQsXG5cdFx0XHRcdFx0ZGlmZjtcblx0XHRcdFx0aWYgKCFvbmNlICYmIGRhdGEudmVsb2NpdHkpIHtcblx0XHRcdFx0XHRkYXRhLnZlbG9jaXR5ICo9IDAuOTtcblx0XHRcdFx0XHRkaWZmID0gZGF0YS52ZWxvY2l0eTtcblx0XHRcdFx0XHRpZiAoZGlmZiA8IDAuNSkge1xuXHRcdFx0XHRcdFx0dGhpcy5tZW51U2Nyb2xsU3RvcCgkc3ViKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGlmZiA9IHN0ZXAgfHwgKG9uY2UgfHwgIXRoaXMub3B0cy5zY3JvbGxBY2NlbGVyYXRlID8gdGhpcy5vcHRzLnNjcm9sbFN0ZXAgOiBNYXRoLmZsb29yKGRhdGEuc3RlcCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGhpZGUgYW55IHZpc2libGUgZGVlcGVyIGxldmVsIHN1YiBtZW51c1xuXHRcdFx0XHR2YXIgbGV2ZWwgPSAkc3ViLmRhdGFTTSgnbGV2ZWwnKTtcblx0XHRcdFx0aWYgKHRoaXMudmlzaWJsZVN1Yk1lbnVzLmxlbmd0aCA+IGxldmVsKSB7XG5cdFx0XHRcdFx0dGhpcy5tZW51SGlkZVN1Yk1lbnVzKGxldmVsIC0gMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIG5ld1kgPSBkYXRhLnVwICYmIGVuZCA8PSB5IHx8ICFkYXRhLnVwICYmIGVuZCA+PSB5ID8geSA6IChNYXRoLmFicyhlbmQgLSB5KSA+IGRpZmYgPyB5ICsgKGRhdGEudXAgPyBkaWZmIDogLWRpZmYpIDogZW5kKTtcblx0XHRcdFx0JHN1Yi5hZGQoJHN1Yi5kYXRhU00oJ2llLXNoaW0nKSkuY3NzKCdtYXJnaW4tdG9wJywgbmV3WSk7XG5cdFx0XHRcdC8vIHNob3cgb3Bwb3NpdGUgYXJyb3cgaWYgYXBwcm9wcmlhdGVcblx0XHRcdFx0aWYgKG1vdXNlICYmIChkYXRhLnVwICYmIG5ld1kgPiBkYXRhLmRvd25FbmQgfHwgIWRhdGEudXAgJiYgbmV3WSA8IGRhdGEudXBFbmQpKSB7XG5cdFx0XHRcdFx0JGFycm93cy5lcShkYXRhLnVwID8gMSA6IDApLnNob3coKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBpZiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcblx0XHRcdFx0aWYgKG5ld1kgPT0gZW5kKSB7XG5cdFx0XHRcdFx0aWYgKG1vdXNlKSB7XG5cdFx0XHRcdFx0XHQkYXJyb3dzLmVxKGRhdGEudXAgPyAwIDogMSkuaGlkZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLm1lbnVTY3JvbGxTdG9wKCRzdWIpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCFvbmNlKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5zY3JvbGxBY2NlbGVyYXRlICYmIGRhdGEuc3RlcCA8IHRoaXMub3B0cy5zY3JvbGxTdGVwKSB7XG5cdFx0XHRcdFx0XHRkYXRhLnN0ZXAgKz0gMC41O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRcdFx0dGhpcy5zY3JvbGxUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgc2VsZi5tZW51U2Nyb2xsKCRzdWIpOyB9LCB0aGlzLm9wdHMuc2Nyb2xsSW50ZXJ2YWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudVNjcm9sbE1vdXNld2hlZWw6IGZ1bmN0aW9uKCRzdWIsIGUpIHtcblx0XHRcdFx0aWYgKHRoaXMuZ2V0Q2xvc2VzdE1lbnUoZS50YXJnZXQpID09ICRzdWJbMF0pIHtcblx0XHRcdFx0XHRlID0gZS5vcmlnaW5hbEV2ZW50O1xuXHRcdFx0XHRcdHZhciB1cCA9IChlLndoZWVsRGVsdGEgfHwgLWUuZGV0YWlsKSA+IDA7XG5cdFx0XHRcdFx0aWYgKCRzdWIuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJykuZXEodXAgPyAwIDogMSkuaXMoJzp2aXNpYmxlJykpIHtcblx0XHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdzY3JvbGwnKS51cCA9IHVwO1xuXHRcdFx0XHRcdFx0dGhpcy5tZW51U2Nyb2xsKCRzdWIsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9LFxuXHRcdFx0bWVudVNjcm9sbE91dDogZnVuY3Rpb24oJHN1YiwgZSkge1xuXHRcdFx0XHRpZiAobW91c2UpIHtcblx0XHRcdFx0XHRpZiAoIS9ec2Nyb2xsLSh1cHxkb3duKS8udGVzdCgoZS5yZWxhdGVkVGFyZ2V0IHx8ICcnKS5jbGFzc05hbWUpICYmICgkc3ViWzBdICE9IGUucmVsYXRlZFRhcmdldCAmJiAhJC5jb250YWlucygkc3ViWzBdLCBlLnJlbGF0ZWRUYXJnZXQpIHx8IHRoaXMuZ2V0Q2xvc2VzdE1lbnUoZS5yZWxhdGVkVGFyZ2V0KSAhPSAkc3ViWzBdKSkge1xuXHRcdFx0XHRcdFx0JHN1Yi5kYXRhU00oJ3Njcm9sbC1hcnJvd3MnKS5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudVNjcm9sbE92ZXI6IGZ1bmN0aW9uKCRzdWIsIGUpIHtcblx0XHRcdFx0aWYgKG1vdXNlKSB7XG5cdFx0XHRcdFx0aWYgKCEvXnNjcm9sbC0odXB8ZG93bikvLnRlc3QoZS50YXJnZXQuY2xhc3NOYW1lKSAmJiB0aGlzLmdldENsb3Nlc3RNZW51KGUudGFyZ2V0KSA9PSAkc3ViWzBdKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbnVTY3JvbGxSZWZyZXNoRGF0YSgkc3ViKTtcblx0XHRcdFx0XHRcdHZhciBkYXRhID0gJHN1Yi5kYXRhU00oJ3Njcm9sbCcpO1xuXHRcdFx0XHRcdFx0JHN1Yi5kYXRhU00oJ3Njcm9sbC1hcnJvd3MnKS5lcSgwKS5jc3MoJ21hcmdpbi10b3AnLCBkYXRhLnVwRW5kKS5lbmQoKVxuXHRcdFx0XHRcdFx0XHQuZXEoMSkuY3NzKCdtYXJnaW4tdG9wJywgZGF0YS5kb3duRW5kICsgZGF0YS5zdWJIIC0gZGF0YS5hcnJvd0Rvd25IKS5lbmQoKVxuXHRcdFx0XHRcdFx0XHQuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRtZW51U2Nyb2xsUmVmcmVzaERhdGE6IGZ1bmN0aW9uKCRzdWIpIHtcblx0XHRcdFx0dmFyIGRhdGEgPSAkc3ViLmRhdGFTTSgnc2Nyb2xsJyksXG5cdFx0XHRcdFx0JHdpbiA9ICQod2luZG93KSxcblx0XHRcdFx0XHR2cG9ydFkgPSAkd2luLnNjcm9sbFRvcCgpIC0gJHN1Yi5kYXRhU00oJ3BhcmVudC1hJykub2Zmc2V0KCkudG9wIC0gZGF0YS5pdGVtSDtcblx0XHRcdFx0JC5leHRlbmQoZGF0YSwge1xuXHRcdFx0XHRcdHVwRW5kOiB2cG9ydFksXG5cdFx0XHRcdFx0ZG93bkVuZDogdnBvcnRZICsgdGhpcy5nZXRWaWV3cG9ydEhlaWdodCgpIC0gZGF0YS5zdWJIXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSxcblx0XHRcdG1lbnVTY3JvbGxTdG9wOiBmdW5jdGlvbigkc3ViKSB7XG5cdFx0XHRcdGlmICh0aGlzLnNjcm9sbFRpbWVvdXQpIHtcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGhpcy5zY3JvbGxUaW1lb3V0KTtcblx0XHRcdFx0XHR0aGlzLnNjcm9sbFRpbWVvdXQgPSAwO1xuXHRcdFx0XHRcdCQuZXh0ZW5kKCRzdWIuZGF0YVNNKCdzY3JvbGwnKSwge1xuXHRcdFx0XHRcdFx0c3RlcDogMSxcblx0XHRcdFx0XHRcdHZlbG9jaXR5OiAwXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRtZW51U2Nyb2xsVG91Y2g6IGZ1bmN0aW9uKCRzdWIsIGUpIHtcblx0XHRcdFx0ZSA9IGUub3JpZ2luYWxFdmVudDtcblx0XHRcdFx0aWYgKGlzVG91Y2hFdmVudChlKSkge1xuXHRcdFx0XHRcdHZhciB0b3VjaFBvaW50ID0gdGhpcy5nZXRUb3VjaFBvaW50KGUpO1xuXHRcdFx0XHRcdC8vIG5lZ2xlY3QgZXZlbnQgaWYgd2UgdG91Y2hlZCBhIHZpc2libGUgZGVlcGVyIGxldmVsIHN1YiBtZW51XG5cdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Q2xvc2VzdE1lbnUodG91Y2hQb2ludC50YXJnZXQpID09ICRzdWJbMF0pIHtcblx0XHRcdFx0XHRcdHZhciBkYXRhID0gJHN1Yi5kYXRhU00oJ3Njcm9sbCcpO1xuXHRcdFx0XHRcdFx0aWYgKC8oc3RhcnR8ZG93bikkL2kudGVzdChlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm1lbnVTY3JvbGxTdG9wKCRzdWIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gaWYgd2Ugd2VyZSBzY3JvbGxpbmcsIGp1c3Qgc3RvcCBhbmQgZG9uJ3QgYWN0aXZhdGUgYW55IGxpbmsgb24gdGhlIGZpcnN0IHRvdWNoXG5cdFx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuaXNUb3VjaFNjcm9sbGluZyA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5pc1RvdWNoU2Nyb2xsaW5nID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Ly8gdXBkYXRlIHNjcm9sbCBkYXRhIHNpbmNlIHRoZSB1c2VyIG1pZ2h0IGhhdmUgem9vbWVkLCBldGMuXG5cdFx0XHRcdFx0XHRcdHRoaXMubWVudVNjcm9sbFJlZnJlc2hEYXRhKCRzdWIpO1xuXHRcdFx0XHRcdFx0XHQvLyBleHRlbmQgaXQgd2l0aCB0aGUgdG91Y2ggcHJvcGVydGllc1xuXHRcdFx0XHRcdFx0XHQkLmV4dGVuZChkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0dG91Y2hZOiB0b3VjaFBvaW50LnBhZ2VZLFxuXHRcdFx0XHRcdFx0XHRcdHRvdWNoVGltZXN0YW1wOiBlLnRpbWVTdGFtcCxcblx0XHRcdFx0XHRcdFx0XHR2ZWxvY2l0eTogMFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoL21vdmUkL2kudGVzdChlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBwcmV2WSA9IGRhdGEudG91Y2hZO1xuXHRcdFx0XHRcdFx0XHRpZiAocHJldlkgIT09IHVuZGVmaW5lZCAmJiBwcmV2WSAhPSB0b3VjaFBvaW50LnBhZ2VZKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5pc1RvdWNoU2Nyb2xsaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHQkLmV4dGVuZChkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHR1cDogcHJldlkgPCB0b3VjaFBvaW50LnBhZ2VZLFxuXHRcdFx0XHRcdFx0XHRcdFx0dG91Y2hZOiB0b3VjaFBvaW50LnBhZ2VZLFxuXHRcdFx0XHRcdFx0XHRcdFx0dG91Y2hUaW1lc3RhbXA6IGUudGltZVN0YW1wLFxuXHRcdFx0XHRcdFx0XHRcdFx0dmVsb2NpdHk6IGRhdGEudmVsb2NpdHkgKyBNYXRoLmFicyh0b3VjaFBvaW50LnBhZ2VZIC0gcHJldlkpICogMC41XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5tZW51U2Nyb2xsKCRzdWIsIHRydWUsIE1hdGguYWJzKGRhdGEudG91Y2hZIC0gcHJldlkpKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgeyAvLyB0b3VjaGVuZC9wb2ludGVydXBcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGEudG91Y2hZICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBjaGVjayBpZiB3ZSBuZWVkIHRvIHNjcm9sbFxuXHRcdFx0XHRcdFx0XHRcdGlmIChlLnRpbWVTdGFtcCAtIGRhdGEudG91Y2hUaW1lc3RhbXAgPCAxMjAgJiYgZGF0YS52ZWxvY2l0eSA+IDApIHtcblx0XHRcdFx0XHRcdFx0XHRcdGRhdGEudmVsb2NpdHkgKj0gMC41O1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5tZW51U2Nyb2xsU3RvcCgkc3ViKTtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWVudVNjcm9sbCgkc3ViKTtcblx0XHRcdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIGRhdGEudG91Y2hZO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWVudVNob3c6IGZ1bmN0aW9uKCRzdWIpIHtcblx0XHRcdFx0aWYgKCEkc3ViLmRhdGFTTSgnYmVmb3JlZmlyc3RzaG93ZmlyZWQnKSkge1xuXHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdiZWZvcmVmaXJzdHNob3dmaXJlZCcsIHRydWUpO1xuXHRcdFx0XHRcdGlmICh0aGlzLiRyb290LnRyaWdnZXJIYW5kbGVyKCdiZWZvcmVmaXJzdHNob3cuc21hcGknLCAkc3ViWzBdKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuJHJvb3QudHJpZ2dlckhhbmRsZXIoJ2JlZm9yZXNob3cuc21hcGknLCAkc3ViWzBdKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5tZW51Rml4TGF5b3V0KCRzdWIpO1xuXHRcdFx0XHQkc3ViLnN0b3AodHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRcdGlmICghJHN1Yi5pcygnOnZpc2libGUnKSkge1xuXHRcdFx0XHRcdC8vIHNldCB6LWluZGV4XG5cdFx0XHRcdFx0JHN1Yi5jc3MoJ3otaW5kZXgnLCB0aGlzLnpJbmRleEluYyA9ICh0aGlzLnpJbmRleEluYyB8fCB0aGlzLmdldFN0YXJ0WkluZGV4KCkpICsgMSk7XG5cdFx0XHRcdFx0Ly8gaGlnaGxpZ2h0IHBhcmVudCBpdGVtXG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5rZWVwSGlnaGxpZ2h0ZWQgfHwgdGhpcy5pc0NvbGxhcHNpYmxlKCkpIHtcblx0XHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdwYXJlbnQtYScpLmFkZENsYXNzKCdoaWdobGlnaHRlZCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBtaW4vbWF4LXdpZHRoIGZpeCAtIG5vIHdheSB0byByZWx5IHB1cmVseSBvbiBDU1MgYXMgYWxsIFVMJ3MgYXJlIG5lc3RlZFxuXHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuc3ViTWVudXNNaW5XaWR0aCB8fCB0aGlzLm9wdHMuc3ViTWVudXNNYXhXaWR0aCkge1xuXHRcdFx0XHRcdFx0JHN1Yi5jc3MoeyB3aWR0aDogJ2F1dG8nLCBtaW5XaWR0aDogJycsIG1heFdpZHRoOiAnJyB9KS5hZGRDbGFzcygnc20tbm93cmFwJyk7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vcHRzLnN1Yk1lbnVzTWluV2lkdGgpIHtcblx0XHRcdFx0XHRcdCBcdCRzdWIuY3NzKCdtaW4td2lkdGgnLCB0aGlzLm9wdHMuc3ViTWVudXNNaW5XaWR0aCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vcHRzLnN1Yk1lbnVzTWF4V2lkdGgpIHtcblx0XHRcdFx0XHRcdCBcdHZhciBub01heFdpZHRoID0gdGhpcy5nZXRXaWR0aCgkc3ViKTtcblx0XHRcdFx0XHRcdCBcdCRzdWIuY3NzKCdtYXgtd2lkdGgnLCB0aGlzLm9wdHMuc3ViTWVudXNNYXhXaWR0aCk7XG5cdFx0XHRcdFx0XHRcdGlmIChub01heFdpZHRoID4gdGhpcy5nZXRXaWR0aCgkc3ViKSkge1xuXHRcdFx0XHRcdFx0XHRcdCRzdWIucmVtb3ZlQ2xhc3MoJ3NtLW5vd3JhcCcpLmNzcygnd2lkdGgnLCB0aGlzLm9wdHMuc3ViTWVudXNNYXhXaWR0aCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5tZW51UG9zaXRpb24oJHN1Yik7XG5cdFx0XHRcdFx0Ly8gaW5zZXJ0IElFIGlmcmFtZSBzaGltXG5cdFx0XHRcdFx0aWYgKCRzdWIuZGF0YVNNKCdpZS1zaGltJykpIHtcblx0XHRcdFx0XHRcdCRzdWIuZGF0YVNNKCdpZS1zaGltJykuaW5zZXJ0QmVmb3JlKCRzdWIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgY29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdC8vIGZpeDogXCJvdmVyZmxvdzogaGlkZGVuO1wiIGlzIG5vdCByZXNldCBvbiBhbmltYXRpb24gY29tcGxldGUgaW4galF1ZXJ5IDwgMS45LjAgaW4gQ2hyb21lIHdoZW4gZ2xvYmFsIFwiYm94LXNpemluZzogYm9yZGVyLWJveDtcIiBpcyB1c2VkXG5cdFx0XHRcdFx0XHQkc3ViLmNzcygnb3ZlcmZsb3cnLCAnJyk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHQvLyBpZiBzdWIgaXMgY29sbGFwc2libGUgKG1vYmlsZSB2aWV3KVxuXHRcdFx0XHRcdGlmICh0aGlzLmlzQ29sbGFwc2libGUoKSkge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMub3B0cy5jb2xsYXBzaWJsZVNob3dGdW5jdGlvbikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLm9wdHMuY29sbGFwc2libGVTaG93RnVuY3Rpb24uY2FsbCh0aGlzLCAkc3ViLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkc3ViLnNob3codGhpcy5vcHRzLmNvbGxhcHNpYmxlU2hvd0R1cmF0aW9uLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuc2hvd0Z1bmN0aW9uKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub3B0cy5zaG93RnVuY3Rpb24uY2FsbCh0aGlzLCAkc3ViLCBjb21wbGV0ZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkc3ViLnNob3codGhpcy5vcHRzLnNob3dEdXJhdGlvbiwgY29tcGxldGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBzYXZlIG5ldyBzdWIgbWVudSBmb3IgdGhpcyBsZXZlbFxuXHRcdFx0XHRcdHRoaXMudmlzaWJsZVN1Yk1lbnVzWyRzdWIuZGF0YVNNKCdsZXZlbCcpIC0gMV0gPSAkc3ViO1xuXHRcdFx0XHRcdHRoaXMuJHJvb3QudHJpZ2dlckhhbmRsZXIoJ3Nob3cuc21hcGknLCAkc3ViWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvcHVwSGlkZTogZnVuY3Rpb24obm9IaWRlVGltZW91dCkge1xuXHRcdFx0XHRpZiAodGhpcy5oaWRlVGltZW91dCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcblx0XHRcdFx0XHR0aGlzLmhpZGVUaW1lb3V0ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRcdHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYubWVudUhpZGVBbGwoKTtcblx0XHRcdFx0fSwgbm9IaWRlVGltZW91dCA/IDEgOiB0aGlzLm9wdHMuaGlkZVRpbWVvdXQpO1xuXHRcdFx0fSxcblx0XHRcdHBvcHVwU2hvdzogZnVuY3Rpb24obGVmdCwgdG9wKSB7XG5cdFx0XHRcdGlmICghdGhpcy5vcHRzLmlzUG9wdXApIHtcblx0XHRcdFx0XHRhbGVydCgnU21hcnRNZW51cyBqUXVlcnkgRXJyb3I6XFxuXFxuSWYgeW91IHdhbnQgdG8gc2hvdyB0aGlzIG1lbnUgdmlhIHRoZSBcInBvcHVwU2hvd1wiIG1ldGhvZCwgc2V0IHRoZSBpc1BvcHVwOnRydWUgb3B0aW9uLicpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5oaWRlVGltZW91dCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcblx0XHRcdFx0XHR0aGlzLmhpZGVUaW1lb3V0ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLm1lbnVGaXhMYXlvdXQodGhpcy4kcm9vdCk7XG5cdFx0XHRcdHRoaXMuJHJvb3Quc3RvcCh0cnVlLCB0cnVlKTtcblx0XHRcdFx0aWYgKCF0aGlzLiRyb290LmlzKCc6dmlzaWJsZScpKSB7XG5cdFx0XHRcdFx0dGhpcy4kcm9vdC5jc3MoeyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9KTtcblx0XHRcdFx0XHQvLyBJRSBpZnJhbWUgc2hpbVxuXHRcdFx0XHRcdHRoaXMubWVudUlmcmFtZVNoaW0odGhpcy4kcm9vdCk7XG5cdFx0XHRcdFx0aWYgKHRoaXMuJHJvb3QuZGF0YVNNKCdpZS1zaGltJykpIHtcblx0XHRcdFx0XHRcdHRoaXMuJHJvb3QuZGF0YVNNKCdpZS1zaGltJykuY3NzKHsgekluZGV4OiB0aGlzLiRyb290LmNzcygnei1pbmRleCcpLCB3aWR0aDogdGhpcy5nZXRXaWR0aCh0aGlzLiRyb290KSwgaGVpZ2h0OiB0aGlzLmdldEhlaWdodCh0aGlzLiRyb290KSwgbGVmdDogbGVmdCwgdG9wOiB0b3AgfSkuaW5zZXJ0QmVmb3JlKHRoaXMuJHJvb3QpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBzaG93IG1lbnVcblx0XHRcdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdFx0XHRjb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRzZWxmLiRyb290LmNzcygnb3ZlcmZsb3cnLCAnJyk7XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdGlmICh0aGlzLm9wdHMuc2hvd0Z1bmN0aW9uKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm9wdHMuc2hvd0Z1bmN0aW9uLmNhbGwodGhpcywgdGhpcy4kcm9vdCwgY29tcGxldGUpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLiRyb290LnNob3codGhpcy5vcHRzLnNob3dEdXJhdGlvbiwgY29tcGxldGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnZpc2libGVTdWJNZW51c1swXSA9IHRoaXMuJHJvb3Q7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRyZWZyZXNoOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5tZW51SGlkZUFsbCgpO1xuXHRcdFx0XHR0aGlzLiRyb290LmZpbmQoJ3VsJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHZhciAkdGhpcyA9ICQodGhpcyk7XG5cdFx0XHRcdFx0XHRpZiAoJHRoaXMuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJykpIHtcblx0XHRcdFx0XHRcdFx0JHRoaXMuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJykucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdpbi1tZWdhJylcblx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdzaG93bi1iZWZvcmUnKVxuXHRcdFx0XHRcdC5yZW1vdmVEYXRhU00oJ2llLXNoaW0nKVxuXHRcdFx0XHRcdC5yZW1vdmVEYXRhU00oJ3Njcm9sbC1hcnJvd3MnKVxuXHRcdFx0XHRcdC5yZW1vdmVEYXRhU00oJ3BhcmVudC1hJylcblx0XHRcdFx0XHQucmVtb3ZlRGF0YVNNKCdsZXZlbCcpXG5cdFx0XHRcdFx0LnJlbW92ZURhdGFTTSgnYmVmb3JlZmlyc3RzaG93ZmlyZWQnKTtcblx0XHRcdFx0dGhpcy4kcm9vdC5maW5kKCdhLmhhcy1zdWJtZW51JykucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jylcblx0XHRcdFx0XHQucGFyZW50KCkucmVtb3ZlRGF0YVNNKCdzdWInKTtcblx0XHRcdFx0aWYgKHRoaXMub3B0cy5zdWJJbmRpY2F0b3JzKSB7XG5cdFx0XHRcdFx0dGhpcy4kcm9vdC5maW5kKCdzcGFuLnN1Yi1hcnJvdycpLnJlbW92ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLm9wdHMubWFya0N1cnJlbnRJdGVtKSB7XG5cdFx0XHRcdFx0dGhpcy4kcm9vdC5maW5kKCdhLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuc3ViTWVudXMgPSBbXTtcblx0XHRcdFx0dGhpcy5pbml0KHRydWUpO1xuXHRcdFx0fSxcblx0XHRcdHJvb3RPdXQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0aWYgKCF0aGlzLmhhbmRsZUV2ZW50cygpIHx8IHRoaXMuaXNUb3VjaE1vZGUoKSB8fCBlLnRhcmdldCA9PSB0aGlzLiRyb290WzBdKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLmhpZGVUaW1lb3V0KSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuXHRcdFx0XHRcdHRoaXMuaGlkZVRpbWVvdXQgPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghdGhpcy5vcHRzLnNob3dPbkNsaWNrIHx8ICF0aGlzLm9wdHMuaGlkZU9uQ2xpY2spIHtcblx0XHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRcdFx0dGhpcy5oaWRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHNlbGYubWVudUhpZGVBbGwoKTsgfSwgdGhpcy5vcHRzLmhpZGVUaW1lb3V0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHJvb3RPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGlmICghdGhpcy5oYW5kbGVFdmVudHMoKSB8fCB0aGlzLmlzVG91Y2hNb2RlKCkgfHwgZS50YXJnZXQgPT0gdGhpcy4kcm9vdFswXSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5oaWRlVGltZW91dCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcblx0XHRcdFx0XHR0aGlzLmhpZGVUaW1lb3V0ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHdpblJlc2l6ZTogZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRpZiAoIXRoaXMuaGFuZGxlRXZlbnRzKCkpIHtcblx0XHRcdFx0XHQvLyB3ZSBzdGlsbCBuZWVkIHRvIHJlc2l6ZSB0aGUgZGlzYWJsZSBvdmVybGF5IGlmIGl0J3MgdmlzaWJsZVxuXHRcdFx0XHRcdGlmICh0aGlzLiRkaXNhYmxlT3ZlcmxheSkge1xuXHRcdFx0XHRcdFx0dmFyIHBvcyA9IHRoaXMuJHJvb3Qub2Zmc2V0KCk7XG5cdCBcdFx0XHRcdFx0dGhpcy4kZGlzYWJsZU92ZXJsYXkuY3NzKHtcblx0XHRcdFx0XHRcdFx0dG9wOiBwb3MudG9wLFxuXHRcdFx0XHRcdFx0XHRsZWZ0OiBwb3MubGVmdCxcblx0XHRcdFx0XHRcdFx0d2lkdGg6IHRoaXMuJHJvb3Qub3V0ZXJXaWR0aCgpLFxuXHRcdFx0XHRcdFx0XHRoZWlnaHQ6IHRoaXMuJHJvb3Qub3V0ZXJIZWlnaHQoKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBoaWRlIHN1YiBtZW51cyBvbiByZXNpemUgLSBvbiBtb2JpbGUgZG8gaXQgb25seSBvbiBvcmllbnRhdGlvbiBjaGFuZ2Vcblx0XHRcdFx0aWYgKCF0aGlzLmlzQ29sbGFwc2libGUoKSAmJiAoISgnb25vcmllbnRhdGlvbmNoYW5nZScgaW4gd2luZG93KSB8fCBlLnR5cGUgPT0gJ29yaWVudGF0aW9uY2hhbmdlJykpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5hY3RpdmF0ZWRJdGVtcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdHRoaXMuYWN0aXZhdGVkSXRlbXNbdGhpcy5hY3RpdmF0ZWRJdGVtcy5sZW5ndGggLSAxXVswXS5ibHVyKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMubWVudUhpZGVBbGwoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JC5mbi5kYXRhU00gPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdGlmICh2YWwpIHtcblx0XHRcdHJldHVybiB0aGlzLmRhdGEoa2V5ICsgJ19zbWFydG1lbnVzJywgdmFsKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZGF0YShrZXkgKyAnX3NtYXJ0bWVudXMnKTtcblx0fVxuXG5cdCQuZm4ucmVtb3ZlRGF0YVNNID0gZnVuY3Rpb24oa2V5KSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlRGF0YShrZXkgKyAnX3NtYXJ0bWVudXMnKTtcblx0fVxuXG5cdCQuZm4uc21hcnRtZW51cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzLFxuXHRcdFx0XHRtZXRob2QgPSBvcHRpb25zO1xuXHRcdFx0QXJyYXkucHJvdG90eXBlLnNoaWZ0LmNhbGwoYXJncyk7XG5cdFx0XHRyZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgc21hcnRtZW51cyA9ICQodGhpcykuZGF0YSgnc21hcnRtZW51cycpO1xuXHRcdFx0XHRpZiAoc21hcnRtZW51cyAmJiBzbWFydG1lbnVzW21ldGhvZF0pIHtcblx0XHRcdFx0XHRzbWFydG1lbnVzW21ldGhvZF0uYXBwbHkoc21hcnRtZW51cywgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHR2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCAkLmZuLnNtYXJ0bWVudXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xuXHRcdHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRuZXcgJC5TbWFydE1lbnVzKHRoaXMsIG9wdHMpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gZGVmYXVsdCBzZXR0aW5nc1xuXHQkLmZuLnNtYXJ0bWVudXMuZGVmYXVsdHMgPSB7XG5cdFx0aXNQb3B1cDpcdFx0ZmFsc2UsXHRcdC8vIGlzIHRoaXMgYSBwb3B1cCBtZW51IChjYW4gYmUgc2hvd24gdmlhIHRoZSBwb3B1cFNob3cvcG9wdXBIaWRlIG1ldGhvZHMpIG9yIGEgcGVybWFuZW50IG1lbnUgYmFyXG5cdFx0bWFpbk1lbnVTdWJPZmZzZXRYOlx0MCxcdFx0Ly8gcGl4ZWxzIG9mZnNldCBmcm9tIGRlZmF1bHQgcG9zaXRpb25cblx0XHRtYWluTWVudVN1Yk9mZnNldFk6XHQwLFx0XHQvLyBwaXhlbHMgb2Zmc2V0IGZyb20gZGVmYXVsdCBwb3NpdGlvblxuXHRcdHN1Yk1lbnVzU3ViT2Zmc2V0WDpcdDAsXHRcdC8vIHBpeGVscyBvZmZzZXQgZnJvbSBkZWZhdWx0IHBvc2l0aW9uXG5cdFx0c3ViTWVudXNTdWJPZmZzZXRZOlx0MCxcdFx0Ly8gcGl4ZWxzIG9mZnNldCBmcm9tIGRlZmF1bHQgcG9zaXRpb25cblx0XHRzdWJNZW51c01pbldpZHRoOlx0JzEwZW0nLFx0XHQvLyBtaW4td2lkdGggZm9yIHRoZSBzdWIgbWVudXMgKGFueSBDU1MgdW5pdCkgLSBpZiBzZXQsIHRoZSBmaXhlZCB3aWR0aCBzZXQgaW4gQ1NTIHdpbGwgYmUgaWdub3JlZFxuXHRcdHN1Yk1lbnVzTWF4V2lkdGg6XHQnMjBlbScsXHRcdC8vIG1heC13aWR0aCBmb3IgdGhlIHN1YiBtZW51cyAoYW55IENTUyB1bml0KSAtIGlmIHNldCwgdGhlIGZpeGVkIHdpZHRoIHNldCBpbiBDU1Mgd2lsbCBiZSBpZ25vcmVkXG5cdFx0c3ViSW5kaWNhdG9yczogXHRcdHRydWUsXHRcdC8vIGNyZWF0ZSBzdWIgbWVudSBpbmRpY2F0b3JzIC0gY3JlYXRlcyBhIFNQQU4gYW5kIGluc2VydHMgaXQgaW4gdGhlIEFcblx0XHRzdWJJbmRpY2F0b3JzUG9zOiBcdCdwcmVwZW5kJyxcdC8vIHBvc2l0aW9uIG9mIHRoZSBTUEFOIHJlbGF0aXZlIHRvIHRoZSBtZW51IGl0ZW0gY29udGVudCAoJ3ByZXBlbmQnLCAnYXBwZW5kJylcblx0XHRzdWJJbmRpY2F0b3JzVGV4dDpcdCcrJyxcdFx0Ly8gW29wdGlvbmFsbHldIGFkZCB0ZXh0IGluIHRoZSBTUEFOIChlLmcuICcrJykgKHlvdSBtYXkgd2FudCB0byBjaGVjayB0aGUgQ1NTIGZvciB0aGUgc3ViIGluZGljYXRvcnMgdG9vKVxuXHRcdHNjcm9sbFN0ZXA6IFx0XHQzMCxcdFx0Ly8gcGl4ZWxzIHN0ZXAgd2hlbiBzY3JvbGxpbmcgbG9uZyBzdWIgbWVudXMgdGhhdCBkbyBub3QgZml0IGluIHRoZSB2aWV3cG9ydCBoZWlnaHRcblx0XHRzY3JvbGxJbnRlcnZhbDpcdFx0MzAsXHRcdC8vIGludGVydmFsIGJldHdlZW4gZWFjaCBzY3JvbGxpbmcgc3RlcFxuXHRcdHNjcm9sbEFjY2VsZXJhdGU6XHR0cnVlLFx0XHQvLyBhY2NlbGVyYXRlIHNjcm9sbGluZyBvciB1c2UgYSBmaXhlZCBzdGVwXG5cdFx0c2hvd1RpbWVvdXQ6XHRcdDI1MCxcdFx0Ly8gdGltZW91dCBiZWZvcmUgc2hvd2luZyB0aGUgc3ViIG1lbnVzXG5cdFx0aGlkZVRpbWVvdXQ6XHRcdDUwMCxcdFx0Ly8gdGltZW91dCBiZWZvcmUgaGlkaW5nIHRoZSBzdWIgbWVudXNcblx0XHRzaG93RHVyYXRpb246XHRcdDAsXHRcdC8vIGR1cmF0aW9uIGZvciBzaG93IGFuaW1hdGlvbiAtIHNldCB0byAwIGZvciBubyBhbmltYXRpb24gLSBtYXR0ZXJzIG9ubHkgaWYgc2hvd0Z1bmN0aW9uOm51bGxcblx0XHRzaG93RnVuY3Rpb246XHRcdG51bGwsXHRcdC8vIGN1c3RvbSBmdW5jdGlvbiB0byB1c2Ugd2hlbiBzaG93aW5nIGEgc3ViIG1lbnUgKHRoZSBkZWZhdWx0IGlzIHRoZSBqUXVlcnkgJ3Nob3cnKVxuXHRcdFx0XHRcdFx0XHQvLyBkb24ndCBmb3JnZXQgdG8gY2FsbCBjb21wbGV0ZSgpIGF0IHRoZSBlbmQgb2Ygd2hhdGV2ZXIgeW91IGRvXG5cdFx0XHRcdFx0XHRcdC8vIGUuZy46IGZ1bmN0aW9uKCR1bCwgY29tcGxldGUpIHsgJHVsLmZhZGVJbigyNTAsIGNvbXBsZXRlKTsgfVxuXHRcdGhpZGVEdXJhdGlvbjpcdFx0MCxcdFx0Ly8gZHVyYXRpb24gZm9yIGhpZGUgYW5pbWF0aW9uIC0gc2V0IHRvIDAgZm9yIG5vIGFuaW1hdGlvbiAtIG1hdHRlcnMgb25seSBpZiBoaWRlRnVuY3Rpb246bnVsbFxuXHRcdGhpZGVGdW5jdGlvbjpcdFx0ZnVuY3Rpb24oJHVsLCBjb21wbGV0ZSkgeyAkdWwuZmFkZU91dCgyMDAsIGNvbXBsZXRlKTsgfSxcdC8vIGN1c3RvbSBmdW5jdGlvbiB0byB1c2Ugd2hlbiBoaWRpbmcgYSBzdWIgbWVudSAodGhlIGRlZmF1bHQgaXMgdGhlIGpRdWVyeSAnaGlkZScpXG5cdFx0XHRcdFx0XHRcdC8vIGRvbid0IGZvcmdldCB0byBjYWxsIGNvbXBsZXRlKCkgYXQgdGhlIGVuZCBvZiB3aGF0ZXZlciB5b3UgZG9cblx0XHRcdFx0XHRcdFx0Ly8gZS5nLjogZnVuY3Rpb24oJHVsLCBjb21wbGV0ZSkgeyAkdWwuZmFkZU91dCgyNTAsIGNvbXBsZXRlKTsgfVxuXHRcdGNvbGxhcHNpYmxlU2hvd0R1cmF0aW9uOjAsXHRcdC8vIGR1cmF0aW9uIGZvciBzaG93IGFuaW1hdGlvbiBmb3IgY29sbGFwc2libGUgc3ViIG1lbnVzIC0gbWF0dGVycyBvbmx5IGlmIGNvbGxhcHNpYmxlU2hvd0Z1bmN0aW9uOm51bGxcblx0XHRjb2xsYXBzaWJsZVNob3dGdW5jdGlvbjpmdW5jdGlvbigkdWwsIGNvbXBsZXRlKSB7ICR1bC5zbGlkZURvd24oMjAwLCBjb21wbGV0ZSk7IH0sXHQvLyBjdXN0b20gZnVuY3Rpb24gdG8gdXNlIHdoZW4gc2hvd2luZyBhIGNvbGxhcHNpYmxlIHN1YiBtZW51XG5cdFx0XHRcdFx0XHRcdC8vIChpLmUuIHdoZW4gbW9iaWxlIHN0eWxlcyBhcmUgdXNlZCB0byBtYWtlIHRoZSBzdWIgbWVudXMgY29sbGFwc2libGUpXG5cdFx0Y29sbGFwc2libGVIaWRlRHVyYXRpb246MCxcdFx0Ly8gZHVyYXRpb24gZm9yIGhpZGUgYW5pbWF0aW9uIGZvciBjb2xsYXBzaWJsZSBzdWIgbWVudXMgLSBtYXR0ZXJzIG9ubHkgaWYgY29sbGFwc2libGVIaWRlRnVuY3Rpb246bnVsbFxuXHRcdGNvbGxhcHNpYmxlSGlkZUZ1bmN0aW9uOmZ1bmN0aW9uKCR1bCwgY29tcGxldGUpIHsgJHVsLnNsaWRlVXAoMjAwLCBjb21wbGV0ZSk7IH0sXHQvLyBjdXN0b20gZnVuY3Rpb24gdG8gdXNlIHdoZW4gaGlkaW5nIGEgY29sbGFwc2libGUgc3ViIG1lbnVcblx0XHRcdFx0XHRcdFx0Ly8gKGkuZS4gd2hlbiBtb2JpbGUgc3R5bGVzIGFyZSB1c2VkIHRvIG1ha2UgdGhlIHN1YiBtZW51cyBjb2xsYXBzaWJsZSlcblx0XHRzaG93T25DbGljazpcdFx0ZmFsc2UsXHRcdC8vIHNob3cgdGhlIGZpcnN0LWxldmVsIHN1YiBtZW51cyBvbmNsaWNrIGluc3RlYWQgb2Ygb25tb3VzZW92ZXIgKG1hdHRlcnMgb25seSBmb3IgbW91c2UgaW5wdXQpXG5cdFx0aGlkZU9uQ2xpY2s6XHRcdHRydWUsXHRcdC8vIGhpZGUgdGhlIHN1YiBtZW51cyBvbiBjbGljay90YXAgYW55d2hlcmUgb24gdGhlIHBhZ2Vcblx0XHRrZWVwSW5WaWV3cG9ydDpcdFx0dHJ1ZSxcdFx0Ly8gcmVwb3NpdGlvbiB0aGUgc3ViIG1lbnVzIGlmIG5lZWRlZCB0byBtYWtlIHN1cmUgdGhleSBhbHdheXMgYXBwZWFyIGluc2lkZSB0aGUgdmlld3BvcnRcblx0XHRrZWVwSGlnaGxpZ2h0ZWQ6XHR0cnVlLFx0XHQvLyBrZWVwIGFsbCBhbmNlc3RvciBpdGVtcyBvZiB0aGUgY3VycmVudCBzdWIgbWVudSBoaWdobGlnaHRlZCAoYWRkcyB0aGUgJ2hpZ2hsaWdodGVkJyBjbGFzcyB0byB0aGUgQSdzKVxuXHRcdG1hcmtDdXJyZW50SXRlbTpcdGZhbHNlLFx0XHQvLyBhdXRvbWF0aWNhbGx5IGFkZCB0aGUgJ2N1cnJlbnQnIGNsYXNzIHRvIHRoZSBBIGVsZW1lbnQgb2YgdGhlIGl0ZW0gbGlua2luZyB0byB0aGUgY3VycmVudCBVUkxcblx0XHRtYXJrQ3VycmVudFRyZWU6XHR0cnVlLFx0XHQvLyBhZGQgdGhlICdjdXJyZW50JyBjbGFzcyBhbHNvIHRvIHRoZSBBIGVsZW1lbnRzIG9mIGFsbCBhbmNlc3RvciBpdGVtcyBvZiB0aGUgY3VycmVudCBpdGVtXG5cdFx0cmlnaHRUb0xlZnRTdWJNZW51czpcdGZhbHNlLFx0XHQvLyByaWdodCB0byBsZWZ0IGRpc3BsYXkgb2YgdGhlIHN1YiBtZW51cyAoY2hlY2sgdGhlIENTUyBmb3IgdGhlIHN1YiBpbmRpY2F0b3JzJyBwb3NpdGlvbilcblx0XHRib3R0b21Ub1RvcFN1Yk1lbnVzOlx0ZmFsc2UsXHRcdC8vIGJvdHRvbSB0byB0b3AgZGlzcGxheSBvZiB0aGUgc3ViIG1lbnVzXG5cdFx0b3ZlcmxhcENvbnRyb2xzSW5JRTpcdHRydWVcdFx0Ly8gbWFrZSBzdXJlIHN1YiBtZW51cyBhcHBlYXIgb24gdG9wIG9mIHNwZWNpYWwgT1MgY29udHJvbHMgaW4gSUUgKGkuZS4gU0VMRUNULCBPQkpFQ1QsIEVNQkVELCBldGMuKVxuXHR9O1xuXG59KShqUXVlcnkpOyIsIi8qXG4gKiBTbWFydE1lbnVzIGpRdWVyeSBCb290c3RyYXAgQWRkb24gLSB2MC4xLjFcbiAqIGh0dHA6Ly93d3cuc21hcnRtZW51cy5vcmcvXG4gKlxuICogQ29weXJpZ2h0IDIwMTQgVmFzaWwgRGlua292LCBWYWRpa29tIFdlYiBMdGQuXG4gKiBodHRwOi8vdmFkaWtvbS5jb20vXG4gKlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuICogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuXG4oZnVuY3Rpb24oJCkge1xuXG5cdC8vIGluaXQgb25kb21yZWFkeVxuXHQkKGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gaW5pdCBhbGwgbWVudXNcblx0XHQkKCd1bC5uYXZiYXItbmF2JykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyICR0aGlzID0gJCh0aGlzKTtcblx0XHRcdFx0JHRoaXMuYWRkQ2xhc3MoJ3NtJykuc21hcnRtZW51cyh7XG5cblx0XHRcdFx0XHRcdC8vIHRoZXNlIGFyZSBzb21lIGdvb2QgZGVmYXVsdCBvcHRpb25zIHRoYXQgc2hvdWxkIHdvcmsgZm9yIGFsbFxuXHRcdFx0XHRcdFx0Ly8geW91IGNhbiwgb2YgY291cnNlLCB0d2VhayB0aGVzZSBhcyB5b3UgbGlrZVxuXHRcdFx0XHRcdFx0c3ViTWVudXNTdWJPZmZzZXRYOiAyLFxuXHRcdFx0XHRcdFx0c3ViTWVudXNTdWJPZmZzZXRZOiAtNixcblx0XHRcdFx0XHRcdHN1YkluZGljYXRvcnNQb3M6ICdhcHBlbmQnLFxuXHRcdFx0XHRcdFx0c3ViSW5kaWNhdG9yc1RleHQ6ICcuLi4nLFxuXHRcdFx0XHRcdFx0Y29sbGFwc2libGVTaG93RnVuY3Rpb246IG51bGwsXG5cdFx0XHRcdFx0XHRjb2xsYXBzaWJsZUhpZGVGdW5jdGlvbjogbnVsbCxcblx0XHRcdFx0XHRcdHJpZ2h0VG9MZWZ0U3ViTWVudXM6ICR0aGlzLmhhc0NsYXNzKCduYXZiYXItcmlnaHQnKSxcblx0XHRcdFx0XHRcdGJvdHRvbVRvVG9wU3ViTWVudXM6ICR0aGlzLmNsb3Nlc3QoJy5uYXZiYXInKS5oYXNDbGFzcygnbmF2YmFyLWZpeGVkLWJvdHRvbScpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQvLyBzZXQgQm9vdHN0cmFwJ3MgXCJhY3RpdmVcIiBjbGFzcyB0byBTbWFydE1lbnVzIFwiY3VycmVudFwiIGl0ZW1zIChzaG91bGQgc29tZW9uZSBkZWNpZGUgdG8gZW5hYmxlIG1hcmtDdXJyZW50SXRlbTogdHJ1ZSlcblx0XHRcdFx0XHQuZmluZCgnYS5jdXJyZW50JykucGFyZW50KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuXHRcdFx0fSlcblx0XHRcdC5iaW5kKHtcblx0XHRcdFx0Ly8gc2V0L3Vuc2V0IHByb3BlciBCb290c3RyYXAgY2xhc3NlcyBmb3Igc29tZSBtZW51IGVsZW1lbnRzXG5cdFx0XHRcdCdzaG93LnNtYXBpJzogZnVuY3Rpb24oZSwgbWVudSkge1xuXHRcdFx0XHRcdHZhciAkbWVudSA9ICQobWVudSksXG5cdFx0XHRcdFx0XHQkc2Nyb2xsQXJyb3dzID0gJG1lbnUuZGF0YVNNKCdzY3JvbGwtYXJyb3dzJyksXG5cdFx0XHRcdFx0XHRvYmogPSAkKHRoaXMpLmRhdGEoJ3NtYXJ0bWVudXMnKTtcblx0XHRcdFx0XHRpZiAoJHNjcm9sbEFycm93cykge1xuXHRcdFx0XHRcdFx0Ly8gdGhleSBpbmhlcml0IGJvcmRlci1jb2xvciBmcm9tIGJvZHksIHNvIHdlIGNhbiB1c2UgaXRzIGJhY2tncm91bmQtY29sb3IgdG9vXG5cdFx0XHRcdFx0XHQkc2Nyb2xsQXJyb3dzLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICQoZG9jdW1lbnQuYm9keSkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQkbWVudS5wYXJlbnQoKS5hZGRDbGFzcygnb3BlbicgKyAob2JqLmlzQ29sbGFwc2libGUoKSA/ICcgY29sbGFwc2libGUnIDogJycpKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0J2hpZGUuc21hcGknOiBmdW5jdGlvbihlLCBtZW51KSB7XG5cdFx0XHRcdFx0JChtZW51KS5wYXJlbnQoKS5yZW1vdmVDbGFzcygnb3BlbiBjb2xsYXBzaWJsZScpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQvLyBjbGljayB0aGUgcGFyZW50IGl0ZW0gdG8gdG9nZ2xlIHRoZSBzdWIgbWVudXMgKGFuZCByZXNldCBkZWVwZXIgbGV2ZWxzIGFuZCBvdGhlciBicmFuY2hlcyBvbiBjbGljaylcblx0XHRcdFx0J2NsaWNrLnNtYXBpJzogZnVuY3Rpb24oZSwgaXRlbSkge1xuXHRcdFx0XHRcdHZhciBvYmogPSAkKHRoaXMpLmRhdGEoJ3NtYXJ0bWVudXMnKTtcblx0XHRcdFx0XHRpZiAob2JqLmlzQ29sbGFwc2libGUoKSkge1xuXHRcdFx0XHRcdFx0dmFyICRpdGVtID0gJChpdGVtKSxcblx0XHRcdFx0XHRcdFx0JHN1YiA9ICRpdGVtLnBhcmVudCgpLmRhdGFTTSgnc3ViJyk7XG5cdFx0XHRcdFx0XHRpZiAoJHN1YiAmJiAkc3ViLmRhdGFTTSgnc2hvd24tYmVmb3JlJykgJiYgJHN1Yi5pcygnOnZpc2libGUnKSkge1xuXHRcdFx0XHRcdFx0XHRvYmouaXRlbUFjdGl2YXRlKCRpdGVtKTtcblx0XHRcdFx0XHRcdFx0b2JqLm1lbnVIaWRlKCRzdWIpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHR9KTtcblxuXHQvLyBmaXggY29sbGFwc2libGUgbWVudSBkZXRlY3Rpb24gZm9yIEJvb3RzdHJhcCAzXG5cdCQuU21hcnRNZW51cy5wcm90b3R5cGUuaXNDb2xsYXBzaWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLiRmaXJzdExpbmsucGFyZW50KCkuY3NzKCdmbG9hdCcpICE9ICdsZWZ0Jztcblx0fTtcblxufSkoalF1ZXJ5KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=