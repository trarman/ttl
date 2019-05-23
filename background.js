// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function updateBadge() {
  chrome.storage.sync.get(["today"], function(items) {
    var count = items["today"].length;
    if (count == null || count < 1) {
      console.log("No tasks today");
      chrome.browserAction.setBadgeText({'text':''}); // empty string removes
      return;
    }
    var badgeText = count.toString();
    if (count > 10) {
      badgetText = "10+"
    }
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.browserAction.setBadgeText({'text': badgeText});
    console.log("Number of tasks today:" + count);
  });
}

chrome.runtime.onInstalled.addListener(function() {
  updateBadge();
  checkToday();
  var context = "selection";
  var title = "Add as Today Task";
  var id = chrome.contextMenus.create({"title":title,"contexts":[context],
	"id":"context" + context});
});

chrome.contextMenus.onClicked.addListener(function(info,tab) {
  var sText = info.selectionText;
  addTask("today", sText);
});

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

function moveTomorrowTasks() {
  console.log("Move Tomorrow Tasks called");
  chrome.storage.sync.get(["tomorrow"], function(items) {
    if (items["tomorrow"] == null) {
      console.log("Nothing to move");
      return;
    }
    var tomorrowTasks = [];
    items["tomorrow"].forEach(function(task) {
      tomorrowTasks.push({"task":task, "when":"tomorrow"});
    });
    removeTasks(tomorrowTasks);
    chrome.storage.sync.get(["today"], function(todayItems) {
      if (todayItems["today"] == null) {
        todayItems["today"] = tomorrowTasks;
        console.log("Copied tomorrow list");
      } else {
        console.log("Adding the following tasks to today");
        tomorrowTasks.forEach(function(task) {
          todayItems["today"].push(task["task"]);
        });
      }
      chrome.storage.sync.set(todayItems, function() {
        console.log("Added tomorrow's tasks to today");
      });
    });
  });
};

function checkToday() {
  chrome.storage.sync.get(['current'], function(items) {
    var now = new Date();
    var savedMillis = items['current'];
    var savedDate;
    var shouldUpdate = false;
    if (savedMillis == null) {
      console.log("No current date set");
      shouldUpdate = true;
    } else {
      console.log(savedMillis);
      savedDate = new Date(savedMillis);
      if (!sameDay(savedDate, now)) {
        moveTomorrowTasks();
        shouldUpdate = true;
      }
    }
    if (shouldUpdate) {
      items["current"] = now.getTime();
      chrome.storage.sync.set(items, function() {
        console.log("Updated TTL saved date to " + now);
      });
    };
  });
};

function arrayRemove(arr, value) {
  return arr.filter(function(ele) {
    return ele != value;
  });
};

function removeTask(when, task) {
  chrome.storage.sync.get([when], function(items) {
    console.log("Fetching array for " + when);
    if (items[when] == null) {
      console.log("Woah!  No items to remove from " + when);
      return;
    }
    var result = arrayRemove(items[when], task);
    console.log("New " + when + " list = " + result);
    items[when] = result;
    chrome.storage.sync.set(items, function() {
      console.log("Updated tasks for " + when + " to " + result);
    });
  });
};

function removeTasks(tasks) {
  if (tasks == null || tasks.length == 0) {
    console.log("No tasks to remove");
    return;
  }
  var whenArray = ['today', 'tomorrow', 'later'];
  whenArray.forEach(function(when) {
    console.log("Updating " + when);
    chrome.storage.sync.get([when], function(items) {
      console.log("Fetching array for " + when);
      if (items[when] == null) {
        console.log("Woah!  No items to remove from " + when);
        return;
      };
      var result;
      tasks.forEach(function(task) {
        if (when == task.when) {
          result = arrayRemove(items[when], task.task);
	  items[when] = result;
        } 
      });
      console.log("New " + when + " list = " + items[when]);
      chrome.storage.sync.set(items, function() {
        console.log("Updated tasks for " + when + " to " + items[when]);
        if (when == "today") {
          updateBadge();
        }
      });
    });
  });
};

function addTask(when, task) {
  chrome.storage.sync.get([when], function(items) {
    if (items[when] == null) {
      items[when] = [task];
      console.log("Empty list");
    } else {
      items[when].push(task);
      console.log("Adding to list");
    }
    chrome.storage.sync.set(items, function() {
      console.log("Updated tasks for " + when + " to " + items[when]);
      if (when == "today") {
        updateBadge();
      };
    });
  });
};

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  switch (msg.type) {
    case 'updateBadge':
      updateBadge();
      response('badge updated');
      break;
    case 'removeTask':
      removeTask(msg.when, msg.task);
      response(msg.task + ' removed from ' + msg.when);
      break;
    case 'removeTasks':
      removeTasks(msg.tasks);
      response(msg.tasks.length + ' tasks removed');
      break;
    case 'addTask':
      addTask(msg.when, msg.task);
      response(msg.task + ' added to ' + msg.when);
      break;
    case 'log':
      console.log(msg.text);
      break;
    default:
      response('unknown request');
      break;
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  checkToday();
});
