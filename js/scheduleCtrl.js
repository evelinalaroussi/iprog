meetingPlannerApp.controller('scheduleCtrl', function ($scope,$filter,Meeting) {
	Meeting.getWeather();
	var information  = {};
	$scope.getParkedActivities = function(){
		return Meeting.getParkedActivities();
	}

	$scope.getDays = function(){
		return Meeting.getDays();
	}

	$scope.addDay = function(){
		Meeting.addDay();
	}

	$scope.setStart = function(day, start, dayIndex){
		if(start != null){
			var res = start.split(":");
			if(res.length == 0)
				day.setStart();
			else if(res.length == 1)
				day.setStart(res[0], 0);
			else{
				if(res[1].length<2)
					res[1] += "0";
				day.setStart(res[0], res[1]);
			}
			Meeting.updateDayInFirebase(dayIndex);
		}
	}

	$scope.setDate = function(day, date, dayIndex){
		var date = $filter('date')(date, 'yyyy-MM-dd')
		day.setDate(date)
		Meeting.updateDayInFirebase(dayIndex);
	}

	$scope.getStart = function(act, day){
		var acts = day.getActivities();
		var start = day._start;
		var i = 0;
		while (i < act){
			start += acts[i].getLength();
			i += 1;
		}
		var hours = Math.floor(start/60);
		var minutes = start % 60;
		if(hours<10){
			hours = "0"+hours;
		}
		if(minutes<10){
			minutes = "0"+minutes;
		}
		return  hours + ":" + minutes;
	} 

	$scope.setEdit = function (day, act){
		Meeting.setEdit(day,act);
	}

	$scope.removeDay = function(day) {
		Meeting.removeDay(day);
	}

	$scope.getColor = function (id) {
		return Meeting.getColor(id);
	}

	$scope.activityPercent = function (day,type) {
		var total=0;
		var typelist = [0,0,0,0,0];
		var activities = day.getActivities();
		for (a in activities){
			typelist[activities[a].getTypeId()]+=activities[a].getLength();
			total+=activities[a].getLength();
		}	
		return (typelist[type]/total);
	}

	$scope.allowDrop = function(ev, ui) {
		ev.preventDefault();
	}

	$scope.drag = function(ev, ui) {
	    information["activity"] = ev.target.id;
	    information["day"] = ev.target.parentNode.parentNode.id;
	}

	//if drop on activity
	$scope.drop = function(ev, ui)  {
		console.log("in drop");
	    ev.preventDefault();
	    var activity = information["activity"];
	    var day = information["day"];

		if (ev.target.parentNode.parentNode.id == "parked" || day =="parkedTable"){
			if (ev.target.parentNode.parentNode.id == "parked" && day =="parkedTable"){
				Meeting.moveActivity(null, activity, null, ev.target.id);
			} else if(day == "parkedTable"){
				Meeting.moveActivity(null, activity, ev.target.parentNode.parentNode.id, ev.target.id);
			} else {
				Meeting.moveActivity(day, activity, null, ev.target.id);
			}
		} else {
			Meeting.moveActivity(day, activity, ev.target.parentNode.parentNode.id, ev.target.id);
		}
	}

	//if drop on day or parked list, both are needed since days and activities both are identified by a number
	//as such there is no way of knowing if ev.target.id = 1 refers to the day or activity
	$scope.dropInArea = function(ev,ui){
		console.log("in dropInArea");
		ev.preventDefault();
	    var activity = information["activity"];
	    var day = information["day"];

		if (ev.target.id == "parked" || day =="parkedTable"){
			if (ev.target.id == "parked" && day =="parkedTable"){
				Meeting.appendActivity(null, activity, null);
			} else if(day == "parkedTable"){
				Meeting.moveActivity(null, activity, ev.target.id);
			} else {
				Meeting.appendActivity(day, activity, null);
			}
		} else {
			Meeting.appendActivity(day, activity, ev.target.id);
		}
	}

	$scope.getIcon = function(day){
		return Meeting.getIcon(day);
	}

	$scope.getTemperature = function(day){
		return Meeting.getTemperature(day);
	}

});