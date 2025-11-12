// Utility Functions

// Session Management Functions
const checkAuthStatus = async () => {
  try {
    const response = await fetch('/M00951083/login');
    const data = await response.json();
    
    if (data.user) {
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
};

const updateUIWithUserInfo = (user) => {
  // Update user nav element
  const userNav = document.querySelector('[data-page="logout"]');
  if (userNav) {
    userNav.innerHTML = `👤 ${user.username}`;
    userNav.title = "Click to logout";
    userNav.addEventListener('click', handleLogout);
  }

  // Update welcome message
  const contentTitle = document.getElementById('content-title');
  if (contentTitle) {
    contentTitle.textContent = `Welcome, ${user.fullName}!`;
  }
};

// handleLogOut
const handleLogout = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/M00951083/logout', {
      method: 'POST',
    });
    
    if (response.ok) {
      navigateTo('/M00951083/login');
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// the handleLogin function
const handleLogin = async (event) => {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  let errorMessage = "";
  
  if (email.length === 0 || email.length > 50) {
    errorMessage += "Email must be between 1 and 50 characters.\n";
  }

  if (password.length === 0 || password.length > 50) {
    errorMessage += "Password must be between 1 and 50 characters.\n";
  }
  
  if (errorMessage) {
    alert(`Please fix the following errors:\n${errorMessage}`);
  } else {
    try {
      const response = await fetch('/M00951083/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      const responseData = await response.json();
      if (responseData.error) {
        alert(responseData.error);
      } else {
        // Store user data in sessionStorage 
        sessionStorage.setItem('currentUser', JSON.stringify(responseData.user));
        alert('Logged in successfully!');
        navigateTo('/M00951083/dashboard');
      }
    } catch (err) {
      console.error('Error during login:', err);
      alert(`Invalid credentials. Please try again`);
    }
  }
};

// search bar functionality
const API_KEY = 'AIzaSyBQNcz2G59gxVD1baKHjlXG6AC-CLBaXdI'; //global 
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

const handleSearch = async (query) => {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = '<h2>Search Results</h2>'; // Clear and add a title
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('search-results-container');

  try {
    // Perform all searches in parallel
    const [usersResponse, topicsResponse, booksResponse, videosResponse] = await Promise.all([
      fetch(`http://localhost:8080/M00951083/users/search?query=${encodeURIComponent(query)}`), // Search users
      fetch(`http://localhost:8080/M00951083/contents/search?query=${encodeURIComponent(query)}`), // Search topics
      fetch(`${BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`), // Search books
      fetch(`${YOUTUBE_API_URL}?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`), // Search YouTube videos
    ]);

    // Create sections for Users and Topics
    const userSection = document.createElement('div');
    const topicSection = document.createElement('div');

    // Handle Users
    if (!usersResponse.ok) {
      userSection.innerHTML = '<h3>Users</h3><p>No results found.</p>';
    } else {
      const users = (await usersResponse.json()) || [];
      if (users.length > 0) {
        userSection.innerHTML = '<h3>Users</h3>';
        users.forEach((user) => {
          const userCard = document.createElement('div');
          userCard.classList.add('user-card');
          userCard.innerHTML = `
           <img src="${user.profilePicture}" alt="${user.fullName}">
           <p>${user.fullName}</p>
            <p>${user.username}</p>
            <small>${user.occupation || 'No occupation listed'}</small>
          `;
          userSection.appendChild(userCard);
        });
      } else {
        userSection.innerHTML = '<h3>Users</h3><p>No results found.</p>';
      }
    }
    resultsContainer.appendChild(userSection);

    // Handle Topics
    if (!topicsResponse.ok) {
      topicSection.innerHTML = '<h3>Community Topics</h3><p>No results found.</p>';
    } else {
      const topics = (await topicsResponse.json()) || [];
      if (topics.length > 0) {
        topicSection.innerHTML = '<h3>Community Topics</h3>';
        topics.forEach((topic) => {
          const topicCard = document.createElement('div');
          topicCard.classList.add('topic-card');
          topicCard.innerHTML = `
            <p>${topic.content}</p>
            <small>Posted by: ${topic.userId}</small>
          `;
          topicSection.appendChild(topicCard);
        });
      } else {
        topicSection.innerHTML = '<h3>Community Topics</h3><p>No results found.</p>';
      }
    }
    resultsContainer.appendChild(topicSection);

    // Handle Books
    const books = (await booksResponse.json()).items || [];
    if (books.length > 0) {
      const bookSection = document.createElement('div');
      bookSection.innerHTML = '<h3>Books</h3>';
      books.forEach((book) => {
        const bookInfo = book.volumeInfo;
        const bookCard = document.createElement('div');
        bookCard.classList.add('book-card');
        bookCard.innerHTML = `
          <img src="${bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192'}" alt="${bookInfo.title}" />
          <h4>${bookInfo.title}</h4>
          <p>${bookInfo.authors?.join(', ') || 'Unknown author'}</p>
          <a href="${bookInfo.previewLink}" target="_blank">View More</a>
        `;
        bookSection.appendChild(bookCard);
      });
      resultsContainer.appendChild(bookSection);
    }

    // Handle Videos
    const videos = (await videosResponse.json()).items || [];
    if (videos.length > 0) {
      const videoSection = document.createElement('div');
      videoSection.innerHTML = '<h3>YouTube Videos</h3>';
      videos.forEach((video) => {
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');
        videoCard.innerHTML = `
          <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}" />
          <h4>${video.snippet.title}</h4>
          <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">Watch</a>
        `;
        videoSection.appendChild(videoCard);
      });
      resultsContainer.appendChild(videoSection);
    }

    // Append results to the main content
    if (resultsContainer.childElementCount > 0) {
      mainContent.appendChild(resultsContainer);
    } else {
      mainContent.innerHTML += '<p>No results found.</p>';
    }
    } catch (error) {
    console.error('Error during search:', error);
    mainContent.innerHTML = '<p>Failed to load search results. Please try again later.</p>';
    }
};

// the loadDashboardPage function to load the dashboard
const loadDashboardPage = async () => {
  // Check if user is authenticated
  const user = await checkAuthStatus();
  if (!user) {
    navigateTo('/M00951083/login');
    return;
  }

  // Clear all content from the body
  document.body.innerHTML = ''; 

  // Create the container for the dashboard
  const dashboardContainer = document.createElement('div');
  dashboardContainer.classList.add('dashboard-container');

  // Create Sidebar
  const sidebar = document.createElement('div');
  sidebar.classList.add('sidebar');
  sidebar.id = 'sidebar';

  const logo = document.createElement('div');
  logo.id = 'logo';
  const logoImg = document.createElement('img');
  logoImg.src = "../images/Screenshot_2024-11-11_163145-removebg-preview.png";
  logoImg.alt = "";
  logo.appendChild(logoImg);

  const searchForm = document.createElement('form');
  searchForm.classList.add('search-bar');
  searchForm.id = 'search-form';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search...';
  searchInput.id = 'search-input';

  const searchButton = document.createElement('button');
  searchButton.type = 'submit';
  searchButton.classList.add('search-icon');
  searchButton.innerHTML = '🔍';

  searchForm.appendChild(searchInput);
  searchForm.appendChild(searchButton);

  // Navigation links
  const nav = document.createElement('nav');

  const linksData = [
    { page: 'home', label: '🏠 Home' },
    { page: 'journal', label: '📝 My Journal' },
    { page: 'meditations', label: '🧘 Meditations' },
    { page: 'community', label: '🫂 Communnity' },
    { page: 'resources', label: '📚 Resources' },
    { page: 'about', label: `❔ About` },
    { page: 'User', label: `👤 ${user.username}` },
    { page: 'Logout', label: `🚪Logout` },

  ];

  linksData.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = '#';
    anchor.dataset.page = link.page;
    anchor.classList.add('nav-link');
    anchor.innerHTML = link.label;

    // Add click listener to update the main content dynamically
    anchor.addEventListener('click', (event) => {

      event.preventDefault();

      setActivePage(link.page);
      updateMainContent(link.page, user);
    });

    nav.appendChild(anchor);
  });

  sidebar.appendChild(logo);
  sidebar.appendChild(searchForm);
  sidebar.appendChild(nav);

  
  // Event listener for the search form
  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      console.log('Search Query:', query);
      handleSearch(query);
    } else {
      alert('Please enter a search term.');
    }
  };

