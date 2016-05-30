$(document).ready(function() {

  /* Converts a time string (MM:SS) to number of seconds. Used for startTimer function. */
  function convertTimeToSeconds(time_string) {
    var time_array = time_string.split(":");
    var seconds = (60 * (+time_array[0]) + (+time_array[1]));
    return seconds;
  }

  /* Formats number of seconds to a time string (MM:SS). Used in display of timer. */
  function formatTimeLeft(timeLeftInSeconds) {
    var minutes = (timeLeftInSeconds / 60) | 0;
    var seconds = (timeLeftInSeconds % 60) | 0;
    minutes = minutes < 10 ? "0" + minutes : minutes; /* Put a preceding 0 to single digit minutes */
    seconds = seconds < 10 ? "0" + seconds : seconds; /* Put a preceding 0 to single digit seconds */
    return minutes + ":" + seconds;
  }


  var pomodoroDuration = 25*60; /* Default value */
  var pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);
  $("#time_left").html("<p>" + pomodoroDurationFormatted + "</p>");
  $("#pLength").html("<p>" + pomodoroDurationFormatted + "</p>");

  var breakDuration = 5*60; /* Default value */
  var breakDurationFormatted = formatTimeLeft(breakDuration);
  $("#bLength").html("<p>" + breakDurationFormatted + "</p>");

  var mode = "Paused";
  var prev_mode = "Session"; /* Used to keep track of what mode it is prior to pausing (i.e. when resumed, checks if its on Break or Session). By default start as Session. */
  $("#mode").html("<p>Mode: " + mode + "</p>");


  var session_bgcolor = "red";
  var break_bgcolor = "#7FFF00";

  function drawTimer(percent, timeLeft) {
    $('div.timer').html('<div id="time_left"></div><div id="slice"'+(percent > 50?' class="gt50"':'')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');

    /* Have to set it in this interval function since the div class keeps getting readded to DOM */
    if (mode == 'Session') {
      $(".timer #slice .pie").css("background", session_bgcolor);
    } else {
      $(".timer #slice .pie").css("background", break_bgcolor);
    }

    var deg = 360/100*percent;

    $('#slice .pie').css({
      '-moz-transform':'rotate('+deg+'deg)',
      '-webkit-transform':'rotate('+deg+'deg)',
      '-o-transform':'rotate('+deg+'deg)',
      'transform':'rotate('+deg+'deg)'
    })

    $('#time_left').html(timeLeft);
  }



  /* Sets up a timer to run every second. */
  var myInterval;

  function startTimer(durationInSeconds) {

    var start = Date.now();
    var timeLeft, minutes, seconds;
    var percent;

    /* Function used by startTime to run every second. Counts down the timer. */
    function timer() {

      /* | 0 Truncates the decimal */
      timeLeft = durationInSeconds - (((Date.now() - start) / 1000) | 0);
      var formattedTimeLeft = formatTimeLeft(timeLeft);

      $("#time_left").html("<p>" + formattedTimeLeft + "</p>");


      if (timeLeft <= 0) {

        drawTimer(100, formatTimeLeft(0));

        if (mode == "Session") {
          mode = "Break!";
          durationInSeconds = breakDuration;
          $(".timer #slice .pie").css("background", break_bgcolor); /* For when it hits 0 */
        } else {
          mode = "Session";
          durationInSeconds = pomodoroDuration;
          $(".timer #slice .pie").css("background", session_bgcolor); /* For when it hits 0 */
        }
        $("#mode").html("<p>" + mode + "</p>");
        start = Date.now();
        start.setSeconds(start.getSeconds() + 2);
      } else {

        if (mode == "Session") {
          percent = 100 - ((timeLeft/pomodoroDuration) * 100);
        } else if (mode == "Break!") {
          percent = 100 - ((timeLeft/breakDuration) * 100);
        }
        drawTimer(percent, formatTimeLeft(timeLeft));
      }

    };

    timer(); /* Run this once to avoid 1 second delay in setInterval */

    /* Draw pie graph once to avoid 1 second delay in setInterval */
    if (mode == "Session") {
      percent = 100 - ((timeLeft/pomodoroDuration) * 100);
    } else if (mode == "Break!") {
      percent = 100 - ((timeLeft/breakDuration) * 100);
    }

    drawTimer(percent, formatTimeLeft(timeLeft));
    myInterval = setInterval(timer, 1000);
  }


  /* Depending on the current state, will either start or pause the session. If started, buttons to change the pomodoro/break lengths will be disabled. The opposite is true if the button is pressed to pause the session. */
  $("#startTimerButton").click(function() {
    if (mode == "Paused") {
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
    } else {
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
    pomodoroDuration += 60;
    var pomodoroDurationFormatted = formatTimeLeft(pomodoroDuration);

    /* Resets state, starts back at Session, skips current break time. */
    if (prev_mode == "Break!") {
      prev_mode = "Session";
    }
    drawTimer(0, formatTimeLeft(pomodoroDuration));

    $("#pLength").html("<p>" + pomodoroDurationFormatted + "</p>");
    $("#time_left").html("<p>" + pomodoroDurationFormatted + "</p>");
  });

  /* When pressed, decrements the pomodoro by a minute. Cannot have a pomodoro less than 1 minute. (In practice, pomodoro shouldn't be 0) */
  $("#decrementPomodoroLength").click(function() {
    if (pomodoroDuration > 0) {

      /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode == "Break!") {
        prev_mode = "Session";
      }
      drawTimer(0, formatTimeLeft(pomodoroDuration));
      pomodoroDuration -= 60;
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
    drawTimer(0, formatTimeLeft(pomodoroDuration));
    breakDuration += 60;
    var breakDurationFormatted = formatTimeLeft(breakDuration);
    $("#bLength").html("<p>" + breakDurationFormatted + "</p>");
  });

  /* When pressed, decrements the break by a minute. Cannot have a break less than 1 minute (defeats the purpose of a Pomodoro to have no break). */
  $("#decrementBreakLength").click(function() {
    if (breakDuration > 0) {

      /* Resets state, starts back at Session, skips current break time. */
      if (prev_mode == "Break!") {
        prev_mode = "Session";
      }
      drawTimer(0, formatTimeLeft(pomodoroDuration));

      breakDuration -= 60;
      var breakDurationFormatted = formatTimeLeft(breakDuration);
      $("#bLength").html("<p>" + breakDurationFormatted + "</p>");
    }
  });

});
