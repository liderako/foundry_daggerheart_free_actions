import { MODULE_ID, addCount, getCount, grant, listCharacters, setCount } from "./free-actions.js";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * The GM's free actions window: every player character with their count (type a number, or −1 / +1), and a timeskip
 * line on top to add free actions to the ticked characters at once.
 */
export class FreeActionsWindow extends HandlebarsApplicationMixin(ApplicationV2) {
	static DEFAULT_OPTIONS = {
		id: `${MODULE_ID}-window`,
		classes: ["mist-free-actions"],
		window: { title: "MIST_FREE.Title", icon: "fa-solid fa-hourglass-half", resizable: true },
		position: { width: 440, height: "auto" },
		actions: {
			minus: FreeActionsWindow.#onMinus,
			plus: FreeActionsWindow.#onPlus,
			grant: FreeActionsWindow.#onGrant
		}
	};

	static PARTS = {
		body: { template: `modules/${MODULE_ID}/templates/actions.hbs` }
	};

	static #instance = null;

	static show() {
		if (!game.user.isGM) {
			return null;
		}
		FreeActionsWindow.#instance ??= new FreeActionsWindow();
		FreeActionsWindow.#instance.render({ force: true });
		return FreeActionsWindow.#instance;
	}

	constructor(options) {
		super(options);
		/** The timeskip amount and who it goes to, kept across renders. */
		this.amount = 20;
		this.unticked = new Set();
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.amount = this.amount;
		context.characters = listCharacters().map(actor => ({
			id: actor.id,
			name: actor.name,
			img: actor.img,
			count: getCount(actor),
			ticked: !this.unticked.has(actor.id)
		}));
		return context;
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.querySelector("input[name=amount]")?.addEventListener("change", event => {
			this.amount = Math.floor(Number(event.target.value) || 0);
		});
		for (const input of this.element.querySelectorAll("input[data-tick]")) {
			input.addEventListener("change", () => {
				if (input.checked) {
					this.unticked.delete(input.dataset.tick);
				} else {
					this.unticked.add(input.dataset.tick);
				}
			});
		}
		for (const input of this.element.querySelectorAll("input[data-count]")) {
			input.addEventListener("change", () => {
				const actor = game.actors.get(input.dataset.count);
				if (actor) {
					setCount(actor, input.value);
				}
			});
		}
	}

	_onFirstRender(context, options) {
		super._onFirstRender(context, options);
		this._hook = Hooks.on("updateActor", actor => {
			if (actor.type === "character" && this.rendered) {
				this.render();
			}
		});
	}

	_onClose(options) {
		super._onClose(options);
		if (this._hook) {
			Hooks.off("updateActor", this._hook);
			this._hook = null;
		}
	}

	static #actorFrom(target) {
		return game.actors.get(target.closest("[data-actor-id]")?.dataset.actorId);
	}

	static async #onMinus(event, target) {
		const actor = FreeActionsWindow.#actorFrom(target);
		if (actor) {
			await addCount(actor, -1);
		}
	}

	static async #onPlus(event, target) {
		const actor = FreeActionsWindow.#actorFrom(target);
		if (actor) {
			await addCount(actor, 1);
		}
	}

	static async #onGrant() {
		const amount = Math.floor(Number(this.element.querySelector("input[name=amount]")?.value) || 0);
		this.amount = amount;
		const actors = listCharacters().filter(actor => !this.unticked.has(actor.id));
		await grant(actors, amount);
	}
}

/** GM: the small window from a character sheet's counter — set an exact number or add some. */
export async function editCount(actor) {
	if (!game.user.isGM || !actor) {
		return;
	}
	const count = getCount(actor);
	const content = `
		<div class="mist-free-actions-edit">
			<label>${game.i18n.localize("MIST_FREE.Count")} <input type="number" name="count" value="${count}" min="0" step="1" autofocus></label>
		</div>`;
	const value = await DialogV2.prompt({
		window: { title: game.i18n.format("MIST_FREE.EditTitle", { actor: actor.name }) },
		content,
		ok: {
			label: "MIST_FREE.Save",
			icon: "fa-solid fa-check",
			callback: (event, button) => button.form.elements.count.value
		},
		rejectClose: false
	});
	if (value !== null && value !== undefined && value !== "") {
		await setCount(actor, value);
	}
}
