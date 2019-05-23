
TODAY = "today";
TOMORROW = "tomorrow";
LATER = "later";
ALARM = "dayChange";

function log(text) {
  chrome.runtime.sendMessage({"type": "log", "text":text});
};

function addTodayTask(task) {
  log("Adding Today:" + task);
  addTask(TODAY, task);
};

function addTomorrowTask(task) {
  log("Adding Tomorrow:" + task);
  addTask(TOMORROW, task);
};

function addLaterTask(task) {
  log("Adding Later:" + task);
  addTask(LATER, task);
};

function addTask(when, task) {
  chrome.runtime.sendMessage({"type": "addTask", "when":when, "task":task});
  document.getElementById("notification").innerHTML = "Added!";
};

function getTasks(when) {
  chrome.storage.sync.get([when], function(items) {
    if (items[when] == null) {
      return "Nothing";
    }
    log(when + ":" + items[when]);
    return items[when];
  });
};

todayButton.onclick = function(element) {
  var task = document.getElementById("taskField").value;
  if (task == null || task.length == 0) {
    return;
  }
  addTodayTask(task);
  document.getElementById("taskField").value = null;
  return false;
};

tomorrowButton.onclick = function(element) {
  var task = document.getElementById("taskField").value;
  if (task == null || task.length == 0) {
    return;
  }
  addTomorrowTask(task);
  document.getElementById("taskField").value = null;
  return false;
};

laterButton.onclick = function(element) {
  var task = document.getElementById("taskField").value;
  if (task == null || task.length == 0) {
    return;
  }
  addLaterTask(task);
  document.getElementById("taskField").value = null;
  return false;
};

listButton.onclick = function(element) {
  chrome.windows.create({'url': 'list.html', 'type':'popup', height:300, width:200}, function(window) {
  });
  return false;
};

function checkAlarm(callback) {
  chrome.alarms.getAll(function(alarms) {
    var hasAlarm = alarms.some(function(a) {
      return a.name == ALARM;
    });
    if (callback) callback(hasAlarm);
  })
}

function createAlarm(hasAlarm) {
  if (! hasAlarm) {
    log("Created hourly check alarm for new day");
    chrome.alarms.create(ALARM, {delayInMinutes: 60, periodInMinutes: 60});
  } else {
    log("Hourly check alarm already exists");
  }
}

function cancelAlarm() {
  chrome.alarms.clear(ALARM);
}

checkAlarm(createAlarm);