// Click event on the search button
if (searchButton) {
  searchButton.addEventListener('click', (e) => {
    console.log('Button clicked');
    e.preventDefault();
    performSearch();
  });
}

// Keypress event for "Enter" key
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed');
      e.preventDefault();
      performSearch();
    }
  });
}

  // Create Main Content
  const mainContent = document.createElement('div');
  mainContent.classList.add('main-content');
  mainContent.id = 'main-content';

  // Append sidebar and main content to the dashboard container
  dashboardContainer.appendChild(sidebar);
  dashboardContainer.appendChild(mainContent);

  // Append the dashboard container to the body
  document.body.appendChild(dashboardContainer);

  // Automatically set the first link (Home) as active
  const firstLink = document.querySelector('.nav-link');
  if (firstLink) firstLink.classList.add('active');

  // Load initial content 
  updateMainContent('home', user);

  // Event listener for logout
  const logoutLink = document.querySelector('[data-page="logout"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', handleLogout);
  }
};

// the home page function for main feed
const loadHomePage = async () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content
  mainContent.innerHTML = '';

  // Create Swiper Container
  const swiperContainer = document.createElement('div');
  swiperContainer.classList.add('container', 'swiper');
  swiperContainer.innerHTML = `
    <div class="slider-wrapper">
      <div class="card-list swiper-wrapper" id="user-swiper">
        <!-- Dynamic User Cards will be injected here -->
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-slide-button swiper-button-prev"></div>
      <div class="swiper-slide-button swiper-button-next"></div>
    </div>
  `;
  mainContent.appendChild(swiperContainer);

  // Fetch users for swiper
  try {
    // Fetch all users and following data
    const usersResponse = await fetch('http://localhost:8080/M00951083/users');
    const users = await usersResponse.json();

    const followingResponse = await fetch('http://localhost:8080/M00951083/following');
    const following = await followingResponse.json();
    const followingSet = new Set(following); // Create a Set for quick lookup

    const swiperWrapper = document.getElementById('user-swiper');
    users.forEach((user) => {
      const isFollowing = followingSet.has(user.username);

      const card = document.createElement('div');
      card.classList.add('card-item', 'swiper-slide');
      card.innerHTML = `
        <img src="${user.profilePicture || 'https://via.placeholder.com/150'}" alt="${user.username}'s Image" class="user-image">
        <h2 class="user-name">${user.username}</h2>
        <p class="comment">${user.occupation || 'No Occupation Listed'}</p>
        <button class="follow-btn" data-username="${user.username}">
          ${isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      `;
      swiperWrapper.appendChild(card);
    });

   // Add event listeners for follow/unfollow buttons
   document.querySelectorAll('.follow-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetUsername = button.dataset.username;
      const currentButtonText = button.textContent.trim();

      if (currentButtonText === 'Unfollow') {
        await unfollowUser(targetUsername);
        button.textContent = 'Follow';
      } else {
        await followUser(targetUsername);
        button.textContent = 'Unfollow';
      }
    });
  });
    // Initialize Swiper.js
    new Swiper('.slider-wrapper', {
      loop: true,
      grabCursor: true,
      spaceBetween: 10,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        0: { slidesPerView: 2 },
        768: { slidesPerView: 4 },
        1024: { slidesPerView: 8},
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }

// Create Content Feed Section
const contentFeed = document.createElement('div');
contentFeed.classList.add('content-feed');
mainContent.appendChild(contentFeed);

// Fetch and display content
try {
  const contentResponse = await fetch('http://localhost:8080/M00951083/contents');
  const contents = await contentResponse.json();

  const usersResponse = await fetch('http://localhost:8080/M00951083/users');
  const users = await usersResponse.json();

  const userMap = users.reduce((acc, user) => {
    acc[user.username] = user;
    return acc;
  }, {});

  if (contents.length > 0) {
    contents.forEach((content) => {
      const user = userMap[content.username];
      const profilePicture = user?.profilePicture || 'https://via.placeholder.com/50';

      const contentCard = document.createElement('div');
      contentCard.classList.add('content-card');
      contentCard.innerHTML = `
        <div class="content-header">
          <img src="${profilePicture}" alt="Profile Picture" class="profile-icon">
          <h3>${content.username}</h3>
        </div>
        <div class="content-body">
          <p class="content-caption">${content.text}</p>
          ${
            content.media
              ? `<img src="${content.media}" alt="Post Media" class="post-media">`
              : ''
          }
          <p class="content-date"><small>Posted on ${new Date(content.date).toLocaleString()}</small></p>
          <div class="content-actions">
            <i class="fa-regular fa-heart like-icon" data-id="${content._id}"></i>
            <span class="like-count" data-id="${content._id}">
              ${content.likes.length > 0 
                ? `Liked by ${content.likes.slice(0, 2).join(', ')}${content.likes.length > 2 ? ' and others' : ''}` 
                : 'Be the first to like'}
            </span>
          </div>
        </div>
      `;

      const likeIcon = contentCard.querySelector(`.like-icon[data-id="${content._id}"]`);
      likeIcon.addEventListener('click', () => likePost(content._id));

      contentFeed.appendChild(contentCard);
    });
  } else {
    contentFeed.innerHTML = '<p>Follow people to see content in your feed!</p>';
  }
} catch (error) {
  console.error('Error fetching content:', error);
}

// Function to handle like action
async function likePost(contentId) {

  try {
    // Retrieve the current user's information from session management
    const currentUser = await checkAuthStatus();
    if (!currentUser || !currentUser.username) {
      console.error('User is not logged in.');
      alert('You must be logged in to like posts.');
      return;
    }

  // Send like request to the server
  const response = await fetch(`http://localhost:8080/M00951083/contents/${contentId}/likes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: currentUser.username })
  });

  if (!response.ok) {
    throw new Error('Failed to like the post');
  }

    const updatedContent = await response.json();
    const likeIcon = document.querySelector(`.like-icon[data-id="${contentId}"]`);
    const likeCount = document.querySelector(`.like-count[data-id="${contentId}"]`);

    // Update UI
    if (updatedContent.likedByCurrentUser) {
      likeIcon.className = 'fa-solid fa-heart';
      likeIcon.style.color = '#ff0000';
    } else {
      likeIcon.className = 'fa-regular fa-heart';
      likeIcon.style.color = '';
    }

    likeCount.innerHTML = updatedContent.likes.length > 0
      ? `Liked by ${updatedContent.likes.slice(0, 2).join(', ')}${updatedContent.likes.length > 2 ? ' and others' : ''}`
      : 'Like';
  } catch (error) {
    console.error('Error liking post:', error);
  }
}
};

// Helper function to follow a user
const followUser = async (username) => {
  try {
    const response = await fetch('http://localhost:8080/M00951083/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.message);
      loadHomePage();
    } else {
      const error = await response.json();
      console.error('Failed to follow user:', error.message);
    }
  } catch (error) {
    console.error('Error following user:', error);
  }
};

// Helper function to unfollow a user
const unfollowUser = async (username) => {
  try {
    const response = await fetch('http://localhost:8080/M00951083/follow', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.message);
      loadHomePage();
    } else {
      const error = await response.json();
      console.error('Failed to unfollow user:', error.message);
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
  }
};

// Journal Page

const loadJournalPage = async (user) => {
  // Select the mainContent div
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content from mainContent
  mainContent.innerHTML = '';

  // Create Journal Header Section
  const journalHeader = document.createElement('header');
  journalHeader.classList.add('journal-header');
  journalHeader.innerHTML = `
    <h1>Welcome to Your Journal, ${user.username}!</h1>
    <p>Reflect on your day and review your past thoughts below.</p>
  `;

 // Create Journal Entry Form
const journalForm = document.createElement('form');
journalForm.classList.add('journal-form');
journalForm.innerHTML = `
  <input id="journal-topic" type="text" placeholder="Enter a topic..." required />
  <textarea id="journal-entry" placeholder="Write your thoughts here..." required></textarea>
  <button type="submit" class="journal-submit">Save Entry</button>
`;

// Add event listener to save journal entry
journalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const topic = document.getElementById('journal-topic').value.trim();
  const entryContent = document.getElementById('journal-entry').value.trim();

  if (topic && entryContent) {
    try {
      const response = await fetch('http://localhost:8080/M00951083/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username, topic: topic, entry: entryContent }),
      });

      if (response.ok) {
        alert('Journal entry saved successfully!');
        document.getElementById('journal-topic').value = ''; // Clear topic input
        document.getElementById('journal-entry').value = ''; // Clear textarea
        loadJournalEntries(user.username); // Refresh the past entries
      } else {
        alert('Failed to save entry.');
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
    }
  } else {
    alert('Please fill in both the topic and the entry!');
  }
});


  // Create Section for Past Journal Entries
  const journalEntriesSection = document.createElement('section');
  journalEntriesSection.classList.add('journal-entries');
  journalEntriesSection.innerHTML = `
    <h2>Your Past Entries</h2>
    <div id="past-entries"></div>
  `;

  // Append all elements to mainContent
  mainContent.appendChild(journalHeader);
  mainContent.appendChild(journalForm);
  mainContent.appendChild(journalEntriesSection);

  // Load past entries
  loadJournalEntries(user.username);
};

// About Section with detailed content
const addAboutSection = () => {
  //  About Section container
  const aboutSection = document.createElement('section');
  aboutSection.classList.add('homepage-about');

  // Add content to the About Section
  aboutSection.innerHTML = `
    <h2>About SheeshConnect</h2>
    <p class="animated-paragraph">
      SheeshConnect is more than just a social network. It’s a sanctuary for those seeking mental clarity, emotional balance, and a supportive community. 
      In today’s fast-paced world, we often neglect the most important relationship of all—the one we have with ourselves. SheeshConnect aims to change that by creating 
      a safe space where mindfulness and mental wellbeing come first.
    </p>
    <p class="animated-paragraph">
      Whether you’re exploring guided meditations to ease anxiety, journaling to express and reflect on your emotions, or connecting with others who share your journey, 
      SheeshConnect is here to support you. Our platform combines cutting-edge tools with timeless mindfulness practices to help you find balance and purpose in your daily life.
    </p>
    <p class="animated-paragraph">
      Our vision is to build a global community that celebrates mindfulness and mental health. Through collaborative forums, goal-setting features, and access to valuable 
      resources, we empower you to take proactive steps toward self-improvement. From beginners to mindfulness veterans, SheeshConnect welcomes everyone.
    </p>
    <p class="animated-paragraph">
      Join SheeshConnect today and discover a world where mental health is prioritized, self-care is celebrated, and you can connect with like-minded individuals 
      who truly understand the importance of inner peace.
    </p>
  `;

  return aboutSection;
};


const loadAboutPage = async () => {
  // Fetch user information from the backend
  const user = await checkAuthStatus();
  if (!user) {
    console.error('User not authenticated.');
    navigateTo('/M00951083/login'); // Redirect to login if not authenticated
    return;
  }

  // Select the mainContent div
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content from mainContent
  mainContent.innerHTML = '';

  // Header Section
  const headerContainer = document.createElement('div');
  headerContainer.classList.add('homepage-header-container');

  headerContainer.innerHTML = `
    <header class="homepage-header">
      <h1>Welcome to SheeshConnect, ${user.fullName}!</h1>
      <p>Your Journey to Mindfulness Starts Here</p>
    </header>
  `;
  mainContent.appendChild(headerContainer);

  // About paragraphs
  const aboutSection = addAboutSection();
  mainContent.appendChild(aboutSection);

  // Create Cards Section
  const cardsSection = document.createElement('div');
  cardsSection.classList.add('homepage-cards');

  const cardsData = [
    {
      title: 'Meditations',
      description: 'Explore guided meditations to relax and focus.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSBI4aoU47cqu813CKdJ5ni7bGcEUgAqu7uw&s',
      click: () => {
        setActivePage('meditations');
        loadMeditationsPage();
      },
    },
    {
      title: 'Journal',
      description: 'Reflect on your thoughts with our journaling tools.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTkJlSgjvZc9VovFJXIV86aLVwaLOYeaj-Sw&s',
      click: () => {
        setActivePage('journal');
        loadJournalPage(user);
      },
    },
    {
      title: 'Community',
      description: 'Connect with others on the same journey.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp91Oh8VZ845qI4E5r3h522zP1ffBrF8Ovnw&s',
      click: () => {
        setActivePage('community');
        loadCommunityPage();
      },
    },
    {
      title: 'Resources',
      description: 'Make use of our wellbeing reading materials crafted by reputable mental health experts.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR058wUHsyE_8DMBNt1TmL5sakWyrCAHXStQQ&s',
      click: () => {
        setActivePage('resources');
        loadResourcesPage();
      },
    },
  ];

  cardsData.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.innerHTML = `
      <img src="${card.image}" alt="${card.title}" />
      <h3>${card.title}</h3>
      <p>${card.description}</p>
      <button class="card-button">Learn More</button>
    `;

    const button = cardElement.querySelector('.card-button');
    button.addEventListener('click', card.click);

    cardsSection.appendChild(cardElement);
  });

  mainContent.appendChild(cardsSection);
};

// active nav link function
function setActivePage(page) {
  // Remove 'active' class from all nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => link.classList.remove('active'));

  // Add 'active' class to the corresponding link
  const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}


// load past entries function
const loadJournalEntries = async (username) => {
  try {
    const response = await fetch(`http://localhost:8080/M00951083/journal?username=${username}`);
    if (response.ok) {
      const entries = await response.json();
      const pastEntriesDiv = document.getElementById('past-entries');
      pastEntriesDiv.innerHTML = ''; // Clear existing entries

      if (entries.length > 0) {
        entries.forEach((entry) => {
          const entryCard = document.createElement('div');
          entryCard.classList.add('entry-card');
          entryCard.innerHTML = `
            <p class="entry-date">${new Date(entry.date).toLocaleString()}</p>
            <h4 class="entry-topic">${entry.topic}</h4>
            <p class="entry-text">${entry.entry}</p>
            <button class="delete-icon" data-entry-id="${entry._id}" title="Delete this entry">
              <i class="fa-solid fa-trash"></i>
            </button>
          `;

           // Add delete button functionality
           const deleteButton = entryCard.querySelector('.delete-icon');
           deleteButton.addEventListener('click', async () => {
             const confirmDelete = confirm('Are you sure you want to delete this entry?');
             if (confirmDelete) {
               try {
                 const entryId = deleteButton.dataset.entryId;
                 console.log('Deleting Entry ID:', entryId); // Debug log
 
                 const deleteResponse = await fetch(`http://localhost:8080/M00951083/journal/${entryId}`, {
                   method: 'DELETE',
                 });
 
                 if (deleteResponse.ok) {
                   alert('Journal entry deleted successfully.');
                   loadJournalEntries(username); // Refresh entries
                 } else {
                   const error = await deleteResponse.json();
                   alert(`Failed to delete entry: ${error.message}`);
                 }
               } catch (error) {
                 console.error('Error deleting journal entry:', error);
                 alert('An error occurred while deleting the entry.');
               }
             }
           });

          pastEntriesDiv.appendChild(entryCard);
        });
      } else {
        pastEntriesDiv.innerHTML = '<p>No past entries yet. Start journaling today!</p>';
      }
    } else {
      console.error('Failed to fetch journal entries.');
    }
  } catch (err) {
    console.error('Error fetching journal entries:', err);
  }
};


const loadSharedContent = async (username) => {
  try {
    const response = await fetch(`http://localhost:8080/M00951083/contents?username=${username}`);
    if (!response.ok) {
      console.error('Failed to fetch user content.');
      return;
    }

    const contents = await response.json();
    const contentList = document.getElementById('content-list');
    if (!contentList) return;

    // Clear existing content
    contentList.innerHTML = '';

    if (contents.length > 0) {
      contents.forEach((content) => {
        const contentBlock = document.createElement('div');
        contentBlock.classList.add('content-block');
        contentBlock.innerHTML = `
          <div class="content-text">
            <h3>${content.text}</h3>
          </div>
          ${
            content.media
              ? `<div class="content-media">
                   <img src="${content.media}" alt="Shared Content" class="shared-media">
                 </div>`
              : ''
          }
          <div class="content-date">
            <p><small>Posted on: ${new Date(content.date).toLocaleString()}</small></p>
          </div>
          <button class="delete-icon" data-content-id="${content._id}" title="Delete this content">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
        contentList.appendChild(contentBlock);

        // Add event listener for delete button
        const deleteButton = contentBlock.querySelector('.delete-icon');
        deleteButton.addEventListener('click', async () => {
          const confirmDelete = confirm('Are you sure you want to delete this content?');
          if (confirmDelete) {
            try {
              const deleteResponse = await fetch(`http://localhost:8080/M00951083/contents/${content._id}`, {
                method: 'DELETE',
              });
              if (deleteResponse.ok) {
                alert('Content deleted successfully.');
                loadSharedContent(username); // Refresh the content list
              } else {
                const error = await deleteResponse.json();
                alert(`Failed to delete content: ${error.message}`);
              }
            } catch (error) {
              console.error('Error deleting content:', error);
              alert('An error occurred while deleting the content.');
            }
          }
        });
      });
    } else {
      contentList.innerHTML = '<p>No content shared yet.</p>';
    }
  } catch (error) {
    console.error('Error fetching shared content:', error);
  }
};


