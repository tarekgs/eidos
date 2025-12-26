/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';
import { IExtensionService } from '../../../services/extensions/common/extensions.js';

const OPEN_CODEX_ON_STARTUP_KEY = 'workbench.codex.openedOnStartup';
const CODEX_OPEN_SIDEBAR_COMMAND = 'chatgpt.openSidebar';

class OpenCodexSidebarOnStartupContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.openCodexSidebarOnStartup';

	constructor(
		@IProductService private readonly productService: IProductService,
		@IStorageService private readonly storageService: IStorageService,
		@ICommandService private readonly commandService: ICommandService,
		@IExtensionService private readonly extensionService: IExtensionService,
	) {
		super();

		// Only in product builds that explicitly disable the built-in chat UI.
		if (this.productService.enableBuiltinChat !== false) {
			return;
		}

		// Only auto-open once per profile. After that, the Activity Bar pinning/state should persist.
		if (this.storageService.getBoolean(OPEN_CODEX_ON_STARTUP_KEY, StorageScope.PROFILE, false)) {
			return;
		}

		this.run();
	}

	private async run(): Promise<void> {
		await this.extensionService.whenInstalledExtensionsRegistered();

		try {
			// Activates the Codex extension on demand and focuses its sidebar.
			await this.commandService.executeCommand(CODEX_OPEN_SIDEBAR_COMMAND);
		} catch {
			// If the command isn't available for any reason, don't block startup.
		} finally {
			this.storageService.store(OPEN_CODEX_ON_STARTUP_KEY, true, StorageScope.PROFILE, StorageTarget.USER);
		}
	}
}

registerWorkbenchContribution2(OpenCodexSidebarOnStartupContribution.ID, OpenCodexSidebarOnStartupContribution, WorkbenchPhase.AfterRestored);


