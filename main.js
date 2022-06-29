(function() {
    var root = document.body

    var players = [];
    var trackShips = false;
    var syncShips = false;
    var MAX_SYSTEMS = {
    	"capital": 4,
    	"frigate": 3
    }

	function calculatePPA() {
		players.forEach(function (player){
			player.ppa = 5;
		})
			
		var playersSorted = [...players].sort(function (a,b){
			return b.tas - a.tas
		});
		var maxTas = parseInt(playersSorted[0].tas);
		var minTas = parseInt(playersSorted[playersSorted.length-1].tas);

		playersSorted.sort(function (a,b){
			return b.systems - a.systems
		});
		var maxSystems = parseInt(playersSorted[0].systems);
		var minSystems = parseInt(playersSorted[playersSorted.length-1].systems);

		players.forEach(function (player) {
			if (parseInt(player.tas) == maxTas) {
				player.ppa = player.ppa - 1;
			}
			if (parseInt(player.tas) == minTas) {
				player.ppa = player.ppa + 1;
			}
			if (parseInt(player.systems) == maxSystems) {
				player.ppa = player.ppa - 1;
			}
			if (parseInt(player.systems) == minSystems) {
				player.ppa = player.ppa + 1;
			}
		})
	}

	function PlayerComponent () {
		
		function changeName(player, newName) {
			player.name = newName;
		}
		function changeHva(player, newHva) {
			player.hva = parseInt(newHva);
			calculatePPA()
		}

		function changeTas(player, newTas) {
			player.tas = parseInt(newTas);
			calculatePPA()
		}

		function changeSystems(player, newSystems) {
			player.systems = parseInt(newSystems);
			calculatePPA()
		}

		return {	
			view: function(vnode) {
				var player = vnode.attrs.player;
				return m("div", {style: "display: flex; flex-direction: column; margin-left: 5px;"},
						m("input", {value: player.name ,oninput: function (e) { changeName(player, e.target.value); } }),
						m("input", {type: "number", min: 0, value: player.hva, oninput: function (e) { changeHva(player, e.target.value); } }),
						m("input", {type: "number", min: 0, disabled: syncShips, value: player.tas, oninput: function (e) { changeTas(player, e.target.value); } }),
						m("input", {type: "number", min: 0, disabled: syncShips, value: player.systems, oninput: function (e) { changeSystems(player, e.target.value); } }),
						m("span", player.ppa),
						m("span", player.ppa * ( player.hva + player.tas ) )
					)
			}
		}
	}

	function SystemComponent () {

		var secondSystem = false;

		function changeClass(system, newClass) {
			system.class = newClass;
		}

		function changeAttackType(system, newType) {
			system.attackType = newType;
		}

		function changeAttackType2(system, newType) {
			system.attackType2 = newType;
		}

		function flipSecondSystem(system) {
			secondSystem = !secondSystem;
			if(!secondSystem){
				delete system.attackType2
			}
		}

		return {
			view: function(vnode) {
				var system = vnode.attrs.system
				return [
							m("select", {value: system.class, oninput: function (e) { changeClass(system, e.target.value); } }, [
								m("option",{value: "attack"}, "Attack"),
								m("option",{value: "defence"}, "Defence"),
								m("option",{value: "sensor"}, "Sensors"),
								m("option",{value: "catapult"}, "Catapult"),
							]),
							system.class === "attack" ?
								[
									m("select", {value: system.attackType, oninput: function (e) { changeAttackType(system, e.target.value); } }, [
										m("option",{value: "p"}, "Point defence"),
										m("option",{value: "a"}, "Assault"),
										m("option",{value: "s"}, "Support"),
									]), 
									secondSystem ?
										m("select", {value: system.attackType2, oninput: function (e) { changeAttackType2(system, e.target.value); } }, [
											m("option",{value: "p"}, "Point defence"),
											m("option",{value: "a"}, "Assault"),
											m("option",{value: "s"}, "Support"),
										]) : null, 
									m("button",{onclick: function () {flipSecondSystem(system)} }, secondSystem ? "-" : "+")
								]
								: null
						]
			}
		}
	}

	function ShipComponent () {
		function changeName(ship, newName) {
			ship.name = newName;
		}

		function shipCatapults(ship) {
			if(ship.hasOwnProperty("systems")) {
				return ship.systems.filter(function (system){
					return system.class === "catapult"
				})
			}
			return []
		}

		function changeClass(ship, newClass) {
			if(ship.class !== newClass){
				ship.class = newClass;
				ship.systems = []
				var systems = MAX_SYSTEMS.hasOwnProperty(newClass) ? MAX_SYSTEMS[newClass] : 0;
				for(var i = 0; i< systems; i++){
					ship.systems.push({class:""})
				}
			}
		}


		return {
			view: function(vnode) {
				var ship = vnode.attrs.ship

				return [
						m("div", {style: "display: flex"},[
							m("input", {value: ship.name, oninput: function (e) { changeName(ship, e.target.value); } }),
							m("select", {value: ship.class, oninput: function (e) { changeClass(ship, e.target.value); } }, [
								m("option",{value: "capital"}, "Capital"),
								m("option",{value: "frigate"}, "Frigate"),
							]),
							ship.hasOwnProperty("systems") ? ship.systems.map(function (system){
								return m(SystemComponent, {system: system})
							}) : null
						]),
						shipCatapults(ship).map(function(system) {
								return m("div", "Mech company")
						})
				]
			}
		}
	}

	function FleetComponent () {
		return {	
			oninit: function(vnode) {
				var fleet = vnode.attrs.fleet;
				if(!fleet.hasOwnProperty("ships")){
					fleet.ships = []
					for (var i=0;i<fleet.tas;i++){
						fleet.ships.push({})
					}
				}
			},
			view: function(vnode) {
				var fleet = vnode.attrs.fleet
				return m("div",[
							m("h3", fleet.name),
							fleet.ships.map(function (ship){
								return m(ShipComponent, {ship: ship})
							})
						]
					)
			}
		}
	}

	function ShipTrackerComponent () {

		function setShips (newSyncShips) {
				syncShips = newSyncShips;
		}	

		return {	
			view: function() {
				return m("div",[
							m("h2", "Fleet builder"),
			            	// "Sync PPA calculations with ship builder",
			            	// m("input", {
			             //    	onclick: function (e) {setShips(e.target.checked)}, type: "checkbox", value: syncShips
			           		// }), 
			           		players.map(function (player){
			           			return m(FleetComponent, {fleet: player})
			           		})
			           	])
			}
		}
	}

	var main = {
	    view: function() {

    		function add () {
				players.push({name: "Player", hva: 2, tas: 5, systems:10, ppa: 5});
				calculatePPA();
			}

			function setShips (newTrackShips) {
				trackShips = newTrackShips;
			}

	        return m("main", [
	            m("h1", "MF0 Intercept Orbit tools"),
	            m("h2", "Points per asset calculator"),
	            m("div", {style: "display: flex;"},
	            	[
	            		m("div", {style: "display: flex; flex-direction: column; justify-content: space-between;size: 100%;margin-right: 5px;"},
	            			m("span", "Fleet id"),
	            			m("span", "HVA"),
	            			m("span", "TAS"),
	            			m("span", "Systems"),
	            			m("span", "PPA"),
	            			m("span", "Total")
	            		),
	            		players.map(function(player){
	            			return m(PlayerComponent, {player: player})
	            		})
	            ]),
	            m("button", {
	                onclick: add
	            }, "Add player"),
	            m("div", {style: "display: flex;flex-direction: column;"},
	            	[
			            m("span",[
			            	"Track ships",
			            	m("input", {
			                	onclick: function (e) {setShips(e.target.checked)}, type: "checkbox", value: trackShips
			           		}), 
			           	]),
			           	trackShips ?
			           		m(ShipTrackerComponent) : null
	           		]),
	           	m("button", {onclick: function() {console.log(players)}}, "Debug")		 
	        ])
	    }
	}

	m.mount(root, main)
})();
