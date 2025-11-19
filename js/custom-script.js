document.addEventListener('click', function(event) {
    if (event.target.id === 'closeModalBtn') {
        closeModal();
    }
});

function toggleBodyScroll(modalOpen) {
    if (modalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('myModal');

openModalBtn.addEventListener('click', function(event) {
    event.preventDefault(); // Verhindere das Standardverhalten des Links
    openModal();
});

function openModal() {
    modal.style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    toggleBodyScroll(true);

    // Initialize the Babylon.js scene
    // initializeBabylonScene();
}

function closeModal() {
    modal.style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    toggleBodyScroll(false); // Enable body scrolling
}

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