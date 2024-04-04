let access_token = ""
chrome.storage.local.get(["access_token"], (result) => {
    access_token = result.access_token;
} )

let title = ""
let artist = ""
async function onClick(){
    let tab = await chrome.tabs.query({active: true});
    tab = tab[0]
    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        func: getSong,
    }).then(injectionResults => {
        title = injectionResults[0].result
        let newDiv = document.createElement("p");
        newDiv.textContent = title;
        document.body.appendChild(newDiv);
      })
}

function getSong() {return document.querySelector("div.yt-video-attribute-view-model__metadata h1").textContent}
onClick();

document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success'){
            console.log("Sign Out Successful")
            window.close();
        } 
    });
});

document.getElementById('token').addEventListener('click', async () =>  {
    const topTracks = await getTracks();
    topTracks?.map(({name, artists}) => {
        let newDiv = document.createElement("p");
        newDiv.textContent = name + " by " + artists.map(artist => artist.name).join(', ');
        document.body.appendChild(newDiv);
    });

});

async function getTracks(){
    const result = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.items
}

async function getYoutubeTrack(title, artist){
    const result = await fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(title + " artist:" + artist) + '&type=track&limit=1', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.tracks.items
}

document.getElementById('test').addEventListener('click', async () =>  {
    const track = await getYoutubeTrack("congratulations", "pewdiepie");
    console.log(track)

});