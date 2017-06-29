
meetingPlannerApp.controller('ActivityCtrl', function ($scope,Meeting) {

//calls on model to create a new activity
$scope.newActivity = function (name,length,typeid,description) {
       if(name == null){
        name = "";
       }
       if(length == null){
        length = 0;
       }
       if(typeid == null){
        typeid = 4;
       }
       if(description == null){
        description = "";
       }
       Meeting.setActivityVariables(name,length,typeid,description);
}

//change the type of selected activity
$scope.changeType = function(typeid) {
	$scope.typeid=typeid;

}

//get array containing information about which day and activity was chosen
$scope.getEdit = function() {
	return Meeting.getEdit();
}

//get selected activity
$scope.getActivity = function(){
  var toEdit = Meeting.getEdit();
  if (toEdit[0] == null){
    var acts = Meeting.getParkedActivities();
  } else {
    var days = Meeting.getDays()
    var day = days[toEdit[0]];
    var acts = day.getActivities();
  }
  return acts[toEdit[1]];
}

//functions for getting activity fields
$scope.getType = function () {
  var types = Meeting.getActivityType();
  return types;
}

$scope.getName = function() {
  	return this.getActivity().getName();
}

$scope.getLength = function() {
  	return this.getActivity().getLength();
}

$scope.getDescription = function() {
  	return this.getActivity().getDescription();
}

//change an existing activity
$scope.updateActivity = function(name,length,typeid,description){
	var act = this.getActivity();
	if(name != null)
		act.setName(name);
	if(length != null)
		act.setLength(length);
	if(typeid != null)
		act.setTypeId(typeid);
	if(description != null)
		act.setDescription(description);
}

//remove selected activity
$scope.removeActivity = function(){
  Meeting.removeActivity(this.getEdit()[0],this.getEdit()[1]);
}
 
});