let access_token = "";
let videoTitle = "";
let titleMode;
const swiper = new Swiper('.swiper', {
    slidesPerView: 1,
    spaceBetween: 40,
    observer: true,
    preventClicks: true,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    effect: 'coverflow',
    coverflowEffect: {
        rotate: 30,
        slideShadows: false,
    },
    watchOverflow: true,
  });


initialize();


/** After clicking on the extension icon, it will:
 *  1) Initialize the Spotify Access Token
 *  2) Get the title of the YouTube video
 *  3) Get the User's Spotify Playlists */
async function initialize(){
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0];

    await chrome.storage.local.get(["access_token"], (result) => {
        access_token = result.access_token;
    });

    if (tab.url && tab.url.includes("youtube.com/watch")){
        await getTitle(tab).then(async () =>{
            showPlaylists(tab);
            detectMode();
        });
    }
}  


/** Signs out of Spotify */
document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success'){
            window.close();
        } 
    });
});


/** Toggle the use of using title or normal searching */
document.getElementById('title').addEventListener('click', async () =>  {
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0];

    if(document.getElementById('title').checked){
        chrome.storage.local.set({'titleMode': true})
        useTitle();
    }
    else{
        chrome.storage.local.set({'titleMode': false})
        detectSongs(tab);
    }
});


/** Gets the Spotify Tracks depending on the mode selected */
async function detectMode(){
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0];
    
    await chrome.storage.local.get(["titleMode"], async (result) => {
        titleMode = result.titleMode;

        document.getElementById("title-mode").hidden = false;
        document.getElementById("text").hidden = false;
        document.getElementById("songs").hidden = false;

        if(titleMode){
            document.getElementById('title').checked = true;
            useTitle();
        }
        else    
            detectSongs(tab);
    });
}


/** Uses the video title to search for song instead */
async function useTitle(){
    const swiper = document.getElementById("swiper-wrapper");
    if(!videoTitle == ""){
        const track = await getTrack(videoTitle, "");
        swiper.replaceChildren();
        if (document.getElementById("amount") !== null) 
            document.getElementById("amount").remove();
        
        if(track !== undefined){
            getTrackInfo(track);
        }
        else{
            const text = document.createElement('h1');
            text.innerHTML= "No songs were found on this video";
            swiper.appendChild(text);
        }
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


/** Gets the User's owned playlists and adds them to the popup*/
async function showPlaylists(tab) {
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: (() => {}),
    }).then(async () => {
        const playlists = await getPlaylists();
        for(let playlist of playlists) {
            getPlaylistInfo(playlist);
        }
      })
}


/** Helper to add playlist to the popup */
function getPlaylistInfo(playlist){
    const id = playlist.id;
    const name = playlist.name;

    const playlists = document.getElementById("playlists");
    const option = document.createElement("option");
    
    option.value = id;
    option.innerHTML = name;

    playlists.appendChild(option);
}


/** Runs the scraping script on the current YouTube page */
async function detectSongs(tab) {
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: getSongs,
    }).then(async (songResults) => {
        const songs = songResults[0].result;
        const swiper = document.getElementById("swiper-wrapper");
        swiper.replaceChildren();
        if (document.getElementById("amount") !== null) 
            document.getElementById("amount").remove();

        let songsAdded = 0;    
        for (let song of songs) {
            let track = await getTrack(song[0], song[1]);
            const songHeader = song[0] + song[1];
            if (track === undefined){ 
                track = await getTrack(songHeader, ""); //Try searching without artist filter, might not detect it
                if (track === undefined) continue;
            }
            getTrackInfo(track);
            songsAdded++;
        }

        const text = document.createElement('h1');
        text.id = "amount";
        const added = document.getElementById("songs");
        if (songsAdded === 0){
            text.innerHTML= "No songs were found on this video, try using Title Mode";
            added.insertBefore(text, document.getElementById("swiper"));
        }
        else if (songsAdded > 1){
            text.innerHTML= songsAdded + " songs found";
            added.insertBefore(text, document.getElementById("swiper"));
        }
      })
}


/** Helper to add song information to popup */
function getTrackInfo(track){
    const url = track.external_urls.spotify;
    const title = track.name;
    const artist = track.artists[0].name;
    const image = track.album.images[1].url;
    const preview_url = track.preview_url; 
    const uri = track.uri;

    const songs = document.getElementById("swiper-wrapper");
    const song = document.createElement("div");
    song.id = "song";
    song.classList.add("swiper-slide");

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

    const songPreview = document.createElement("audio"); //Spotify Preview (if there is one)
    songPreview.setAttribute("controls","");
    songPreview.volume = 0.05;
    if (preview_url !== null){
        const preview = document.createElement("source");
        preview.src = preview_url;
        preview.type = "audio/mpeg";
        songPreview.appendChild(preview);
    }
    song.appendChild(songPreview);

    const addButton = document.createElement("button");
    addButton.textContent = "Add to playlist";
    addButton.addEventListener("click", async () => { //Function to song to the selected playlist
        const playlist = document.getElementById("playlists").value; 
        await addTrack(playlist, uri)
        addButton.disabled = true;
        addButton.textContent = "Successfully added";
    })
    song.appendChild(addButton);

    songs.appendChild(song);
}


/** Uses Spotify API 
 *  @return Spotify track */
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
 *  @return Spotify playlists owned by User */
async function getPlaylists(){
    const result = await fetch('https://api.spotify.com/v1/me/playlists', {
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
 *  @return Success response */
async function addTrack(playlist, uri){
    const result = await fetch('https://api.spotify.com/v1/playlists/' + playlist + '/tracks?uris=' + encodeURIComponent(uri), {
        method: 'POST',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    return result;
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


/** Check for Youtube Music songs on page */
function getSongs() {
    const songs = [];
    const dupes = [];
    const titleResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h1");
    const artistResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h4");
    for(let i = 0; i < titleResults.length; i++){
        const title = titleResults[i].textContent;
        let artist;
        
        if (artistResults[i] === undefined)
            artist = "";
        else
            artist = artistResults[i].textContent;
        
        if(!dupes.includes(title)){
            dupes.push(title);
            songs.push([title, artist]);
        }   
    }
    return songs;
}