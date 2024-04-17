# Youtube Music to Spotify Chrome Extension

A convenient Chrome extension to help you easily detect and transfer songs from Youtube Music in videos to your Spotify playlists


## Setup & Installation

1) Clone the repo:
```bash
git clone <repo-url>
```

2) Go to the Spotify Developer Page and create a new app

3) Update the follow lines in background.js with information from the app and extension created:
```bash
const CLIENT_ID = '' 
const REDIRECT_URI = 'http://<EXTENSION ID>.chromiumapp.org/'
```

4) Enable Developer Mode on Chrome and Load the extension by selecting the directory of the repo