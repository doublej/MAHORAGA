
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const NVM_INC: string;
	export const PORKBUN_API_KEY: string;
	export const STARSHIP_SHELL: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const GST_PLUGIN_SCANNER: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const DYLD_FALLBACK_LIBRARY_PATH: string;
	export const INIT_CWD: string;
	export const NVM_CD_FLAGS: string;
	export const RENDER_API_KEY: string;
	export const MAX_CONVERSATION_TURNS: string;
	export const ANDROID_HOME: string;
	export const TWITTER_BEARER_TOKEN: string;
	export const TERM: string;
	export const SHELL: string;
	export const TART_HOME: string;
	export const HOMEBREW_REPOSITORY: string;
	export const TMPDIR: string;
	export const npm_config_global_prefix: string;
	export const TERM_PROGRAM_VERSION: string;
	export const COLOR: string;
	export const TERM_SESSION_ID: string;
	export const ALPACA_PAPER: string;
	export const npm_config_noproxy: string;
	export const npm_config_local_prefix: string;
	export const ZSH: string;
	export const GIT_EDITOR: string;
	export const CONVERSATION_TIMEOUT_HOURS: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const LS_COLORS: string;
	export const GST_PLUGIN_SYSTEM_PATH_1_0: string;
	export const COMMAND_MODE: string;
	export const ALPACA_API_KEY: string;
	export const OPENAI_API_KEY: string;
	export const npm_config_globalconfig: string;
	export const SSH_AUTH_SOCK: string;
	export const KILL_SWITCH_SECRET: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const TERM_FEATURES: string;
	export const PAGER: string;
	export const DEFAULT_THINKING_MODE_THINKDEEP: string;
	export const LSCOLORS: string;
	export const GOOGLE_API_KEY: string;
	export const TERMINFO_DIRS: string;
	export const PATH: string;
	export const _: string;
	export const npm_package_json: string;
	export const npm_config_userconfig: string;
	export const npm_config_init_module: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const DEFAULT_MODEL: string;
	export const PWD: string;
	export const OPENROUTER_API_KEY: string;
	export const JAVA_HOME: string;
	export const npm_lifecycle_event: string;
	export const EDITOR: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_package_name: string;
	export const DISABLED_TOOLS: string;
	export const PORKBUN_SECRET_KEY: string;
	export const LANG: string;
	export const ITERM_PROFILE: string;
	export const CLOUDSDK_PYTHON: string;
	export const ALPACA_API_SECRET: string;
	export const npm_config_npm_version: string;
	export const XPC_FLAGS: string;
	export const npm_package_engines_node: string;
	export const ANTHROPIC_API_KEY: string;
	export const npm_config_node_gyp: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const GEMINI_API_KEY: string;
	export const LOG_LEVEL: string;
	export const SHLVL: string;
	export const HOME: string;
	export const COLORFGBG: string;
	export const GOROOT: string;
	export const LC_TERMINAL_VERSION: string;
	export const HOMEBREW_PREFIX: string;
	export const ITERM_SESSION_ID: string;
	export const npm_config_cache: string;
	export const STARSHIP_SESSION_KEY: string;
	export const LESS: string;
	export const LOGNAME: string;
	export const npm_lifecycle_script: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const NVM_BIN: string;
	export const GOPATH: string;
	export const BUN_INSTALL: string;
	export const npm_config_user_agent: string;
	export const MAHORAGA_TOKEN: string;
	export const ANDROID_NDK_HOME: string;
	export const INFOPATH: string;
	export const HOMEBREW_CELLAR: string;
	export const GI_TYPELIB_PATH: string;
	export const LC_TERMINAL: string;
	export const OSLogRateLimit: string;
	export const GROK_API_KEY: string;
	export const CLAUDECODE: string;
	export const MAHORAGA_API_TOKEN: string;
	export const npm_node_execpath: string;
	export const npm_config_prefix: string;
	export const COLORTERM: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		NVM_INC: string;
		PORKBUN_API_KEY: string;
		STARSHIP_SHELL: string;
		NoDefaultCurrentDirectoryInExePath: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		GST_PLUGIN_SCANNER: string;
		TERM_PROGRAM: string;
		NODE: string;
		DYLD_FALLBACK_LIBRARY_PATH: string;
		INIT_CWD: string;
		NVM_CD_FLAGS: string;
		RENDER_API_KEY: string;
		MAX_CONVERSATION_TURNS: string;
		ANDROID_HOME: string;
		TWITTER_BEARER_TOKEN: string;
		TERM: string;
		SHELL: string;
		TART_HOME: string;
		HOMEBREW_REPOSITORY: string;
		TMPDIR: string;
		npm_config_global_prefix: string;
		TERM_PROGRAM_VERSION: string;
		COLOR: string;
		TERM_SESSION_ID: string;
		ALPACA_PAPER: string;
		npm_config_noproxy: string;
		npm_config_local_prefix: string;
		ZSH: string;
		GIT_EDITOR: string;
		CONVERSATION_TIMEOUT_HOURS: string;
		NVM_DIR: string;
		USER: string;
		LS_COLORS: string;
		GST_PLUGIN_SYSTEM_PATH_1_0: string;
		COMMAND_MODE: string;
		ALPACA_API_KEY: string;
		OPENAI_API_KEY: string;
		npm_config_globalconfig: string;
		SSH_AUTH_SOCK: string;
		KILL_SWITCH_SECRET: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		TERM_FEATURES: string;
		PAGER: string;
		DEFAULT_THINKING_MODE_THINKDEEP: string;
		LSCOLORS: string;
		GOOGLE_API_KEY: string;
		TERMINFO_DIRS: string;
		PATH: string;
		_: string;
		npm_package_json: string;
		npm_config_userconfig: string;
		npm_config_init_module: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		DEFAULT_MODEL: string;
		PWD: string;
		OPENROUTER_API_KEY: string;
		JAVA_HOME: string;
		npm_lifecycle_event: string;
		EDITOR: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_package_name: string;
		DISABLED_TOOLS: string;
		PORKBUN_SECRET_KEY: string;
		LANG: string;
		ITERM_PROFILE: string;
		CLOUDSDK_PYTHON: string;
		ALPACA_API_SECRET: string;
		npm_config_npm_version: string;
		XPC_FLAGS: string;
		npm_package_engines_node: string;
		ANTHROPIC_API_KEY: string;
		npm_config_node_gyp: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		GEMINI_API_KEY: string;
		LOG_LEVEL: string;
		SHLVL: string;
		HOME: string;
		COLORFGBG: string;
		GOROOT: string;
		LC_TERMINAL_VERSION: string;
		HOMEBREW_PREFIX: string;
		ITERM_SESSION_ID: string;
		npm_config_cache: string;
		STARSHIP_SESSION_KEY: string;
		LESS: string;
		LOGNAME: string;
		npm_lifecycle_script: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		NVM_BIN: string;
		GOPATH: string;
		BUN_INSTALL: string;
		npm_config_user_agent: string;
		MAHORAGA_TOKEN: string;
		ANDROID_NDK_HOME: string;
		INFOPATH: string;
		HOMEBREW_CELLAR: string;
		GI_TYPELIB_PATH: string;
		LC_TERMINAL: string;
		OSLogRateLimit: string;
		GROK_API_KEY: string;
		CLAUDECODE: string;
		MAHORAGA_API_TOKEN: string;
		npm_node_execpath: string;
		npm_config_prefix: string;
		COLORTERM: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
