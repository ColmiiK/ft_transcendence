particlesJS("particles-js", {
	"particles": {
	  "number": {
		"value": 80,
		"density": {
		  "enable": true,
		  "value_area": 800
		}
	  },
	  "color": {
		"value": "#FEE0EF" // star color
	  },
	  "shape": {
		"type": "star", // set shape
		"stroke": {
		  "width": 0,
		  "color": "#000000"
		},
		"polygon": {
		  "nb_sides": 5
		},
		// "image": {
		//   "src": "img/github.svg",
		//   "width": 100,
		//   "height": 100
		// }
	  },
	  "opacity": {
		"value": 0.5,
		"random": false,
		"anim": {
		  "enable": false,
		  "speed": 1,
		  "opacity_min": 0.1,
		  "sync": false
		}
	  },
	  "size": {
		"value": 3.5,
		"random": true,
		"anim": {
		  "enable": true,
		  "speed": 20, // blink speed
		  "size_min": 0.1,
		  "sync": false
		}
	  },
	  "line_linked": {
		"enable": true,
		"distance": 150,
		"color": "#ffffff",
		"opacity": 0.2,
		"width": 1
	  },
	  "move": {
		"enable": true,
		"speed": 4, // general speed
		"direction": "none",
		"random": false,
		"straight": false,
		"out_mode": "out",
		"bounce": false,
		"attract": {
		  "enable": false,
		  "rotateX": 600,
		  "rotateY": 1200
		}
	  }
	},
	"interactivity": {
	  "detect_on": "canvas",
	  "events": {
		"onhover": {
		  "enable": true,
		  "mode": "grab"
		},
		"onclick": {
		  "enable": true,
		  "mode": "push"
		},
		"resize": true
	  },
	  "modes": {
		"grab": {
		  "distance": 250,
		  "line_linked": {
			"opacity": 0.5
		  }
		},
		"bubble": {
		  "distance": 100,
		  "size": 10,
		  "duration": 2,
		  "opacity": 8,
		  "speed": 3
		},
		"repulse": {
		  "distance": 50,
		  "duration": 0.4
		},
		"push": {
		  "particles_nb": 4
		},
		"remove": {
		  "particles_nb": 2
		}
	  }
	},
	"retina_detect": true
});