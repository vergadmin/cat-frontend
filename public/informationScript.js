var CAT_IDS = [
    "control_assistant_id",
    "accommodation_assistant_id",
]

// Initialize the array
let topicsObject = {}
for (let i = 1; i <= 5; i++) {
    topicsObject[i] = false;
}

function checkTopic(topic) {
    if(topic == 1 || topic == "Safety in Clinical Trials") { topic = 1 }
    if(topic == 2 || topic == "Understanding and Comfort with the Clinical Trial Process") { topic = 2 }
    if(topic == 3 || topic == "Logistical, Time, and Financial Barriers to Participation") { topic = 3 }
    if(topic == 4 || topic == "Risks and Benefits of Clinical Trials") { topic = 4 }
    if(topic == 5 || topic == "Awareness and Information Accessibility") { topic = 5 }
    console.log("TOPIC IS: " + topic)
    let topicElem = "topic" + topic
    var topicHTML = document.getElementById(topicElem)
    topicHTML.style.color = "green"
    var textContent = topicHTML.textContent;
    var newTextContent = textContent.replace('☐', '☑'); // Replace 'oldChar' with the character you want to replace and 'newChar' with the character you want to replace it with
    topicHTML.textContent = newTextContent;
    topicsObject[topic] = true
    let allTrue = Object.values(topicsObject).every(value => value === true);
    // To disable the button
    console.log(allTrue)
    if (allTrue === true) {
        finishButton.disabled = false;
    }   
}

// const base_url = "http://44.209.126.3"
const base_url = "http://127.0.0.1:8000"

var cat_assistant_id = ""

let scripted_voice_base_url = "https://rashi-cat-study.s3.amazonaws.com/scripted/"
// let scripted_voice_base_url = "boop"

let surveyAnswersCommStyle = {}
let surveyAnswersBRIEF = {}
let backgroundInfo = {}

let returningUser = false;
let firstMessage = true

const chatBox = document.getElementById('chat-box');
const concludeButton = document.getElementById('conclude-button');

const inputAreaText = document.getElementById('input-area');
const inputAreaButtons = document.getElementById('input-area-buttons');

var responsesArray = ["Continue", "Option 2", "Option 3"]

var currentDate;
var localDateTime;
var informationTranscript = new Map()

var id = ''
var condition = ''
var bhls = 0

const userInput = document.getElementById('user-input');
const loadingSvg = document.getElementById('loading-svg');

const finishButton = document.getElementById('finish-button');

// To disable the button
finishButton.disabled = true;

var buttonSelection = ''

var BRIEFscore = 0
var commStyle = ''
var userInfo = ''

function formatJSONObjectAsString(JSONObject, item) {
    if (item === 'commStyle') {
        for (const [key, value] of Object.entries(JSONObject)) {
            commStyle += `${key}: ${value}/7; `;
        }
        commStyle = commStyle.trim().slice(0, -1);
    } else {
        for (const [key, value] of Object.entries(JSONObject)) {
            userInfo += `${key}: ${value}; `;
        }
        userInfo = userInfo.trim().slice(0, -1);
    }
}

function enableInput() {
    // userInput.disabled = false;
}

function disableInput() {
    // userInput.disabled = true;
}


