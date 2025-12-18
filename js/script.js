import { finnish } from './languages/words-fi.js';
import { english } from './languages/words-en.js';
import { javascriptWords } from './languages/words-javascript.js';

// list of different game languages
const words = {
    english,
    finnish,
    javascriptWords
}

// Handles game language selection
document.getElementById("language-select").addEventListener("change", (e) => {
    if (e.target.value === "en") currentLanguage = "english"
    if (e.target.value === "fi") currentLanguage = "finnish"
    if (e.target.value === "js") currentLanguage = "javascriptWords"
    console.log(currentLanguage)
    newGame();
})

// Handles game time setting
document.getElementById("time-select").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return; // Prevents errors if user clicks gaps

    // Update selected time
    selectedGametime = parseInt(btn.value, 10);
    gameTime = selectedGametime * 1000;

    // Update button "active" class
    document.querySelectorAll("#time-select .btn")
        .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    console.log("Selected game time", selectedGametime,"Game time in ms", gameTime);

    newGame(); // restart with new time
});

let currentLanguage = "english" // Default game language
let selectedGametime = 30 // Deafult game time
let gameTime = selectedGametime * 1000 // Gametime converted to milliseconds
let totalInputs = 0 // Number of keypresses during the game
let correctInputs = 0 // Number of correct keypresses during the game

window.timer = null
window.gameStart = null
window.pauseTime = 0

function addClass(element, name) {
    element.className += ' '+name
}

function removeClass(element, name) {
    element.className = element.className.replace(name, '')
}

// Takes the words and randomizes them 
function randomWord() {
    const list = words[currentLanguage]
    const randomIndex = Math.floor(Math.random() * list.length)
    return list[randomIndex]
}

function formatWord(word) {
    return `<div class="word"><span class="letter">${word.split('').join('</span><span class="letter">')}</span></div>`;
}

function newGame()  {
    document.getElementById('words').innerHTML = '';
    for (let i = 0; i < 200; i++) {
        document.getElementById('words').innerHTML += formatWord(randomWord());
    }
    addClass(document.querySelector('.word'), 'current');
    addClass(document.querySelector('.letter'), 'current');
    document.getElementById('info').innerHTML = (gameTime / 1000) + ''
    // reset timers and state
    clearInterval(window.timer)
    window.timer = null
    window.gameStart = null
    window.pauseTime = 0
 
    totalInputs = 0 // Reset accuracy tracking
    correctInputs = 0 // Reset accuracy tracking

    // ensure game element is focusable and focused so key events fire
    const gameEl = document.getElementById('game')
    if (gameEl) {
        gameEl.className = gameEl.className.replace('over', '')
        gameEl.setAttribute('tabindex', '0')
        gameEl.focus()
    }

    // reset any scroll/margin
    const wordsEl = document.getElementById('words')
    if (wordsEl) wordsEl.style.marginTop = '0px'

    // position the cursor immediately
    updateCursor()
}


function updateCursor() {
    const nextLetter = document.querySelector('.letter.current')
    const nextWord = document.querySelector('.word.current')
    const cursor = document.getElementById('cursor')
    const game = document.getElementById('game')
    if (!cursor || !game) return

    const target = nextLetter || nextWord
    if (!target) return

    const rect = target.getBoundingClientRect()
    const gameRect = game.getBoundingClientRect()

    // convert viewport coords → container coords
    const top = rect.top - gameRect.top
    const left = rect.left - gameRect.left

    cursor.style.top = (top + 2) + 'px'
    cursor.style.left = (nextLetter ? left : left + rect.width) + 'px'
}


function getWPM() {
    const words = [...document.querySelectorAll('.word')]
    const lastTypedWord = document.querySelector('.word.current')
    const lastTypedWordIndex = words.indexOf(lastTypedWord)
    const typedWords = words.slice(0,lastTypedWordIndex)
    const correctWords = typedWords.filter(word => {
        const letters = [...word.children]
        const incorrectLetters = letters.filter(letter => letter.className.includes('incorrect'))
        const correctLetters = letters.filter(letter => letter.className.includes('correct'))
        return incorrectLetters.length === 0 && correctLetters.length === letters.length
    })
    return correctWords.length / gameTime * 60000
}

function getAccuracy(){
    return Math.round((correctInputs / totalInputs) * 100)
}


function gameOver() {
    clearInterval(window.timer)
    addClass(document.getElementById('game'), 'over')
    const wpm = getWPM()
    const accuracy = getAccuracy()
    console.log("Total inputs: ", totalInputs, "Correct inputs:", correctInputs, "Accuracy:", accuracy, "%")
    document.getElementById('info').innerHTML = `Words per minute: ${getWPM(wpm)} | Accuracy: ${getAccuracy(accuracy)}%`
}

