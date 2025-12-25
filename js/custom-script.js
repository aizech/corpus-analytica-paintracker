document.addEventListener('DOMContentLoaded', function () {
    // Store original viewport meta content to restore when modal closes
    var originalViewportContent = null;
    var viewportMeta = document.querySelector('meta[name="viewport"]');

    var ptDebugEnabled = (function () {
        try {
            return /(?:\?|&)ptdebug=1(?:&|$)/.test(window.location.search || '');
        } catch (e) {
            return false;
        }
    })();

    var ptDebugPanel = null;
    var ptDebugActive = false;
    var ptDebugHandler = null;

    function ptDebugEnsurePanel() {
        if (ptDebugPanel) {
            return;
        }

        ptDebugPanel = document.createElement('div');
        ptDebugPanel.id = 'ptTouchDebug';
        ptDebugPanel.style.position = 'fixed';
        ptDebugPanel.style.left = '8px';
        ptDebugPanel.style.right = '8px';
        ptDebugPanel.style.bottom = '8px';
        ptDebugPanel.style.zIndex = '2147483647';
        ptDebugPanel.style.background = 'rgba(0, 0, 0, 0.75)';
        ptDebugPanel.style.color = '#fff';
        ptDebugPanel.style.fontSize = '12px';
        ptDebugPanel.style.lineHeight = '1.3';
        ptDebugPanel.style.padding = '8px 10px';
        ptDebugPanel.style.borderRadius = '10px';
        ptDebugPanel.style.pointerEvents = 'none';
        ptDebugPanel.style.fontFamily = 'system-ui, -apple-system, Segoe UI, sans-serif';
        ptDebugPanel.textContent = 'Touch debug: waiting...';
        document.body.appendChild(ptDebugPanel);
    }

    function ptDescribeEl(el) {
        if (!el) {
            return 'null';
        }
        var id = el.id ? ('#' + el.id) : '';
        var cls = (el.className && typeof el.className === 'string') ? ('.' + el.className.trim().replace(/\s+/g, '.')) : '';
        return (el.tagName || 'EL') + id + cls;
    }

    function ptDebugSet(text) {
        ptDebugEnsurePanel();
        if (ptDebugPanel) {
            ptDebugPanel.textContent = text;
        }
    }

    function ptDebugStart() {
        if (!ptDebugEnabled) {
            return;
        }
        if (ptDebugActive) {
            return;
        }
        ptDebugActive = true;
        ptDebugEnsurePanel();

        ptDebugHandler = function (e) {
            if (!ptDebugActive) {
                return;
            }

            var x = null;
            var y = null;
            var touchesCount = 0;
            if (e.touches && e.touches.length) {
                touchesCount = e.touches.length;
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else if (typeof e.clientX === 'number') {
                x = e.clientX;
                y = e.clientY;
            }

            var at = (x !== null && y !== null) ? document.elementFromPoint(x, y) : null;
            var target = e.target || null;
            var canvas = document.getElementById('renderCanvas');
            var inCanvas = false;
            if (canvas && x !== null && y !== null) {
                var r = canvas.getBoundingClientRect();
                inCanvas = (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
            }

            var type = e.type;
            var pointerType = e.pointerType ? (' ' + e.pointerType) : '';
            ptDebugSet(type + pointerType + ' touches=' + touchesCount + ' inCanvas=' + inCanvas + ' target=' + ptDescribeEl(target) + ' at=' + ptDescribeEl(at));
        };

        document.addEventListener('touchstart', ptDebugHandler, { capture: true, passive: true });
        document.addEventListener('touchmove', ptDebugHandler, { capture: true, passive: true });
        document.addEventListener('pointerdown', ptDebugHandler, { capture: true });
        document.addEventListener('pointermove', ptDebugHandler, { capture: true });
    }

    function ptDebugStop() {
        if (!ptDebugEnabled) {
            return;
        }
        if (!ptDebugActive) {
            return;
        }
        ptDebugActive = false;
        if (ptDebugHandler) {
            document.removeEventListener('touchstart', ptDebugHandler, { capture: true });
            document.removeEventListener('touchmove', ptDebugHandler, { capture: true });
            document.removeEventListener('pointerdown', ptDebugHandler, { capture: true });
            document.removeEventListener('pointermove', ptDebugHandler, { capture: true });
            ptDebugHandler = null;
        }
        if (ptDebugPanel && ptDebugPanel.parentNode) {
            ptDebugPanel.parentNode.removeChild(ptDebugPanel);
        }
        ptDebugPanel = null;
    }

    function toggleBodyScroll(modalOpen) {
        if (modalOpen) {
            document.body.style.overflow = 'hidden';
            // CRITICAL: Set touch-action on body and html for PEP.js to work
            document.body.style.touchAction = 'none';
            document.documentElement.style.touchAction = 'none';
            // Disable page zoom on mobile when modal is open
            if (viewportMeta) {
                originalViewportContent = viewportMeta.getAttribute('content');
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            } else {
                viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(viewportMeta);
            }
        } else {
            document.body.style.overflow = '';
            // Restore touch-action
            document.body.style.touchAction = '';
            document.documentElement.style.touchAction = '';
            // Restore original viewport when modal closes
            if (viewportMeta && originalViewportContent !== null) {
                viewportMeta.setAttribute('content', originalViewportContent);
            } else if (viewportMeta && originalViewportContent === null) {
                // If we created the meta tag, remove it
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        }
    }

    function getElements() {
        return {
            openModalBtn: document.getElementById('openModalBtn'),
            modal: document.getElementById('myModal'),
            overlay: document.getElementById('modalOverlay'),
            closeBtn: document.querySelector('#myModal .close-btn')
        };
    }

    function ensureTopLayer() {
        var els = getElements();
        if (!els.modal || !els.overlay) {
            return;
        }

        // Avoid theme stacking-context issues by putting overlay+modal directly under <body>
        if (els.overlay.parentNode !== document.body) {
            document.body.appendChild(els.overlay);
        }
        if (els.modal.parentNode !== document.body) {
            document.body.appendChild(els.modal);
        }
    }

    function openModal() {
        var els = getElements();
        if (!els.modal || !els.overlay) {
            return;
        }

        ensureTopLayer();
        els.overlay.style.display = 'block';
        els.modal.style.display = 'block';
        toggleBodyScroll(true);

        ptDebugStart();

        // Re-initialize Babylon.js canvas after modal is visible
        // This fixes touch event issues when canvas was hidden during initialization
        setTimeout(function() {
            var canvas = document.getElementById('renderCanvas');
            if (canvas) {
                // Trigger a resize to ensure canvas dimensions are correct
                if (window.painTrackerEngine) {
                    window.painTrackerEngine.resize();
                }
                // Re-attach camera controls to ensure touch events work
                if (window.painTrackerCamera) {
                    window.painTrackerCamera.detachControl();
                    window.painTrackerCamera.attachControl(canvas, false);
                }
            }
        }, 100);
    }

    function closeModal() {
        var els = getElements();
        if (!els.modal || !els.overlay) {
            return;
        }

        els.modal.style.display = 'none';
        els.overlay.style.display = 'none';
        toggleBodyScroll(false);

        ptDebugStop();
    }

    // Expose closeModal globally because inline onclick calls it (from PHP template)
    window.closeModal = closeModal;
    window.openModal = openModal;

    var els = getElements();
    if (els.openModalBtn) {
        els.openModalBtn.addEventListener('click', function (event) {
            event.preventDefault();
            openModal();
        });
    }

    // Close when clicking on the dark backdrop
    if (els.overlay) {
        els.overlay.addEventListener('click', function () {
            closeModal();
        });
    }

    // Close when clicking the X icon
    if (els.closeBtn) {
        els.closeBtn.addEventListener('click', function (event) {
            event.preventDefault();
            closeModal();
        });
    }

    // Close on ESC
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});

const slideValue = document.querySelector("span");
const inputSlider = document.querySelector("input");
inputSlider.oninput = (() => {
    let value = inputSlider.value;
    slideValue.textContent = value;
    slideValue.style.left = (value / 2) + "%";
    slideValue.classList.add("show");
});
inputSlider.onblur = (() => {
    slideValue.classList.remove("show");
});