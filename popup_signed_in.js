let access_token = "";
let videoTitle = "";
chrome.storage.local.get(["access_token"], (result) => {
    access_token = result.access_token;
} )

onClick();

/** Signs out of Spotify */
document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success'){
            window.close();
        } 
    });
});

/** Uses the video title instead of detecting YouTube Music */
document.getElementById('title').addEventListener('click', async () =>  {
    const songs = document.getElementById("songs");
    if(!videoTitle == ""){
        const track = await getTrack(videoTitle, "");
        if(track !== undefined){
            songs.replaceChildren();
            getTrackInfo(track);
        }
    }
});

/** After clicking on the extension icon, it will get the title of the Youtube video and show all of the songs detected from the description in the popup */
async function onClick(){
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0];
    
    if (tab.url && tab.url.includes("youtube.com/watch")){
        getTitle(tab);
        detectSongs(tab);
    }
}

/** Gets the title of the YouTube video */
async function getTitle(tab) {
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: (() => {return document.querySelector("h1.ytd-watch-metadata").innerText}),
    }).then(async (title) => {
        videoTitle = title[0].result;
      })
}

/** Runs the scraping script on the current YouTube page */
async function detectSongs(tab) {
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: getSongs,
    }).then(async (songResults) => {
        const songs = songResults[0].result;
        for (let song of songs) {
            let track = await getTrack(song[0], song[1]);
            if (track === undefined){ 
                track = await getTrack(song[0] + " " + song[1], ""); //Try searching without artist filter, might not detect it
                if (track === undefined) return;
            }

            getTrackInfo(track);
        }
      })
}

/** Uses Spotify API 
 *  @return Spotify Track */
async function getTrack(title, artist){
    const result = await fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(title + " artist:" + artist) + '&type=track&limit=1', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.tracks.items[0];
}

/** Uses Spotify API 
 *  @return Spotify Playlists created by User */
async function getPlaylists(){
    const result = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    const userId = await getId();
    return data.items.filter((playlist) => playlist.owner.id === userId);
}

/** Uses Spotify API 
 *  @return Spotify User ID */
async function getId(){
    const result = await fetch('https://api.spotify.com/v1/me/', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.id;
}

/** Adds song information from Spotify API results to popup */
function getTrackInfo(track){
    const songs = document.getElementById("songs");
    const song = document.createElement("div");
    song.id = "song";

    const url = track.external_urls.spotify;
    const title = track.name;
    const artist = track.artists[0].name;
    const image = track.album.images[1].url;
    const preview_url = track.preview_url; 

    const songImg = document.createElement("img") //Image with Spotify Link
    songImg.src = image;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.appendChild(songImg);
    song.appendChild(link);

    const songInfo = document.createElement("p"); //Title and Artist
    songInfo.innerHTML = title + " by " + artist + " ";
    song.appendChild(songInfo);

    const songPreview = document.createElement("audio"); //Spoify Preview (if there is one)
    songPreview.setAttribute("controls","");
    songPreview.volume = 0.05;
    if (preview_url !== null){
        const preview = document.createElement("source");
        preview.src = preview_url;
        preview.type = "audio/mpeg";
        songPreview.appendChild(preview);
    }
    song.appendChild(songPreview);

    songs.appendChild(song);
}

/** Check for Youtube Music songs on page */
function getSongs() {
    videoTitle = document.querySelector("h1.ytd-watch-metadata").innerText; 
    const songs = [];
    const dupes = [];
    const titleResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h1");
    const artistResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h4");
    for(let i = 0; i < titleResults.length; i++){
        const title = titleResults[i].textContent;
        const artist = artistResults[i].textContent;
        
        if(!dupes.includes(title)){
            dupes.push(title);
            songs.push([title, artist]);
        }   
    }
    return songs;
}

//***DELETE THIS WHEN DONE***
document.getElementById('test').addEventListener('click', async () =>  {
    const playlists = await getPlaylists();
    console.log(playlists);
});