// Main loadUserProfilePage function
const loadUserProfilePage = async (user) => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content
  mainContent.innerHTML = '';

  // Create Profile Section
  const profileSection = document.createElement('section');
  profileSection.classList.add('user-profile');

  profileSection.innerHTML = `
    <h1>Welcome to Your Profile, ${user.username}</h1>
    <div class="profile-details">
      <div class="profile-picture">
        <img src="${user.profilePicture || 'https://via.placeholder.com/150'}" alt="Profile Picture" id="profile-picture-img">
        <input type="file" id="profile-picture-input" accept="image/*" hidden>
        <button id="upload-picture-btn">Upload New Picture</button>
      </div>
      <div class="user-info">
        <h3>Occupation: <span id="occupation-display">${user.occupation}</span></h3>
        <button id="edit-occupation-btn">Change Occupation</button>
        <textarea id="occupation-input" style="display: none;" placeholder="Enter new occupation"></textarea>
        <button id="save-occupation-btn" style="display: none;">Save</button>
        <p>Total Followers: <span id="follower-count">Loading...</span></p>
        <p>Total Following: <span id="following-count">Loading...</span></p>
        <h3>Bio:</h3>
        <textarea id="bio-input" placeholder="Write something about yourself...">${user.bio || ''}</textarea>
        <button id="save-bio-btn">Save Bio</button>
      </div>
    </div>
  `;

  mainContent.appendChild(profileSection);

  // Fetch and update follower/following stats
  try {
    const response = await fetch(`http://localhost:8080/M00951083/follow/stats?username=${user.username}`);
    const stats = await response.json();

    document.getElementById('follower-count').textContent = stats.followers;
    document.getElementById('following-count').textContent = stats.following;
  } catch (error) {
    console.error('Error fetching follower stats:', error);
    document.getElementById('follower-count').textContent = 'Error';
    document.getElementById('following-count').textContent = 'Error';
  }

  // Add Event Listeners
  document.getElementById('upload-picture-btn').addEventListener('click', () => {
    document.getElementById('profile-picture-input').click();
  });

  document.getElementById('profile-picture-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);

      try {
        const response = await fetch('http://localhost:8080/M00951083/user/uploadPicture', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          document.getElementById('profile-picture-img').src = data.profilePicture;
          alert('Profile picture updated successfully!');
        } else {
          alert('Failed to upload picture.');
        }
      } catch (error) {
        console.error('Error uploading picture:', error);
      }
    }
  });

  document.getElementById('edit-occupation-btn').addEventListener('click', () => {
    document.getElementById('occupation-display').style.display = 'none';
    document.getElementById('occupation-input').style.display = 'block';
    document.getElementById('save-occupation-btn').style.display = 'inline-block';
  });

  document.getElementById('save-occupation-btn').addEventListener('click', async () => {
    const newOccupation = document.getElementById('occupation-input').value.trim();
    if (newOccupation) {
      try {
        const response = await fetch('http://localhost:8080/M00951083/user/updateOccupation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, occupation: newOccupation }),
        });
        if (response.ok) {
          document.getElementById('occupation-display').textContent = newOccupation;
          document.getElementById('occupation-display').style.display = 'block';
          document.getElementById('occupation-input').style.display = 'none';
          document.getElementById('save-occupation-btn').style.display = 'none';
          alert('Occupation updated successfully!');
        } else {
          alert('Failed to update occupation.');
        }
      } catch (error) {
        console.error('Error updating occupation:', error);
      }
    } else {
      alert('Occupation cannot be empty.');
    }
  });

  document.getElementById('save-bio-btn').addEventListener('click', async () => {
    const newBio = document.getElementById('bio-input').value.trim();
    if (newBio) {
      try {
        const response = await fetch('http://localhost:8080/M00951083/user/updateBio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, bio: newBio }),
        });
        if (response.ok) {
          alert('Bio updated successfully!');
        } else {
          alert('Failed to update bio.');
        }
      } catch (error) {
        console.error('Error updating bio:', error);
      }
    } else {
      alert('Bio cannot be empty.');
    }
  });

  // Shared content section
  const sharedContentSection = document.createElement('section');
  sharedContentSection.classList.add('shared-content');
  sharedContentSection.innerHTML = `
    <div class="shared-content-header">
      <h2>Shared Content</h2>
      <button id="add-post-btn" class="add-post-btn" alt="add post">Add post +</button>
    </div>
    <div id="content-list" class="content-list"></div>
  `;
  mainContent.appendChild(sharedContentSection);

  // Fetch and display user's shared content
  await loadSharedContent(user.username);

  // Add share content section
  const postModal = createShareContentModal(user.username, async () => {
    await loadSharedContent(user.username);
  });

  // Add event listener for the + button to open the modal
  document.getElementById('add-post-btn').addEventListener('click', () => {
    postModal.classList.remove('hidden');
  });
};

