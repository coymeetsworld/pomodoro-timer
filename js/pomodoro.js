$(document).ready(() => {

  const SECONDS_IN_MINUTE = 60;
  const DEFAULT_POMODORO_LENGTH = 52;
  const DEFAULT_BREAK_LENGTH = 17;
  const DEFAULT_NUM_POMODOROS = 4;
  const CHIME = new Audio('media/ding.mp3');
  const TOMATO_IMG = "<img class=\"pomodoro-pending\" src=\"images/tomato1.svg\" alt=\"Pomodoro\"/>";

  /* Converts a time string (MM:SS) to number of seconds. Used for startTimer function. */
  function convertTimeToSeconds(time_string) {
    let time_array = time_string.split(":");
    let seconds = (SECONDS_IN_MINUTE * (+time_array[0]) + (+time_array[1]));
    return seconds;
  }


  /* Used to send notifications to the user for when a pomodoro or break finishes. This will help signal the user if they are not currently on the pomodoro page. */
  function notifyUser(state) {
    let msg = "";
    if (state === 'SESSION') { msg = "Session " + numPomodorosCompleted + " completed!"; }
    else if (state === 'BREAK') { msg = "Break is over, starting next pomodoro now."; }
    else if (state === 'COMPLETED') { msg = "Pomodoros completed!"; }

    if (!("Notification" in window)) {
      //The browser doesn't support desktop notification
      alert(msg);
    }
    else if (Notification.permission === "granted") { // Checks if notif permissions granted already
      let notification = new Notification(msg);
    }
    else if (Notification.permission !== 'denied' || Notification.permission === "default") { // Lets ask user for permission
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") { let notification = new Notification(msg); }
      });
    }
  }Notification.requestPermission().then(function(result) {
    //console.log(result);
  });function spawnNotification(theBody,theIcon,theTitle) {
    let options = {
      body: theBody,
      icon: theIcon
    }
    let n = new Notification(theTitle,options);
  }


  /* Formats number of seconds to a time string (MM:SS). Used in display of timer. */
  function formatTimeLeft(timeLeftInSeconds) {
    let minutes = (timeLeftInSeconds / SECONDS_IN_MINUTE) | 0;
    let seconds = (timeLeftInSeconds % SECONDS_IN_MINUTE) | 0;
    minutes = minutes < 10 ? "0" + minutes : minutes; 
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
  }


  let pomodoroDuration = DEFAULT_POMODORO_LENGTH*SECONDS_IN_MINUTE; /* Default value */
  let pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);
  $("#time-left").html("<p>" + pomodoroDurationFormatted + "</p>");
  $("#pomodoro-length").html("<p>" + pomodoroDurationFormatted + "</p>");

  let breakDuration = DEFAULT_BREAK_LENGTH*SECONDS_IN_MINUTE; /* Default value */
  let breakDurationFormatted = formatTimeLeft(breakDuration);
  $("#break-length").html("<p>" + breakDurationFormatted + "</p>");

  let numPomodoros = DEFAULT_NUM_POMODOROS;
  let numPomodorosCompleted = 0;
  $("#num-pomodoros").html("<p>" + numPomodoros + "</p>");
  for (let i = 0; i < DEFAULT_NUM_POMODOROS; i++) {
    $("#row-pomodoros").append(TOMATO_IMG);
  }

  let mode = "Paused";
  let prev_mode = "Session"; /* Used to keep track of what mode it is prior to pausing (i.e. when resumed, checks if its on Break or Session). By default start as Session. */
  $("#mode").html("<p>Mode: " + mode + "</p>");


  /* Shows user their current pomodoro status. Will show image of a pomodoro for each completed pomodoro, and a transparent pomodoro for current pomodoro status. */
  function showCurrentPomodoroStatus() {
    for (let i = numPomodorosCompleted; i < numPomodoros-1; i++) { // -1 so not to remove current pomodoro
      $(".pomodoro-pending").last().remove();
    }
  }

  /* Shows user how many pomodoros they have completed and future pomodoros. */
  function showPlannedPomodoroStatus() {
    for (let i = numPomodorosCompleted; i < numPomodoros-1; i++) { // -1 so to include current pomodoro
      $("#row-pomodoros").append(TOMATO_IMG);
    }
  }

  function clearCompletedPomodoros() {
    $(".pomodoro_completed").remove();
    numPomodorosCompleted = 0;

    for (let i = 0; i < numPomodoros; i++) {
      $("#row-pomodoros").append(TOMATO_IMG); //Add
    }
  }

  function incrementPomodorosCompleted() {
    numPomodorosCompleted++;
    $("#row-pomodoros").prepend(TOMATO_IMG);
    if (numPomodorosCompleted === numPomodoros) {
      $(".pomodoro-pending").last().remove();
    }
  }

  function sessionsCompleted() {
    if (numPomodorosCompleted != numPomodoros) { return false; }

    clearInterval(myInterval);
    mode = "Completed";
    $("#start-timer-btn").html("Start");
    notifyUser("COMPLETED");
    $("#row-menu").slideDown(600);
    $("#row-pomodoros").animate({bottom: '50px'}, 600);
    return true;
  }

  /* Sets up a timer to run every second. */
  let myInterval;

  function startTimer(durationInSeconds) {
    let start = Date.now();
    let timeLeft, minutes, seconds;

    /* Function used by startTime to run every second. Counts down the timer. */
    function timer() {

      /* | 0 Truncates the decimal */
      timeLeft = durationInSeconds - (((Date.now() - start) / 1000) | 0);
      let formattedTimeLeft = formatTimeLeft(timeLeft);

      $("#time-left").html("<p>" + formattedTimeLeft + "</p>");

      if (timeLeft <= 0) {
        CHIME.play();
        if (mode === "Session") {
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
      }
    };

    timer(); /* Run this once to avoid 1 second delay in setInterval */

    myInterval = setInterval(timer, 1000);
  }


  /* Depending on the current state, will either start or pause the session. If started, buttons to change the pomodoro/break lengths will be disabled. The opposite is true if the button is pressed to pause the session. */
  $("#start-timer-btn").click(() => {
    if (mode === "Paused") {
      $("#row-menu").slideUp(600);
      $("#row-pomodoros").animate({bottom: '0px'}, 600);
      showCurrentPomodoroStatus();
      mode = prev_mode;
      $("#mode").html("<p>Mode: " + mode + "</p>");
      let secondsLeft = convertTimeToSeconds($("#time-left").text());

      /* Edge case where pause button is hit when either break or pomodoro clock is at 0. */
      if (secondsLeft === 0) {
        if (mode === "Session") {
          startTimer(convertTimeToSeconds($("#pLength").text()));
        } else {/* mode is "Break!" */
          startTimer(convertTimeToSeconds($("#bLength").text()));
        }
      } else{
        startTimer(secondsLeft);
      }

      $("#start-timer-btn").html("Pause");
      $("#inc-pomodoro-length").prop("disabled",true);
      $("#dec-pomodoro-length").prop("disabled",true);
      $("#inc-break-length").prop("disabled",true);
      $("#dec-break-length").prop("disabled",true);

    } else if (mode === "Completed") {
      /* Starting over */
      clearCompletedPomodoros();
      $("#row-menu").slideUp(600);
      $("#row-pomodoros").animate({bottom: '0px'}, 600);
      showCurrentPomodoroStatus();
      mode = "Session";
      $("#mode").html("<p>Mode: " + mode + "</p>");
      startTimer(pomodoroDuration);

    } else { // Mode is either Session or Break, do same thing for either.
      $("#row-menu").slideDown(600);
      $("#row-pomodoros").animate({bottom: '50px'}, 600);
      showPlannedPomodoroStatus();
      prev_mode = mode;
      mode = "Paused";
      $("#mode").html("<p>Mode: " + mode + "</p>");
      clearInterval(myInterval);
      $("#start-timer-btn").html("Start");
      $("#inc-pomodoro-length").prop("disabled",false);
      $("#dec-pomodoro-length").prop("disabled",false);
      $("#inc-break-length").prop("disabled",false);
      $("#dec-break-length").prop("disabled",false);
    }
  });


  /* When pressed, increment the pomodoro by a minute. */
  $("#inc-pomodoro-length").click(() => {
    pomodoroDuration += SECONDS_IN_MINUTE;
    let pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);

    /* Resets state, starts back at Session, skips current break time. */
    if (prev_mode === "Break!") { prev_mode = "Session"; }

    if (mode === "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    $("#pomodoro-length").html("<p>" + pomodoroDurationFormatted + "</p>");
    $("#time-left").html("<p>" + pomodoroDurationFormatted + "</p>");
  });


  /* When pressed, decrements the pomodoro by a minute. Cannot have a pomodoro less than 1 minute. (In practice, pomodoro shouldn't be 0) */
  $("#dec-pomodoro-length").click(() => {
    if (pomodoroDuration > SECONDS_IN_MINUTE) {

    /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode === "Break!") {  prev_mode = "Session"; }

      if (mode === "Completed") {
        mode = "Paused";
        clearCompletedPomodoros();
        $("#mode").html("<p>Mode: " + mode + "</p>");
      }

      pomodoroDuration -= SECONDS_IN_MINUTE;
      let pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);
      $("#pomodoro-length").html("<p>" + pomodoroDurationFormatted + "</p>");
      $("#time-left").html("<p>" + pomodoroDurationFormatted + "</p>");
    }
  });


  /* When pressed, increments the break by a minute. */
  $("#inc-break-length").click(() => {
    /* Resets state, starts back at Session, skips current break time. */
    if (prev_mode === "Break!") { prev_mode = "Session"; }

    if (mode === "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    breakDuration += SECONDS_IN_MINUTE;
    let breakDurationFormatted = formatTimeLeft(breakDuration);
    $("#break-length").html("<p>" + breakDurationFormatted + "</p>");
  });


  /* When pressed, decrements the break by a minute. Cannot have a break less than 1 minute (defeats the purpose of a Pomodoro to have no break). */
  $("#dec-break-length").click(() => {
    if (breakDuration > SECONDS_IN_MINUTE) {

      /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode === "Break!") { prev_mode = "Session"; }

      if (mode === "Completed") {
        mode = "Paused";
        clearCompletedPomodoros();
        $("#mode").html("<p>Mode: " + mode + "</p>");
      }

      breakDuration -= SECONDS_IN_MINUTE;
      let breakDurationFormatted = formatTimeLeft(breakDuration);
      $("#break-length").html("<p>" + breakDurationFormatted + "</p>");
    }
  });


  /* When pressed, increments the number of pomodoros by 1. */
  $("#inc-pomodoros").click(() => {
    if (mode === "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    if (numPomodoros < 8) {
      numPomodoros++;
      $("#row-pomodoros").append(TOMATO_IMG);
      $("#num-pomodoros").html("<p>" + numPomodoros + "</p>");
    }
  });


  /* When pressed, decrements the number of pomodoros by 1. Cannot have less than one pomodoro. */
  $("#dec-pomodoros").click(() => {
    if (mode === "Completed") {
      mode = "Paused";
      clearCompletedPomodoros();
      $("#mode").html("<p>Mode: " + mode + "</p>");
    }

    if (numPomodoros > 1 && (numPomodorosCompleted < numPomodoros-1)) {
      //on a currently running session, can't decrement number of pomodoros by more than what was already completed.
      numPomodoros--;
      $(".pomodoro-pending").first().remove();
      $("#num-pomodoros").html("<p>" + numPomodoros + "</p>");
    }
  });


  window.onbeforeunload = () => { 
    return "Are you sure you want to leave? Pomodoro progress will be lost!";
  }

});