document.getElementById('game').addEventListener('keydown', event => {
    const key = event.key;
    const currentWord = document.querySelector('.word.current')
    const currentLetter = document.querySelector('.letter.current');
    const expected = currentLetter?.innerHTML || ' ';
    const isLetter = key.length === 1 && key !== ' ';
    const isSpace = key === ' '
    const isBackspace = key === 'Backspace'
    const isFirstletter = currentLetter === currentWord.firstChild

    if(document.querySelector('#game.over')) {
        return
    }

    if(!window.timer && isLetter) {
        window.timer = setInterval(() => {
            if(!window.gameStart) {
                window.gameStart = (new Date()).getTime()
            }
            const currentTime = (new Date()).getTime()
            const msPassed = currentTime - window.gameStart
            const sPassed = Math.round(msPassed / 1000)
            const sLeft = (gameTime / 1000) - sPassed 
            if (sLeft <= 0) {
                gameOver()
                return
            }
            document.getElementById('info').innerHTML = 'Time left: ' + sLeft + ' seconds'
        }, 1000)
    }

    if (isLetter) {
        totalInputs++; // For accuracy tracking

        if (currentLetter) {
            if (key === expected) {
                addClass(currentLetter, 'correct');
                correctInputs++ // For accuracy tracking
            } else {
                addClass(currentLetter, 'incorrect');
            }

            removeClass(currentLetter, 'current');

            if (currentLetter.nextSibling) {
                addClass(currentLetter.nextSibling, 'current');
            }
        } else {
            const incorrectLetter = document.createElement('span');
            incorrectLetter.innerHTML = key;
            incorrectLetter.className = 'letter incorrect extra';
            currentWord.appendChild(incorrectLetter);
        }
    }

    if(isSpace) {
        totalInputs++
        if(expected !== ' ') {
            const lettersToInvalidate = [...document.querySelectorAll('.word.current .letter:not(.correct)')]
            lettersToInvalidate.forEach(letter => {
                addClass(letter, 'incorrect')
                totalInputs++
            })
        }
        removeClass(currentWord, 'current')
        addClass(currentWord.nextSibling, 'current')
        correctInputs++
        if (currentLetter) {
            removeClass(currentLetter, 'current')
        }
        addClass(currentWord.nextSibling.firstChild, 'current')
    }

    if(isBackspace){
        // Prevent browser default (navigation) and ensure only one logical delete per key press
        event.preventDefault()

        // Helper to clear and set an element as current
        function setAsCurrent(el) {
            if (!el) return
            addClass(el, 'current')
            removeClass(el, 'incorrect')
            removeClass(el, 'correct')
        }

        // Single-responsibility backspace handling:
        // - If there's an `.extra` span immediately before the cursor (or at end), remove it.
        // - Otherwise move the cursor one letter left (and clear its correct/incorrect state).
        if (currentLetter) {
            // Cursor is on a letter inside the word
            const prev = currentLetter.previousSibling
            if (prev && prev.className && prev.className.includes('extra')) {
                // remove single extra char before cursor
                currentWord.removeChild(prev)
            } else if (prev) {
                // move cursor left into prev and clear markers
                removeClass(currentLetter, 'current')
                setAsCurrent(prev)
            } else {
                // at first letter: move to previous word
                const prevWord = currentWord.previousSibling
                if (prevWord) {
                    const prevLast = prevWord.lastChild
                    if (prevLast && prevLast.className && prevLast.className.includes('extra')) {
                        prevWord.removeChild(prevLast)
                    } else if (prevLast) {
                        removeClass(currentWord, 'current')
                        addClass(prevWord, 'current')
                        setAsCurrent(prevLast)
                    }
                }
            }
        } else {
            // No currentLetter: cursor is after the last character in the word
            const last = currentWord.lastChild
            if (last && last.className && last.className.includes('extra')) {
                currentWord.removeChild(last)
            } else if (last) {
                // select last as current
                setAsCurrent(last)
            } else if (currentWord.previousSibling) {
                // word is empty: jump to previous word
                removeClass(currentWord, 'current')
                addClass(currentWord.previousSibling, 'current')
                setAsCurrent(currentWord.previousSibling.lastChild)
            }
        }
    }

    console.log({ key, expected, totalInputs, correctInputs })
    //move lines/words

    const limit = window.innerHeight * 0.37; // 45% from top
    const scrollAmount = window.innerHeight * 0.03; // scroll 4% of screen height

    if (currentWord.getBoundingClientRect().top > limit) {
        const words = document.getElementById('words');
        const margin = parseFloat(words.style.marginTop || '0');
        words.style.marginTop = (margin - scrollAmount) + 'px';
    }

    // update cursor position
    updateCursor()
})



newGame();
window.newGame = newGame //Using window.newGame because using HTML onClick="", will change later