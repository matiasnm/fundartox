const API_URL = 'http://localhost/wordpress/wp-json/wp/v2/posts';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  setupNavigation();
  setupHamburger();
  setupFooterNavigation();
  setupPaginationButtons();
  fetchPosts(currentPage);
  setupModal();
  setupContactForm();
}

// Contact Form Logic
function setupContactForm() {
  const formEmail = document.getElementById("form-email");
  const formBody = document.getElementById("form-body");
  const formSubmit = document.getElementById("form-submit");

  formSubmit.addEventListener("click", handleFormSubmit);

  function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateEmail(formEmail.value)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!formBody.value.trim()) {
      alert("Please enter your query.");
      return;
    }

    submitForm(formEmail.value, formBody.value)
      .then(() => {
        alert("Your query has been successfully sent!");
        formEmail.value = "";
        formBody.value = "";
      })
      .catch((error) => {
        console.error("Form submission error:", error);
        alert("There was an issue submitting your query. Please try again later.");
      });
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function submitForm(email, body) {
  // Simulated API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.1 ? resolve() : reject("Simulated network error");
    }, 1000);
  });
}

// Modal Setup
function setupModal() {
  const modal = document.getElementById('searchModal');
  const searchButton = document.getElementById('search');
  const closeButton = document.querySelector('.modal-content .close');
  const submitButton = document.getElementById('searchSubmit');
  const searchInput = document.getElementById('searchInput');

  searchButton.addEventListener('click', () => (modal.style.display = 'block'));
  closeButton.addEventListener('click', () => (modal.style.display = 'none'));
  window.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = 'none';
  });

   // Submit the search query when the submit button is clicked
   submitButton.addEventListener('click', () => handleSearch());

   // Submit the search query when pressing Enter in the input field
   searchInput.addEventListener('keydown', (event) => {
     if (event.key === 'Enter') {
       event.preventDefault(); // Prevent the default form submission behavior
       handleSearch();
     }
   });
 
   // Handle the search logic
   function handleSearch() {
     const query = searchInput.value.trim();
     if (query) {
       fetchPosts(1, query);
       modal.style.display = 'none';
     } else {
       alert('Please enter a search query');
     }
   }
}

// Navigation Setup
function setupNavigation() {
  const menuItems = ['home', 'about', 'services', 'news', 'contact'];
  menuItems.forEach((item) => {
    const menu = document.getElementById(item);
    menu.addEventListener('click', (event) => handleMenuClick(event, item));
  });
}

function setupHamburger() {
  const hamburger = document.querySelector('.hamburger-menu');
  const menu = document.querySelector('.menu-nav');

  hamburger.addEventListener('click', () => {
      menu.classList.toggle('show');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
        menu.classList.remove('show');
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
        menu.classList.remove('show');
    }
  });
}

function handleMenuClick(event, item) {
  event.preventDefault();
  const sections = document.querySelectorAll('section');
  sections.forEach((section) => (section.style.display = 'none'));

  const selectedSection = document.getElementById(`section-${item}`);
  selectedSection.style.display = 'block';
  window.scrollTo(0, 0);

  const galleryContainer = document.getElementById('gallery');
  if (item === 'news' && galleryContainer.innerHTML === '') {
    fetchPosts(1);
  }
}

// Footer Navigation
function setupFooterNavigation() {
  const footerMenuItems = ['home-footer', 'news-footer', 'contact-footer'];
  footerMenuItems.forEach((footerItem) => {
    const footerMenu = document.getElementById(footerItem);
    footerMenu.addEventListener('click', (event) => handleFooterMenuClick(event, footerItem));
  });
}

function handleFooterMenuClick(event, footerItem) {
  event.preventDefault();
  const targetSectionId = footerItem.replace('-footer', '');
  document.getElementById(`section-${targetSectionId}`).style.display = 'block';
  window.scrollTo(0, 0);
}

// Pagination Setup
function setupPaginationButtons() {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) fetchPosts(--currentPage);
  });

  nextButton.addEventListener('click', () => fetchPosts(++currentPage));
}

// Fetch Posts
async function fetchPosts(page = 1, query = '') {
  const spinner = document.getElementById("spinner-overlay");
  spinner.style.display = 'flex';

  try {
    const url = query
      ? `${API_URL}?per_page=6&page=${page}&search=${encodeURIComponent(query)}`
      : `${API_URL}?per_page=6&page=${page}`;

    if (query) {
      searchResultsMsg(query); // Display search results message
    } else {
      searchResultsMsg(); // Hide search results message
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching posts');

    const posts = await response.json();
    const totalPages = response.headers.get('X-WP-TotalPages');

    if (posts.length === 0) {
        renderEmptyGallery('Sin resultados');
        disablePaginationButtons();
    } else {
        const gallery = await Promise.all(posts.map(mapPostToGalleryItem));
        renderGallery(gallery);
        managePaginationButtons(page, response.headers.get('X-WP-TotalPages'));
    }

  } catch (error) {
    console.error('Error fetching posts:', error);
    disablePaginationButtons();
    renderEmptyGallery('Error: Sin resultados.');
  } finally {
    spinner.style.display = 'none';
  }
}

function searchResultsMsg(msg = '') {
    let searchResults = document.getElementById('search-results');
    let searchResultsSpan = document.getElementById('search-results-span');
    let searchResultsClose = document.getElementById('search-results-close');
    if (msg === '') {
      searchResultsSpan.innerText = '';
      searchResults.style.display = 'none';
    } else {
      searchResultsSpan.innerText = `Resultados de búsqueda para: ${msg}.`;
      searchResults.style.display = 'block';
      searchResultsClose.addEventListener('click', () => (fetchPosts(1)));
    }
}

function renderGallery(posts) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  gallery.innerHTML = posts
    .map(
      (post) => `
      <div class="gallery-item">
        <a href="${post.link}" target="_blank">
          <img src="${post.image}" alt="${post.title}">
          <h3>${post.title}</h3>
        </a>
      </div>`
    )
    .join('');
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

function renderEmptyGallery(message) {
  document.getElementById('gallery').innerHTML = `<p>${message}</p>`;
}

function managePaginationButtons(currentPage, totalPages) {
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

function disablePaginationButtons() {
    document.getElementById('prevPage').disabled = true;
    document.getElementById('nextPage').disabled = true;
}