let access_token = ""
chrome.storage.local.get(["access_token"], (result) => {
    access_token = result.access_token;
} )

onClick();

document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success'){
            console.log("Sign Out Successful")
            window.close();
        } 
    });
});

document.getElementById('test').addEventListener('click', async () =>  {
    const track = await getTrack("congratulation", "post");
    console.log(track)

});

async function onClick(){
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0]
    
    if (tab.url && tab.url.includes("youtube.com/watch"))
        detectSongs(tab);
}

async function detectSongs(tab) {
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: getSongs,
    }).then(async (songResults) => {
        const songs = songResults[0].result;
        for (let song of songs) {
            const track = await getTrack(song[0], song[1]);
            if (!track.length == 0){
                const url = track[0].external_urls.spotify;
                const title = track[0].name;
                const artist = track[0].artists[0].name;
                const image = track[0].album.images[1].url; 

                let songImg = document.createElement("img")
                songImg.src = image;
                document.body.appendChild(songImg);

                let songInfo = document.createElement("p");
                songInfo.innerHTML = title + " by " + artist + " (" + '<a href="' + url + '" target="_blank"> Link </a>' + ")";
                document.body.appendChild(songInfo);

            }
        }
      })
}

function getSongs() { 
    const songs = [];
    const dupes = [];
    const titleResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h1");
    const artistResults = document.querySelectorAll("div.yt-video-attribute-view-model__metadata h4");
    for(let i = 0; i < titleResults.length; i++){
        const title = titleResults[i].textContent;
        const artist = artistResults[i].textContent;
        
        if(!dupes.includes(title)){
            dupes.push(title);
            songs.push([title, artist])
        }   
    }

    return songs;

}

async function getTrack(title, artist){
    const result = await fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(title + " artist:" + artist) + '&type=track&limit=1', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.tracks.items
}

