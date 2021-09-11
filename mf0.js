angular.module('mf0App', [])
    .controller('TeamSetupController', function () {
        let teamSetup = this;
        const LOCAL_STORAGE_KEY = "mf0-tools";

        teamSetup.$onInit = function () {
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
            console.log("Recounting")
            let mostFramesPlayer = teamSetup.players[0];
            let leastFramesPlayer = teamSetup.players[0];
            let mostSystemsPlayer = teamSetup.players[0];
            let leastSystemsPlayer = teamSetup.players[0];
            teamSetup.players.forEach(player => {
                player.score = 5;
                player.role = "Offense";
                if(player.mf > mostFramesPlayer.mf) {
                    mostFramesPlayer = player;
                }
                if(player.mf < leastFramesPlayer.mf) {
                    leastFramesPlayer = player;
                }
                if(player.systems > mostSystemsPlayer.systems) {
                    mostSystemsPlayer = player;
                }
                if(player.systems < leastSystemsPlayer.systems) {
                    leastSystemsPlayer = player
                }
            })

            teamSetup.players.forEach(player => {
                player.totalScore = player.score * (player.mf + player.st)
            });

            mostFramesPlayer.score = mostFramesPlayer.score - 1;
            mostSystemsPlayer.score = mostSystemsPlayer.score - 1;
            leastFramesPlayer.score = leastFramesPlayer.score + 1;
            leastSystemsPlayer.score = leastSystemsPlayer.score + 1;

            teamSetup.players.forEach(player => {
                player.totalScore = player.score * (player.mf + player.st)
            });

            let players = [...teamSetup.players].sort((player1, player2) => {
                return (player1.totalScore) - (player2.totalScore);
            })
            players[0].role = "Defender";
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

