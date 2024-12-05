const apiUrl = 'http://localhost/wordpress/wp-json/wp/v2/posts';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  setupMenuNavigation();
  setupMenuFooterNavigation();
  setupPaginationButtons();
  fetchPosts(currentPage);
  setupModal();
  setupContactForm();
}

function setupContactForm() {
  const formEmail = document.getElementById("form-email");
  const formBody = document.getElementById("form-body");
  const formSubmit = document.getElementById("form-submit");

  formSubmit.addEventListener("click", (event) => {
    event.preventDefault();

    if (!validateEmail(formEmail.value)) {
      alert("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    if (!formBody.value.trim()) {
      alert("Por favor, ingrese su consulta.");
      return;
    }

    // Simulate submission function
    async function handleSubmit(email, body) {
      // Replace this with a real API call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) resolve(); // 90% chance of success
          else reject("Simulated network error");
        }, 1000);
      });
    }

    // Simulate form submission (e.g., via an API call)
    handleSubmit(formEmail.value, formBody.value)
      .then(() => {
        alert("¡Su consulta ha sido enviada con éxito!");
        // Reset form
        formEmail.value = "";
        formBody.value = "";
      })
      .catch((error) => {
        console.error("Error al enviar el formulario:", error);
        alert("Hubo un problema al enviar su consulta. Por favor, inténtelo de nuevo más tarde.");
      });
  });

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

function setupModal() {
  const modal = document.getElementById('searchModal');
  const searchButton = document.getElementById('search');
  const closeButton = document.querySelector('.modal-content .close');
  const submitButton = document.getElementById('searchSubmit');
  const searchInput = document.getElementById('searchInput');
  // Open modal on button click
  searchButton.addEventListener('click', () => {
    modal.style.display = 'block';
  });
  // Close modal on close button click
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  // Handle search input submit
  submitButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      fetchPosts(1, query);
      modal.style.display = 'none'; // Close modal after submission
    } else {
      alert('Please enter a search query');
    }
  });
}

// Set up menu navigation
function setupMenuNavigation() {
  const menuItems = ['home', 'about', 'services', 'news', 'contact'];
  const sections = menuItems.map((item) => document.getElementById(`section-${item}`));

  menuItems.forEach((item) => {
    const menu = document.getElementById(item);
    menu.addEventListener('click', (ev) => {
      ev.preventDefault();
      displaySection(item, sections);
      if (item === 'news') {
        fetchPosts(1);
      }
    });
  });
}

function setupMenuFooterNavigation() {
  const footerMenuItems = ['home-footer', 'news-footer', 'contact-footer'];
  const menuItems = ['home', 'news', 'contact']; // Corresponding section IDs
  const sections = menuItems.map((item) => document.getElementById(`section-${item}`));

  footerMenuItems.forEach((footerItem, index) => {
    const footerMenu = document.getElementById(footerItem);
    footerMenu.addEventListener('click', (ev) => {
      ev.preventDefault();
      // Use the corresponding menu item to find the section
      displaySection(menuItems[index], sections);
    });
  });
}

// Display the selected section
function displaySection(id, sections) {
  sections.forEach((section) => (section.style.display = 'none'));
  const sectionToShow = document.getElementById(`section-${id}`);
  sectionToShow.style.display = 'block';
  //sectionToShow.style.display = id === 'news' ? 'flex' : 'block';
  window.scrollTo(0, 0);
}

// Set up pagination buttons
function setupPaginationButtons() {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      fetchPosts(currentPage);
    }
  });

  nextButton.addEventListener('click', () => {
    currentPage += 1;
    fetchPosts(currentPage);
  });
}

// Fetch posts and render the gallery
async function fetchPosts(page = 1, query = '') {
  const spinnerOverlay = document.getElementById("spinner-overlay");

  // Show spinner
  function showSpinner() {
    spinnerOverlay.style.display = "flex";
  }

  // Hide spinner
  function hideSpinner() {
    spinnerOverlay.style.display = "none";
  }

  function showNoResultsMessage() {
    const noResultsMessage = document.createElement("div");
    noResultsMessage.classList.add("no-results");
    noResultsMessage.innerText = "Sin resultados.";
    let galleryContainer = document.getElementById('gallery');
    galleryContainer.innerHTML = '';
    galleryContainer.appendChild(noResultsMessage);
  }

  try {
    showSpinner();

    // Create the URL with the optional query
    let url = `${apiUrl}?per_page=6&page=${page}`;
    if (query) {
      url += `&search=${encodeURIComponent(query)}`; // Append query if provided
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching posts');

    const posts = await response.json();
    //const gallery = await Promise.all(posts.map(mapPostToGalleryItem));
    //renderGallery(gallery);
    //managePaginationButtons(page, response.headers.get('X-WP-TotalPages'));

    if (posts.length === 0) {
      showNoResultsMessage();
    } else {
      const gallery = await Promise.all(posts.map(mapPostToGalleryItem));
      renderGallery(gallery);
      managePaginationButtons(page, response.headers.get('X-WP-TotalPages'));
    }

    hideSpinner();
  } catch (error) {
    console.error('Error fetching posts:', error);
    hideSpinner();
  }
}

// Map post data to gallery items
async function mapPostToGalleryItem(post) {
  const image = await fetchFeaturedImage(post.featured_media);
  return {
    title: post.title.rendered,
    link: post.link,
    image: image || 'default-image.jpg',
  };
}

// Fetch the featured image using the media endpoint
async function fetchFeaturedImage(mediaId) {
  if (!mediaId) return null;
  try {
    const response = await fetch(`http://localhost/wordpress/wp-json/wp/v2/media/${mediaId}`);
    if (!response.ok) throw new Error('Error fetching media');
    const media = await response.json();
    return media.source_url;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

// Render the gallery with posts
function renderGallery(posts) {
  const galleryContainer = document.getElementById('gallery');
  galleryContainer.innerHTML = ''; // Clear previous content

  posts.forEach((post) => {
    const postElement = document.createElement('div');
    postElement.className = 'gallery-item';
    postElement.innerHTML = `
      <a href="${post.link}" target="_blank">
        <img src="${post.image}" alt="${post.title}">
        <h3>${post.title}</h3>
      </a>
    `;
    galleryContainer.appendChild(postElement);
  });
}

// Manage pagination button states
function managePaginationButtons(currentPage, totalPages) {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');

  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
}
