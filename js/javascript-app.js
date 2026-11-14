$(document).ready(function(){
"use strict";

//HIDE PROMPTS ONLOAD
$("#js-modal").hide();
$("#js-undo").hide();

//***** BROWSER STORAGE *****//

//LISTS ARE SAVED AS [{ name: "Groceries", items: ["apples", "honey"] }]
var lists = JSON.parse(localStorage.getItem("lists"));
var current = Number(localStorage.getItem("current")) || 0;

//FIRST VISIT AFTER THE UPDATE: MOVE THE ORIGINAL LIST INTO "GROCERIES"
if(!lists){
	var oldItems = $("<ul>" + (localStorage.getItem("list") || "") + "</ul>").children().map(function(){
		return $(this).text();
	}).get();
	lists = [{ name: "Groceries", items: oldItems }];
}
if(current >= lists.length){
	current = 0;
}

function save(){
	localStorage.setItem("lists", JSON.stringify(lists));
	localStorage.setItem("current", current);
}

//***** SHOW THE CURRENT LIST AND TABS *****//
function render(){
	$("#list").empty();
	$.each(lists[current].items, function(i, item){
		$("<li>").text(item).appendTo("#list");
	});

	$("#js-tabs").empty();
	$.each(lists, function(i, list){
		$("<button>").text(list.name).toggleClass("is-active", i === current).appendTo("#js-tabs");
	});
	$("#js-tabs .is-active")[0].scrollIntoView({ block: "nearest", inline: "nearest" });

	//ONLY OFFER DELETE WHEN THERE'S MORE THAN ONE LIST
	$("#js-delete").toggle(lists.length > 1);

	$(".emptyState").text("Nothing on your list yet.");
	emptyState();
}

//SHOW MESSAGE IF LIST IS EMPTY
function emptyState(){
	if($("#list li").length === 0){
		$(".emptyState").show();
	}else{
		$(".emptyState").hide();
	}
}

save();
render();

//***** DIALOG (ADD ITEM, NEW LIST, EDIT LIST NAME) *****//
var mode;

function openDialog(newMode, title, placeholder, value){
	$("nav").removeClass("open");
	mode = newMode;
	$(".modal__title").text(title);
	$("#js-modal input").attr("placeholder", placeholder).val(value);
	$("#btnAdd").text(newMode === "rename" ? "Save" : "Add");
	$(".modal").removeClass("is-hidden");
	$("#js-modal").show();
	$("#js-modal input").focus();
}

$("#js-add").on("click", function(event){
	event.stopPropagation();
	openDialog("item", "Add item", "Item name", "");
});

$("#js-new-list").on("click", function(event){
	event.stopPropagation();
	openDialog("new-list", "New list", "List name", "");
});

$("#js-rename").on("click", function(){
	openDialog("rename", "Edit list name", "List name", lists[current].name);
});

//HIDE PROMPT IF USER CANCELS
$("#btnCancel").on("click", function(){
	$("#js-modal").hide();
});

//SAVE WHAT WAS TYPED
$("#btnAdd").on("click", function(){
	var value = $.trim($("#js-modal input").val());
	if(value === ""){
		$(".modal__title").text(mode === "item" ? "Please type an item" : "Please type a list name");
		return;
	}
	if(mode === "item"){
		lists[current].items.push(value);
	}
	if(mode === "new-list"){
		lists.push({ name: value, items: [] });
		current = lists.length - 1;
	}
	if(mode === "rename"){
		lists[current].name = value;
	}
	save();
	render();
	$("#js-modal").hide();
});

//SUBMIT ON ENTER KEYPRESS
$("#js-modal input").on("keypress", function(e){
	if(e.keyCode === 13){
		$("#btnAdd").click();
		$(this).blur();
	}
});

//***** REMOVE LIST ITEM *****//
$("#list").on("click", "li", function(){
	//IF THE MENU IS OPEN, THIS TAP ONLY CLOSES IT
	if($("nav").hasClass("open")){
		return;
	}
	var index = $(this).index();
	var item = lists[current].items.splice(index, 1)[0];
	save();
	$(this).remove();

	//CHECK FOR EMPTY LIST
	$(".emptyState").text("You’re all caught up.");
	emptyState();

	showUndo(item, index);
});

//***** UNDO *****//
var removed, undoTimer;

//SHOW "ITEM REMOVED · UNDO" FOR 5s
function showUndo(item, index){
	removed = { item: item, index: index, list: current };
	$(".undo__text").text(item + " removed");
	$("#js-undo").show();
	clearTimeout(undoTimer);
	undoTimer = setTimeout(hideUndo, 5000);
}

function hideUndo(){
	clearTimeout(undoTimer);
	$("#js-undo").hide();
}

//PUT THE ITEM BACK WHERE IT WAS (EVEN IF ANOTHER TAB IS OPEN)
$(".undo__btn").on("click", function(){
	lists[removed.list].items.splice(removed.index, 0, removed.item);
	current = removed.list;
	save();
	render();
	hideUndo();
});

//***** TABS *****//
$("#js-tabs").on("click", "button", function(){
	current = $(this).index();
	save();
	render();
});

//DELETE THE CURRENT LIST (ASKS FIRST)
$("#js-delete").on("click", function(){
	if(confirm("Delete “" + lists[current].name + "”? Its items will be removed too.")){
		lists.splice(current, 1);
		current = Math.max(current - 1, 0);
		save();
		render();
		hideUndo();
	}
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