// create post function
const createShareContentModal = (username, reloadContentCallback) => {
  // Create modal element
  const postModal = document.createElement('div');
  postModal.classList.add('post-modal', 'hidden');
  postModal.innerHTML = `
    <div class="modal-content">
      <h3>Create a New Post</h3>
      <form id="post-form">
        <textarea name="text" id="post-text" placeholder="Write something..." rows="4" required></textarea>
        <label for="post-media">Add Media (Image/Video):</label>
        <input type="file" id="post-media" name="media" accept="image/*,video/*" />
        <button type="submit" class="submit-post-btn">Share</button>
        <button type="button" class="close-modal-btn">Cancel</button>
      </form>
    </div>
  `;

  // Append modal to the body
  document.body.appendChild(postModal);

  // Add event listeners
  document.querySelector('.close-modal-btn').addEventListener('click', () => {
    postModal.classList.add('hidden');
  });

  document.getElementById('post-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await sharePost(username); // Call the backend communication function
    postModal.classList.add('hidden');
    if (reloadContentCallback) {
      await reloadContentCallback(); // Reload shared content after post
    }
  });

  return postModal;
};

// Backend communication function for share post submission
const sharePost = async (username) => {
  const formData = new FormData();
  const text = document.getElementById('post-text').value;
  const media = document.getElementById('post-media').files[0];

  formData.append('username', username);
  formData.append('text', text);
  if (media) {
    formData.append('media', media);
  }

  try {
    const response = await fetch('http://localhost:8080/M00951083/contents', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      console.log('Post shared successfully!');
    } else {
      console.error('Failed to share post:', await response.text());
    }
  } catch (error) {
    console.error('Error sharing post:', error);
  }
};

