import { MODULE_ID, addCount, getCount, grant, setCount, spend } from "./free-actions.js";
import { FreeActionsWindow, editCount } from "./actions-window.js";

/**
 * The free actions counter next to the rest buttons on a character sheet, for the owner and the GM. The GM clicks it
 * to set the number; for the player it only shows what is left.
 */
function addSheetCounter(sheet, element) {
	const actor = sheet.document;
	if (actor?.type !== "character" || !(game.user.isGM || actor.isOwner)) {
		return;
	}
	const section = element.querySelector(".downtime-section");
	if (!section) {
		return;
	}
	section.querySelector(".mist-free-actions-counter")?.remove();
	const button = document.createElement("button");
	button.type = "button";
	button.classList.add("mist-free-actions-counter");
	button.dataset.tooltip = game.i18n.localize(game.user.isGM ? "MIST_FREE.CounterGM" : "MIST_FREE.CounterPlayer");
	button.innerHTML = `<i class="fa-solid fa-hourglass-half" inert></i> <span>${getCount(actor)}</span>`;
	button.addEventListener("click", event => {
		event.preventDefault();
		event.stopPropagation();
		if (game.user.isGM) {
			editCount(actor);
		}
	});
	section.prepend(button);
}

/** GM: a button in the Actors sidebar header, next to "Create Actor", opens the free actions window. */
function addDirectoryButton(app, element) {
	if (!game.user.isGM) {
		return;
	}
	const root = element instanceof HTMLElement ? element : element?.[0];
	const actions = root?.querySelector(".header-actions");
	if (!actions || actions.querySelector(".mist-free-actions-button")) {
		return;
	}
	const button = document.createElement("button");
	button.type = "button";
	button.classList.add("mist-free-actions-button");
	button.innerHTML = `<i class="fa-solid fa-hourglass-half" inert></i> ${game.i18n.localize("MIST_FREE.Title")}`;
	button.addEventListener("click", event => {
		event.preventDefault();
		FreeActionsWindow.show();
	});
	actions.append(button);
}

Hooks.once("init", () => {
	foundry.applications.handlebars.loadTemplates([`modules/${MODULE_ID}/templates/actions.hbs`]);
});

Hooks.once("ready", () => {
	game.modules.get(MODULE_ID).api = {
		/** A character's free actions. */
		get: actor => getCount(actor),
		/** Adds (or with a negative number removes) free actions, never below 0. */
		add: (actor, amount) => addCount(actor, amount),
		/** Sets the number of free actions. */
		set: (actor, value) => setCount(actor, value),
		/** Spends one free action if there is any; returns false at 0. */
		spend: (actor, reason) => spend(actor, reason),
		/** GM: adds free actions to several characters at once. */
		grant: (actors, amount) => grant(actors, amount),
		/** GM: the free actions window. */
		show: () => FreeActionsWindow.show()
	};
});

Hooks.on("renderActorSheetV2", addSheetCounter);
Hooks.on("renderActorDirectory", addDirectoryButton);
