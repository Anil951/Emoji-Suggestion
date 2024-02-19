document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('textInput');
    const placeholder = input.nextElementSibling;

    input.addEventListener('focus', function() {
        placeholder.style.top = '0px';
        placeholder.style.fontSize = '12px';
        placeholder.style.color = 'black';
        placeholder.style.background='white';
    });

    input.addEventListener('blur', function() {
        if (input.value === '') {
            placeholder.style.top = '50%';
            placeholder.style.fontSize = '16px';
            placeholder.style.color = '#524f4f';
            placeholder.style.fontWeight='bold';
        }
    });

    const inputs = document.querySelectorAll('#emoji, #emojiName, #emojiMeaning');

inputs.forEach(input => {
    const placeholder1 = input.nextElementSibling;

    input.addEventListener('focus', function() {
        placeholder1.style.fontSize = '12px';
        placeholder1.style.color = 'black';
        placeholder1.style.background='white';
    });

    input.addEventListener('blur', function() {
        if (input.value === '') {
            placeholder1.style.fontSize = '16px';
            placeholder1.style.color = '#524f4f';
            placeholder1.style.fontWeight='bold';
        }
    });
});





    // Function to fetch emojis and their details
    async function fetchEmojis(sentence) {
        const response = await fetch('/process_input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sentence })
        });
        const data = await response.json();
        return data.emojis;
    }

    // Function to update the UI with emojis and their details
    async function updateUI(sentence) {
        const emojisWithDetails = await fetchEmojis(sentence);
        const emojisContainer = document.querySelector('.emojis-container');
        if (emojisContainer) {
            emojisContainer.innerHTML = ''; // Clear previous emojis

            emojisWithDetails.forEach(emoji => {
                const emojiElement = document.createElement('div');
                emojiElement.classList.add('emoji');
                emojiElement.textContent = emoji.emojis;

                const tooltip = document.createElement('span');
                tooltip.classList.add('tooltip');
                
                const formattedScore = (emoji.score * 100).toFixed(2); 
                tooltip.textContent = `${emoji.emojiNames} : ${formattedScore}%`;
                emojiElement.appendChild(tooltip);

                emojisContainer.appendChild(emojiElement);
            });
        } else {
            console.error('Emojis container not found');
        }
    }

    input.addEventListener('keydown', function(event) {
        const sentence = input.value.trim();
        if (event.key === ' ' && sentence !== '') {
            updateUI(sentence);
        }
    });

    const addEmojiBtn = document.getElementById('addEmojiBtn');
    const addEmojiForm = document.getElementById('addEmojiForm');
    const backbtn = document.getElementById('backbtn');
    const main = document.getElementById('input-container');
    const addEmojiBtndiv=document.getElementById('addEmojiBtndiv');
 

    addEmojiBtn.addEventListener('click', function() {
        addEmojiForm.style.display = 'flex';
        addEmojiForm.style.flexDirection="column";
        backbtn.style.display = 'flex';
        addEmojiBtn.style.display = 'none';
        main.style.display = 'none';
        addEmojiBtndiv.style.display='none';
    });

    backbtn.addEventListener('click', function() {
        addEmojiForm.style.display = 'none';
        backbtn.style.display = 'none';
        addEmojiBtn.style.display = 'block';
        main.style.display = 'flex';
        addEmojiBtndiv.style.display='flex';
    });

    const submitEmojiBtn = document.getElementById('submitEmojiBtn');

    submitEmojiBtn.addEventListener('click', function() {
        const emoji = document.getElementById('emoji').value.trim();
        const emojiName = document.getElementById('emojiName').value.trim();
        const emojiMeaning = document.getElementById('emojiMeaning').value.trim();
    
        if (emoji && emojiName && emojiMeaning.length >= 10) {
            // Disable all text boxes and buttons
            const inputs = document.querySelectorAll('input, button');
            inputs.forEach(input => {
                input.disabled = true;
            });
 
    
            // Make a POST request to Flask server to add the emoji
            fetch('/add_emoji', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emoji: emoji,
                    emojiName: emojiName,
                    emojiMeaning: emojiMeaning
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.text(); // Return the response text
                } else {
                    throw new Error('Error adding emoji');
                }
            })
            .then(data => {
                // This code will execute after the user clicks "OK" on the alert dialog
                alert('Emoji added successfully');
   
                // Enable all text boxes and buttons
                inputs.forEach(input => {
                    input.disabled = false;
                });
                addEmojiForm.style.display = 'none';
                backbtn.style.display = 'none';
                addEmojiBtn.style.display = 'block';
                addEmojiBtndiv.style.display='flex';
                main.style.display = 'block';
                // You can optionally display a success message here
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            if (!emoji || !emojiName) {
                alert('Emoji name and meaning are required');
            } else {
                alert('Emoji meaning should consist of at least 10 characters');
            }
            inputs.forEach(input => {
                input.disabled = false;
            });
        }
    });
    
    
});