// Meditation page content
const PLAYLIST_ID = 'PL7by6RYPG3HDE8kJe2DXiS3M_yTzCGJz6&si=le5aOjIfXrWuLMWH';
const API_URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${API_KEY}`;


// Define the loadMeditations function
function loadMeditationsPage() {
  const mainContent = document.getElementById('main-content');
  
  // Clear existing content in the main content area
  mainContent.innerHTML = '';

  // Fetch playlist data
  fetch(API_URL)
      .then(response => {
        return response.json();
      })
      .then(data => {
          const videos = data.items;

          // Create the header container
          const headerContainer = document.createElement('div');
          headerContainer.className = 'meditation-header-container';

          // Add header content
          headerContainer.innerHTML = `
            <div class="header-content">
              <h1>Meditation Videos</h1>
              <p>
                Welcome to the Meditation Page! Explore our carefully curated collection of guided meditation videos. These resources are designed to help you relax, focus, and find inner peace. Take a moment to breathe and enjoy.
              </p>
            </div>
          `;

         mainContent.appendChild(headerContainer);

          // Create and append the main video player
          const mainVideoContainer = document.createElement('div');
          mainVideoContainer.className = 'main-video-container';
          mainVideoContainer.innerHTML = `
              <iframe id="mainVideo" src="" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          `;
          mainContent.appendChild(mainVideoContainer);

          const mainVideo = mainVideoContainer.querySelector('#mainVideo');

          // Load the first video in the main player
          if (videos.length > 0) {
              mainVideo.src = `https://www.youtube.com/embed/${videos[0].snippet.resourceId.videoId}`;
          }

          // Create a container for the video list
          const videoList = document.createElement('div');
          videoList.className = 'video-list';

          // Display videos in the list
          videos.forEach(video => {
              const videoId = video.snippet.resourceId.videoId;
              const thumbnail = video.snippet.thumbnails.default.url;
              const title = video.snippet.title;

              // Create a video item
              const videoItem = document.createElement('div');
              videoItem.className = 'video-item';
              videoItem.innerHTML = `
                  <img src="${thumbnail}" alt="${title}">
                  <p>${title}</p>
              `;

              // Add click event to load the video into the player
              videoItem.addEventListener('click', () => {
                  mainVideo.src = `https://www.youtube.com/embed/${videoId}`;
              });

              videoList.appendChild(videoItem);
          });

          // Append the video list to the main content area
          mainContent.appendChild(videoList);
      })
      .catch(error => console.error('Error fetching playlist:', error));
}

