import { navigateTo } from "../index.js"
import { getClientID } from "../messages/messages-page.js";
import { showAlert, socketToast} from "../toast-alert/toast-alert.js";
import { uploadCanvas, updatePhoto, updateNick, updateDescription ,initModifyFetchEvents } from "./modify-fetch.js";
import { applyTranslation, getTranslation } from "../login-page/login-transcript.js"

export function initModifyPageEvents() {
  applyTranslation();
	// Return Home
	const homeButton = document.getElementById("home-button");
	if (!homeButton) { return ;}
	homeButton.addEventListener('click', () => { returnHome(); })

	// Change Nick and Description
	const modifyIcons = document.getElementsByClassName("edit-icon") as HTMLCollectionOf<HTMLButtonElement>;
	if (!modifyIcons) { return ; }
	modifyIcons[0].onclick = () => { toggleNickForm(); };
	modifyIcons[1].onclick = () => { toggleDescriptionForm(); };	

	// Upload photos buttons
	const buttonId = document.getElementById('buttonid');
	const fileId = document.getElementById('fileid');
	if (!buttonId || !fileId) {return ;}
	
	buttonId.addEventListener('click', openFileSelector);
	fileId.addEventListener('change', submitImage);

	// Create and modify avatar options
	initCanvas();
	const createAvatarButton = document.getElementById("create-avatar");
	if (!createAvatarButton) { return ; }
	createAvatarButton.onclick = () => { toggleAvatarEditor(); };

	const avatarOptions = document.getElementsByClassName("avatar-option") as HTMLCollectionOf<HTMLImageElement>
	if (!avatarOptions) { return ; }
	for (const option of avatarOptions) {
		option.addEventListener('click', () => {
			setOption(option.getAttribute('src'));
		});
	}

	// Responsivity
	const returnButton = document.getElementById("go-back");
	if (!returnButton) { return ; }
	returnButton.addEventListener('click', () => { toggleMobileDisplay(); })

	// Fetches
	initModifyFetchEvents();
}

function returnHome() {
	for (let layer of layers)
		layer.src = "";
	navigateTo("/home");
}

function toggleNickForm() {
	const nickForm = document.getElementById("nick-form") as HTMLFormElement;
	const nickInput = document.getElementById("modify-nick") as HTMLInputElement;
	const nickSpan = document.getElementById("your-nick");
	if (!nickForm || !nickInput || !nickSpan) { return ; }

	if (nickForm.classList.contains('hidden')) {
		nickForm.classList.remove('hidden');
		nickSpan.classList.add('hidden');
	}
	nickForm.onsubmit = (e: Event) => {
		e.preventDefault();
		nickForm.classList.add('hidden');
		nickSpan.innerText = nickInput.value;
		nickSpan.classList.remove('hidden');
		updateNick(nickInput.value);
	}
}

function toggleDescriptionForm() {
	const descriptionForm = document.getElementById("description-form") as HTMLFormElement;
	const descriptionInput = document.getElementById("modify-description") as HTMLInputElement;
	const descriptionSpan = document.getElementById("your-description");
	if (!descriptionForm || !descriptionInput || !descriptionSpan) { return ; }

	if (descriptionForm.classList.contains('hidden')) {
		descriptionForm.classList.remove('hidden');
		descriptionSpan.classList.add('hidden');
	}
	descriptionForm.onsubmit = (e: Event) => {
		e.preventDefault();	
		descriptionForm.classList.add('hidden');
		descriptionSpan.innerText = descriptionInput.value;
		descriptionSpan.classList.remove('hidden');
		updateDescription(descriptionInput.value);
	}
}

function openFileSelector() {
	const fileId = document.getElementById('fileid');
	if (fileId)
		fileId.click();
}

