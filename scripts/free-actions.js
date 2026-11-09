export const MODULE_ID = "mist-age-free-actions";
export const CHANGED_HOOK = `${MODULE_ID}.changed`;

/*
 * A character's free actions: flags["mist-age-free-actions"].count, a whole number ≥ 0. The GM sets or adds them;
 * every downtime roll in the other Mist Age modules spends one through the API. At 0 nothing is spent and nothing is
 * blocked.
 */

export function getCount(actor) {
	return Math.max(0, Math.floor(Number(actor?.getFlag(MODULE_ID, "count")) || 0));
}

export async function setCount(actor, value) {
	const count = Math.max(0, Math.floor(Number(value) || 0));
	await actor.setFlag(MODULE_ID, "count", count);
	return count;
}

export async function addCount(actor, amount) {
	return setCount(actor, getCount(actor) + (Math.floor(Number(amount) || 0)));
}

/**
 * Spends one free action, if the character has any, and says so in the chat. Returns false (and does nothing) at 0.
 * @param {Actor} actor
 * @param {string} reason  what the action was spent on, e.g. "Brewing: Stride Potion"
 */
export async function spend(actor, reason = "") {
	const count = getCount(actor);
	if (!actor || count <= 0) {
		return false;
	}
	const left = await setCount(actor, count - 1);
	const escape = foundry.utils.escapeHTML;
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: `<p class="mist-free-actions-chat"><i class="fa-solid fa-hourglass-half" inert></i> ${game.i18n.format(reason ? "MIST_FREE.SpentFor" : "MIST_FREE.Spent", {
			actor: escape(actor.name),
			reason: escape(reason),
			left
		})}</p>`
	});
	return true;
}

/** The characters the GM manages: player characters, and any character that already has free actions. */
export function listCharacters() {
	return game.actors
		.filter(actor => actor.type === "character" && (actor.hasPlayerOwner || getCount(actor) > 0))
		.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
}

/** GM: adds free actions to several characters at once (a timeskip) and posts one chat line. */
export async function grant(actors, amount) {
	const n = Math.floor(Number(amount) || 0);
	if (!game.user.isGM || !n || !actors.length) {
		return;
	}
	for (const actor of actors) {
		await addCount(actor, n);
	}
	const escape = foundry.utils.escapeHTML;
	await ChatMessage.create({
		speaker: { alias: game.i18n.localize("MIST_FREE.Title") },
		content: `<p class="mist-free-actions-chat"><i class="fa-solid fa-hourglass-start" inert></i> ${game.i18n.format("MIST_FREE.Granted", {
			amount: n > 0 ? `+${n}` : String(n),
			names: actors.map(actor => escape(actor.name)).join(", ")
		})}</p>`
	});
}