//resources page
const loadResourcesPage = async (topic) => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  try {
    // Fetch books from Google Books API
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(topic)}&maxResults=40&printType=books&key=`);
    
    if (!response.ok) {
      console.error('Error fetching books:', response.statusText);
      mainContent.innerHTML = '<p class="error">Failed to load books. Please try again later.</p>';
      return;
    }

    const data = await response.json();
    const books = data.items || [];

    // Clear previous content
    mainContent.innerHTML = '<h2>Recommended Books</h2>';

    if (books.length === 0) {
      mainContent.innerHTML += '<p>No books found for this topic.</p>';
      return;
    }

    // Display books as cards
    const booksContainer = document.createElement('div');
    booksContainer.classList.add('books-container');

    books.forEach((book) => {
      const bookInfo = book.volumeInfo;
      const title = bookInfo.title || 'No title available';
      const authors = bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown author';
      const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Image';
      const description = bookInfo.description || 'No description available';
      const previewLink = bookInfo.previewLink || '#';

      const bookCard = document.createElement('div');
      bookCard.classList.add('book-card');
      bookCard.innerHTML = `
        <img src="${thumbnail}" alt="${title}" class="book-thumbnail">
        <div class="book-details">
          <h3>${title}</h3>
          <p><strong>Author(s):</strong> ${authors}</p>
          <p>${description.slice(0, 100)}...</p>
          <a href="${previewLink}" target="_blank" class="book-link">View Book</a>
        </div>
      `;
      booksContainer.appendChild(bookCard);
    });

    mainContent.appendChild(booksContainer);
  } catch (error) {
    console.error('Error fetching books:', error);
    mainContent.innerHTML = `
    <div class="error-message">
      <h1>Cannot load the page right now</h1>
      <p>Please try again later.</p>
    </div>
      `;  }
};

// logout page
const loadLogoutPage = async () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content
  mainContent.innerHTML = '';

  // Create Logout Confirmation UI
  const logoutContainer = document.createElement('div');
  logoutContainer.classList.add('logout-container');
  logoutContainer.innerHTML = `
    <div class="logout-dialog">
      <h2>Are you sure you want to logout?</h2>
      <div class="logout-buttons">
        <button id="confirm-logout-btn" class="logout-btn confirm">Yes, Logout</button>
        <button id="cancel-logout-btn" class="logout-btn cancel">No, Go Back</button>
      </div>
    </div>
  `;

  mainContent.appendChild(logoutContainer);

  // Add event listener for "Yes" button
  document.getElementById('confirm-logout-btn').addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:8080/M00951083/logout', {
        method: 'POST',
      });
      if (response.ok) {
        // Redirect to the login or landing page
        window.location.href = 'http://localhost:8080/M00951083';
      } else {
        console.error('Failed to logout');
        alert('An error occurred while logging out. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });

  // Add event listener for "No" button
  document.getElementById('cancel-logout-btn').addEventListener('click', () => {
    // Redirect to the homepage display
    loadHomePage();
  });
};

// Community page
const loadCommunityPage = async () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content area not found!');
    return;
  }

  // Clear existing content
  mainContent.innerHTML = '';

  // Render Header Section
  const renderCommunityHeader = () => {
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('community-header');
    headerContainer.innerHTML = `
      <h1>Welcome to the Community</h1>
      <p>Engage with others, share your thoughts, participate in polls, and discover shared resources.</p>
    `;
    mainContent.appendChild(headerContainer);
  };

  renderCommunityHeader();

  // Add Post Section
  const addPostToCommunity = () => {
    const addPostContainer = document.createElement('div');
    addPostContainer.classList.add('add-post-container');
    addPostContainer.innerHTML = `
        <h2>Contribute to the Community</h2>
        <form id="community-post-form">
          <textarea id="post-text" placeholder="Write your post..." rows="4"></textarea>
          <div id="media-section">
            <label for="post-media">Attach Media:</label>
            <input type="file" id="post-media" accept="image/*,video/*">
            <input type="text" id="media-caption" placeholder="Enter caption for the media">
          </div>
          <div id="poll-section">
            <label>Create a Poll:</label>
            <input type="text" id="poll-question" placeholder="Poll Question">
            <input type="text" class="poll-option" placeholder="Option 1">
            <input type="text" class="poll-option" placeholder="Option 2">
            <button type="button" id="add-poll-option-btn">Add Another Option</button>
          </div>
          <div id="resource-sharing-section">
            <label for="resource-link">Share a Resource:</label>
            <input type="url" id="resource-link" placeholder="Paste URL here">
          </div>
          <div id="topic-selection">
            <label>Select Topic:</label>
            <button type="button" class="topic-btn" data-topic="Meditation">Meditation</button>
            <button type="button" class="topic-btn" data-topic="Stress Management">Stress Management</button>
            <button type="button" class="topic-btn" data-topic="Daily Gratitude">Daily Gratitude</button>
            <button type="button" class="topic-btn" data-topic="Success Stories">Success Stories</button>
          </div>
          <button type="submit" id="submit-post-btn">Post</button>
        </form>
      `;

    mainContent.appendChild(addPostContainer);

    // Poll Options Handling
    document.getElementById('add-poll-option-btn').addEventListener('click', () => {
      const pollSection = document.getElementById('poll-section');
      const newOption = document.createElement('input');
      newOption.type = 'text';
      newOption.className = 'poll-option';
      newOption.placeholder = `Option ${pollSection.querySelectorAll('.poll-option').length + 1}`;
      pollSection.appendChild(newOption);
    });

    // Topic Selection Handling
    let selectedTopic = null;
    document.querySelectorAll('.topic-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedTopic = btn.dataset.topic;
        document.querySelectorAll('.topic-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Post Submission Handling
    document.getElementById('community-post-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const text = document.getElementById('post-text').value.trim();
      const media = document.getElementById('post-media').files[0];
      const mediaCaption = document.getElementById('media-caption').value.trim();
      const pollQuestion = document.getElementById('poll-question').value.trim();
      const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
        .map((input) => input.value.trim())
        .filter(Boolean);
      const resourceLink = document.getElementById('resource-link').value.trim();

      // Determine Post Type
      let type = null;
      if (pollQuestion) type = 'poll';
      else if (resourceLink) type = 'resource';
      else if (selectedTopic) type = 'forum';
      else if (text || media) type = 'feed';

      if (!type) {
        alert('Please provide valid content to post.');
        return;
      }

      const formData = new FormData();
      formData.append('type', type);
      formData.append('content', pollQuestion || text);
      if (selectedTopic) formData.append('topic', selectedTopic);
      if (media) {
        formData.append('media', media);
        formData.append('mediaCaption', mediaCaption); // Append the media caption
      }
      if (resourceLink) formData.append('resources', JSON.stringify([resourceLink]));
      if (pollOptions.length > 0) formData.append('options', JSON.stringify(pollOptions));

      try {
        const response = await fetch('http://localhost:8080/M00951083/community', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          alert('Post shared successfully!');
          loadCommunityPage();
        } else {
          const error = await response.json();
          alert(`Failed to share post: ${error.error}`);
        }
      } catch (error) {
        console.error('Error posting to community:', error);
        alert('An error occurred. Please try again.');
      }
    });
  };

  addPostToCommunity();

  // Render Community Feed
  const renderCommunityFeed = async () => {
    const feedContainer = document.createElement('div');
    feedContainer.classList.add('feed-container');
    feedContainer.innerHTML = '<h2>Community Feed</h2>';
    mainContent.appendChild(feedContainer);
  
    try {
      const response = await fetch('http://localhost:8080/M00951083/community');
      const posts = await response.json();

      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

      posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.classList.add('card'); // Add 'card' class for styling
        postElement.innerHTML = `
          <div class="card-header">
            <h3>${post.userId}</h3>
            <p>${post.topic || 'General'}</p>
            ${
              currentUser.username === post.userId
                ? `<button class="delete-icon" data-post-id="${post._id}" title="Delete this post">
                     <i class="fa-solid fa-trash"></i>
                   </button>`
                : ''
            }
          </div>
          <div class="card-content">
            <p>${post.content}</p>
            ${post.media ? `<img src="${post.media}" alt="Media" class="card-media">` : ''}
            ${post.mediaCaption ? `<p class="media-caption">${post.mediaCaption}</p>` : ''}
            ${post.type === 'poll' ? renderPoll(post) : ''}
            ${post.type === 'resource' && post.resources.length > 0 
              ? `<a href="${post.resources[0]}" target="_blank" class="card-resource">${post.resources[0]}</a>` 
              : ''}
                      <div class="card-footer">
            <small>Posted on: ${new Date(post.createdAt).toLocaleString()}</small>
          </div>
        `;
        
        feedContainer.appendChild(postElement);

          // Add delete button event listener if currentUser matches post.userId
        if (currentUser.username === post.userId) {
          const deleteButton = postElement.querySelector('.delete-icon');
          deleteButton.addEventListener('click', async (e) => {
            const postId = deleteButton.dataset.postId;

            // Show confirmation dialog
            if (confirm('Are you sure you want to delete this post?')) {
              try {
                const response = await fetch(`http://localhost:8080/M00951083/community/${postId}`, {
                  method: 'DELETE',
                });

                if (response.ok) {
                  alert('Post deleted successfully.');
                  loadCommunityPage(); // Reload the community feed
                } else {
                  const error = await response.json();
                  alert(`Failed to delete post: ${error.error}`);
                }
              } catch (error) {
                console.error('Error deleting post:', error);
                alert('An error occurred while deleting the post.');
              }
            }
          });
        }
  
        // Attach event listeners for voting in polls
        if (post.type === 'poll') {
          const pollForm = postElement.querySelector(`#poll-form-${post._id}`);
          pollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedOption = pollForm.querySelector('input[name="poll-option"]:checked');
            if (!selectedOption) {
              alert('Please select an option to vote.');
              return;
            }
            try {
              const response = await fetch('http://localhost:8080/M00951083/community/vote', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  pollId: post._id,
                  optionText: selectedOption.value,
                }),
              });
              if (response.ok) {
                alert('Vote registered successfully!');
                loadCommunityPage(); // Reload page to update poll results
              } else {
                const error = await response.json();
                alert(`Failed to register vote: ${error.error}`);
              }
            } catch (error) {
              console.error('Error voting in poll:', error);
              alert('An error occurred while voting. Please try again.');
            }
          });
        }
      });
    } catch (error) {
      console.error('Error fetching community feed:', error);
    }
  };
  
  const renderPoll = (poll) => {
    const pollOptions = poll.options
      .map(
        (option) =>
          `<label>
            <input type="radio" name="poll-option" value="${option.text}" />
            ${option.text} (${option.votes} votes)
          </label><br />`
      )
      .join('');
  
    return `
      <form id="poll-form-${poll._id}" class="poll-form">
        <h4>${poll.content}</h4>
        ${pollOptions}
        <button type="submit" class="poll-vote-btn">Vote</button>
      </form>
    `;
  };  

  await renderCommunityFeed();
};

