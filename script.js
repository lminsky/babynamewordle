//Get the search string
//If there is no search string, choose a random number
//Find the associated word
let search = parseInt(location.search.substring(1));
if(isNaN(search) || search > wordList.length) {
  // location.search = ""
  search = Math.floor(Math.random() * wordList.length);
}
let answer = wordList[search].toUpperCase();
// console.log(answer, search);
answer = "PENELOPE";


//Track what guess the player is on
//And what letter within the guess
//And which letters they've already guessed
let gameData = {
  letter: 0,
  letterStatus: {},
  guesses: [],
  status: 0 //0 is in progess, -1 is lost, 1 is won
}

let playerData;
if(playerData) {
  playerData = JSON.parse(playerData);
} else {
  playerData = {
    games: 0,
    wins: 0,
    losses: 0,
    distribution: [0,0,0,0,0,0]
  }
}

//Handle keyboard inputs
document.addEventListener('keydown',  function(e){
  let keyCode = e.keyCode;
  
  if(keyCode == 27) $(".stats").hide();
  
  let alt = event.getModifierState('Alt');
  let ctrl = event.getModifierState('Control');
  let meta = event.getModifierState('Meta');
  let os = event.getModifierState('OS');
  if(alt || ctrl || meta || os || gameData.status != 0) {
    return false;
  }
  
  if(keyCode >= 97 && keyCode <= 122 && gameData.letter < 8) addLetter(e.key.toUpperCase());
  if(keyCode >= 65 && keyCode <= 90 && gameData.letter < 8) addLetter(e.key.toUpperCase());
  if(keyCode == 8 && gameData.letter > 0) deleteLetter();
  if(keyCode == 13) validateWord();
});

//Handle On Screen Keyboard
$("key").click(function(e) {
  let val = $(e.target).attr("val");
  if(val == "DELETE" && gameData.letter > 0) deleteLetter();
  else if(val == "RETURN") validateWord();
  else addLetter(val);
});


function validateWord() {
  if(gameData.letter < 8) {
    toast("Not enough letters");
    return false;
  }
  // console.log("CHECK WORD");
  let word = $("word[num='" + gameData.guesses.length + "']");
  let letters = $("letter", word);
  let entry = "";
  letters.each(function() {
    entry += $( this ).text();
  });
  
  //Check if the word is in the list
  if(wordList.find(word => word.toUpperCase() == entry)) {
    // console.log("VALID WORD");
    if(gameData.guesses.length == 0) {
      playerData.games++;
    }
    gameData.guesses.push(entry);
    
    displayEntries();
    
    // gameData.word++;
    gameData.letter = 0;
    
    
    if(gameData.status == 1) {
      playerData.wins++;
      playerData.distribution[gameData.guesses.length-1]++;
      gameOver();
    } else if(gameData.guesses.length == 6) {
      gameData.status = -1;
      playerData.losses++;
      gameOver();
    }
    
  } else {
    toast("Not in name list");
    return false;
  }
  
}


//Deletes the last entered letter
function deleteLetter() {
  gameData.letter--;
  let word = $("word[num='" + gameData.guesses.length + "']");
  let letter = $("letter[num='" + gameData.letter + "']", word);
  letter.html("&nbsp;");
}

//Adds a new letter
function addLetter(entry) {
  if(entry.charAt(0) < 65 || entry.charAt(0) > 90 || entry.length > 1) return false;
  let word = $("word[num='" + gameData.guesses.length + "']");
  let letter = $("letter[num='" + gameData.letter + "']", word);
  letter.text(entry);
  gameData.letter++;
}

/*
Display a toast notification
*/
function toast(message) {
  let t = document.createElement("div");
  $(t).addClass("toast").text(message);
  $(".toasts").prepend(t);
  setTimeout(function() {
    $(t).remove();
  }, 2000)
}


/*
Tracks which letters have been tested
letter is the actual character
status is -1 if wrong, 1 if partial, 2 if perfect
*/
function foundLetter(letter, status) {
  if(gameData.letterStatus[letter.toUpperCase()] == null || status > gameData.letterStatus[letter.toUpperCase()]) {
    gameData.letterStatus[letter.toUpperCase()] = status;
  }
}

// TODO - handle loss
function gameOver() {
  $("#played").text(playerData.games);
  $("#won").text(Math.round((playerData.wins / playerData.games) * 100) + "%");
  $("#lost").text(Math.round((playerData.losses / playerData.games) * 100) + "%");
  $("#unfinished").text(Math.round(((playerData.games-playerData.wins-playerData.losses) / playerData.games) * 100) + "%");
  
  let maximum = Math.max(...playerData.distribution);
  
  for(let i = 0; i < playerData.distribution.length; i++) {
    let val = playerData.distribution[i]
    $("#" + (i+1)).text(val);
    if(val > 0) {
      let percent = Math.round(val/maximum*90);
      $("#" + (i+1)).css("width", percent + "%");
    }
  }
  
  if(gameData.status == -1) {
    $(".gameStatus").text("You Lose. The word was \"" + answer.toUpperCase() + "\"");
  }
  $("#" + (gameData.guesses.length)).addClass("perfect");
  
  $(".stats").show();
}

async function share() {
  let url = "https://wordler.glitch.me?" + search;
  let text = ""

  $("word").each(function() {
    let valid = false;
    $("letter", this).each(function() {
      let c = $(this).attr('class');
      if(c == "incorrect") text += "⬛";
      if(c == "partial") text += "🟨";
      if(c == "perfect") text += "🟩";
      if(c) valid = true;
    })
    if(valid) text += "\n"
  })
  // navigator.share(shareData);
  let shareData = {
    title: 'Wordler',
    text: text,
    url: url
  }
  
  try {
    await navigator.share(shareData)
  } catch(err) {
    navigator.clipboard.writeText(text + url);
    $("#share").text("Copied!");
  }
}


function displayEntries() {
  for(let w in gameData.guesses) {
    let entry = gameData.guesses[w];
    
    let entryStatus = [-1,-1,-1,-1,-1, -1, -1, -1];
    let answerArray = answer.split("");
    let entryArray = entry.split("");
    
    //Check for perfect
    let perfectCount = 0;
    for(let i in entryArray) {
      $("[num='" + i +"']", $("word[num='" + w + "']")).text(entryArray[i]);
      if(entryArray[i] == null) continue;
      if(answerArray[i] == entryArray[i]) {
        entryStatus[i] = 2;
        answerArray[i] = null;
        entryArray[i] = null;
        perfectCount++;
      }
    }
    if(perfectCount == 8) gameData.status = 1;
    
    //Check for wrong place
    for(let i in entryArray) {
      if(entryArray[i] == null) continue;
      for(let j in answerArray) {
        if(answerArray[j] == null) continue;
        if(entryArray[i] == answerArray[j]) {
          entryStatus[i] = 1;
          entryArray[i] = null;
          answerArray[j] = null;
        }
      }
    }
    
    //Update the keyboard status indicators
    for(let i in entryStatus) {
      foundLetter(entry.charAt(i), entryStatus[i]);
      let className = "incorrect";
      if(entryStatus[i] == 1) className = "partial";
      if(entryStatus[i] == 2) className = "perfect";
      $("[num='" + i +"']", $("word[num='" + w + "']")).addClass(className);
    }
  }
  
  //Update the on screen keyboard
  for(let i in gameData.letterStatus) {
    let status = gameData.letterStatus[i];
    if (status == -1) status = "incorrect";
    if (status == 1) status = "partial";
    if (status == 2) status = "perfect";
    $("key[val='" + i + "']").addClass(status);
  }
}

function newGame() {
  location.search = "";
}