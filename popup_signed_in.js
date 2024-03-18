document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success'){
            console.log("Sign Out Successful")
            window.close();
        } 
    });
});

document.getElementById('token').addEventListener('click', () =>  {
    let access_token = chrome.storage.local.get(["access_token"])
    console.log(access_token);
});