// Function to update the main content dynamically
const updateMainContent = (page, user) => {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = ''; // Clear existing content

  switch (page) {
    case 'home':
      loadHomePage(user);
      break;
    case 'journal':
      loadJournalPage(user);
      break;
    case 'meditations':
      loadMeditationsPage();
      break;
    case 'community':
      loadCommunityPage(user);
      break;
    case 'resources':
      loadResourcesPage('mental health');
      break;
    case 'User':
      loadUserProfilePage(user);
      break;
    case 'Logout':
      loadLogoutPage();
      break;
    case 'about':
      loadAboutPage();
      break;
    default:
      mainContent.innerHTML = '<h1>404</h1><p>Page not found.</p>';
  }
};

// Route protection
const protectedRoutes = ['/M00951083/dashboard'];

const checkAuth = async (path) => {
  if (protectedRoutes.includes(path)) {
    const user = await checkAuthStatus();
    if (!user) {
      navigateTo('/M00951083/login');
      return false;
    }
  }
  return true;
};


// Navigate to function
const navigateTo = async (path) => {
    window.history.pushState({}, "", path);
    setTimeout(async () => {
      await loadPage(path);
    }, 0);
};
  

// Footer HTML
const footerHTML = `
  <footer>
    &copy; Keith Muhlanga. All Rights Reserved. 2024
  </footer>
`;

// Footer injection function
const injectFooter = () => {
  let existingFooter = document.querySelector("footer");
  if (existingFooter) existingFooter.remove();
  const footerElement = document.createElement("div");
  footerElement.innerHTML = footerHTML;
  document.body.appendChild(footerElement);
};

