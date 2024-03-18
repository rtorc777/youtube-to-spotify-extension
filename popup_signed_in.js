document.getElementById('sign-out').addEventListener('click', () =>  {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});