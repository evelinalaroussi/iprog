meetingPlannerApp.controller('HomePageCtrl', function ($scope,Meeting) {
		$("#registerView").hide();

	$scope.regi = function () {
       $("#loginView").hide();
       $("#registerView").show();
   };


	$scope.register = function (reg) {
       $("#loginView").hide();
       $("#registerView").show();
       console.log(reg);

   };

   $scope.login = function(cred) {
   	console.log(cred);
   }

  $scope.auth = function(){
    var ref = new Firebase("https://flickering-torch-6459.firebaseio.com");
    ref.authWithOAuthPopup("google", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
        Meeting.setUser(authData.uid);
        window.location = "#/schedule";
      }
    });
  }
});