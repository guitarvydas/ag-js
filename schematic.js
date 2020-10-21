function SchematicComponent () {
    this.isSchematic = true; 
    this.inputQueue = []; 
    this.isBusy = function () { return this.parts.some(isBusy); };
    this.isReady = function () { 
	return ( 
	    (this.inputQueue.length > 0)
		&& (!this.isBusy())
	)};
    this.react = function (event) {
	var pin = event.pin;
	var data = event.data;
	var wire = kernel.findWire (this, this, pin);
	wire.deliver (data);	  
    };
    this.hasInputs = function () {
	return (0 < this.inputQueue.length) || 
	    this.parts.some(child => { return child.hasInputs() });
    };
    this.consumeOneEventIfReady = function () {
	this.parts.forEach(p => p.consumeOneEventIfReady());
	if (this.isReady()) {
	    var event = this.inputQueue.pop ();
	    this.react (event);
	}
    };

    this.parts = [];  // initialized by programmer
    this.initializeParts = function (arr) { // called by programmer with an array of parts
	arr.forEach (part => { part.parent = this; });
	this.parts = arr;
    };

    this.wires = [];  // initialized by programmer
    this.initializeWires = function (arr) { // called by programmer with an array of wires
	this.wires = arr;
    };
};