function appendAlexMessage(message, audioDataUrl) {
    const messageElement = document.createElement('div');
    const labelText = document.createElement('span');
    labelText.className = "label-text";
    const messageText = document.createElement('span');

    const avatarImg = document.createElement('img');
    avatarImg.src = 'https://rashi-cat-study.s3.amazonaws.com/generic.gif'; // Replace with your image path
    avatarImg.alt = 'Alex';
    avatarImg.className = 'alex-icon';

    labelText.innerText = `Alex`;
    messageText.innerHTML = `${message}`;

    messageElement.className = "chatbot-message"
    messageElement.appendChild(labelText);
    messageElement.appendChild(messageText);

    const alexMessage = document.createElement('div');
    alexMessage.className = "alex-message-item"

    alexMessage.appendChild(avatarImg)
    alexMessage.appendChild(messageElement);

    chatBox.appendChild(alexMessage)


    // COMMENT OUT AUDIO FOR TESTING
    // Create and append the audio element
    const audioElement = new Audio(audioDataUrl);
    audioElement.controls = true;
    chatBox.appendChild(audioElement);
    audioElement.style.display = 'none'

    audioElement.play();

    // // Play the video and loop when the audio starts playing
    // audioElement.addEventListener('play', function() {
    //     const video = document.getElementById('myVideo');
    //     video.loop = true; // Ensure video loops
    //     video.play();
    //     loadingSvg.style.visibility = 'visible';
    // });

    // Pause the video when the audio stops playing
    audioElement.addEventListener('ended', function() {
        const alexIcons = document.querySelectorAll('.alex-icon');
        // Select the last element
        const lastAlexIcon = alexIcons[alexIcons.length - 1];
        lastAlexIcon.setAttribute('src', 'https://rashi-cat-study.s3.amazonaws.com/generic.jpeg');
    });

    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}

function appendUserMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    const labelText = document.createElement('span');
    labelText.className = "label-text";
    const messageText = document.createElement('span');

    labelText.innerText = `You`;
    messageText.innerText = `${message}`;

    messageElement.className = "user-message"
    messageElement.appendChild(labelText);
    messageElement.appendChild(messageText);

    
    chatBox.appendChild(messageElement);

    appendLoadingDots();

    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}

function appendLoadingDots() {
    const ellipse = document.createElement('div');
    ellipse.className = "lds-ellipsis";
    ellipse.setAttribute('id', "lds-ellipsis")


    const l1 = document.createElement('div');
    const l2 = document.createElement('div');
    const l3 = document.createElement('div');

    ellipse.appendChild(l1)
    ellipse.appendChild(l2)
    ellipse.appendChild(l3)

    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(ellipse);
}

function formatResponseWithAnnotations(response, annotations) {
    let citationNumber = 1;
    let citationMap = {};
    let annotationKeys = Object.keys(annotations);

    // Replace each annotation with a citation number
    for (let key of annotationKeys) {
        let citation = `[${citationNumber}]`;
        citationMap[citationNumber] = annotations[key];
        // Replace all occurrences of the key in the response with the citation number wrapped in a link
        response = response.replace(new RegExp(key, 'g'), `<a target="_blank" href="https://rashi-cat-study.s3.amazonaws.com/resources/${annotations[key].replace(/ /g, '+')}" title="${annotations[key]}">${citation}</a>`);
        citationNumber++;
    }
    
    return response;
}

function parseAndReplaceCitations(text) {
    // Regular expression to match citation placeholders like &#8203;:citation[oaicite:2]{index=2}&#8203;
    const citationRegex = /【\d+:\d+†(.*?)】/g;

    let citationNumber = 1;
    let citationMap = {};
    let response = text;

    // Replace each citation placeholder with the formatted citation number and link
    response = response.replace(citationRegex, (match, key) => {
        citationMap[citationNumber] = key.trim();
        // Generate HTML link for the citation
        return `[${citationNumber}]`;
    });

    // Replace each citation number in the response with the HTML link
    Object.keys(citationMap).forEach(citationNum => {
        const citation = `[${citationNum}]`;
        const linkText = citationMap[citationNum];
        const encodedLink = encodeURIComponent(linkText.trim().replace(/ /g, '+'));
        const link = `<a target="_blank" href="https://rashi-cat-study.s3.amazonaws.com/resources/${encodedLink}" title="${linkText}">${citation}</a>`;
        response = response.replace(new RegExp(`\\[${citationNum}\\]`, 'g'), link);
    });

    return response;
}

// JavaScript function to trigger when the user hits Enter after typing in the input field
document.getElementById("user-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
  });

