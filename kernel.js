function Wire () {
    var receivers = new ReceiversCollection (this);
    var dataList = new DataQueue (this);
    function installReceiver (part, inputPin, outputPin) { receivers.push ( {isNC=false, part, inputPin, outputPin} )};
    function installNC (senderPart, senderOutputPin) { receivers.push ( {isNC= true, senderPart, null, senderPin} )};
    function deliver () {
	dataList.foreachDequeue ( 
	    (d) => {
		this.receivers.foreach(lock); // masking interrupts or turning off full-preemption would have the same effect
		this.receivers.foreach( 
		    (r) => {
			if (r.isNC) {
			    if (r.part.hasParent () ) {
				// ignore event
			    } else {
			    // top-level has no parent - log event
				console.log (r.part.name + " outputs " + data + " on pin " + r.outputPin);
			    } else if (r.inputPin) {
				r.part.enqueueInput (r.inputPin, data);
			    } else {
				r.part.enqueueOutput (r.outputPin, data);
			    }
			}
		    })
	    });
	this.receivers.foreach(unlock);
    };
}

function Dispatcher () {
    var allParts = new PartsCollection ("_dispatcher_parts_");
    function installPart (part) { this.allParts.add (part); };
    function inject (part, pin, data) { // inject data event from the outside - need to remember to (re)start the Dispatcher
	this.allParts.ensureContains (part);
	part.enqueueInput ({pin, data});
    };
    function run () {
	var keepLooping = true;
	while (keepLooping) {
	    keepLooping = false;
	    this.allParts.foreach ( (part) => {
		if ( part.isReady() ) {
		    keepLooping = true;
		    var e = part.dequeueInput ();
		    part.react (e);
		}
	    } );
	    this.distributeAllOutputEvents ();
	}
    }
    function distributeAllOutputEvents () {
	this.allParts.foreach ( (part) => this.distributeOutputs (part) );
    }
    function distributeOutputs (part) {
	this.allParts.foreach ( 
	    (part) => {
		part.outputCollection.foreach(deliver);
		part.outputCollection.reset ();
	    }
	)
    }
}

dispatcher = new Dispatcher();

function Schematic (parent, nameInParent) {
    var parent = parent;
    var name = nameInParent;
    var inputQueue = new InputQueue (this);
    var outputCollection = new OutputCollection (this);
    var parts = new PartsCollection (this);
    var isSchematic = true;

    function isBusy () { return parts.every( (p) => { p.isNotBusy () }); };
    function isNotBusy () { return ! this.isBusy (); };
    function isReady () { return ( (0 < this.inputQueuelength) && this.isNotBusy ()); };
    function installPart (p) { parts.push (p); };
    function installWire (wire) {
	wire.foreach ( 
	    (w) => {
		w.senders.foreach ( (part) => { this.parts.mustContain (part) } );
		w.receivers.foreach ( (part) => { this.parts.mustContain (part) } );
	    }
	);
	wires.add (wire);
    };
    function initialize () {
	parts.foreach ( (part) => part.initialize ());
	parts.foreach ( (part) => dispatcher.InstallPart (part) );
    }
}

function Leaf (parent, nameInParent reactorFunction) {
    var parent = parent;
    var name = nameInParent;
    var inputQueue = new InputQueue (this);
    var outputCollection = new OutputCollection (this);
    var isSchematic = false;
    function isBusy () { return false; }
    function isNotBusy () { return ! this.isBusy (); },
    function isReady () { return ( (0 < this.inputQueueLength()) && this.isNotBusy ()); };
    var reactor = reactorFunction;
    function react (event) { this.reactor (event); }
    function initialize () {};
}

function PartsCollection (owner) = {
    var owner = owner;
    var collection = [];
    function ensureContains (part) {
	if (collection.includes (part) {
	} else{
	    throw "Parts collection of " + owner.name " does not contain the part " + part.name;
	}
    };
    function add (part) {
	this.collection.push (part);
    };
    function foreach (func) {
	this.collection.foreach (func);
    };
}

function InputQueue (owner) = {
    var owner = owner;
    var q = [];
    function inputQueueLength () { return this.q.length; }
    function dequeueInput () { return this.q.shift(); }
    function enqueueInput (x) { this.q.push(x); }
}
    
function OutputCollection (owner) = {
    var owner = owner;
    var collection = [];
    function foreach (func) { collection.foreach (func); };
    function reset () { collection = []; };
}
