let access_token = ""
chrome.storage.local.get(["access_token"], (result) => {
    access_token = result.access_token;
} )

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
    const body = document.getElementsByTagName('body')[0];

    topTracks?.map(({name, artists}) => {
        let newDiv = document.createElement("p");
        newDiv.textContent = name + " by " + artists.map(artist => artist.name).join(', ');
        body.appendChild(newDiv);
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

async function getYoutubeTracks(title, artist){
    const result = await fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(title + " artist:" + artist) + '&type=track&limit=1', {
        method: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + access_token
        }
    });

    const data = await result.json();
    return data.tracks
}

document.getElementById('test').addEventListener('click', async () =>  {
    const track = await getYoutubeTracks("congratulations", "pewdiepie");
    console.log(track)

});