async function submitImage() {
	const formId = document.getElementById('formid') as HTMLFormElement;
	const fileId = document.getElementById('fileid') as HTMLInputElement;
	if (!formId || !fileId) { return; }

	if (fileId.files){
		const avatar = await updatePhoto(fileId.files[0]);
    if (socketToast && avatar){
      socketToast.send(JSON.stringify({
        type: "change_avatar",
        info: "update",
        sender_id: getClientID(),
        avatar: avatar,
      }));
    }
	}
}

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
const layers = [
	{
		name: "background",
		src: ""
	},
	{
		name: "body",
		src: ""
	},
	{
		name: "eyes",
		src: ""
	},
	{
		name: "accessory",
		src: ""
	}
];

function initCanvas() {
    canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
	context = canvas.getContext('2d');
    if (!canvas || !context) {
        console.error("Canvas element not found");
        return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleAvatarEditor() {
    const avatarEditorPage = document.getElementById("avatar");
    const modifyProfilePage = document.getElementById("modify-dimensions");
    const saveChanges = document.getElementById("save-avatar");
    if (!avatarEditorPage || !saveChanges || !modifyProfilePage) { return; }
	
	modifyProfilePage.classList.add('animate__fadeOutLeft');
	avatarEditorPage.classList.remove('hidden');
	modifyProfilePage.onanimationend = () => {
		modifyProfilePage.classList.add('hidden');
		modifyProfilePage.classList.remove('animate__fadeOutLeft');
		avatarEditorPage.onanimationend = () => {};
	};
    
    saveChanges.onclick = async () => {
		if (canvas) {
			for (let layer of layers) {
				if (!layer || layer.src === "") {
					showAlert(getTranslation('modify_select_options') , "toast-error");
					return ;
				}
			}
			const avatar = await uploadCanvas(canvas);
			if (socketToast){
				socketToast.send(JSON.stringify({
					type: "change_avatar",
					info: "update",
					sender_id: getClientID(),
					avatar: avatar,
				}));
			}
		}
		avatarEditorPage.classList.add('animate__fadeOutRight');
		modifyProfilePage.classList.remove('hidden');
		modifyProfilePage.onanimationend = () => {};
		avatarEditorPage.onanimationend = () => {
			avatarEditorPage.classList.add('hidden');
			avatarEditorPage.classList.remove('animate__fadeOutRight');
		};
	};
}

function setOption(src: string | null) {
    if (!src) { return };

    for (let layer of layers) {
        if (src.includes(layer.name)) {
            layer.src = src;
            break ;
        }
    }
    redrawCanvas();
}

function redrawCanvas() {
    if (!context || !canvas) { return };

    context.clearRect(0, 0, canvas.width, canvas.height);
    const layerPromises = layers.map(layer => {
        return new Promise<void>((resolve) => {
            if (layer.src === "") {
                resolve();
                return;
            }
            
            const image = new Image();
            image.onload = () => {
                if (context && canvas)
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve();
            };
            image.onerror = () => {
                console.error(`Failed to load image: ${layer.src}`);
                resolve();
            };
            image.src = layer.src;
        });
    });
    
    // Wait for all images to load and be drawn in order
    Promise.all(layerPromises);
}

function toggleMobileDisplay() {
	const avatarEditorPage = document.getElementById("avatar");
    const modifyProfilePage = document.getElementById("modify-dimensions");
	
	if (avatarEditorPage && modifyProfilePage) {
		if (!modifyProfilePage.classList.contains('hidden')) {
			modifyProfilePage.classList.add('animate__fadeOutLeft');
			avatarEditorPage.classList.remove('hidden');
			modifyProfilePage.onanimationend = () => {
				modifyProfilePage.classList.add('hidden');
				modifyProfilePage.classList.remove('animate__fadeOutLeft');
				avatarEditorPage.onanimationend = () => {};
			};
		}
		else {
			avatarEditorPage.classList.add('animate__fadeOutRight');
			modifyProfilePage.classList.remove('hidden');
			modifyProfilePage.classList.add('animate__fadeInLeft');
			modifyProfilePage.onanimationend = () => {};
			avatarEditorPage.onanimationend = () => {
				avatarEditorPage.classList.add('hidden');
				avatarEditorPage.classList.remove('animate__fadeOutRight');
			};
		}
	}
}