// Function to handle registration
const handleRegistration = async (event) => {
  event.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const phoneNumber = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const occupation = document.getElementById('Occupation').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  let errorMessage = "";

  if (fullName.length === 0 || fullName.length > 50) {
    errorMessage += "Full Name must be between 1 and 50 characters.\n";
  }

  if (username.length === 0 || username.length > 20) {
    errorMessage += "Username must be between 1 and 20 characters.\n";
  }

  const phoneRegex = /^\+\d{1,3}\d{8,12}$/;
  if (!phoneRegex.test(phoneNumber)) {
    errorMessage += "Phone Number must start with a valid country code and contain 8-12 digits.\n";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorMessage += "Please provide a valid email address.\n";
  }

  if (occupation.length === 0 || occupation.length > 100) {
    errorMessage += "Occupation must be between 1 and 100 characters.\n";
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    errorMessage += "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.\n";
  }

  if (password !== confirmPassword) {
    errorMessage += "Passwords do not match.\n";
  }

  if (errorMessage) {
    alert(`Please fix the following errors:\n${errorMessage}`);
  } else {
    try {
      const response = await fetch('/M00951083/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, username, phoneNumber, email, occupation, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const responseData = await response.json();
      alert(responseData.message);
      navigateTo('/M00951083/login');
    } catch (err) {
      console.error('Error during registration:', err);
      alert(`Unexpected error: ${err.message}`);
    }
  }
};

// Page Loading Functions
const loadDefaultPage = () => {
  window.location.href = "/M00951083";
};

const loadLoginPage = () => {
  document.body.innerHTML = `
  <div style="background: linear-gradient(135deg, #a8edea, #fed6e3); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <div style="background: linear-gradient(to right, #85d8ce, #a8e6cf); padding: 50px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 100%; font-family: Arial, sans-serif; color: #333;">
      <img src="/images/Screenshot_2024-11-11_163145-removebg-preview.png" alt="SheeshConnect Logo" style="width: 120px; margin-bottom: 20px;">
      <h1 style="color: #055052; margin-bottom: 30px;">Login to SheeshConnect</h1>
      <form id="loginForm" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="text-align: left;">
          <label for="email" style="display: block; font-weight: bold; margin-bottom: 5px;">Email Address</label>
          <input id="email" type="email" placeholder="Enter your email address" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="password" style="display: block; font-weight: bold; margin-bottom: 5px;">Password</label>
          <input id="password" type="password" placeholder="Enter your password" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <input type="checkbox" id="rememberMe">
          <label for="rememberMe" style="margin-left: 10px;">Remember me</label>
        </div>
        <button id="login-button" type="submit" style="background-color: #05676e; color: white; border: none; padding: 12px; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 20px;">
          Login
        </button>
      </form>
      <p style="margin-top: 20px; font-size: 14px; color: #555;">
        Don't have an account? 
        <a id="register-link" style="color: #05676e; text-decoration: none; font-weight: bold; cursor: pointer;">Register now</a>
      </p>
    </div>
  </div>
`;

// Attach an event listener to the "Register now" link
document.getElementById('register-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigateTo('/M00951083/register');
});

  injectFooter();
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
};

const loadRegisterPage = () => {
  document.body.innerHTML = `
  <div style="background: linear-gradient(135deg, #a8edea, #fed6e3); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <div style="background: linear-gradient(to right, #85d8ce, #a8e6cf); padding: 50px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; max-width: 500px; width: 100%; font-family: Arial, sans-serif; color: #333;">
      <img src="/images/Screenshot_2024-11-11_163145-removebg-preview.png" alt="SheeshConnect Logo" style="width: 120px; margin-bottom: 20px;">
      <h1 style="color: #055052; margin-bottom: 30px;">Register with SheeshConnect</h1>
      <form id="registerForm" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="text-align: left;">
          <label for="fullName" style="display: block; font-weight: bold; margin-bottom: 5px;">Full Name</label>
          <input id="fullName" type="text" placeholder="Enter your full name" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="username" style="display: block; font-weight: bold; margin-bottom: 5px;">Username</label>
          <input id="username" type="text" placeholder="Choose a username" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="phone" style="display: block; font-weight: bold; margin-bottom: 5px;">Phone Number</label>
          <input id="phone" type="tel" placeholder="Enter phone number with country code" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="email" style="display: block; font-weight: bold; margin-bottom: 5px;">Email Address</label>
          <input id="email" type="email" placeholder="Enter your email address" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="Occupation" style="display: block; font-weight: bold; margin-bottom: 5px;">Occupation</label>
          <input id="Occupation" type="text" placeholder="Enter your occupation" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="password" style="display: block; font-weight: bold; margin-bottom: 5px;">Password</label>
          <input id="password" type="password" placeholder="Create a password" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
          <label for="confirmPassword" style="display: block; font-weight: bold; margin-bottom: 5px;">Confirm Password</label>
          <input id="confirmPassword" type="password" placeholder="Confirm your password" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <button id="register-button" class="btn" type="submit" style="background-color: #05676e; color: white; border: none; padding: 12px; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 20px;">
          Register
        </button>
      </form>
      <p style="margin-top: 20px; font-size: 14px; color: #555;">
        Already have an account? 
        <a id="login-link" style="color: #05676e; text-decoration: none; font-weight: bold; cursor: pointer;">Log in</a>
      </p>
    </div>
  </div>
`;

// Attach an event listener to the "Log in" link
document.getElementById('login-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigateTo('/M00951083/login');
});

  injectFooter();
  document.getElementById("registerForm").addEventListener("submit", handleRegistration);
};


// the loadPage function
const loadPage = async (path) => {
  if (!await checkAuth(path)) return;

  if (path === "/M00951083/login") {
    loadLoginPage();
  } else if (path === "/M00951083/register") {
    loadRegisterPage();
  } else if (path === "/M00951083/dashboard") {
    loadDashboardPage();
  } else {
    loadDefaultPage();
  }
};


// Typing Effect Function
const initTypeEffect = () => {
  const heroHeading = document.querySelector(".hero-heading");
  const heroSubheading = document.querySelector(".hero-subheading");
  
  if (!heroHeading || !heroSubheading) return;

  const headingText = "Find Peace Within";
  const subheadingText = "Your Journey to Mindfulness Starts Here.";
  let index = 0;
  let isTypingHeading = true;

  const type = () => {
    if (isTypingHeading && index < headingText.length) {
      heroHeading.textContent += headingText.charAt(index);
    } else if (!isTypingHeading && index < subheadingText.length) {
      heroSubheading.textContent += subheadingText.charAt(index);
    }

    index++;

    if (isTypingHeading && index === headingText.length) {
      isTypingHeading = false;
      index = 0;
      setTimeout(() => type(), 500);
    } else if (!isTypingHeading && index === subheadingText.length) {
      return;
    } else {
      setTimeout(() => type(), 50);
    }
  };

  type();
};

// Main Initialization
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize typing effect
  initTypeEffect();

  // Check for existing session
  const user = await checkAuthStatus();
  if (user && window.location.pathname === '/M00951083/login') {
    navigateTo('/M00951083/dashboard');
  }

  // Set up navigation event listeners
  window.addEventListener("popstate", async () => {
    await loadPage(location.pathname);
  });

  const loginButton = document.getElementById("login");
  if (loginButton) {
    loginButton.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("/M00951083/login");
    });
  }

  const registerButton = document.getElementById("register-btn");
  if (registerButton) {
    registerButton.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("/M00951083/register");
    });
  }

  const login = document.getElementById("login-button");
  if (login) {
    login.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("/M00951083/dashboard");
    });
  }
});

