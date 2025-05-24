const locales = [
	{
		code: 'en',
		flag: '🇬🇧',
		label: 'English',
		translations: {
			login_welcome: 'Welcome!',
			login_username: 'Username',
			login_password: 'Password',
			login_sign_in: 'Sign In',
			login_or: 'or',
			login_forgot_password: 'Forgot password?',
			login_no_account: `Don't have an account? `,
			login_sign_up: '&nbsp;Sign up',
			login_create_account: 'Create an account',
			login_repeat_password: 'Repeat the password',
			login_example_username: 'username-example123',
			login_example_email: 'example@email.com',
			login_create: 'Create account',
			login_return_to: 'or return to&nbsp;',
			login_accept_terms: 'By signing up, you agree to our Privacy and Terms Conditions.',
			terms_policy: 'Terms and Privacy Policy',
			language: 'English',
			fill_all_fields: 'Fill in all the fields',
			username_too_short: 'Username too short',
			username_too_long: 'Username too long (max 16 characters)',
			username_allowed_chars: 'Username can only contain lowercase and digits',
			passwords_not_match: `Passwords don't match`,
			password_too_short: 'Password too short',
			password_musts: `Please use at least one uppercase, lowercase, number and '*.-_'`,
			incorrect_inputs: 'Username or Password may be incorrect',
      home_header: 'Home Page',
      home_welcome: 'Welcome<span id="username" class="text-[var(--dark-pink)]"> Username</span>!',
      home_modify: 'Modify profile',
      home_profile: 'Profile settings',
      home_logout: 'Log out',
      home_games: 'Games',
      home_friends: 'Friends',
      home_messages: 'Messages',
      home_statistics: 'Statistics',
      home_moonbit: '✨ Welcome to Moonbit! ✨ ',
      home_first_p: 'Here, you can jump into classic games like <b class="text-white">Pong</b> or <b class="text-white">Connect Four</b>, play quick matches or join friendly <b class="text-white">tournaments</b>, whether it\'s with people nearby or online players from anywhere.',
      home_second_p: 'Feel like chatting? The <b class="text-white">chat</b> is always open: say hi, share a laugh, or plan your next game. You can also check out your <b class="text-white">Friends Page</b>, invite others to play, and see what they\'re up to.',
      home_third_p: 'And of course, this world is yours to make your own: visit your <b class="text-white">Profile</b> to personalize how you look and feel in this starry pixel space.',
      home_fourth_p: 'So go ahead: explore, play, and have fun. We’re happy you’re here. 🌟',
      stats_header: 'Statistics',
      stats_pong: 'Pong',
      stats_connect: 'Connect4',
      stats_historical: 'Historical',
      stats_dash: 'Dashboard',
      wins: 'Wins',
      losses: 'Losses',
      score_last_10: 'Score in the last 10 games',
      modify_header: 'Modify Profile',
      modify_create_avatar: 'Create an Avatar',
      modify_username: 'Username: ',
      modify_nick: 'Nick: ',
      modify_description: 'Description: ',
      modify_account: 'Account creation date: ',
      modify_wins: 'Total wins',
      modify_losses: 'Total losses',
      modify_avatar_creator: 'Avatar Creator',
      modify_save_changes: 'Save Changes',
	},
	{
		code: 'es',
		flag: '🇪🇸',
		label: 'Español',
		translations: {
			login_welcome: 'Bienvenido',
			login_username: 'Nombre de usuario',
			login_password: 'Contraseña',
			login_sign_in: 'Iniciar Sesión',
			login_or: 'o',
			login_forgot_password: '¿Olvidaste tu contraseña?',
			login_no_account: `¿No tienes una cuenta? `,
			login_sign_up: '&nbsp;Regístrate',
			login_create_account: 'Registro',
			login_repeat_password: 'Repite la contraseña',
			login_example_username: 'usuario-ejemplo123',
			login_example_email: 'ejemplo@email.es',
			login_create: 'Create una cuenta',
			login_return_to: 'o vuelve a&nbsp;',
			login_accept_terms: 'Al registrarte, aceptas nuestros Términos y Condiciones de Privacidad',
			terms_policy: 'Términos y Políticas de Privacidad',
			language: 'Español',
			fill_all_fields: 'Rellena todos los campos',
			username_too_short: 'Nombre de usuario demasiado corto',
			username_too_long: 'Nombre de usuario demasiado largo (max 16 caracteres)',
			username_allowed_chars: 'El nombre de usuario sólo puede contener minúsculas y barra baja',
			passwords_not_match: `Las contraseñas no coinciden`,
			password_too_short: 'Contraseña demasiado corta',
			password_musts: `Por favor utiliza por lo menos una mayúscula, minúscula, número y '*.-_'`,
			incorrect_inputs: 'Nombre de usuario o contraseña incorrectos',
      home_header: 'Página de Inicio',
      home_welcome: '¡Bienvenido<span id="username" class="text-[var(--dark-pink)]"> Username</span>!',
      home_modify: 'Modificar perfil',
      home_profile: 'Opciones del perfil',
      home_logout: 'Cerrar sesión',
      home_games: 'Juegos',
      home_friends: 'Amigos',
      home_messages: 'Mensajes',
      home_statistics: 'Estadísticas',
      home_moonbit: '✨ ¡Bienvenido a Moonbit! ✨ ',
      home_first_p: 'Aquí podrás disfrutar de juegos clásicos como <b class="text-white">Pong</b> o <b class="text-white">Cuatro en raya</b>, juega partidas rápidas o únete a <b class="text-white">torneos</b> amistosos.',
      home_second_p: '¿Quieres hablar un rato? El <b class="text-white">chat</b> siempre está abierto: di hola, comparte unas risas o prepara tu siguiente partida. También puedes echarle un vistazo a tu <b class="text-white">Página de Amigos</b>, invitar a otros a jugar y ver qué están haciendo.',
      home_third_p: 'Y por supuesto, este mundo te pertenece para hacerlo tuyo: visita tu <b class="text-white">Perfil</b> para personalizar cómo se te ve en este estrellado espacio pixelado.',
      home_fourth_p: 'Así que adelante: explora, juega, y diviértete. Estamos felices de que estés aquí. 🌟',
      stats_header: 'Estadísticas',
      stats_pong: 'Pong',
      stats_connect: 'Cuatro en raya',
      stats_historical: 'Historial',
      stats_dash: 'Panel',
      wins: 'Victorias',
      losses: 'Derrotas',
      score_last_10: 'Puntuación en las últimas 10 partidas',
      modify_header: 'Modificar Perfil',
      modify_create_avatar: 'Crea un avatar',
      modify_username: 'Nombre de usuario: ',
      modify_nick: 'Apodo: ',
      modify_description: 'Descripción: ',
      modify_account: 'Fecha de creación de cuenta: ',
      modify_wins: 'Victorias totales',
      modify_losses: 'Derrotas totales',
      modify_avatar_creator: 'Creador de Avatares',
      modify_save_changes: 'Guardar Cambios',
		}
	},
	{
		code: 'fr',
		flag: '🇫🇷',
		label: 'Français',
		translations: {
			login_welcome: 'Bienvenue !',
			login_username: `Nom d'utilisateur`,
			login_password: 'Mot de passe',
			login_sign_in: 'Se connecter',
			login_or: 'ou',
			login_forgot_password: 'Mot de passe oublié ?',
			login_no_account: `Vous n'avez pas de compte ? `,
			login_sign_up: `&nbsp;Inscrivez-vous`,
			login_create_account: 'Enregistrement',
			login_repeat_password: 'Répète le mot de passe',
			login_example_username: 'utilisateur-exemple123',
			login_example_email: 'exemple@email.fr',
			login_create: 'Creez-vous un compte',
			login_return_to: 'ou returnez au&nbsp;',
			login_accept_terms: `En vous inscrivant, vous acceptez nos conditions d'utilisation relatives à la protection de la vie privée.`,
			terms_policy: 'Conditions et Politique de confidentialité',
			language: 'Français',
			fill_all_fields: 'Remplir tous les champs',
			username_too_short: `Nom d'utilisateur trop court`,
			username_too_long: `Nom d'utilisateur trop long (max 16 caractères)`,
			username_allowed_chars: `Le nom d'utilisateur ne peut contenir que des minuscules et des traits de soulignement`,
			passwords_not_match : `Les mots de passe ne correspondent pas`,
			password_too_short : 'Mot de passe trop court',
			password_musts : `Veuillez utiliser au moins une majuscule, une minuscule, un chiffre et '*.-_'`,
      home_header: '',
      home_welcome: '',
      home_modify: '',
      home_profile: '',
      home_logout: '',
      home_games: '',
      home_friends: '',
      home_messages: '',
      home_statistics: '',
      home_moonbit: '',
      home_first_p: '',
      home_second_p: '',
      home_third_p: '',
      home_fourth_p: '',
      stats_header: '',
      stats_pong: '',
      stats_connect: '',
      stats_historical: '',
      stats_dash: '',
      wins: '',
      losses: '',
      score_last_10: '',
      modify_header: '',
      modify_create_avatar: '',
      modify_username: '',
      modify_nick: '',
      modify_description: '',
      modify_account: '',
      modify_wins: '',
      modify_losses: '',
      modify_avatar_creator: '',
      modify_save_changes: '',
		}
	},
];

const navigatorLanguage = 'es';

let lang = locales.find(lang => lang.code === navigatorLanguage)
						? navigatorLanguage
						: 'en';

export function applyTranslation() {
	const translations = locales.find(e => e.code === lang)?.translations;

	// localStorage.setItem("") = lang;

	const nodes = document.querySelectorAll('[translatekey]');
	const formNodes = document.querySelectorAll('[data-placeholder]');

	if (!nodes) return;

	nodes?.forEach((node) => {
		const key = node.getAttribute('translatekey');
		const translation = translations[key] || key;
		node.innerHTML = translation;
	});
	formNodes?.forEach((node) => {
		const key = node.getAttribute('data-placeholder');
		const translation = translations[key] || key;
		node.setAttribute('placeholder', translation);
	});
}

function generateLanguageSelector() {
	const container = document.querySelector('#languageSelector');

	if (!container) return;

	locales.forEach((locale) => {locales.find(e => e.code === lang)?.translations
		const element = document.createElement('button');
		element.className = 'dropdown-item';
		element.type = 'button';
		element.innerHTML = `${locale.flag} ${locale.label}`;
		element.onclick = () => {
			lang = locale.code;
			applyTranslation();
		}
		container.appendChild(element);
	});
}

export function getTranslation(key: string) {
	const translation = locales.find(e => e.code === lang).translations[key];
	return (translation || key);
}
