document.addEventListener('DOMContentLoaded', function () {
    function toggleBodyScroll(modalOpen) {
        if (modalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
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
    }

    function closeModal() {
        var els = getElements();
        if (!els.modal || !els.overlay) {
            return;
        }

        els.modal.style.display = 'none';
        els.overlay.style.display = 'none';
        toggleBodyScroll(false);
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