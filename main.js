(function() {
    var root = document.body

    var players = [];

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
						m("input", {type: "number", min: 0, value: player.tas, oninput: function (e) { changeTas(player, e.target.value); } }),
						m("input", {type: "number", min: 0, value: player.systems, oninput: function (e) { changeSystems(player, e.target.value); } }),
						m("span", player.ppa),
						m("span", player.ppa * ( player.hva + player.tas ) )	
					)
			}
		}
	}

	var main = {
	    view: function() {

    		function add () {
				players.push({name: "Player", hva: 2, tas: 5, systems:10, ppa: 5});
				calculatePPA();
			}

	        return m("main", [
	            m("h1", "MF0 Intercept Orbit tools"),
	            m("div", {style: "display: flex;"},
	            	[
	            		m("div", {style: "display: flex; flex-direction: column; justify-content: space-between;size: 100%;margin-right: 5px;"},
	            			m("span", "Callsign"),
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
	        ])
	    }
	}

	m.mount(root, main)
})();