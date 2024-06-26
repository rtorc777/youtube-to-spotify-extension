//Request User Authorization - NOTE, using Implicit Grant Flow, so token doesn't refresh (Need to sign in and out every hour) 
const CLIENT_ID = ''; //Update with your own app
const RESPONSE_TYPE = 'token';
const REDIRECT_URI = 'http://<EXTENSION ID>.chromiumapp.org/'; //Update with your own app
const SCOPE = 'user-read-email user-read-private playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public';
const SHOW_DIALOG = 'true';
let STATE = '';
let ACCESS_TOKEN = '';

let signed_in = false;

function create_spotify_endpoint() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let auth_url ='https://accounts.spotify.com/authorize';
    auth_url += '?response_type=' + encodeURIComponent(RESPONSE_TYPE);;
    auth_url += '&client_id=' + encodeURIComponent(CLIENT_ID);
    auth_url += '&scope=' + encodeURIComponent(SCOPE);
    auth_url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    auth_url += '&state=' + encodeURIComponent(STATE);
    auth_url += '&show_diag=' + encodeURIComponent(SHOW_DIALOG);

    return auth_url;
}

chrome.alarms.onAlarm.addListener(() => {
    ACCESS_TOKEN = '';
    signed_in = false;
    chrome.action.setPopup({ popup: 'popup.html' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (signed_in) {
            console.log("User is already signed in.");
        } else {
            // sign the user in with Spotify
            chrome.identity.launchWebAuthFlow({
                interactive: true,
                url: create_spotify_endpoint()
            }, (redirect_url) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ message: 'fail' });
                } else {
                    if (redirect_url.includes('callback?error=access_denied')) {
                        sendResponse({ message: 'fail' });
                    } else {
                        ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
                        ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf('&'));
                        let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);
            
                        if (state === STATE) {
                            signed_in = true;
                            chrome.storage.local.set({'access_token': ACCESS_TOKEN});
            
                            chrome.action.setPopup({ popup: 'popup_signed_in.html' }, () => {
                                sendResponse({ message: 'success' });
                            });


                            chrome.alarms.create({ delayInMinutes: 60 }); //Spotify Token expires every hour, so need to re-sign in to get new Token

                        } else {
                            sendResponse({ message: 'fail' });
                        }
                    }
                }
            });
        }
      return true;

    } else if (request.message === 'logout') {
        signed_in = false;
        chrome.action.setPopup({ popup: './popup.html' }, () => {
            sendResponse({ message: 'success' });
        });

        return true;
    }
});