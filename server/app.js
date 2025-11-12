// Import required modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const multer  = require('multer');
const axios = require('axios');
const { ObjectId } = require('mongodb');

// Initialize Express app and configuration
const app = express();
const port = 8080;
const prefix = '/M00951083'; // Custom prefix for routes

// Middleware setup
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use('/public', express.static(path.join(__dirname, '../public'))); // Static files (CSS, JS, etc.)
app.use('/images', express.static(path.join(__dirname, '../images'))); // Image files
app.use('/scripts', express.static(path.join(__dirname, '../public'))); // JavaScript files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Uploaded profile pictures


// Session setup

app.use(
  session({
    secret: 'Keith123', 
    resave: false,
    saveUninitialized: true,
  })
);

// Database setup
const { connectToDatabase, closeConnection } = require('./db.js');

// Use the database connection
let db;
connectToDatabase()
  .then((database) => {
    db = database;
    console.log("Database ready for operations.");
  })
  .catch((error) => {
    console.error("Error initializing the database:", error);
    process.exit(1); // Exit process if database connection fails
  });

// multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the uploads directory exists
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using the username and current timestamp
    const username = req.session.user ? req.session.user.username : 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${username}-${timestamp}${ext}`);
  },
});

// Initialize Multer middleware
const upload = multer({ storage: storage });

// Serve the main HTML file
app.get(`${prefix}`, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'sheesh.html'), (err) => {
    if (err) {
      console.error(`Error serving sheesh.html: ${err}`);
      res.status(500).send('Error serving the file');
    }
  });
});


// API to register a new user
app.post(`${prefix}/users`, async (req, res) => {
  const { fullName, username, phoneNumber, email, occupation, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // Create and save new user
    const newUser = {
      fullName,
      username,
      phoneNumber,
      email,
      occupation,
      password,
      profilePicture: '', // Initialize with empty profile picture
      bio: '',
      followers: 0,
      following: 0,
    };

    await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ message: 'Internal server error occurred.', error: err.message });
  }
});

// get user route
app.get('/M00951083/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});


// Check session status
app.get(`${prefix}/login`, (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Handle logout
app.post(`${prefix}/logout`, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// API to handle login
app.post(`${prefix}/login`, async (req, res) => {
  const { email, password } = req.body; // Use req.body to get data from the request
  
  try {
    // Query the database for a user with the given email
    const user = await db.collection('users').findOne({ email });

    // If the user doesn't exist, send an error response
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Compare user password with the one provided
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Store user in session
    req.session.user = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      occupation: user.occupation,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
    };

    // If everything is okay, return the user object
    res.json({ message: 'Login successful!', user: req.session.user });

  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Internal server error occurred.', error: err.message });
  }
});

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// route  for saving journal entries
app.post(`${prefix}/journal`, async (req, res) => {
  const { username, topic, entry } = req.body;

  if (!username || !topic || !entry) {
    return res.status(400).json({ message: 'Username, topic, and entry content are required.' });
  }

  try {
    const newEntry = {
      username,
      topic,
      entry,
      date: new Date(), // Timestamp
    };

    await db.collection('journals').insertOne(newEntry);
    res.status(201).json({ message: 'Journal entry saved successfully.' });
  } catch (err) {
    console.error('Error saving journal entry:', err);
    res.status(500).json({ message: 'Failed to save journal entry.' });
  }
});

// route for fetching journal entries
app.get(`${prefix}/journal`, async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Username is required to fetch entries.' });
  }

  try {
    const entries = await db.collection('journals')
      .find({ username })
      .sort({ date: -1 }) // Sort by most recent first
      .toArray();
    res.json(entries);
  } catch (err) {
    console.error('Error fetching journal entries:', err);
    res.status(500).json({ message: 'Failed to fetch journal entries.' });
  }
});

// Delete a journal entry by ID
app.delete('/M00951083/journal/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid journal entry ID.' });
    }

    // Check if the journal entry exists
    const entry = await db.collection('journals').findOne({ _id: new ObjectId(id) });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    // Delete the journal entry
    const result = await db.collection('journals').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      console.log(`Deleted journal entry with ID: ${id}`); // Debug log
      res.status(200).json({ message: 'Journal entry deleted successfully.' });
    } else {
      console.error(`Failed to delete journal entry with ID: ${id}`);
      res.status(500).json({ message: 'Failed to delete journal entry.' });
    }
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'An error occurred while deleting the journal entry.' });
  }
});


// API route to handle profile picture upload
app.post(
  `${prefix}/user/uploadPicture`,
  ensureAuthenticated,
  upload.single('profilePicture'),
  async (req, res) => {
    const username = req.session.user.username;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const profilePicturePath = `/uploads/${req.file.filename}`; // Adjust path as needed

    try {
      // Update the user's profile picture in the database
      await db.collection('users').updateOne(
        { username },
        { $set: { profilePicture: profilePicturePath } }
      );

      // Update session data
      req.session.user.profilePicture = profilePicturePath;

      res.json({
        message: 'Profile picture updated successfully.',
        profilePicture: profilePicturePath,
      });
    } catch (err) {
      console.error('Error uploading picture:', err.message);
      res.status(500).json({ message: 'Failed to upload picture.' });
    }
  }
);

// API route to update occupation
app.post(`${prefix}/user/updateOccupation`, ensureAuthenticated, async (req, res) => {
  const { occupation } = req.body;
  const username = req.session.user.username;

  try {
    await db.collection('users').updateOne(
      { username },
      { $set: { occupation } }
    );

    // Update session data
    req.session.user.occupation = occupation;

    res.json({ message: 'Occupation updated successfully.' });
  } catch (err) {
    console.error('Error updating occupation:', err.message);
    res.status(500).json({ message: 'Failed to update occupation.' });
  }
});

// API route to update bio
app.post(`${prefix}/user/updateBio`, ensureAuthenticated, async (req, res) => {
  const { bio } = req.body;
  const username = req.session.user.username;

  try {
    await db.collection('users').updateOne(
      { username },
      { $set: { bio } }
    );

    // Update session data
    req.session.user.bio = bio;

    res.json({ message: 'Bio updated successfully.' });
  } catch (err) {
    console.error('Error updating bio:', err.message);
    res.status(500).json({ message: 'Failed to update bio.' });
  }
});

// post content
app.post(`${prefix}/contents`, upload.single('media'), async (req, res) => {
  const { username, text } = req.body;
  const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required.' });
  }

  try {
    const newPost = {
      username,
      text,
      media: mediaPath,
      date: new Date(),
      likes: []
    };

    await db.collection('contents').insertOne(newPost);
    res.status(201).json({ message: 'Post shared successfully!', post: newPost });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to share post.' });
  }
});

// like post route

app.post(`${prefix}/contents/:contentId/likes`, async (req, res) => {
  const { contentId } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const content = await db.collection('contents').findOne({ _id: new ObjectId(contentId) });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Ensure likedBy is an array
    const likedBy = content.likedBy || [];

    const alreadyLiked = likedBy.includes(username);

    let updatedLikes, updatedLikedBy;
    if (alreadyLiked) {
      // Remove the like
      updatedLikes = (content.likes || 0) - 1; // Default likes to 0 if missing
      updatedLikedBy = likedBy.filter(user => user !== username);
    } else {
      // Add the like
      updatedLikes = (content.likes || 0) + 1; // Default likes to 0 if missing
      updatedLikedBy = [...likedBy, username];
    }

    // Update the content document
    await db.collection('contents').updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          likes: updatedLikes,
          likedBy: updatedLikedBy
        }
      }
    );

    res.status(200).json({
      likes: updatedLikes,
      likedByCurrentUser: !alreadyLiked
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// fetch user content
app.get(`${prefix}/contents`, async (req, res) => {
  const currentUser = req.session.user?.username;

  if (!currentUser) {
    return res.status(401).json({ error: 'You must be logged in to view content.' });
  }

  try {
    // Find the list of users the current user follows
    const follows = await db.collection('follows').findOne({ follower: currentUser });
    const followedUsers = follows?.following || []; // Get the array of followed usernames

    // Include the current user's own content
    const usernamesToFetch = [...followedUsers, currentUser];

    // Fetch content for the current user and their followed users
    const contents = await db.collection('contents')
      .find({ username: { $in: usernamesToFetch } }) // Match any username in the array
      .sort({ date: -1 }) // Sort by most recent
      .toArray();

      // Include the likes array in the response
    const enrichedContents = contents.map(content => ({
      ...content,
      likes: content.likes || [] // Ensure the likes array exists, default to empty array
    }));

    res.status(200).json(enrichedContents);
  } catch (error) {
    console.error('Error fetching feed content:', error);
    res.status(500).json({ error: 'Failed to fetch feed content.' });
  }
});

// delete the content
// DELETE /M00951083/contents/:contentId - Delete a specific content post
app.delete(`${prefix}/contents/:contentId`, async (req, res) => {
  const { contentId } = req.params;

  // Ensure the user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to delete content.' });
  }

  const username = req.session.user.username; // Get the username from the session

  try {
    // Find the content by ID and ensure it belongs to the logged-in user
    const content = await db.collection('contents').findOne({ _id: new ObjectId(contentId) });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    if (content.username !== username) {
      return res.status(403).json({ error: 'You can only delete your own content.' });
    }

    // Delete the content
    await db.collection('contents').deleteOne({ _id: new ObjectId(contentId) });

    res.status(200).json({ message: 'Content deleted successfully.' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content.' });
  }
});


// follow user route 
app.post(`${prefix}/follow`, async (req, res) => {
  const { username } = req.body;
  const currentUser = req.session.user?.username;

  if (!currentUser) {
    return res.status(401).json({ message: 'You must be logged in to follow users.' });
  }

  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.collection('follows').updateOne(
      { follower: currentUser },
      { $addToSet: { following: username } },
      { upsert: true }
    );

    res.json({ message: `You are now following ${username}.` });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch follower and following counts
app.get(`${prefix}/follow/stats`, async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    // Count followers (users who follow the given username)
    const followerCount = await db.collection('follows').countDocuments({
      following: username,
    });

    // Get the user's following list
    const followingData = await db.collection('follows').findOne({ follower: username });
    const followingCount = followingData ? followingData.following.length : 0;

    res.status(200).json({
      followers: followerCount,
      following: followingCount,
    });
  } catch (error) {
    console.error('Error fetching follower stats:', error);
    res.status(500).json({ error: 'Failed to fetch follower stats.' });
  }
});

// return followings
app.get(`${prefix}/following`, async (req, res) => {
  const currentUser = req.session.user?.username;

  if (!currentUser) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  try {
    const followData = await db.collection('follows').findOne({ follower: currentUser });
    const following = followData ? followData.following : [];
    res.json(following);
  } catch (error) {
    console.error('Error fetching following data:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// unfollow user route
app.delete(`${prefix}/follow`, async (req, res) => {
  const { username } = req.body;
  const currentUser = req.session.user?.username;

  if (!currentUser) {
    return res.status(401).json({ message: 'You must be logged in to unfollow users.' });
  }

  try {
    await db.collection('follows').updateOne(
      { follower: currentUser },
      { $pull: { following: username } }
    );

    res.json({ message: `You have unfollowed ${username}.` });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// community routes
// POST /M00951083/community
app.post(`${prefix}/community`, upload.single('media'), async (req, res) => {
  const { type, content, topic, options, resources, mediaCaption } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to post to the community.' });
  }

  try {
    const username = req.session.user.username; // Get the username from the session
    const newCommunityEntry = {
      type,
      content: content || null, // Allow empty content for feed posts with media
      userId: username,
      createdAt: new Date(),
    };

    // Additional fields based on type
    if (type === 'poll') {
      if (!content || !options) {
        return res.status(400).json({ error: 'Poll must include content and options.' });
      }
      const parsedOptions = JSON.parse(options); // Parse options JSON string
      if (parsedOptions.length < 2) {
        return res.status(400).json({ error: 'Poll must include at least two options.' });
      }
      newCommunityEntry.options = parsedOptions.map((optionText) => ({
        text: optionText,
        votes: 0,
      }));
    } else if (type === 'forum') {
      if (!content || !topic) {
        return res.status(400).json({ error: 'Forum post must have content and a topic.' });
      }
      newCommunityEntry.topic = topic;
    } else if (type === 'resource') {
      if (!resources) {
        return res.status(400).json({ error: 'Resource must include links.' });
      }
      newCommunityEntry.resources = JSON.parse(resources); // Parse resources JSON string
    } else if (type === 'feed') {
      if (!content && !req.file) {
        return res.status(400).json({ error: 'Feed must have content or media.' });
      }
      if (req.file) {
        newCommunityEntry.media = `/uploads/${req.file.filename}`; // Store media path
      }
      if (mediaCaption) {
        newCommunityEntry.mediaCaption = mediaCaption; // Store media caption
      }
    } else {
      return res.status(400).json({ error: 'Invalid community entry type.' });
    }

    // Insert into the community collection
    await db.collection('community').insertOne(newCommunityEntry);

    res.status(201).json({ message: 'Community entry created successfully.' });
  } catch (error) {
    console.error('Error saving community entry:', error);
    res.status(500).json({ error: 'Failed to save community entry.' });
  }
});



// delete the community entry
app.delete(`${prefix}/community/:postId`, async (req, res) => {
  const { postId } = req.params;

  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to delete posts.' });
  }

  try {
    // Ensure the user is the owner of the post
    const result = await db.collection('community').deleteOne({
      _id: new ObjectId(postId),
      userId: req.session.user.username,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Post not found or you are not authorized to delete it.' });
    }

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});


// GET /M00951083/community
app.get(`${prefix}/community`, async (req, res) => {
  try {
    const communityData = await db.collection('community').find().sort({ createdAt: -1 }).toArray();

        // Ensure `resources` is parsed as an array
        const formattedData = communityData.map((entry) => {
          if (entry.type === 'resource' && typeof entry.resources === 'string') {
            try {
              entry.resources = JSON.parse(entry.resources);
            } catch (err) {
              console.error('Error parsing resources:', err);
              entry.resources = []; // Default to empty array if parsing fails
            }
          }
          return entry;
        });

    res.status(200).json(communityData);
  } catch (error) {
    console.error('Error retrieving community data:', error);
    res.status(500).json({ error: 'Failed to retrieve community data.' });
  }
});

// POST /M00951083/community/vote - Handle voting for polls
app.post(`${prefix}/community/vote`, async (req, res) => {
  const { pollId, optionText } = req.body;

  if (!pollId || !optionText) {
    return res.status(400).json({ error: 'Poll ID and option text are required.' });
  }

  try {
    // Increment vote count for the selected option
    const result = await db.collection('community').updateOne(
      { _id: new ObjectId(pollId), 'options.text': optionText },
      { $inc: { 'options.$.votes': 1 } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Poll or option not found.' });
    }

    res.status(200).json({ message: 'Vote registered successfully!' });
  } catch (error) {
    console.error('Error registering vote:', error);
    res.status(500).json({ error: 'Failed to register vote.' });
  }
});


// search query routes

//for user
app.get(`${prefix}/users/search`, async (req, res) => {
  const query = req.query.query || '';
  try {
    const users = await db.collection('users').find({ username: { $regex: query, $options: 'i' } }).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});


// for topics
app.get(`${prefix}/contents/search`, async (req, res) => {
  const query = req.query.query || '';
  try {
    const topics = await db.collection('community').find({ topic: { $regex: query, $options: 'i' } }).toArray();
    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching community topics:', error);
    res.status(500).json({ error: 'Failed to fetch community topics.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}${prefix}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await closeConnection();
  process.exit(0);
});
