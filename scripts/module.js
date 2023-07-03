class ConversationWindow extends Application {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'conversation-window',
			template: 'modules/InteractiveConversations/templates/conversation-window.html',
			width: 500,
			minHeight: 300,
			minimizable: true,
			resizable: true,
			title: 'Conversation',
		});
	}


	getData() {
		// Get the current conversation node
		const node = game.conversationNode;

		return {
			text: node.text,
			options: node.options,
			media: node.media,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		// Listen for click events on the options
		html.find('.option').click(this._onOptionClicked.bind(this));
	}

	_onOptionClicked(event) {
		// Get the index of the clicked option
		const index = $(event.currentTarget).index();

		// Get the next conversation node
		const next = game.conversationNode.options[index].next;

		if (next !== null) {
			// Update the conversation node and re-render the window
			game.conversationNode = game.conversationTree[next];
			this.render(true);
		} else {
			// End the conversation
			this.close();
		}
	}
}

class NPCActor extends Actor {
	prepareData() {
		super.prepareData();

		// Add a conversationTree property to the data
		this.data.data.conversationTree = this.data.data.conversationTree || [];
	}
}

class NPCActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['sheet', 'actor', 'npc'],
			width: 600,
			height: 600
		});
	}

	/** @override */
	get template() {
		return 'modules/InteractiveConversations/templates/npc-sheet.html';
	}

	/** @override */
	getData() {
		const data = super.getData();
		data.conversationTree = this.actor.data.data.conversationTree;
		return data;
	}

	/** @override */
	_updateObject(event, formData) {
		if (formData['data.conversationTree']) {
			formData['data.conversationTree'] = formData['data.conversationTree'];
		}
		return super._updateObject(event, formData);
	}
}



Hooks.on('init', () => {
	game.conversation = new ConversationWindow();

	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("InteractiveConversations", NPCActorSheet, { makeDefault: false });

});

Hooks.on('canvasReady', () => {
	// Check if there's a controlled token with a conversation tree
	const token = game.canvas.tokens.controlled.find(t => t.actor.type === "npc" && t.actor.system.conversationTree);

	if (token) {
		// Initialize the conversation tree and node
		game.conversationTree = token.actor.system.conversationTree;
		game.conversationNode = game.conversationTree[0];

		// Render the conversation window
		game.conversation.render(true);
	}
});



Hooks.on('getSceneControlButtons', (controls) => {
	let tokenButton = controls.find(b => b.name == "token")

	if (tokenButton) {
		tokenButton.tools.push({
			name: "talk",
			title: "Talk to NPC",
			icon: "fas fa-comments",
			visible: game.user.isGM,
			onClick: () => {
				game.canvas.tokens.controlled.forEach(t => {
					if (t.actor.type === "npc" && t.actor.system.conversationTree) {
						game.conversationTree = JSON.parse(t.actor.system.conversationTree);
						game.conversationNode = game.conversationTree[0];
						game.conversation.render(true);
					}
				})
			}
		});
	}
});


