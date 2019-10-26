

$(".togBut").click(function(){
   if($(this).text()=="Unselect"){
       $(".iToggle").addClass("toggle");
       $(this).text("Select");
   } else{
    $(".iToggle").removeClass("toggle");
        $(this).text("Unselect");
   }
});


// $(".iToggle").click(function(){
//  if($("input[type='checkbox'].iToggle:checked").length >0){
//      $("cbutton").removeClass("toggle");
//  }
//  else{
//     $("cbutton").addClass("toggle");
//  }
// });
// $('input[type="checkbox"]').click(function(){
//     //If more than 15 are checked - don't allow
//     if (this.checked && $('input:checked').length > 0) {
//         $("cbutton").removeClass("toggle");
//     }
//     else{
//             $("cbutton").addClass("toggle");
//          }
//   });
// var checkboxes = document.querySelectorAll('input[type="checkbox"]');
// var checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
// $(".iToggle").click(function(){
//     checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
//     if(checkedOne.length==0){
//         $("cbutton").addClass("toggle");
//     }
//     else{
//         $("cbutton").removeClass("toggle");    }
// });



