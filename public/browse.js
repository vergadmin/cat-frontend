var CAT_IDS = [
    "ct_control_assistant_id",
    "ct_accommodation_assistant_id",
]

var BRIEFscore = 0
var commStyle = ''
var userInfo = ''

// const base_url = "http://44.209.126.3"
const base_url = "http://127.0.0.1:8000"

var cat_assistant_id = ""

const chatBox = document.getElementById('chat-box');
const concludeButton = document.getElementById('conclude-button');

var currentDate;
var localDateTime;
var browseTranscript = new Map()

var id = ''
var condition = ''

const userInput = document.getElementById('user-input');
const loadingSvg = document.getElementById('loading-svg');

let progress = 0;

const finishButton = document.getElementById('finish-button');

// To disable the button
finishButton.disabled = true;

function enableInput() {
    // userInput.disabled = false;
}

function disableInput() {
    // userInput.disabled = true;
}

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

function convertTextToHTML(text) {
    // Split the text into lines
    const lines = text.split('\n');
  
    // Start the HTML with an unordered list
    let html = '<ul>';
  
    // Track the depth of sub-lists
    let depth = 0;
  
    lines.forEach(line => {
      // Determine the current depth by counting leading spaces or tabs
      const currentDepth = line.search(/\S|$/); // Index of first non-space character
  
      if (currentDepth > depth) {
        // If deeper, start a new sub-list
        html += '<ul>';
      } else if (currentDepth < depth) {
        // If shallower, close the current sub-list
        html += '</ul>';
      }
  
      // Set the new depth
      depth = currentDepth;
  
      // Remove leading hyphens, asterisks, and spaces, and wrap the line in <li> tags
      const content = line.trim().replace(/^[-*] /, '');
      if (content) {
        html += `<li>${content}</li>`;
      }
    });
  
    // Close any open lists
    while (depth-- > 0) {
      html += '</ul>';
    }
  
    // Close the main list
    html += '</ul>';
  
    return html;
  }

  function getTrial(NCTID, selectButton, deselectButton1, deselectButton2) {
    console.log(selectButton)
    document.getElementById(selectButton).classList.add('selected-study')
    document.getElementById(deselectButton1).classList.remove('selected-study')
    document.getElementById(deselectButton2).classList.remove('selected-study')
    fetch(NCTID+'.json')
        .then(response => response.json())
        .then(data => {
            const briefTitle = data.protocolSection.identificationModule.briefTitle;
            const eligibilityCriteria = data.protocolSection.eligibilityModule.eligibilityCriteria;
            const briefSummary = data.protocolSection.descriptionModule.briefSummary;
            const studyType = data.protocolSection.designModule.studyType;
            const primaryOutcome = data.protocolSection.outcomesModule.primaryOutcomes[0].measure;
            
            const eligibility = data.protocolSection.eligibilityModule;
            const sex = eligibility.sex || 'Not specified';  // Defaulting to 'Not specified' if sex is not defined
            const minimumAge = eligibility.minimumAge || 'Not specified';  // Defaulting to 'Not specified' if minimumAge is not defined
            const maximumAge = eligibility.maximumAge || 'Not specified';
            
            let htmlCriteria = convertTextToHTML(eligibilityCriteria);

            document.getElementById("criteriaList").innerHTML = htmlCriteria

            const ctTitle = document.getElementById('ct-title');
            const ctSummary = document.getElementById('ct-summary');
            const ctType = document.getElementById('ct-type');
            const ctOutcome = document.getElementById('ct-outcome');
            const ctSex = document.getElementById('ct-sex');
            const ctMinAge = document.getElementById('ct-minAge');
            const ctMaxAge = document.getElementById('ct-maxAge');

            ctTitle.innerHTML="Study " + selectButton + ": " + briefTitle
            ctSummary.innerHTML=briefSummary
            ctType.innerHTML=studyType
            ctOutcome.innerHTML=primaryOutcome
            ctSex.innerHTML=sex
            ctMinAge.innerHTML=minimumAge
            ctMaxAge.innerHTML=maximumAge

        })
        .catch(error => console.error('Error loading the data: ', error));
  }


document.addEventListener("DOMContentLoaded", function() {
    getTrial("NCT04990895", "1", "2", "3")
});


