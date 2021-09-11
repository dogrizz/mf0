angular.module('mf0App', [])
    .controller('TeamSetupController', function () {
        let teamSetup = this;
        const LOCAL_STORAGE_KEY = "mf0-tools";
        teamSetup.players = []

        teamSetup.players = (function () {
            let oldPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
            if(oldPlayers === null) {
                return getNewPlayersList();
            }
            return JSON.parse(oldPlayers);
        })();

        function addPlayer() {
            teamSetup.players.push({
                uuid: getUUID(),
                name: "",
                mf: 0,
                st: 0,
                score: 5
            })
            recalculate()
        }

        function recalculate() {

        }

        function getNewPlayersList() {
            teamSetup.players = [];
            addPlayer();
        }


        function getUUID() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        }

        function persistToLocalStorage() {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players));   
        }

        teamSetup.recalculate = recalculate;
        teamSetup.addPlayer = addPlayer;

    })
    .controller('SumUpController', function () {
        let sumUp = this;
        const LOCAL_STORAGE_KEY = "exercises";
        sumUp.result = 0;
        sumUp.resultHour = 0;
        sumUp.resultMinute = 0;
        sumUp.hours = [];
        for (let i = 0; i <= 23; i++) {
            sumUp.hours.push(i);
        }
    
        sumUp.minutes = [];
        for (let i = 0; i <= 59; i++) {
            sumUp.minutes.push(i);
        }

        function getUUID() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        }
    
        function getEmptyExercise() {
            return {fromHours: 0, fromMinutes: 0,toHours: 0, toMinutes: 0, uuid: getUUID()};
        }

        function persistToLocalStorage() {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sumUp.exercises));   
        }
    
        sumUp.exercises = (function () {
            let oldExercises = localStorage.getItem(LOCAL_STORAGE_KEY);
            if(oldExercises === null) {
                return [getEmptyExercise()];
            }
            return JSON.parse(oldExercises);
        })();

        sumUp.calculate = function () {
            let sum = 0;
            for (let exercise of sumUp.exercises) {
                let from = +exercise.fromHours * 60 + +exercise.fromMinutes;
                let to = +exercise.toHours * 60 + +exercise.toMinutes;

                if(to < from ) {
                  to += 24*60;
                }

                exercise.subSum = to - from;
                sum += exercise.subSum;
            }
            sumUp.result = sum;
            sumUp.resultHour = Math.trunc(sum / 60);
            sumUp.resultMinute = sum % 60;
            persistToLocalStorage();
        };

        sumUp.add = function () {
            sumUp.exercises.push(getEmptyExercise());
            sumUp.calculate();
        };

        sumUp.remove = function (exercise) {
            sumUp.exercises.splice(sumUp.exercises.indexOf(exercise), 1);
            sumUp.calculate();
        };
    });
