//The meeting model
meetingPlannerApp.factory('Meeting', function($resource, $q, $cookieStore) {

	var user = $cookieStore.get("uid");
	console.log(user);

	var toEdit = [];
	var days = [];
	var parkedActivities = [];

	var firebaseRef = new Firebase('https://flickering-torch-6459.firebaseio.com/');	

	// The possible activity types and their colors
	var ActivityType = ["Presentation","Group Work","Discussion","Break", "Other"];
	var colors = ["#ff99ff", "#aaff80", "#99e6ff", "#ffff80", "#bfbfbf"];

	var api_key = "b43895e6f2430ca306266df7a539c71a";
	var city = "Stockholm";

	var weather = [];

	//http://api.openweathermap.org/data/2.5/forecast?q=Stockholm&APPID=b43895e6f2430ca306266df7a539c71a'
	this.Weather = $resource('http://api.openweathermap.org/data/2.5/forecast', {
		q: city,
		APPID : api_key
	});

	//set user
	this.setUser = function(uid){
		if (days.length == 0){
			this.loadDays(uid);
		}
		user = uid;
		$cookieStore.put("uid", uid);
	}

	//gets the users schedule from firebase
	this.loadDays = function(uid){
		firebaseRef.child(uid).once("value", function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
				var childData = childSnapshot.val();
				if(childSnapshot.key() == "parked"){
					var a = JSON.parse(childData);
					for(i=0; i<a.length; i++) {
						var act = JSON.parse(a[i]);
						parkedActivities.push(new Activity(act._name, act._length, act._typeid, act._description));
					}
				} else {
					var day = convertJsonToDay(childData);
					days.push(day);
				}
			});
			$q.all(days).then(function(){}); //update view when done loading
			$q.all(parkedActivities).then(function(){}); //update view when done loading
		});
	}

	//writes all days to firebase
	this.writeDaysToFirebase = function(){
		firebaseRef.child(user).set({});
		for(i=0; i<days.length; i++){
			firebaseRef.child(user).child(i).set(JSON.stringify(days[i]));
		}
	}

	//writes a day to firebase
	this.updateDayInFirebase = function(day){
		if(day == null){
			firebaseRef.child(user).child("parked").set(JSON.stringify(parkedActivities));	
		} else {
			firebaseRef.child(user).child(day).set(JSON.stringify(days[day]));
		}
	}

	this.getActivityType = function () {
		return ActivityType;
	}

	this.getColor = function(id){
		return colors[id];
	}

	//gets the wether for the next five days from openweathermap
	this.getWeather = function(){
		this.Weather.get({},function(data){
			for(i = 0; i < 5; ++i){
				weather[i] = data.list[8*i];
			}
		},function(data){
			console.log("There was an error");
		});
		$q.all(weather);
	}

	//check if day has a wether forecast (i.e. the day is within five days from today) 
	this.hasWeather = function(day){
		var dayDate = new Date(days[day]._date);
		var limit = new Date();
		limit.setDate(limit.getDate() + 5);
		return dayDate < limit;
	}

	//gets a wether icon for a day
	this.getIcon = function(day){
		var d = new Date();
		var dd = new Date(days[day]._date);
		var diffDays = Math.round(Math.abs((d.getTime() - dd.getTime())/(24*60*60*1000)));
		if (!this.hasWeather(day) || weather[diffDays] == null)
			return "../icons/white.png";
		else
			return "../icons/"+weather[diffDays].weather[0].icon+".png";
	}

	//gets the temperature of a day
	this.getTemperature = function(day){
		var d = new Date();
		var dd = new Date(days[day]._date);
		var diffDays = Math.round(Math.abs((d.getTime() - dd.getTime())/(24*60*60*1000)));
		if (!this.hasWeather(day) || weather[diffDays] == null)
			return "Day is too far away for forecast";
		else
			return Math.round(weather[diffDays].main.temp-273.15)+"° Celcius";
	}

	this.getDays = function(){
		return days;
	};
	
	this.getParkedActivities = function(){
		return parkedActivities;
	};

	// adds a new day. if startH and startM (start hours and minutes)
	// are not provided it will set the default start of the day to 08:00
	this.addDay = function (startH,startM) {
		var day;
		if(startH){
			day = new Day(startH,startM);
		} else {
			day = new Day(8,0);
		}
		this.getWeather();
		days.push(day);
		this.updateDayInFirebase(days.length-1);
		return day;
	};

	//get an array that tells what day and activity is currently being edited
	this.getEdit = function() {
		return toEdit;
	};

	//saves what day and activity is currently selected
	this.setEdit = function (day, act){
		toEdit[0] = day;
		toEdit[1] = act;
	};
	
	//adds a parked activity
	this.setActivityVariables = function(name,length,typeid,description) {
		this.addParkedActivity(new Activity(name,length,typeid,description));
	};

	//add an activity to a day or to parked activities if day is null
	this.addActivity = function (activity,day,position) {
		if(day != null) {
			days[day]._addActivity(activity,position);
		} else {
			if (position != null) {
				parkedActivities.splice(position,0,activity);
			}
			else parkedActivities.push(activity);
		}
		this.updateDayInFirebase(day);
	}
		
	// add an activity to parked activities
	this.addParkedActivity = function(activity,position){
		this.addActivity(activity,null,position);
	};
	
	// remove an activity on provided position from parked activites 
	this.removeParkedActivity = function(position) {
		act = parkedActivities.splice(position,1)[0];
		this.updateDayInFirebase(null);
		return act;
	};
		
	//removes an activity from a day or parkedactivities
	this.removeActivity = function(day,act) {
		if (day == null)
			this.removeParkedActivity(act);
		else {
			days[day]._removeActivity(act);
		}
		this.updateDayInFirebase(day);
	};

	//removes a day
	this.removeDay = function(day) {
		days.splice(day,1);
		this.writeDaysToFirebase(day);
	};

	//moves an activity between days or from/to parkedactivities
	this.moveActivity = function(oldday, oldposition, newday, newposition) {
		if(oldday !== null && oldday == newday) {
			days[oldday]._moveActivity(oldposition,newposition);
		}else if(oldday == null && newday == null) {
			var activity = this.removeParkedActivity(oldposition);
			this.addParkedActivity(activity,newposition);
		}else if(oldday == null) {
			var activity = this.removeParkedActivity(oldposition);
			days[newday]._addActivity(activity,newposition);
		}else if(newday == null) {
			var activity = days[oldday]._removeActivity(oldposition);
			this.addParkedActivity(activity,newposition);
		} else {
			var activity = days[oldday]._removeActivity(oldposition);
			days[newday]._addActivity(activity,newposition);
		}
		
		this.updateDayInFirebase(oldday);
		this.updateDayInFirebase(newday);
	};

	//appends an activity to a day or parkedactivities
	this.appendActivity = function(oldday, position, newday) {
		if(oldday !== null && oldday == newday) {
			var activity = days[oldday]._removeActivity(position);
			days[oldday]._addActivity(activity);
		} else if(oldday == null && newday == null) {
			var activity = this.removeParkedActivity(position);
			this.addActivity(activity);
		} else if(oldday == null) {
			var activity = this.removeParkedActivity(position);
			days[newday]._addActivity(activity);
		} else if(newday == null) {
			var activity = days[oldday]._removeActivity(position);
			this.addParkedActivity(activity);
		} else {
			var activity = days[oldday]._removeActivity(position);
			days[newday]._addActivity(activity);
		}
		
		this.updateDayInFirebase(oldday);
		this.updateDayInFirebase(newday);
	};

	//converts json to A Day
	convertJsonToDay = function(jsonDay){
		var d = new Day(0,0); 
		JSON.parse(jsonDay, function(k, v){
			if(k == '_start'){
				d._start = v;
			} else if(k == '_date'){
				d._date = v;
			}else if(k == ''){
				return;
			} else if(!isNaN(k)){
				var act = JSON.parse(v);
				d._addActivity(new Activity(act._name, act._length, act._typeid, act._description));
			}
		});
		return d;
	}

	 
	//Activity constructor
	function Activity(name,length,typeid,description){
		var _name = name;
		var _length = length;
		var _typeid = typeid;
		var _description = description;

		//converts an activity to json
		this.toJSON = function(){
			return ('{"_name":"'+ this.getName() +'", "_length":'+ this.getLength() +', "_typeid":'+ this.getTypeId() +', "_description":"'+ this.getDescription() +'"}');
		}
		
		// sets the name of the activity
		this.setName = function(name) {
			_name = name;
		}

		// get the name of the activity
		this.getName = function() {
			return _name;
		}
		
		// sets the length of the activity
		this.setLength = function(length) {
			_length = length;
		}

		// get the name of the activity
		this.getLength = function() {
			return _length;
		}
		
		// sets the typeid of the activity
		this.setTypeId = function(typeid) {
			_typeid = typeid;
		}

		// get the type id of the activity
		this.getTypeId = function() {
			return _typeid;
		}
		
		// sets the description of the activity
		this.setDescription = function(description) {
			_description = description;
		}

		// get the description of the activity
		this.getDescription = function() {
			return _description;
		}
		
		// get the string representation of the activity type
		this.getType = function () {
			return ActivityType[_typeid];
		}
	}


	//Day constructor
	function Day(startH,startM) {
		var d = new Date();

		//sets the date to the current day
		this._date = d.getFullYear().toString()+"-";
		if (d.getMonth() < 9)
			this._date = this._date + "0" +(d.getMonth()+1).toString();
		else
			this._date = this._date + (d.getMonth()+1).toString();
		this._date = this._date+"-"+(d.getDate()).toString();

		this._start = startH * 60 + startM; //starttime in minutes
		this._activities = [];

		// sets the start time to a new value
		this.setStart = function(startH,startM) {
			this._start = startH * 60 + parseInt(startM);
		}

		// sets the date to a new value
		this.setDate = function(date){
			this._date = date;
		}

		// returns the total length of all acitivities in minutes
		this.getTotalLength = function () {
			var totalLength = 0;
			this._activities.forEach(function(activity){
				totalLength += activity.getLength();
			});
			return totalLength;
		}
		
		// returns the string representation Hours:Minutes of the end time of the day
		this.getEnd = function() {
			var end = this._start + this.getTotalLength();
			var hours = Math.floor(end/60)%24;
			var minutes = end % 60;
			if(hours<10){
				hours = "0"+hours;
			}
			if(minutes<10){
				minutes = "0"+minutes;
			}
			return  hours + ":" + minutes;
		}
		
		// returns the string representation Hours:Minutes of the start time of the day
		this.getStart = function() {
			var hours = Math.floor(this._start/60);
			var minutes = this._start % 60;
			if(hours<10){
				hours = "0"+hours;
			}
			if(minutes<10){
				minutes = "0"+minutes;
			}
			return  hours + ":" + minutes;
		}
		
		// get the date
		this.getDate = function(){
			return this._date;
		}

		// returns the length (in minutes) of activities of certain type
		this.getLengthByType = function (typeid) {
			var length = 0;
			this._activities.forEach(function(activity){
				if(activity.getTypeId() == typeid){
					length += activity.getLength();
				}
			});
			return length;
		}
		
		// get all activities
		this.getActivities = function(){
			return this._activities;
		}

		// adds an activity to specific position
		// if the position is not provided then it will add it to the 
		// end of the list
		this._addActivity = function(activity,position){
			if(position != null){
				this._activities.splice(position,0,activity);
			} else {
				this._activities.push(activity);
			}
		}
		
		// removes an activity from specific position
		this._removeActivity = function(position) {
			return this._activities.splice(position,1)[0];
		}
		
		// moves activity inside one day
		this._moveActivity = function(oldposition,newposition) {
			// In case new position is greater than the old position and we are not moving
			// to the last position of the array
			if(newposition > oldposition && newposition < this._activities.length - 1) {
				newposition--;
			}
			var activity = this._removeActivity(oldposition);
			this._addActivity(activity, newposition);
		}
	}

	//load the users schedule
	if (user != null && days.length == 0){
		this.loadDays(user);
	}

	return this;
});