$(document).ready(function(){
"use strict";

//HIDE PROMPTS ONLOAD
$("#js-modal").hide();
$("#js-undo").hide();
	
//REMOVE SHADOW & SHOW GRAPHIC IF LIST IS EMPTY
function emptyState(){
	var emptyStateGraphic = $(".emptyState");
	if($("ul li").length === 0){
		emptyStateGraphic.removeClass("is-hidden").show();
	}else if($("ul li").length >= 1){
		emptyStateGraphic.addClass("is-hidden").hide();
	}else{
		emptyStateGraphic.addClass("is-hidden").hide();
	}
}

//TEST FOR EMPTY STATE
window.onunload = unloadPage;
function unloadPage(){
	emptyState();
}

//***** LIST LOGIC && BROWSER STORAGE *****//
		
//SHOW PROMPT WHEN ON FAB TAP/CLICK
$("#js-add").on("click", function(event){
  var $input = $("input");
  $input.val("");
  $(".modal__title").html("Add item");
  event.preventDefault();
  event.stopPropagation();
	$(".modal").removeClass("is-hidden");
  $("#js-modal").show();
  $input.focus();
});

//HIDE PROMPT IF USER CANCELS
$("#btnCancel").on("click", function(){
	$("#js-modal").hide();
});

//SUBMIT TASK TO LIST ON FAB TAP/CLICK
$("#btnAdd").on("click", function(){
	var $item = $("input").val();
  if($item === ""){
		$(".modal__title").html("Please type an item");
  }else if($item === null){
		return false;
  }else{
		$("ul").append("<li>" + $item + "</li>");
		emptyState();
		$(".emptyState").hide();
		$("#js-modal").hide();
	  }
	
  $("#form")[0].reset();
  var list = $('#list').html();
  localStorage.setItem('list', list);
  return false;
  
});

//SUBMIT TASK ON ENTER KEYPRESS
$('input').on("keypress", function(e){
	if(e.keyCode === 13 ){
	 $("#btnAdd").click();
	 $("input").blur();
	}
});

//SHOW LIST
if(localStorage.getItem('list')){	
  $('#list').html(localStorage.getItem('list'));
	emptyState();
}
    
//REMOVE LIST ITEM
$("ul").on("click", "li", function(){
	//IF THE MENU IS OPEN, THIS TAP ONLY CLOSES IT
	if($("nav").hasClass("open")){
		return;
	}
	var index = $(this).index();
	$(this).remove();
	var i = $(this).text();

	//GET CURRENT LIST AS A STRING
	var currentList = localStorage.getItem('list');

	//REPLACE THE CLICKED ITEM WITH A BLANK STRING
	var newList = currentList.replace('<li>' + i + '</li>', '');

	//UPDATE LOCALSTORAGE WITH UPDATED LIST
	localStorage.setItem('list', newList);
	
	//CHECK FOR EMPTY LIST
	$(".emptyState").text("You’re all caught up.");
	emptyState();

	showUndo($(this), index);
});

//***** UNDO *****//
var removed, undoTimer;

//SHOW "ITEM REMOVED · UNDO" FOR 5s
function showUndo(item, index){
	removed = { item: item, index: index };
	$(".undo__text").text(item.text() + " removed");
	$("#js-undo").show();
	clearTimeout(undoTimer);
	undoTimer = setTimeout(function(){
		$("#js-undo").hide();
	}, 5000);
}

//PUT THE ITEM BACK WHERE IT WAS
$(".undo__btn").on("click", function(){
	if(removed.index === 0){
		$("#list").prepend(removed.item);
	}else{
		$("#list li").eq(removed.index - 1).after(removed.item);
	}
	localStorage.setItem('list', $('#list').html());
	emptyState();
	clearTimeout(undoTimer);
	$("#js-undo").hide();
});
		
//***** DARK MODE *****//
$("#js-theme").on("click", function(){
	var theme = $("html").attr("data-theme") === "dark" ? "light" : "dark";
	$("html").attr("data-theme", theme);
	localStorage.setItem("theme", theme);
});

//***** MENU *****//
$(".nav-toggle").on("click", function(event){
	event.stopPropagation();
	$("nav").toggleClass("open");
});

//CLOSE MENU ON ANY OTHER TAP/CLICK
$(document).on("click", function(){
	$("nav").removeClass("open");
});

});
