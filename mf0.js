angular.module('mf0App', [])
    .controller('TeamSetupController', function () {
        let teamSetup = this;
        const LOCAL_STORAGE_KEY = "mf0-tools";

        teamSetup.$onInit = function () {
            console.log("Init")
            let oldPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
            if(oldPlayers === null) {
                teamSetup.players = getNewPlayersList();
            }
            teamSetup.players = JSON.parse(oldPlayers);
        }

        function addPlayer() {
            teamSetup.players.push({
                uuid: getUUID(),
                name: "",
                mf: 4,
                systems: 16,
                st: 3,
                score: 5,
                role: "Offense"
            })
            recalculate()
        }

        function recalculate() {

            persistToLocalStorage()
        }

        function getNewPlayersList() {
            teamSetup.players = [];
            addPlayer();
            addPlayer();
        }


        function getUUID() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        }

        function persistToLocalStorage() {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teamSetup.players));   
        }

        function removePlayer(player) {
            teamSetup.players.splice(teamSetup.players.indexOf(player), 1)
            persistToLocalStorage();
        }

        teamSetup.recalculate = recalculate;
        teamSetup.addPlayer = addPlayer;
        teamSetup.removePlayer = removePlayer;

    });

