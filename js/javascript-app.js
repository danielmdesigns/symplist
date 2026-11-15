$(document).ready(function(){
"use strict";

//HIDE PROMPTS ONLOAD
$("#js-modal, #js-confirm, #js-homescreen, #js-undo, #js-banner").hide();

//ANIMATION SPEED (MATCHES --speed IN app.css), OFF IF THE DEVICE ASKS FOR REDUCED MOTION
var speed = 200;
$.fx.off = matchMedia("(prefers-reduced-motion: reduce)").matches;

//***** BROWSER STORAGE *****//

//LISTS ARE SAVED AS [{ name: "My list", items: ["apples", "honey"] }]
var lists = JSON.parse(localStorage.getItem("lists"));
var current = Number(localStorage.getItem("current")) || 0;

//FIRST VISIT AFTER THE UPDATE: MOVE THE ORIGINAL LIST INTO "MY LIST"
if(!lists){
	var oldItems = $("<ul>" + (localStorage.getItem("list") || "") + "</ul>").children().map(function(){
		return $(this).text();
	}).get();
	lists = [{ name: "My list", items: oldItems }];
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

	//TABS, EDIT AND DELETE ONLY SHOW ONCE THERE'S MORE THAN ONE LIST
	$(".tabs, #js-rename, #js-delete").toggle(lists.length > 1);
	$("#js-tabs .is-active")[0].scrollIntoView({ block: "nearest", inline: "nearest" });

	$(".emptyState").text("Nothing on your list yet.");
	emptyState();
}

//SHOW MESSAGE IF LIST IS EMPTY
function emptyState(){
	if($("#list li").not(".is-removing").length === 0){
		$(".emptyState").fadeIn(speed);
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
	$("#js-modal .modal__title").text(title);
	$("#js-modal input").attr("placeholder", placeholder).val(value);
	$("#btnAdd").text(newMode === "rename" ? "Save" : "Add");
	$("#js-modal").fadeIn(speed);
	$("#js-modal input").focus();
}

$("#js-add").on("click", function(event){
	event.stopPropagation();
	openDialog("item", "Add item", "Item name", "");
});

//NEW LIST: FROM THE MENU, OR THE + AT THE END OF THE TABS
$("#js-new-list, .tabs__new").on("click", function(){
	openDialog("new-list", "New list", "List name", "");
});

$("#js-rename").on("click", function(){
	openDialog("rename", "Edit list name", "List name", lists[current].name);
});

//HIDE PROMPT IF USER CANCELS
$("#btnCancel").on("click", function(){
	$("#js-modal").fadeOut(speed);
});

//SAVE WHAT WAS TYPED
$("#btnAdd").on("click", function(){
	var value = $.trim($("#js-modal input").val());
	if(value === ""){
		$("#js-modal .modal__title").text(mode === "item" ? "Please type an item" : "Please type a list name");
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
	if(mode === "item"){
		$("#list li").last().addClass("is-new");
	}
	$("#js-modal").fadeOut(speed);
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
	//IF THE MENU IS OPEN, THIS TAP ONLY CLOSES IT. IGNORE ROWS ALREADY ON THEIR WAY OUT
	if($("nav").hasClass("open") || $(this).hasClass("is-removing")){
		return;
	}
	var index = $("#list li").not(".is-removing").index(this);
	var item = lists[current].items.splice(index, 1)[0];
	save();

	//FADE THE ROW OUT AND CLOSE THE GAP
	$(this).addClass("is-removing").animate({ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }, speed, function(){
		$(this).remove();
	});

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
	$("#js-banner").hide();
	$(".undo__text").text(item + " removed");
	$("#js-undo").stop(true, true).fadeIn(speed);
	clearTimeout(undoTimer);
	undoTimer = setTimeout(hideUndo, 5000);
}

function hideUndo(){
	clearTimeout(undoTimer);
	$("#js-undo").fadeOut(speed);
}

//PUT THE ITEM BACK WHERE IT WAS (EVEN IF ANOTHER TAB IS OPEN)
$(".undo__btn").on("click", function(){
	lists[removed.list].items.splice(removed.index, 0, removed.item);
	current = removed.list;
	save();
	render();
	$("#list li").eq(removed.index).addClass("is-new");
	hideUndo();
});

//***** TABS *****//
$("#js-tabs").on("click", "button", function(){
	current = $(this).index();
	save();
	render();
	$("#form").hide().fadeIn(speed);
});

//***** DELETE LIST (ASKS FIRST) *****//
$("#js-delete").on("click", function(){
	$("#js-confirm .modal__title").text("Delete “" + lists[current].name + "”?");
	$("#js-confirm").fadeIn(speed);
});

$("#btnKeep").on("click", function(){
	$("#js-confirm").fadeOut(speed);
});

$("#btnDelete").on("click", function(){
	lists.splice(current, 1);
	current = Math.max(current - 1, 0);
	save();
	render();
	hideUndo();
	$("#js-confirm").fadeOut(speed);
});

//***** ADD TO HOME SCREEN BANNER *****//
//ONLY IN THE BROWSER ON PHONES AND TABLETS, NEVER WHEN OPENED FROM THE HOME SCREEN
var installPrompt;
var reminder = localStorage.getItem("homescreenReminder");
var standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

//ANDROID CHROME CAN SHOW ITS OWN INSTALL PROMPT. SAVE IT FOR THE HOW BUTTON
window.addEventListener("beforeinstallprompt", function(event){
	event.preventDefault();
	installPrompt = event;
});

//SHOW THE BANNER RIGHT AWAY (UNLESS SNOOZED OR TURNED OFF)
if(!standalone && matchMedia("(hover: none)").matches && reminder !== "off" && Date.now() > Number(reminder || 0)){
	setTimeout(function(){
		$("#js-banner").fadeIn(speed);
	}, 1500);
}

//ASK AGAIN IN 3 DAYS
function remindLater(){
	localStorage.setItem("homescreenReminder", Date.now() + 3 * 24 * 60 * 60 * 1000);
	$("#js-banner, #js-homescreen").fadeOut(speed);
}

//HOW: ANDROID OPENS ITS INSTALL PROMPT, EVERYONE ELSE GETS THE STEPS
$("#btnHow").on("click", function(event){
	event.stopPropagation();
	if(installPrompt){
		installPrompt.prompt();
		installPrompt = null;
		remindLater();
		return;
	}
	$("nav").removeClass("open");
	$(".homescreen-ios").toggle(ios);
	$(".homescreen-android").toggle(!ios);
	$("#js-homescreen").fadeIn(speed);
});

$("#btnBannerClose, #btnGotIt").on("click", remindLater);

//DON'T REMIND ME: NEVER SHOW IT AGAIN
$("#btnNever").on("click", function(){
	localStorage.setItem("homescreenReminder", "off");
	$("#js-banner, #js-homescreen").fadeOut(speed);
});

//***** DARK MODE *****//
$("#js-theme").on("click", function(){
	var theme = $("html").attr("data-theme") === "dark" ? "light" : "dark";
	function apply(){
		$("html").attr("data-theme", theme);
	}
	//CROSS-FADE THE WHOLE PAGE WHERE THE BROWSER SUPPORTS IT
	if(document.startViewTransition && !$.fx.off){
		document.startViewTransition(apply);
	}else{
		apply();
	}
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
