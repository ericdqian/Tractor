var socket = io();

var hand1 = []; //spades
var hand2 = []; //hearts
var hand3 = []; //clubs
var hand4 = []; //diamonds
var trump = [];

var selected = new Map;
var possibleDeclareSuits = new Map;
var stringToCard = new Map;
var numToSuit = new Map([[1, 'spades'], [2, 'hearts'], [3, 'clubs'], [4, 'diamonds']]);

function renderHandDealing(data) { //data = [cards (as objects), trump suit, trump number]

  console.log('rendering hand');
  hand1 = []; //spades
  hand2 = []; //hearts
  hand3 = []; //clubs
  hand4 = []; //diamonds
  trump = [];
  cards = data[0];
  console.log(data[0], data[1], data[2]);
  for(var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var suit = card.suit;
    var value = card.value;
    if(suit == data[1] || value == data[2] || suit == 'T') {
      if(value == data[2]) {
        if(suit == data[1]) {
          card.power = 16;
        }
        else {
          card.power = 15;
        }
      }
      trump.push(card);   
    }
    else if(suit == 1){
      hand1.push(card);
    }
    else if(suit == 2){
      hand2.push(card);
    }
    else if(suit == 3){
      hand3.push(card);
    }
    else{
      hand4.push(card);
    }
    
  }
  trump.sort(function(a, b){return a.power - b.power});
  hand1.sort(function(a, b){return a.power - b.power});
  hand2.sort(function(a, b){return a.power - b.power});
  hand3.sort(function(a, b){return a.power - b.power});
  hand4.sort(function(a, b){return a.power - b.power});
  var spadesDiv = document.getElementById('spadesDiv');
  var heartsDiv = document.getElementById('heartsDiv');
  var clubsDiv = document.getElementById('clubsDiv');
  var diamondsDiv = document.getElementById('diamondsDiv');
  var trumpDiv = document.getElementById('trumpDiv');
  renderSuit(hand1, spadesDiv);
  renderSuit(hand2, heartsDiv);
  renderSuit(hand3, clubsDiv);
  renderSuit(hand4, diamondsDiv);
  renderSuit(trump, trumpDiv);

  console.log(hand1, hand2, hand3, hand4, trump);
};

function renderSuit(cards, div) {
	while (div.firstChild) {
		div.removeChild(div.firstChild);
	}
	for(var i = 0; i < cards.length; i++) {
		var newCard = document.createElement('img');
		newCard.setAttribute('style', 'width:80px; height:80px');
		//images from https://code.google.com/archive/p/vector-playing-cards/downloads
		newCard.setAttribute('src', '/static/images/cards/' + cards[i].value.toString() + '-' + cards[i].suit.toString() + '.png');
		newCard.setAttribute('id', cards[i].value.toString() + '-' + cards[i].suit.toString() + '-' + cards[i].deck.toString());
		newCard.addEventListener('click', function() {
			
			if (selected.get(this.id)) {
				selected.delete(this.id);
				this.style.border = '0px';
        console.log(selected);
				// console.log('changing to unbordered');
			}
			else {
				selected.set(this.id, true) ;
        console.log(selected);
				this.style.border = '1px';
				this.style.borderColor = 'black';
				this.style.borderStyle = 'solid';
        console.log(selected);
				// console.log('changing to bordered');
			}
		});
		stringToCard.set(cards[i].value.toString() + '-' + cards[i].suit.toString() + '-' + cards[i].deck.toString(), cards[i]);
		div.append(newCard); 
	}
}

function renderDeclareButton(suit) {
  var declareDiv = document.getElementById('declareInfo');
  var suitButton = document.createElement('BUTTON');
  suitButton.setAttribute('id', suit.toString() + '-' + numToSuit.get(suit));
  suitButton.innerHTML = numToSuit.get(suit);
  suitButton.addEventListener('click', function() {
    suit = parseInt(this.id[0]);
    // console.log('declaring, suits look like', possibleDeclareSuits);
    socket.emit('declare', [suit, possibleDeclareSuits.get(suit)]);
  })
  declareDiv.append(suitButton);
}

document.getElementById('createButton').addEventListener('click', function(){
  var IdDiv = document.getElementById('inputBox');
  var gameId = IdDiv.value;
  console.log('clicked create button');
  socket.emit('create game', gameId);
});

document.getElementById('joinButton').addEventListener('click', function(){
  var IdDiv = document.getElementById('inputBox');
  var gameId = IdDiv.value;
  console.log('clicked join button');
    socket.emit('join game', gameId);
});

document.getElementById('playButton').addEventListener('click', function() {
  console.log('clicked play button');
  var toPlay = [];
  for(var [k, v] of selected) {
    console.log(k, v)
    toPlay.push(k);
  }
  socket.emit('play', toPlay);
});

socket.on('played', function(data) {
	console.log('legal move!', data);
  selected = new Map;
  for(var i = 0; i < data.length; i++) {
    var card = document.getElementById(data[i]);
    card.parentNode.removeChild(card);
  }
  // renderHandDealing(data);

})

socket.on('game created', function(data){
  var playerInfoDiv = document.getElementById('playerInfo');
  playerInfoDiv.innerHTML = 'Player 1';
});

socket.on('game joined', function(data){
  var playerInfoDiv = document.getElementById('playerInfo');
  playerInfoDiv.innerHTML = 'Player ' + data[1].toString();
});

socket.on('invalid id', function(data){
  console.log('invalid id!');
  console.log(data);
});

socket.on('already used id', function(data){
  console.log('id already in use!');
  console.log(data);
});

