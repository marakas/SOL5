
(function() {
	
	// Set up our SVG graphics
	var paper = Raphael("gameTable",1000,600);
	// and draw our game table
	var table = paper.rect (10,10,980,580,15);//.attr({fill: "#006400"});

	/**
	 * The base card class
	 * @param suit - "h", "d", "c", "s"
	 * @param value - 1-10,j,k,q
	 */
	function Card (suit, value) {
		this.suit=suit;
		this.value=value;
		this.color="black";
		this._drag = false; // drag flag
		this._dbl = false; // dblclick flag
		this._width = 50;
		this._height = 80;
		this._origin_x = null; // remember origin position before drag 
		this._origin_y = null; // remember origin position before drag 
		this._cardImg = null; // pointer to this image object
		this._face = "down"; // remember which way this card is facing
		this._p = null; // pointer to paper object
		this._srcFaceUp = "cards_png/" + suit + value + ".png";; // src of face up card image 
		this._srcFaceDown = "cards_png/b1fv.png"; // src of face down card image
		
		var redList = ['d','h'];
		var blackList = ['c','s'];
		if (redList.arrIndex(this.suit)!=null) this.color="red";
	};
	
	/**
	 * Set the position of the Card on the table
	 * @param x
	 * @param y
	 */
	Card.prototype.position = function (x,y) {
		this._x = x;
		this._y = y;
	};
	
	/**
	 * Draw the Card image 
	 * @param p A pointer to Raphael paper object
	 * @returns {Boolean}
	 */
	Card.prototype.draw = function (p, face){
		if (this._x==undefined || this._y==undefined) return false;
		if (p==null) return false;
		if (face=="up") {
			//draw face up
			this._cardImg = p.image(this._srcFaceUp, this._x,this._y, this._width,this._height);
		} else {
			//draw face down
			this._cardImg = p.image(this._srcFaceDown, this._x,this._y, this._width,this._height);
		}
		// remember the way the card is facing
	    this._face = face;
	    // keep a pointer to the paper object
	    if (this._p==null)
	    	this._p = p;
	};
	
	Card.prototype.turnOver = function(){
		// clear the existing image
		this._cardImg.remove();
		// flip the face over
		if (this._face=="down") this._face="up";
		else this._face="down";
		//draw the new face
		this.draw(this._p, this._face);
	};
	
	/**
	 * Set a card drag+drop on/off
	 * @param status "on" /"off"
	 */
	Card.prototype.setDrag = function (status) {
		if (status=="on") {
			if (this._face=="up"){
				this.setDragOn();
				//if this is an ace, set up the send to pile function
				if (this.value=="1") {
					this.setSendToPile();
				}
			} else  
				this.setFlipOn();
		} else {
			this.setDragOff();
		}
	};
	
	/**
	 * setSendToPile - send "ace" to finish pile on double click 
	 */
	Card.prototype.setSendToPile = function () {
		var self = this;
		if (!self._dbl){
			this._cardImg.dblclick(function(){
				//tell the world 
				triggerEvent("sendToPile", {card:self});
			});
		}
		self._dbl = true;
	};
	
	/**
	 * setFlipOn allows a face-down card to be overturned by clicking
	 * 
	 */
	Card.prototype.setFlipOn = function () {
		var self = this;
		this._cardImg.click(function(){
			//flip the card
			self.turnOver();
			//remove this event handler
			self.setFlipOff();
			//tell the world 
			triggerEvent("cardFaceUp", {card:self});

		});
	};
	
	/**
	 * setFlipOff stops a card from being overturned by clicking
	 * 
	 */
	Card.prototype.setFlipOff = function () {
		this._cardImg.unclick ();
	};
	
	/**
	 * Set a card drag on
	 */
	Card.prototype.setDragOn = function () {
		var self=this;
		// clear any previous drag handler
		this.setDragOff();
		// set up the dragging functions
		var start = function () {
			// tell the world that we are starting to move
			triggerEvent("cardDragStart", {suit:self.suit,value:self.value});
			// need to move the card to top z-index
			this.toFront();
			// remember starting point incase we need to snap back
			self._origin_x = this.attr('x');
			self._origin_y = this.attr('y');
		},
		move = function (dx, dy) {
			// move the card position 
		    this.attr({x: (dx)+self._origin_x}); this.attr({y: (dy)+self._origin_y});
		    // get current boundary position of this card 
		    var bounds = this.getBBox();
		    // create data object with the suit and value
		    var data = {suit:self.suit,value:self.value, x:bounds.x,y:bounds.y, width:bounds.width, height:bounds.height};
		    // tell the world where we are now
			triggerEvent("cardDragMove", data);
		},
		up = function () {
			// get current boundary position of this card 
		    var bounds = this.getBBox();
		    // create data object with the suit and value
		    var data = {suit:self.suit,value:self.value, x:bounds.x,y:bounds.y, width:bounds.width, height:bounds.height, card:self};
		    // tell the world where we are now
			triggerEvent("cardDragFinish", data);
		};
		// add the drag handler 
		this._cardImg.drag(move, start, up);
		// set the flag
		this._drag = true;
	};
	
	/**
	 * Set a card drag off
	 */
	Card.prototype.setDragOff = function () {
		// check if there is an existing drag handler
		if (this._drag) {
			// turn off drag
			this._cardImg.undrag();
			// set the flag
			this._drag = false;
		}
	};
	
	/**
	 * isOver
	 * test if the boundary passed is over this card
	 * 
	 * @param bounds boundary 
	 */
	Card.prototype.isOver = function (bounds) {
		if (rectOverlap(this._cardImg.getBBox(),bounds)) {
			return true;
		} else return false;
				
		function valueInRange(value, min, max){
			return (value <= max) && (value >= min);
		}

		function rectOverlap(A, B){
			var xOverlap = valueInRange(A.x, B.x, B.x + B.width) ||
			valueInRange(B.x, A.x, A.x + A.width);
	
			var yOverlap = valueInRange(A.y, B.y, B.y + B.height) ||
			valueInRange(B.y, A.y, A.y + A.height);
	
			return xOverlap && yOverlap;
		}
	};
	
	/*
	 * glow
	 * add glow affect
	 *
	 * @param status on / off
	 */
	Card.prototype.glow = function (status) {
		if (status=="on") {
			// apply glow effect if it is not already applied
			if (!this.g) {
				this.g = this._cardImg.glow();
			}
		} else {
			// remove glow if we have it
			if (this.g){
				this.g.remove(); 
				delete this.g; 
			}
		}
	};
	/**
	 * Move card back to its original position before drag started
	 */
	Card.prototype.snapToStartPos = function () {
		// snap back to original position
		this._cardImg.attr({x: this._origin_x});
		this._cardImg.attr({y: this._origin_y});
		// also set the card x + y
		this._x = this.origin_x;
		this._y = this.origin_y;
		// move any cards on top of this one
		stacks.moveStack({'data':{	
			'suit': this.suit,
			'value' : this.value,
			'height': this._height, 
			'width' : this._width,
			'x' : this._x,
			'y' : this._y
		}});
	};
	
	/**
	 * Move card to position 
	 */
	Card.prototype.moveToPos = function (x,y) {
		// snap back to original position
		this._cardImg.attr({x: x});
		this._cardImg.attr({y: y});
		// also set the card x + y
		this._x = x;
		this._y = y;

	};
	
	
	
	/**
	 * Snap card to position above card
	 * 
	 * @param card to snap above
	 */
	Card.prototype.snapToCard = function (card) {
		var bounds = card._cardImg.getBBox();
		this._origin_x = bounds.x;
		this._origin_y = bounds.y + 15
		// snap back to original position
		this._cardImg.attr({x: this._origin_x});
		this._cardImg.attr({y: this._origin_y});
		// also set the card x + y
		this._x = this.origin_x;
		this._y = this.origin_y;
		
		// move any cards on top of this one
		stacks.moveStack({'data':{	
			'suit': this.suit,
			'value' : this.value,
			'height': this._height, 
			'width' : this._width,
			'x' : this.origin_x,
			'y' : this.origin_y
		}});
	};
	
	/**
	 * Check if the card is different color
	 * 
	 * @param card to compare
	 * @returns true if different or false if same
	 */
	Card.prototype.differentColor = function (card) {
		if (card.color != this.color) return true;
		return false;
	};
	
	/**
	 * Check if the card is the next in sequence
	 * 
	 * @param card to compare
	 * @returns true if next in sequence or false if not
	 */
	Card.prototype.nextInSequence = function (card) {
		var indexOfCard = deck._cards.arrIndex(card.value);
		var indexOfThis = deck._cards.arrIndex(this.value);
		if (indexOfCard + 1 == indexOfThis) return true;
		return false;
	};
	
	/**
	 * Check if the card can stack on top of the current card
	 * 
	 *  @param card to check 
	 *  @returns true / false
	 */
	Card.prototype.canStack = function (card) {
		return (this.isOver(card._cardImg.getBBox()) && this.differentColor(card) && this.nextInSequence(card));
	};
	
	/**
	 * Snap card to position
	 * 
	 * @position x/y position 
	 */
	Card.prototype.snapToPos = function (position) {
		this._origin_x = position.pos[0];
		this._origin_y = position.pos[1];
		// snap back to original position
		this._cardImg.attr({x: this._origin_x});
		this._cardImg.attr({y: this._origin_y});
		// also set the card x + y
		this._x = this.origin_x;
		this._y = this.origin_y;
	};
	
	// create the initial deck of cards for the game
	var deck = {
			//array of suits c-clubs, d-diamonds, h-hearts,s-spades
			_suits : ["c","d","h","s"],
			//master list of cards in a suit (j-jack, q-queen, k-king)
			_cards : [1,2,3,4,5,6,7,8,9,10,"j","q","k"],
			//array to hold our pack
			_pack : [],
			
			//init - create our pack
			init : function () {
				// we loop through each of our suits
				for (var i=0;i<this._suits.length;i++){
					// and through each card type in the _cards master list 
					for (var j=0;j<this._cards.length;j++) {
						// Create a new Card object - params are "suit" and "value"
						// and add it to the array
						this._pack.push(new Card(this._suits[i], this._cards[j]));	
					}
				}
			}, 
			//create a test pack based on input array
			testPack : function (cards) {
				// clear the pack
				this._pack = new Array();
				// we loop through each of the cards
				for (var i=0;i<cards.length;i++){
					this._pack.push(new Card(cards[i].suit, cards[i].value));
				}
			},
			/* 
			 * shuffle the pack by 
			 * swapping two random cards in the array 100 times
			 **/  
			shuffle : function (){
				if (this._suits.length==0) return false;
				for (var i=0;i<100;i++){
					// choose two cards at random
					var random1=Math.floor(Math.random()*this._pack.length);
					var random2=Math.floor(Math.random()*this._pack.length);
					// and swap them
					var temp = this._pack[random1];
					this._pack[random1]=this._pack[random2];
					this._pack[random2]=temp;
				}
				return true;
			},
	
			/*
			 * deal a card from the deck
			 * pop a card off the deck and return it
			 * always deals facedown
			 */
			dealCard : function (){
				return this._pack.pop();
			},
			getSize : function (){
				return this._pack.length;
			},
			toConsole : function (){
				console.log(this._pack);
			}
	};
	
	
	
	
	Array.prototype.arrIndex = function (value){
	// Returns the index of the value in the array
		var i;
		for (i=0; i < this.length; i++) {
			// use === to check for Matches. ie., identical (===),
			if (this[i] == value) {
				return i;
			}
		}
		return null;
	};
	
	/**
	 * The base for all Piles
	 */
	function Pile (){
		this._width = 50;
		this._height = 80;
	};
	/**
	 * Set the position of the Pile on the table
	 * @param x
	 * @param y
	 */
	Pile.prototype.position = function (x,y) {
		this._x = x;
		this._y = y;
	};
	
	/**
	 * Draw the Pile outline 
	 * @param p A pointer to Raphael paper object
	 * @returns {Boolean}
	 */
	Pile.prototype.draw = function (p){
		if (this._x==undefined || this._y==undefined) return false;
		if (p==null) return false;
		this._rect=p.rect (this._x,this._y, this._width,this._height).attr({
			// needs a fill or it wont get mouse events!
		    fill: "#fff"
		});;
	};
	
	/**
	 * Pile init 
	 * just create a linked list object
	 */
	Pile.prototype.init = function (){
		this._pile=new LinkedListObject();
	};
	
	/**
	 * Pile add
	 * Just add a card to the pile
	 * returns true or false
	 * @param card card object 
	 */
	Pile.prototype.add = function (card){
		this._pile.add(card);
		return true;
	};
	
	/**
	 * OrderedPile
	 * List of cards that is limited by sort_order
	 * extends Pile
	 */
	function OrderedPile (){};
	OrderedPile.prototype = new Pile();
	OrderedPile.prototype.sort_order = "asc"; // default to ascending order
	OrderedPile.prototype._master_order = null;
	OrderedPile.prototype._pile = null;
	
	/**
	 * OrderedPile init
	 * @param sort_order "asc" or "desc" 
	 * @param masterOrder _cards array from pack
	 */
	OrderedPile.prototype.init = function (sort_order, master_order){
		this.sort_order = (sort_order != undefined) ? sort_order : "asc"; // default to ascending order
		this._master_order = master_order;
		this._pile=new LinkedListObject();
	};
	
	/**
	 * OrderedPile add
	 * Add a card to the pile
	 * returns true or false
	 * @param card card object 
	 */
	OrderedPile.prototype.add = function (card){
		if (this._pile.getSize()==0) { //if its empty just add the card
			this._pile.add(card);
			return true;
		}
		var indexOfNew = this._master_order.arrIndex(card.value);
		var indexOfCurrent = this._master_order.arrIndex(this._pile.getLast().value);

		var toAdd = false; //default to no add
		if (this.sort_order=="asc"){//indexOfNew should be one before indexOfCurrent
			if (indexOfNew - 1 == indexOfCurrent) toAdd = true; 
		} else { // indexOfNew should be one after indexOfCurrent
			if (indexOfNew + 1 == indexOfCurrent) toAdd = true;
		}
		if (!toAdd) return false;
		this._pile.add(card);
		return true;
	};
	
	/**
	 * @returns size of pile
	 */
	OrderedPile.prototype.getSize = function (){
		return this._pile.getSize();
	};
	
	
	/**
	 * SuitOrderedPile
	 * List of cards that is limited by sort_order and Suit
	 * list must with card value of "1"
	 */
	var SuitOrderedPile = function(){};
	SuitOrderedPile.prototype = new OrderedPile();
	
	/**
	 * SuitOrderedPile init
	 * 
	 * @param sort_order
	 * @param masterOrder
	 * @param suit
	 */
	SuitOrderedPile.prototype.init = function (sort_order, masterOrder){
		OrderedPile.prototype.init.call (this, sort_order, masterOrder);
	};
	
	/**
	 * Add a card to the pile
	 * @param card
	 */
	SuitOrderedPile.prototype.add = function (card){
		// if there is no suit, set it 
		if (!this._suit) this._suit=card.suit;
		//check the suit
		if (card.suit!=this._suit) return false;
		//if pile is empty check the card value is "1"
		if (this._pile.getSize()==0) {
			if (card.value!=1) return false;
			else this._pile.add(card);
			return true;
		}
		//try to add it to the pile
		return OrderedPile.prototype.add.call (this, card);
	};
	
	
	/**
	 * AlternatingOrderedPile
	 * List of cards that is limited by sort_order and alternating black / red 
	 */
	var AlternatingOrderedPile = function(){};
	AlternatingOrderedPile.prototype = new OrderedPile();
	
	/**
	 * AlternatingOrderedPile init
	 * 
	 * @param sort_order
	 * @param masterOrder
	 */
	AlternatingOrderedPile.prototype.init = function (sort_order, masterOrder){
		this._redList = ['d','h'];
		this._blackList = ['c','s'];
		OrderedPile.prototype.init.call (this, sort_order, masterOrder);
	};
	
	/**
	 * Add a card to the pile
	 * @param card
	 */
	AlternatingOrderedPile.prototype.add = function (card){
		//check the color of the card being added
		var cardColor="black";
		if (this._redList.arrIndex(card.suit)!=null)
			cardColor="red";
		
		//if pile empty, add the card + remember the color
		if (this._pile.getSize()==0) {
			this._pile.add(card);
			this._currentColor=cardColor;
			return true;
		}
		
		//color needs to be alternate from current color
		if (this._currentColor==cardColor) return false;
		//try to add it to the pile
		if (OrderedPile.prototype.add.call (this, card)){
			//successfully added so remember the current color
			this._currentColor=cardColor;
			return true;
		} else return false;
	};
	
	/**
	 * Create an unordered pile for the face-down cards 
	 */
	function Stack(){
		//create a new local LinkedList for this instance
		this._stack = new LinkedListObject();
	};
	Stack.prototype = new Pile();
	Stack.prototype._stack = null;
	
	/**
	 * Expose the internal "add" function 
	 * @param value
	 */
	Stack.prototype.add = function (value){
		this._stack.add(value);
	};
	
	/**
	 * retrieve last item in this pile
	 * @returns card
	 */
	Stack.prototype.getLast = function () {
		return this._stack.getLast();
	};
	
	/**
	 * removes item from this pile
	 * @param card to remove
	 */
	Stack.prototype.remove = function (card) {
		this._stack.remove(card);
	};
	
	
	// create the stacks on the table of dealt cards
	// last stack will hold the remainder of the cards and will be used for the deal pile
	
	var stacks = {
			_maxStacks : 7, // will only have 7
			_stacks : null,
			_stackPositions : [], // set positions for each stack
			_stackLeft : 50, // X pos of the stacks
			_stackTop : 200, // topY pos of the stacks
			_cardOffsetLeft : 10, // Xoffset of each card in the stack ( to lay them out )
			_cardOffsetTop : 10, // Yoffset of each card in the stack ( to stagger them )
			_cardWidth : 50, // width of a card
			_topCards : null, // array to hold the top cards of each stack
			_faceUpCards : null, // array to hold all face-up cards ( these can all be dragged )
			_originalStack : null, // remember which stack the moving card came from
			_dealPileTop : 20, // ypos for dealpile
			_dealPileLeft : 350, // xpos for dealPile
			_dealPileIndex:7, // stack array index for our deal pile 
			
			init : function (){
				var self = this;
				// create an array to hold our stacks of cards on the table
				this._stacks = new Array(); 
				// set up the array to hold our top cards
				this._topCards = new Array();
				for (var i=0;i<this._maxStacks;i++){
					var x = this._maxStacks - i - 1;
					// find the left pos
					var xPos = self._stackLeft + (x * self._cardWidth) + (x * self._cardOffsetLeft);
					// create the position array
					var pos = {pos:[xPos,self._stackTop]};
					self._stackPositions[i]= pos;
					// add a list to each stack to hold the cards
					var stack = new Stack();
					// set the position of the stack
					stack.position(this._stackPositions[i].pos[0],this._stackPositions[i].pos[1]);
					// draw its outline to the screen
					stack.draw(paper);
					this._stacks.push(stack);
				}
				// add the dealPile
				var dealPile = new Stack();
				// set the position of the dealPile
				dealPile.position(this._dealPileLeft,this._dealPileTop);
				// draw its outline to the screen
				dealPile.draw(paper);
				// add it to our stack pile
				this._stacks.push(dealPile);
				
				// listen for any aces that are double clicked
				document.addEventListener("sendToPile",function(evt){
					for (var i=0;i<self._stacks.length;i++) {
						if (self._stacks[i].getLast()==evt.data.card) {
							//remove card from the stack
							self.remove(i,evt.data.card);
						}
					}
				});
			},

			deal : function (deck) {
				// go through our shuffled deck and fill up the stacks
				var size = deck.getSize();
				// need to know which stack to deal the card to
				var stack_pointer=this.getSize()-1 ; // we will start at the last stack and work our way down
				var maxDealRounds=this.getSize()-1;//need to limit the number of rounds we deal
				var i=0; // counter
				while (true){
					//deal a card from the deck 
					var card = deck.dealCard();
					//calculate its position
					var x = this._stackPositions[stack_pointer].pos[0]; //always same x as stack
					//y increases for each round dealt so it staggers
					var y = this._stackPositions[stack_pointer].pos[1] + (i*this._cardOffsetTop); // calculate offset for next cards 
					card.position (x,y);
					//always deal face down first ( we turn over top card later )
					card.draw(paper,"down");
					//and add it to the stack pointed to by stack_pointer
					this.add(stack_pointer,card);
					// if we reach the first stack we want to do another round
					// each round will deal less cards so we end up with piles of 1,2,3,4,5,6,7
					if (stack_pointer==0){
						i++; //keep count of rounds to calculate offsets
						maxDealRounds--;
						stack_pointer=maxDealRounds;
					} else {
						stack_pointer--;
					}
					if (maxDealRounds<0) break;
				}
				
				// deal one card to the deal pile
				var card = deck.dealCard();
				//calculate its position
				var x = this._dealPileLeft; //same as dealpile
				var y = this._dealPileTop; //same as dealpile
				console.log("deal pile pos: "  + this._dealPileLeft + " , " + this._dealPileTop);
				card.position (x,y);
				//always deal face down
				card.draw(paper,"down");
				//and add it to the dealPile stack
				this.add(this._dealPileIndex,card);
								
				//make list of all top cards on each stack
				this.makeTopList();
				// turn over the top card on each stack
				for (var i=0;i<this._topCards.length;i++){
					this._topCards[i].turnOver();
				}
				//make list of all face-up cards on each stack
				this.makeFaceUpList();
				//listen for any over turned cards
				this.setOverTurnListener();
				// enable the dragging on top cards
				this.setDrag();
				// start listening for drag events
				this.setCardStartListener();
				this.setCardMoveListener();
				this.setCardFinishListener();
			},
			//add card to stack
			add : function (stack_pointer, card){
				if (this._stacks[stack_pointer]!=undefined && card!=undefined)
					this._stacks[stack_pointer].add(card);
			},
			//remove card from stack
			remove : function (stack_pointer, card){
				if (this._stacks[stack_pointer]!=undefined && card!=undefined)
					this._stacks[stack_pointer].remove(card);
			},
			getLast : function (stack_pointer){
				if (this._stacks[stack_pointer]!=undefined)
					return this._stacks[stack_pointer].getLast();
			},
			getSize : function () {
				return this._stacks.length - 1 ; // -1 to ignore the dealpile
			},
			makeTopList : function () {
				// loop through each stack
				// +1 for the dealpile
				for (var i=0;i<this._maxStacks + 1;i++){
					// get top card on the stack ( last in the array )
					var card = this.getLast(i);
					// add to top card list
					if (card) this._topCards[i] = card;
					else this._topCards[i]=null; //empty stack
				}
			},
			makeFaceUpList : function () {
				//clear the faceUp array
				this._faceUpCards = new Array();
				// loop through each stack + 1 for the dealpile
				for (var i=0;i<this._maxStacks+1;i++){
					// make sub array for this stack
					var subArray = new Array();
					// go through each card in the current stack
					for (var j=0;j<this._stacks[i]._stack.getSize();j++){
						// add faceup cards to the face up array
						if (this._stacks[i]._stack.getIndex(j)._face=="up") subArray.push(this._stacks[i]._stack.getIndex(j)); 
					}
					// add subArray to faceupcards
					this._faceUpCards[i] = subArray;
				}
			},
			// make the stack ready for dragging
			setDrag : function (){
				// all top cards can drag
				for (var i=0;i<this._topCards.length;i++){
					if(this._topCards[i]) this._topCards[i].setDrag("on");
				}
				// and all face up cards can drag (may include duplicates from top cards as well)
				for (var i=0;i<this._faceUpCards.length;i++){
					for (var j=0;j<this._faceUpCards[i].length;j++){
						if(this._faceUpCards[i][j]) this._faceUpCards[i][j].setDrag("on");
					}
				}
			},
			// listen for cards that are flipped over
			setOverTurnListener : function () {
				var self = this;
				document.addEventListener("cardFaceUp",function(evt){
					//reset the stacks
					self.resetStacks();
				},false);
			},
			
			//set up listener for when a card starts to be dragged
			setCardStartListener : function () {
				var self = this;
				document.addEventListener("cardDragStart",function(evt){
					for (var i=0;i<self._faceUpCards.length;i++){
						//skip an empty stack
						if (!self._faceUpCards[i]) continue;
						for (var j=0;j<self._faceUpCards[i].length;j++){
							//stop all cards from being dragged except for the one that triggered this event
							if (self._faceUpCards[i][j].suit!=evt.data.suit || self._faceUpCards[i][j].value!=evt.data.value) {
								self._faceUpCards[i][j].setDrag("off");
							} else {
								// remember which stack the card came from
								self._originalStack = i;
							}
						}
					}
				},false);
				
			},
			// deal with when card is moving
			setCardMoveListener : function () {
				var self = this;
				//set up listener to track where a card is moving
				document.addEventListener("cardDragMove",function(evt){
					//clear glow effect from all top cards
					self.clearGlow();
					//set glow if card is hover over another one 
					for (var i=0;i<self._topCards.length;i++){
						//skip an empty stack
						if (!self._topCards[i]) continue;
						// ignore if this is the currently moving card
						if (evt.data.suit!=self._topCards[i].suit || evt.data.value!=self._topCards[i].value ) {
							// if it overlaps - get the card to glow
							if (self._topCards[i].isOver(evt.data)) {
								self._topCards[i].glow("on");
								// only want one card to glow
								break;
							}
						}
					}
					// move any cards that stack on top of the current moving one
					self.moveStack(evt);
				});
			},
			// deal with when card stops moving
			setCardFinishListener : function () {
				var self = this;
				//set up listener to track where a card is moving
				document.addEventListener("cardDragFinish",function(evt){
					//clear glow effect from all top cards
					self.clearGlow();
					// remember if we want to return to origin 
					var returnToOrigin = true;
					// check if card is hover over another one 
					for (var i=0;i<self._topCards.length;i++){
						var moveToStack = false;
						//only king can move to empty stack
						if (!self._topCards[i]) {
							if (evt.data.card.value=="k") {
								//move card to new stack
								moveToStack=true;
							} else {
								// skip anything else
								continue;
							}
						} else { //deal with non-empty stack
							// ignore if this is the currently moving card
							if (evt.data.card.suit!=self._topCards[i].suit || evt.data.card.value!=self._topCards[i].value ) {
								// if it overlaps + and is a different color snap to position in this pile
								if (self._topCards[i].canStack(evt.data.card)) {
									//move card to new stack
									moveToStack=true;
								}
							}
						}
						if (moveToStack) {
							//move card to new stack
							self.moveCardToStack(evt.data.card, i);
							//don't want to return to origin
							returnToOrigin = false;
							// only want to snap to one card
							break;
						}
					}
					// check if the card was overlaping any other card 
					if (returnToOrigin) {
						// snap back to original position
						evt.data.card.snapToStartPos();
					}
					
					//enable the dragging for all cards again
					self.setDrag();
					
				});
			},	
			
			
			/**
			 * Move cards stacked above the currently dragged card
			 * @param evt original drag event details
			 */
			moveStack : function (evt) {
				var list=this.getCardsOnTop(evt.data);
				for (var i=0;i<list.length;i++){
					// work out the new Y pos - how many cards above the original card are we * 10px 
					var newY = evt.data.y + ((i+1) * 15 ); 
					list[i]._cardImg.toFront(); // move card to the front
					list[i].moveToPos(evt.data.x, newY);
				}
			},
			
			/**
			 * Get list of cards stacked on top of another card
			 * @param card 
			 * @return array 
			 */
			getCardsOnTop : function (card) {
				// we dont do this for dealPile
				if (this._originalStack==this._dealPileIndex) return false; 
				//check if there are any cards stacked on top
				var origStack = this._stacks[this._originalStack]._stack;
				// prepare a return array
				var list = [];
				//loop through the stack that this card came from
				for (var i=0;i<origStack.getSize();i++){
					// check if this is the same card as we are dragging
					if (origStack.getIndex(i).suit==card.suit && origStack.getIndex(i).value==card.value) {
						//loop up to the end of the stack
						for (var j=i + 1; j<origStack.getSize();j++){
							// add card to the array
							list.push(origStack.getIndex(j));
						}
						// can exit the main loop now
						break;
					} 
				}
				return list;
			},
			
			/**
			 * Move card to new stack
			 * 
			 * @params card to move
			 * @params stack_pointer stack to move to
			 * 
			 **/
			moveCardToStack : function (card, stack_pointer) {
				// get list of cards on top of this one 
				var list = this.getCardsOnTop(card);
				//remove card from old stack
				this.remove(this._originalStack,card);
				//add card to new stack
				this.add(stack_pointer, card);
				//check if there is a card in the stack
				if (this._topCards[stack_pointer]){
					//snap card to current card on this stack
					card.snapToCard (this._topCards[stack_pointer]);
				} else {
					//snap card to base of this stack
					card.snapToPos (this._stackPositions[stack_pointer]);
				}
				
				// move any cards on top of this one
				for (var i=0;i<list.length;i++){
					// work out the new Y pos - how many cards above the original card are we * 10px 
					var newY = card._cardImg.attr('y') + ((i+1) * 15 );
					list[i]._cardImg.toFront(); // move card to the front
					list[i].moveToPos(card._cardImg.attr('x'), newY);
					//remove card from old stack list
					this.remove(this._originalStack,list[i]);
					//add card to new stack list
					this.add(stack_pointer, list[i]);
				}
				
				
				// reset the top cards list
				this.makeTopList();
				// and face up list
				this.makeFaceUpList();
			},
			
			/**
			 * Deal a card onto the deal pile
			 * 
			 * @params card to add
			 **/
			addToDealPile : function (card) {
				//add card to new stack
				this.add(this._dealPileIndex, card);
				// move the card image to the deal pile
				card.moveToPos (this._dealPileLeft, this._dealPileTop);
				// reset the top cards list
				this.makeTopList();
				// flip the card face up
				card.turnOver();	
				// and face up list
				this.makeFaceUpList();
				//set up the drag
				this.setDrag();
			},
			
			/**
			 * after any changes refresh the handlers for the stacks
			 */
			resetStacks : function (){
				//make the top list
				this.makeTopList();
				// and face up list
				this.makeFaceUpList();
				//set up the drag
				this.setDrag();
			},
			// remove glow effect from all top cards
			clearGlow : function () {
				//clear glow effect from all top cards
				for (var i=0;i<this._topCards.length;i++){
					if (this._topCards[i]) this._topCards[i].glow("off");
				}
			},
			toConsole : function (){
				console.log(this._stacks);
			}
	};
	
	
	
	
	
	
	// create the piles for our player to build their completed suits
	var piles = {
			_maxPiles:4,// will only have 4 for one deck
			_piles : null,// an array to hold our stacks of cards on the table
			_pilePositions : [], // set positions for each pile
			_pileTop : 20, // X pos of pile
			_pileLeft : 50, // Y pos of the first pile
			_pileOffsetLeft : 10, // Xoffset of each card in the pile ( to lay them out )
			_cardWidth : 50, // width of cards
			
			init : function (deck){
				var self = this;
				// create the array 
				this._piles = new Array();
				//fill it with empty lists
				for (var i=0;i<deck._suits.length;i++){
					// find x position for this pile
					var posX = this._pileLeft + (i * this._cardWidth) + (i * this._pileOffsetLeft);
					// set position for each pile
					var pos = {pos:[posX,this._pileTop]};
					this._pilePositions[i]=pos;
					// add a list to each pile to hold the cards
					var pile = new SuitOrderedPile();
					pile.init("asc", deck._cards, deck._suits[i]);
					pile.position(this._pilePositions[i].pos[0],this._pilePositions[i].pos[1]);
					pile.draw(paper);
					this._piles.push(pile);
				}
				// listen for any aces that are doubleclicked
				document.addEventListener("sendToPile",function(evt){
					// add to the next available pile
					self.add (self.getEmptyPile(), evt.data.card);
				});
			},
			
			/**
			 * add a card to a pile
			 * @param pile_pointer id of pile
			 * @param card
			 */
			add : function (pile_pointer, card){
				//add card to the pile list
				this._piles[pile_pointer].add(card);
				//move the card to the pile position
				card.snapToPos (this._pilePositions[pile_pointer]);
				// setup the stacks again
				stacks.resetStacks();
			},
			getPile : function (pile_pointer) {
				return this._piles[pile_pointer];
			},
			getSize : function () {
				return this._piles.length;
			},
			/**
			 * returns the next empty pile_pointer
			 * or false if there are non
			 */
			getEmptyPile : function (){
				for (var i=0;i<this._piles.length;i++){
					if (this._piles[i].getSize()==0) return i;
				}
				return null;
			},
			toConsole : function (){
				console.log(this._piles);
			}
	};
	
	
	
	// create the dealStack on the table of remaining cards
	var dealStack = {
			_stackLeft : 420, // X pos of the deal pile
			_stackTop : 20, // topY pos of the deal pile
			_cardWidth : 50, // width of a card
			_stack :null, // hold our stack 
			_topCard : null, // remember what card is on top of the pile
			
			init : function (deck){
				// add a list to each pile to hold the cards
				this._stack = new Stack();
				this._stack.position(this._stackLeft,this._stackTop);
				this._stack.draw(paper);
			},
			
			deal : function (deck) {
				// loop through all remaining cards in the deck
				while (deck.getSize()>0){
					//deal a card from the deck 
					var card = deck.dealCard();
					//calculate its position
					var x = this._stackLeft; //same as dealpile
					var y = this._stackTop; //same as dealpile 
					card.position (x,y);
					//always deal face down
					card.draw(paper,"down");
					//and add it to the pile
					this._stack.add(card);
					// remember this card - its on top now
					this._topCard = card;
				}

				// start listening for clicks
				this.setClickListener();
			},
			setClickListener : function (){
				// keep a reference to the pile
				var self=this;
				// if there is a card on the pile add handler
				if (this._topCard) {
					// add the click handler to the top card on the deck
					this._topCard._cardImg.click (function(){
						// send to the click handler with a reference to self
						self.clickHandler.apply(self);		
					});
				} else { 
					// add a click event to the empty deck - to refill
					this._stack._rect.click (function(){
						
					});
				}
			},
			
			/**
			 * handle clicks 
			 */
			clickHandler : function (){
				// remove the click listener
				this._topCard._cardImg.unclick();
				// remove the card from the pile
				this._stack.remove(this._topCard);
				// add to the deal pile
				stacks.addToDealPile(this._topCard);
				// set the new top card
				this._topCard=this._stack.getLast();
				this.setClickListener();
			},
			// make the top card ready for dragging
			setDrag : function (){
				this._topCard.setDrag("on");
			},
			toConsole : function (){
				console.log(this._stacks);
			}
	};
	
	
	
	/**
	 * triggerEvent
	 * creates and dispatches an event
	 * @param name name of even
	 * @param data json format data for event body
	 */
	function triggerEvent (name, data) {
		var evt = document.createEvent("Event");	
		evt.initEvent(name,true,true);
		if (data) evt.data = data;
		document.dispatchEvent(evt);
	}
	
	
	//make our deck for the game
	deck.init();
	//shuffle the cards
	//deck.shuffle();
	/*
	var cards = [
	             {suit:'c',value:'1'},{suit:'c',value:'2'},{suit:'c',value:'3'},{suit:'c',value:'4'},{suit:'c',value:'5'},{suit:'c',value:'6'},{suit:'c',value:'7'},
	             {suit:'c',value:'8'},{suit:'c',value:'9'},{suit:'c',value:'10'},{suit:'c',value:'j'},{suit:'c',value:'q'},{suit:'c',value:'k'},
	             {suit:'d',value:'1'},{suit:'d',value:'2'},{suit:'d',value:'3'},{suit:'d',value:'4'},{suit:'d',value:'5'},{suit:'d',value:'6'},{suit:'d',value:'7'},
	             {suit:'d',value:'8'},{suit:'d',value:'9'},{suit:'d',value:'10'},{suit:'d',value:'j'}
	             
	             						,{suit:'d',value:'q'}
	             						,{suit:'d',value:'k'}
	             					,{suit:'h',value:'1'}
	             						,{suit:'h',value:'2'}
	             					,{suit:'h',value:'3'}
	             				,{suit:'h',value:'4'}
	             						,{suit:'h',value:'5'}
	             					,{suit:'h',value:'6'}
	             				,{suit:'h',value:'7'}
	             			,{suit:'h',value:'8'}
	             						,{suit:'h',value:'9'}
	             					,{suit:'h',value:'10'}
	             				,{suit:'h',value:'j'}
	             			,{suit:'h',value:'q'}
	             		,{suit:'h',value:'k'}
	             						,{suit:'s',value:'1'}
	             					,{suit:'s',value:'2'}
	             				,{suit:'s',value:'3'}
	             			,{suit:'s',value:'4'}
	             		,{suit:'s',value:'5'}
	             	,{suit:'s',value:'6'}
	             						,{suit:'s',value:'7'}
	             					,{suit:'s',value:'8'}
	             				,{suit:'s',value:'9'}
	             			,{suit:'s',value:'10'}
	             		,{suit:'s',value:'j'}
	             	,{suit:'s',value:'q'}
	             ,{suit:'s',value:'k'}
	             ];*/
	
	/** 
	 * test array for "loading" the deck
	 */
	var cards = [
	             {suit:'d',value:'2'},{suit:'c',value:'2'},{suit:'h',value:'3'},{suit:'c',value:'4'},{suit:'c',value:'5'},{suit:'c',value:'6'},{suit:'c',value:'7'},
	             {suit:'c',value:'8'},{suit:'c',value:'9'},{suit:'c',value:'10'},{suit:'c',value:'j'},{suit:'c',value:'q'},{suit:'c',value:'k'},
	             {suit:'d',value:'q'},{suit:'d',value:'2'},{suit:'d',value:'3'},{suit:'d',value:'4'},{suit:'d',value:'5'},{suit:'d',value:'6'},{suit:'d',value:'7'},
	             {suit:'d',value:'8'},{suit:'d',value:'9'},{suit:'d',value:'10'},{suit:'d',value:'j'}
	             
	             						,{suit:'d',value:'k'}
	             						,{suit:'c',value:'1'}
	             					,{suit:'c',value:'3'}
	             						,{suit:'s',value:'3'}
	             					,{suit:'s',value:'3'}
	             				,{suit:'h',value:'4'}
	             						,{suit:'h',value:'5'}
	             					,{suit:'h',value:'6'}
	             				,{suit:'h',value:'7'}
	             			,{suit:'h',value:'8'}
	             						,{suit:'h',value:'9'}
	             					,{suit:'h',value:'10'}
	             				,{suit:'h',value:'j'}
	             			,{suit:'h',value:'q'}
	             		,{suit:'h',value:'k'}
	             						,{suit:'s',value:'1'}
	             					,{suit:'s',value:'2'}
	             				,{suit:'s',value:'3'}
	             			,{suit:'s',value:'4'}
	             		,{suit:'s',value:'5'}
	             	,{suit:'s',value:'6'}
	             						,{suit:'s',value:'7'}
	             					,{suit:'s',value:'8'}
	             				,{suit:'s',value:'9'}
	             			,{suit:'s',value:'10'}
	             		,{suit:'s',value:'j'}
	             	,{suit:'s',value:'q'}
	             ,{suit:'s',value:'k'}
	             ];
	
	deck.testPack(cards);
	
	//set up our stacks 
	stacks.init();
	//deal out cards to our stacks
	stacks.deal(deck);
	//set up piles for the player
	piles.init(deck);
	
	//set up the deal Stack 
	dealStack.init();
	//deal remaining cards to dealStack
	dealStack.deal(deck);
	

	
})();