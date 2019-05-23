
taskBoxes=[];

TODAY = "today";
TOMORROW = "tomorrow";
LATER = "later";

function log(text) {
  chrome.runtime.sendMessage({"type": "log", "text":text});
};

function getTasks(when, element) {
  chrome.storage.sync.get([when], function(items) {
    if (items[when] == null) {
      return "Nothing";
    }
    log(when + ":" + items[when]);
    element.appendChild(makeUL(items[when], when));
  });
};

function removeTask(when, task) {
  log("Remove " + task + " from " + when);
  chrome.runtime.sendMessage({"type":"removeTask", "task":task, "when":when},
    function(response) {
      log(response);
  });
};

function makeUL(array, when) {
    // Create the list element:
    var list = document.createElement('ul');
    list.style = "padding:0;margin-left:0;";

    for (var i = 0; i < array.length; i++) {
        // Create the list item:
        var item = document.createElement('li');
	item.style = "list-style:none;";

	// Add checkmark button
        var check = document.createElement('input');
        check.type = "checkbox";
        check.name = when;
	check.value = array[i];
        item.appendChild(check);
	taskBoxes.push(check);

        // Set its contents:
        item.appendChild(document.createTextNode(array[i]));

        // Add it to the list:
        list.appendChild(item);
    }

    // Finally, return the constructed list:
    return list;
};

function loadLists() {
  taskBoxes = [];
  getTasks(TODAY, document.getElementById('todayListDiv'));
  getTasks(TOMORROW, document.getElementById('tomorrowListDiv'));
  getTasks(LATER, document.getElementById('laterListDiv'));
  return false;
};

closeButton.onclick = function(element) {
  log("close list");
  var taskBoxesLength = taskBoxes.length;
  var tasksToRemove = [];
  for (var i = 0; i < taskBoxesLength; i++) {
    if (taskBoxes[i].checked) {
      tasksToRemove.push({"when":taskBoxes[i].name,"task":taskBoxes[i].value});
    }
  }
  if (tasksToRemove.length > 0) {
  chrome.runtime.sendMessage({"type":"removeTasks","tasks":tasksToRemove},
    function(response) {
      log(response);
    }
  )};
  window.close();
};

window.onload = loadLists;