socket.on('game already joined', function(data){
  console.log('already in this game!');
  console.log(data);
});

socket.on('game initializing', function(data){
  // console.log('game init!');
  hand1 = []; //spades
  hand2 = []; //hearts
  hand3 = []; //clubs
  hand4 = []; //diamonds
  trump = [];

});

socket.on('trump declared dealing', function(data) {// data = [trump suit, declaring player, number of cards that were declared]
  console.log('trump num', data[2]);
  var trumpDiv = document.getElementById('trump');
  trumpDiv.innerHTML = numToSuit.get(data[0]) + ' declared by Player ' + data[1].toString();
  declareDiv = document.getElementById('declareInfo');
  while (declareDiv.firstChild) {
    declareDiv.removeChild(declareDiv.firstChild);
  }
  for(var [suit, num] of possibleDeclareSuits) {
    if(num > data[2]) {
      renderDeclareButton(suit);
    }
  }

})

socket.on('deal card', function(data) {//data: [new card (object), player level, number of cards that were declared]
  console.log('trump num delcared', data[2]);
  console.log('dict', possibleDeclareSuits);
  var card = data[0];
  var suit = card.suit;
  var value = card.value;
  // console.log('comparisoins', value, data[1], value == data[1]);
  if(value == data[1] || suit == 'T') {
    if(value == data[1]) {
      if(!possibleDeclareSuits.has(suit)) {
        possibleDeclareSuits.set(suit, 1);
        if(1 > data[2]) {
          renderDeclareButton(suit);
        }
      }
      else {
        possibleDeclareSuits.set(suit, possibleDeclareSuits.get(suit) + 1);
        // console.log('just updated', possibleDeclareSuits);
        if(possibleDeclareSuits.get(suit) > data[2] &&  possibleDeclareSuits.get(suit) - 1 <= data[2]) {
          renderDeclareButton(suit);
        }
      }
      
    }
    trump.push(card);
    trump.sort(function(a, b){return a.power - b.power});
    // console.log('trump looks like', trump);
    var trumpDiv = document.getElementById('trumpDiv');
    renderSuit(trump, trumpDiv)
  }
  else if(suit == 1){
    hand1.push(card);
    hand1.sort(function(a, b){return a.power - b.power});
    var spadesDiv = document.getElementById('spadesDiv');
    renderSuit(hand1, spadesDiv)
  }
  else if(suit == 2){
    hand2.push(card);
    hand2.sort(function(a, b){return a.power - b.power});
    var heartsDiv = document.getElementById('heartsDiv');
    renderSuit(hand2, heartsDiv)
  }
  else if(suit == 3){
    hand3.push(card);
    hand3.sort(function(a, b){return a.power - b.power});
    var clubsDiv = document.getElementById('clubsDiv');
    renderSuit(hand3, clubsDiv)
  }
  else{
    hand4.push(card);
    hand4.sort(function(a, b){return a.power - b.power});
    var diamondsDiv = document.getElementById('diamondsDiv');
    renderSuit(hand4, diamondsDiv)
  }
  // renderHandDealing(data);
});

socket.on('cards dealt', function(data) {
  console.log('all dealt!');
});

socket.on('time', function(time) {
  var timeDiv = document.getElementById('time');
  timeDiv.innerHTML = 'Time: ' + time.toString();
});

socket.on('turn', function(turn) {
  var turnDiv = document.getElementById('turn');
  var timeDiv = document.getElementById('time');
  timeDiv.innerHTML = 'Time: 0' ;
  turnDiv.innerHTML = 'it is player ' + turn.toString() +  ' turn';
});

socket.on('finalize hand', function(data) {
	selected = new Map;
  if(data[4]) {
    makePoints(data);
  }

  renderHandDealing(data);
});

function makePoints(data) {
  var pointsDiv = document.getElementById('points');
  for(i = 1; i < data[3] + 1; i++) {
    var newPlayerPoints = document.createElement('div');
    newPlayerPoints.setAttribute('id', i.toString());
    newPlayerPoints.innerHTML = 'Player ' + i.toString() + ': 0';
    pointsDiv.append(newPlayerPoints);
  }
}

socket.on('choosing bottom', function(data) {
  var declareDiv = document.getElementById('declareInfo');
  declareDiv.style.display = 'none';
})

socket.on('bottom', function(data) {
  console.log('getting bottom');
  // console.log(bottom);
  var bottomDiv = document.getElementById('bottomDiv');
  var gameInfoDiv = document.getElementById('gameInfo');
  var returnButton = document.createElement('BUTTON');
  returnButton.setAttribute('id', 'returnButton');
  returnButton.innerHTML = 'Discard';
  returnButton.addEventListener('click', function() {
    var toDiscard = [];
    for(var [k, v] of selected) {
      console.log(k, v)
      toDiscard.push(k);
    console.log('what is being returned', toDiscard);
    socket.emit('return bottom', toDiscard);
    // this.style.display = 'none';
  }
  })
  gameInfoDiv.append(returnButton);
  renderHandDealing(data);
})

socket.on('play beginning', function() {
  var returnButton = document.getElementById('returnButton');
  returnButton.style.display = 'none';
  selected = new Map;
})

socket.on('round summary', function(data) {
  console.log(data);
  for(i = 1; i < data.length; i++) {
    var playerPointsDiv = document.getElementById(i.toString());
    playerPointsDiv.innerHTML = 'Player ' + i.toString() + ':' + data[i];
  }
})


socket.on('test', function(data) {
  console.log(data);
})
