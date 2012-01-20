
function LinkedListObject(){
	
	function LinkedListNode() {
		this.data = null;
		this.next = null;
	}

	this.firstNode = null;
	this.lastNode = null;
	this.size = 0;

	this.add = function(data) {
		console.log("add");
		console.log("data");
		console.log(data);
		var newNode = new LinkedListNode();
		newNode.data = data;
		
		if (this.firstNode == null) {
			this.firstNode = newNode;
			this.lastNode = newNode;
		}
		else {
			console.log("lastNode next: ");
			console.log(this.lastNode);
			this.lastNode.next = newNode;
			this.lastNode = newNode;
		}
		console.log("lastNode: ");
		console.log(this.lastNode);
		this.size++;
	};

	this.remove = function(data) {
		console.log("remove");
		var currentNode = this.firstNode;

		if (this.size == 0) {
			return;
		}

		var wasDeleted = false;

		/* Are we deleting the first node? */
		if (data == currentNode.data) {
			/* Only one node in list, be careful! */
			if (currentNode.next == null) {
				this.firstNode.data = null;
				this.firstNode = null;
				this.lastNode = null;
				this.size--;
				return;
			}

			currentNode.data = null;
			currentNode = currentNode.next;
			this.firstNode = currentNode;
			this.size--;
			return;
		}

		while (true) {
			/* If end of list, stop */
			if (currentNode == null) {
				wasDeleted = false;
				break;
			}

			/* Check if the data of the next is what we're looking for */
			var nextNode = currentNode.next;
			if (nextNode != null) {
				if (data == nextNode.data) {

					/* Found the right one, loop around the node */
					var nextNextNode = nextNode.next;
					currentNode.next = nextNextNode;

					nextNode = null;
					wasDeleted = true;
					break;
				}
			}

			currentNode = currentNode.next;
			this.lastNode = currentNode;
		}

		if (wasDeleted) {
			this.size--;
		}
	};

	/**
	 * 
	 * returns the element at index in the list 
	 * (removes it from the list)
	 * 
	 */
	this.popFromIndex = function(index) {
		console.log("Popfromn index");
		if (isNaN(index) || this.size==0) return false;
		var currentNode = this.firstNode;
		//are we removing first node?
		if (index===0) {
			var data = currentNode.data;
			/* Only one node in list, be careful! */
			if (currentNode.next == null) {
				this.firstNode.data = null;
				this.firstNode = null;
				this.lastNode = null;
				this.size--;
				return data;
			}
			currentNode.data = null;
			currentNode = currentNode.next;
			this.firstNode = currentNode;
			this.size--;
			return data;
		}
		var beforeIndex = (index>0)? index - 1 : 0;
		if (beforeIndex>52 || beforeIndex < 0) return false; //sanity check for infinite loops
		for (var i=0;i<beforeIndex;i++){
			//loop up to object one before the index we want
			currentNode = currentNode.next;
		}
		// next node is the one we want to get
		var nextNode = currentNode.next;
		// save the data so we can return it
		var data = nextNode.data;
		// get the following node
		var nextNextNode = nextNode.next;
		if (nextNextNode!=null) { // if we are not at the end of the list
			// join the following node to the current node
			currentNode.next = nextNextNode;
		}
		// delete the data  
		nextNode = null;
		// adjust the size 
		this.size--;
		// return
		return data;
	};
	
	/**
	 * 
	 * returns the element at index in the list 
	 * (does not remove it from the list)
	 * 
	 */
	this.getIndex = function(index) {
		if (isNaN(index) || this.size==0) return false;
		var currentNode = this.firstNode;
		//are we removing first node?
		if (index===0) {
			var data = currentNode.data;
			/* Only one node in list, be careful! */
			if (currentNode.next == null) {
				return data;
			}
			return data;
		}
		var beforeIndex = (index>0)? index - 1 : 0;
		if (beforeIndex>52 || beforeIndex < 0) return false; //sanity check for infinite loops
		for (var i=0;i<beforeIndex;i++){
			//loop up to object one before the index we want
			currentNode = currentNode.next;
		}
		// next node is the one we want to get
		var nextNode = currentNode.next;
		// save the data so we can return it
		var data = nextNode.data;
		// return
		return data;
	};
	
	/**
	 * return the last element in the linkedlist
	 * (does not remove it )
	 */
	this.getLast = function () {
		return this.getIndex(this.size - 1);
	};
	
	this.getSize = function() {
		return this.size;
	};

	this.indexOf = function(data) {
		var currentNode = this.firstNode;
		var position = 0;
		var found = false;

		for (; ; position++) {
			if (currentNode == null) {
				break;
			}

			if (data == currentNode.data) {
				found = true;
				break;
			}

			currentNode = currentNode.next;
		}

		if (!found) {
			position = -1;
		}

		return position;
	};
	
	this.toConsole = function() {
		console.trace();
		var currentNode = this.firstNode;
		console.log ("toConsole");
		for (i = 0; currentNode != null; i++) {
			console.log(currentNode);
			currentNode=currentNode.next;
		}
		console.log ("**last node:");
		console.log (this.lastNode);
		console.log ("size: " + this.getSize());
	};
	
	this.toString = function() {
		var currentNode = this.firstNode;

		result = '{';

		for (i = 0; currentNode != null; i++) {
			if (i > 0) {
				result += ',';
			}
			var dataObject = currentNode.data;

			result += (dataObject == null ? '' : dataObject);
			currentNode = currentNode.next;
		}
		result += '}';

		return result;
	};
};