function sendMessage() {
    console.log("returning user is:", returningUser)
    var userMessage

    currentDate = new Date();
    // Convert the date and time to the user's local time zone
    localDateTime = currentDate.toLocaleString();
    // Output the local date and time
    
    if (firstMessage === true) {
        appendLoadingDots()
        var controlInitialMessage = 'Introduce yourself and list 2-3 things you can talk about based on your knowledge base.'
        var accommodateMessage = 'Introduce yourself and list 2-3 things you can talk about based on your knowledge base.'

        if (condition === '0') { userMessage = controlInitialMessage }
            else { userMessage = accommodateMessage }

        informationTranscript.set("SYSTEM " + localDateTime, userMessage);
    } else {
        userMessage = userInput.value;
        if (userMessage.trim() === '') return;
        appendUserMessage(userMessage);
        informationTranscript.set("USER " + localDateTime, userMessage);
        updateTranscript()
    }
    
    disableInput()
    
    fetch(base_url + `/api/cat/assistant`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: id, cat_bot_id: cat_assistant_id, user_message: userMessage, health_literacy: bhls})
    })
    .then(response => response.json())
    .then(data => {
        console.log("ANNOTATIONS:", data.annotations)
        var formattedResponse = formatResponseWithAnnotations(data.response, data.annotations)
        formattedResponse = parseAndReplaceCitations(formattedResponse)
        console.log("AUDIO:", data.audio)
        appendAlexMessage(formattedResponse, data.audio);
        console.log("TOPIC IS:", data.topic)
        console.log(firstMessage)
        if (firstMessage === false) { checkTopic(data.topic) }
        
        currentDate = new Date();
        // Convert the date and time to the user's local time zone
        localDateTime = currentDate.toLocaleString();
        // Output the local date and time
        informationTranscript.set("ALEX " + localDateTime, data.response);
        updateTranscript()
        firstMessage = false
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
        // Remove loading indicator after response received
        const ellipse = document.getElementById('lds-ellipsis');
        console.log(ellipse)
        ellipse.remove();
    });
    userInput.value = ''; // Clear input field after sending message
}

window.onload = function() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    condition = urlParams.get('c')
    console.log(condition);
    id = urlParams.get('id')
    console.log(id);
    bhls = urlParams.get('bhls')
    console.log(bhls)

    if (condition === '6') {
        cat_assistant_id = "accommodative_assistant_id"
    } else if (condition === '0') {
        cat_assistant_id = "control_assistant_id"
    }

    console.log("CAT ASSISTANT ID IS:", cat_assistant_id)

    firstMessage = true

    fetch('/getUserInfo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('HTTP status ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log("User exists.", data)
        returningUser = true;
        sendMessage('text')
    })
    .catch(error => {
        if (error.message === 'HTTP status 404') {
            console.log("User does not exist.");
        } else {
            console.error('Error:', error);
        }
    })
    .finally(() => {
        console.log("Done checking if user exists.");
    });
  };

// Get the modal
var helpModal = document.getElementById("help-modal");

// Get the button that opens the modal
var helpBtn = document.getElementById("help-icon");

// Get the <span> element that closes the modal
var helpSpan = document.getElementsByClassName("help-close")[0];

// When the user clicks on the button, open the modal
helpBtn.onclick = function() {
    helpModal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
helpSpan.onclick = function() {
    helpModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == helpModal) {
    helpModal.style.display = "none";
  }
}

function updateTranscript() {
    let transcriptString = JSON.stringify(Object.fromEntries(informationTranscript));

    fetch('/updateTranscript', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: id, 
            transcriptType: 'informationTranscript', 
            transcript: transcriptString
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Transcript updated successfully");
    })
    .catch(error => console.error('Error logging transcript:', error));
}

function logUserInfo() {
    let surveyAnswers = { ...surveyAnswersCommStyle, ...surveyAnswersBRIEF };

    fetch('/logUserInfo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: id, 
            surveyAnswers: surveyAnswers, 
            briefScore: BRIEFscore,  
            backgroundInfo: backgroundInfo
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("User info logged successfully");
    })
    .catch(error => console.error('Error logging other data:', error))
}

function nextPage() {
    window.location.href = `/continue?id=${id}&c=${condition}`
}