function formatResponseWithAnnotations(response, annotations) {
    console.log(response)
    console.log(annotations)
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
    console.log("NEW RESPONES:", response)
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




function appendAlexMessage(message, audioDataUrl) {
    const messageElement = document.createElement('div');
    const labelText = document.createElement('span');
    labelText.className = "label-text";
    const messageText = document.createElement('span');

    labelText.innerText = `Alex`;
    messageText.innerHTML = `${message}`;

    messageElement.className = "chatbot-message"
    messageElement.appendChild(labelText);
    messageElement.appendChild(messageText);
    chatBox.appendChild(messageElement);

    // COMMENT OUT AUDIO FOR TESTING
    // Create and append the audio element
    // const audioElement = new Audio(audioDataUrl);
    // audioElement.controls = true;
    // chatBox.appendChild(audioElement);
    // audioElement.style.display = 'none'

    // // Play the video and loop when the audio starts playing
    // audioElement.addEventListener('play', function() {
    //     const video = document.getElementById('myVideo');
    //     video.loop = true; // Ensure video loops
    //     video.play();
    //     loadingSvg.style.visibility = 'visible';
    // });

    // // Pause the video when the audio stops playing
    // audioElement.addEventListener('ended', function() {
    //     const video = document.getElementById('myVideo');
    //     video.currentTime = video.duration;
    //     video.pause();
    //     loadingSvg.style.visibility = 'hidden';
    //     enableInput()
    // });

    // audioElement.play();

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

// JavaScript function to trigger when the user hits Enter after typing in the input field
document.getElementById("user-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
  });

function sendMessage() {
    var userMessage

    userMessage = userInput.value;
    if (userMessage.trim() === '') return;

    appendUserMessage(userMessage);
    disableInput()

    currentDate = new Date();
    // Convert the date and time to the user's local time zone
    localDateTime = currentDate.toLocaleString();
    // Output the local date and time
    browseTranscript.set("USER " + localDateTime, userMessage);
    updateTranscript();

    fetch(base_url + `/api/cat/browse`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: id, cat_bot_id: cat_assistant_id, user_message: userMessage, user_info: userInfo, comm_style: commStyle, health_literacy: BRIEFscore})
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.response)
        var formattedResponse = data.response.replace(/\【.*?\】/g, '');
        formattedResponse = formattedResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        appendAlexMessage(formattedResponse, data.audio);
        currentDate = new Date();
        // Convert the date and time to the user's local time zone
        localDateTime = currentDate.toLocaleString();
        // Output the local date and time
        browseTranscript.set("ALEX " + localDateTime, data.response);
        updateTranscript();
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
        // Remove loading indicator after response received
        const ellipse = document.getElementById('lds-ellipsis');
        ellipse.remove();
    });
    
    userInput.value = ''; // Clear input field after sending message
}

window.onload = function() {
    document.getElementById('input-area').style.display = 'flex';
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    condition = urlParams.get('c')
    console.log(condition);
    id = urlParams.get('id')
    console.log(id);

    if (condition === '6') {
        cat_assistant_id = "ct_accommodative_assistant_id"
    } else if (condition === '0') {
        cat_assistant_id = "ct_control_assistant_id"
    }

    console.log("CAT ASSISTANT ID IS:", cat_assistant_id)

    var alexMessage = "Greet the user tell them you have 3 virtual clinical trials you can help them browse; for specific trials, ask them to specify Study 1, Study 2, or Study 3. Suggest 1-2 questions you can answer."

    appendLoadingDots();
    

    currentDate = new Date();
    localDateTime = currentDate.toLocaleString();
    browseTranscript.set("SYSTEM " + localDateTime, alexMessage);
    updateTranscript();

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
        console.log("CHECKED FO RUSER GOT SOME DATA COOL")
        BRIEFscore = data.surveyAnswersBRIEF.BRIEFScore;
        formatJSONObjectAsString(data.surveyAnswersCommStyle, 'commStyle')
        formatJSONObjectAsString(data.backgroundInfo, 'userInfo')

        console.log("AB TO CALL PYTHON API TO BROWSE")
        fetch(base_url + `/api/cat/browse`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: id, cat_bot_id: cat_assistant_id, user_message: alexMessage, user_info: userInfo, comm_style: commStyle, health_literacy: BRIEFscore})
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.response)
            var formattedResponse = data.response.replace(/\【.*?\】/g, '');
            formattedResponse = formattedResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            appendAlexMessage(formattedResponse, data.audio);
            currentDate = new Date();
            // Convert the date and time to the user's local time zone
            localDateTime = currentDate.toLocaleString();
            // Output the local date and time
            browseTranscript.set("ALEX " + localDateTime, data.response);
        })
        .catch(error => console.error('Error:', error))
        .finally(() => {
            const ellipse = document.getElementById('lds-ellipsis')
            ellipse.remove();
        });
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
    let transcriptString = JSON.stringify(Object.fromEntries(browseTranscript));

    fetch('/updateTranscript', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: id, 
            transcriptType: 'browseTranscript', 
            transcript: transcriptString
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Transcript updated successfully");
    })
    .catch(error => console.error('Error logging transcript:', error));
}