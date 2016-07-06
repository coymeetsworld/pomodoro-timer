$(document).ready(function() {

  var SECONDS_IN_MINUTE = 60;
  var DEFAULT_POMODORO_LENGTH = 52;
  var DEFAULT_BREAK_LENGTH = 17;
  var DEFAULT_NUM_POMODOROS = 4;
  var chime = new Audio('media/ding.mp3');

  /* Converts a time string (MM:SS) to number of seconds. Used for startTimer function. */
  function convertTimeToSeconds(time_string) {
    var time_array = time_string.split(":");
    var seconds = (SECONDS_IN_MINUTE * (+time_array[0]) + (+time_array[1]));
    return seconds;
  }

  /* Used to send notifications to the user for when a pomodoro or break finishes. This will help signal the user if they are not currently on the pomodoro page. */
  function notifyUser(state) {
    console.log("Notified: " + state);
    var msg = "";
    if (state == 'SESSION') {
      msg = "Session " + numPomodorosCompleted + " completed!";
    } else if (state == 'BREAK') {
      msg = "Break is over, starting next pomodoro now.";
    } else if (state == 'COMPLETED') {
      msg = "Pomodoros completed!";
    }
    console.log("Notification: " + Notification.permission);
    if (!("Notification" in window)) {
      //The browser doesn't support desktop notification
      alert(msg);
    }
    else if (Notification.permission === "granted") { // Checks if notif permissions granted already
      var notification = new Notification(msg);
    }
    else if (Notification.permission !== 'denied' || Notification.permission === "default") { // Lets ask user for permission
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          var notification = new Notification(msg);
        }
      });
    }
  }Notification.requestPermission().then(function(result) {
    console.log(result);
  });function spawnNotification(theBody,theIcon,theTitle) {
    var options = {
      body: theBody,
      icon: theIcon
    }
    var n = new Notification(theTitle,options);
  }

  /* Formats number of seconds to a time string (MM:SS). Used in display of timer. */
  function formatTimeLeft(timeLeftInSeconds) {
    var minutes = (timeLeftInSeconds / SECONDS_IN_MINUTE) | 0;
    var seconds = (timeLeftInSeconds % SECONDS_IN_MINUTE) | 0;
    minutes = minutes < 10 ? "0" + minutes : minutes; /* Put a preceding 0 to single digit minutes */
    seconds = seconds < 10 ? "0" + seconds : seconds; /* Put a preceding 0 to single digit seconds */
    return minutes + ":" + seconds;
  }


  var pomodoroDuration = DEFAULT_POMODORO_LENGTH*SECONDS_IN_MINUTE; /* Default value */
  var pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);
  $("#time_left").html("<p>" + pomodoroDurationFormatted + "</p>");
  $("#pLength").html("<p>" + pomodoroDurationFormatted + "</p>");

  var breakDuration = DEFAULT_BREAK_LENGTH*SECONDS_IN_MINUTE; /* Default value */
  var breakDurationFormatted = formatTimeLeft(breakDuration);
  $("#bLength").html("<p>" + breakDurationFormatted + "</p>");

  var numPomodoros = DEFAULT_NUM_POMODOROS;
  var numPomodorosCompleted = 0;
  $("#numPomodoros").html("<p>" + numPomodoros + "</p>");
  for (var i = 0; i < DEFAULT_NUM_POMODOROS; i++) {
    $("#row_pomodoros").append("<img class=\"pomodoro_pending\" src=\"images/tomato1.svg\"/>");
  }

  var mode = "Paused";
  var prev_mode = "Session"; /* Used to keep track of what mode it is prior to pausing (i.e. when resumed, checks if its on Break or Session). By default start as Session. */
  $("#mode").html("<p>Mode: " + mode + "</p>");


  var session_bgcolor = "red";
  var break_bgcolor = "#7FFF00";

  /* Shows user their current pomodoro status. Will show image of a pomodoro for each completed pomodoro, and a transparent pomodoro for current pomodoro status. */
  function showCurrentPomodoroStatus() {
    for (var i = numPomodorosCompleted; i < numPomodoros-1; i++) { // -1 so not to remove current pomodoro
      $(".pomodoro_pending").last().remove();
    }
  }

  /* Shows user how many pomodoros they have completed and future pomodoros. */
  function showPlannedPomodoroStatus() {
    for (var i = numPomodorosCompleted; i < numPomodoros-1; i++) { // -1 so to include current pomodoro
      $("#row_pomodoros").append("<img class=\"pomodoro_pending\" src=\"images/tomato1.svg\"/>");
    }
  }

  function clearCompletedPomodoros() {
    $(".pomodoro_completed").remove();
    numPomodorosCompleted = 0;

    for (var i = 0; i < numPomodoros; i++) {
      $("#row_pomodoros").append("<img class=\"pomodoro_pending\" src=\"images/tomato1.svg\"/>"); //Add
    }
  }

  function incrementPomodorosCompleted() {
    numPomodorosCompleted++;
    $("#row_pomodoros").prepend("<img class=\"pomodoro_completed\" src=\"images/tomato1.svg\"/>");
    if (numPomodorosCompleted == numPomodoros) {
      $(".pomodoro_pending").last().remove();
    }
  }

  function sessionsCompleted() {

    if (numPomodorosCompleted != numPomodoros) {
      return false;
    }

    clearInterval(myInterval);
    mode = "Completed";
    $("#startTimerButton").html("Start");
    notifyUser("COMPLETED");
    $("#row_menu").slideDown(600);
    $("#row_pomodoros").animate({bottom: '50px'}, 600);
    return true;
  }


  /* Sets up a timer to run every second. */
  var myInterval;

  function startTimer(durationInSeconds) {

    var start = Date.now();
    var timeLeft, minutes, seconds;

    /* Function used by startTime to run every second. Counts down the timer. */
    function timer() {

      /* | 0 Truncates the decimal */
      timeLeft = durationInSeconds - (((Date.now() - start) / 1000) | 0);
      var formattedTimeLeft = formatTimeLeft(timeLeft);

      $("#time_left").html("<p>" + formattedTimeLeft + "</p>");


      if (timeLeft <= 0) {
        chime.play();
        if (mode == "Session") {
          incrementPomodorosCompleted();

          if (!sessionsCompleted()) {
            notifyUser("SESSION");
            mode = "Break!";
            durationInSeconds = breakDuration;
          }
        } else {
          notifyUser("BREAK");
          mode = "Session";
          durationInSeconds = pomodoroDuration;
        }
        $("#mode").html("<p>Mode: " + mode + "</p>");
        start = Date.now();
        /*console.log("THIS: " + start);
        start.setSeconds(start.getSeconds() + 2);*/
      }

    };

    timer(); /* Run this once to avoid 1 second delay in setInterval */


    myInterval = setInterval(timer, 1000);
  }


  /* Depending on the current state, will either start or pause the session. If started, buttons to change the pomodoro/break lengths will be disabled. The opposite is true if the button is pressed to pause the session. */
  $("#startTimerButton").click(function() {

    if (mode == "Paused") {
      $("#row_menu").slideUp(600);
      $("#row_pomodoros").animate({bottom: '0px'}, 600);
      showCurrentPomodoroStatus();
      mode = prev_mode;
      $("#mode").html("<p>Mode: " + mode + "</p>");
      var secondsLeft = convertTimeToSeconds($("#time_left").text());

      /* Edge case where pause button is hit when either break or pomodoro clock is at 0. */
      if (secondsLeft == 0) {
        if (mode == "Session") {
          startTimer(convertTimeToSeconds($("#pLength").text()));
        } else {/* mode is "Break!" */
          startTimer(convertTimeToSeconds($("#bLength").text()));
        }
      } else{
        startTimer(secondsLeft);
      }

      $("#startTimerButton").html("Pause");
      $("#incrementPomodoroLength").prop("disabled",true);
      $("#decrementPomodoroLength").prop("disabled",true);
      $("#incrementBreakLength").prop("disabled",true);
      $("#decrementBreakLength").prop("disabled",true);
    } else if (mode == "Completed") {
      /* Starting over */
      clearCompletedPomodoros();
      $("#row_menu").slideUp(600);
      $("#row_pomodoros").animate({bottom: '0px'}, 600);
      showCurrentPomodoroStatus();
      mode = "Session";
      $("#mode").html("<p>Mode: " + mode + "</p>");
      startTimer(pomodoroDuration);
    } else { // Mode is either Session or Break, do same thing for either.
      $("#row_menu").slideDown(600);
      $("#row_pomodoros").animate({bottom: '50px'}, 600);
      showPlannedPomodoroStatus();
      prev_mode = mode;
      mode = "Paused";
      $("#mode").html("<p>Mode: " + mode + "</p>");
      clearInterval(myInterval);
      $("#startTimerButton").html("Start");
      $("#incrementPomodoroLength").prop("disabled",false);
      $("#decrementPomodoroLength").prop("disabled",false);
      $("#incrementBreakLength").prop("disabled",false);
      $("#decrementBreakLength").prop("disabled",false);
    }
  });

  /* When pressed, increment the pomodoro by a minute. */
  $("#incrementPomodoroLength").click(function() {
    pomodoroDuration += SECONDS_IN_MINUTE;
    var pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);

    /* Resets state, starts back at Session, skips current break time. */
    if (prev_mode == "Break!") {
      prev_mode = "Session";
    }

    if (mode == "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    $("#pLength").html("<p>" + pomodoroDurationFormatted + "</p>");
    $("#time_left").html("<p>" + pomodoroDurationFormatted + "</p>");
  });

  /* When pressed, decrements the pomodoro by a minute. Cannot have a pomodoro less than 1 minute. (In practice, pomodoro shouldn't be 0) */
  $("#decrementPomodoroLength").click(function() {
    if (pomodoroDuration > SECONDS_IN_MINUTE) {

      /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode == "Break!") {
        prev_mode = "Session";
      }

      if (mode == "Completed") {
        mode = "Paused";
        clearCompletedPomodoros();
        $("#mode").html("<p>Mode: " + mode + "</p>");
      }

      pomodoroDuration -= SECONDS_IN_MINUTE;
      var pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);
      $("#pLength").html("<p>" + pomodoroDurationFormatted + "</p>");
      $("#time_left").html("<p>" + pomodoroDurationFormatted + "</p>");
    }
  });

  /* When pressed, increments the break by a minute. */
  $("#incrementBreakLength").click(function() {

    /* Resets state, starts back at Session, skips current break time. */
    if (prev_mode == "Break!") {
      prev_mode = "Session";
    }

    if (mode == "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    breakDuration += SECONDS_IN_MINUTE;
    var breakDurationFormatted = formatTimeLeft(breakDuration);
    $("#bLength").html("<p>" + breakDurationFormatted + "</p>");
  });

  /* When pressed, decrements the break by a minute. Cannot have a break less than 1 minute (defeats the purpose of a Pomodoro to have no break). */
  $("#decrementBreakLength").click(function() {
    if (breakDuration > SECONDS_IN_MINUTE) {

      /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode == "Break!") {
        prev_mode = "Session";
      }

      if (mode == "Completed") {
        mode = "Paused";
        clearCompletedPomodoros();
        $("#mode").html("<p>Mode: " + mode + "</p>");
      }

      breakDuration -= SECONDS_IN_MINUTE;
      var breakDurationFormatted = formatTimeLeft(breakDuration);
      $("#bLength").html("<p>" + breakDurationFormatted + "</p>");
    }
  });




  /* When pressed, increments the number of pomodoros by 1. */
  $("#incrementPomodoros").click(function() {

    if (mode == "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    if (numPomodoros < 8) {
      //madeup number
      numPomodoros++;
      $("#row_pomodoros").append("<img class=\"pomodoro_pending\" src=\"images/tomato1.svg\"/>");
      $("#numPomodoros").html("<p>" + numPomodoros + "</p>");
    }
  });

  /* When pressed, decrements the number of pomodoros by 1. Cannot have less than one pomodoro. */
  $("#decrementPomodoros").click(function() {

    if (mode == "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    if (numPomodoros > 1 && (numPomodorosCompleted < numPomodoros-1)) {
      //on a currently running session, can't decrement number of pomodoros by more than what was already completed.
      numPomodoros--;
      $(".pomodoro_pending").first().remove();
      $("#numPomodoros").html("<p>" + numPomodoros + "</p>");
    }
  });
});
