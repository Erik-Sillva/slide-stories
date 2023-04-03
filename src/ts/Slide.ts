import Timeout from "./Timeout.js";
const divSound = document.createElement('div');
divSound.className = 'div-sound'
const buttonSound = document.createElement('i');
buttonSound.className = 'fa-solid fa-volume-xmark';
divSound.appendChild(buttonSound);

export default class Slide {
    container: Element;
    element: HTMLElement;
    slides: Element[];
    activeSound: boolean;
    controls: Element;
    time: number;
    index: number;
    slide: Element;
    timeout: Timeout | null;
    pausedTimeout: Timeout | null;
    paused: boolean;
    thumbItems: HTMLElement[] | null;
    thumb: HTMLElement | null;
    constructor(container: Element, element: HTMLElement, slides: Element[], controls: Element, time: number = 5000) {
        this.container = container;
        this.element = element
        this.slides = slides;
        this.activeSound = true
        this.controls = controls;
        this.time = time;
        this.timeout = null
        this.pausedTimeout = null
        this.index = localStorage.getItem('activeSlide') ? Number(localStorage.getItem('activeSlide')) : 0
        this.slide = this.slides[this.index];
        this.paused = false
        this.thumbItems = null;
        this.thumb = null;

        this.init();
    }
    hide(el: Element) {
        el.classList.remove('active');
        if (el instanceof HTMLVideoElement) {
            el.currentTime = 0;
            el.pause();
        }
    }

    soundVideo(video: HTMLVideoElement) {
        if (buttonSound.classList.contains('fa-volume-xmark')) {
            buttonSound.classList.remove('fa-volume-xmark');
            buttonSound.classList.add('fa-volume-high');
            this.activeSound = false
        } else if(buttonSound.classList.contains('fa-volume-high')) {
            buttonSound.classList.remove('fa-volume-high');
            buttonSound.classList.add('fa-volume-xmark');
            this.activeSound = true
        }
        video.muted = this.activeSound;
    }

    show(index: number) {
        this.index = index;
        this.slide = this.slides[this.index];
        localStorage.setItem('activeSlide', String(this.index));

        if(this.thumbItems) {
            this.thumb = this.thumbItems[this.index];
            this.thumbItems.forEach(el => el.classList.remove('active'));
            this.thumb.classList.add('active');
        }

        this.slides.forEach(el => this.hide(el));
        this.slide.classList.add('active');

        if (this.slide instanceof HTMLVideoElement) {
            this.container.appendChild(divSound);
            this.autoVideo(this.slide);
        } else {
            this.auto(this.time);
            
            if (this.container.appendChild(divSound)) {
                this.container.removeChild(divSound);
            }
        }
    }

    autoVideo(video: HTMLVideoElement) {
        video.muted = this.activeSound;
        video.play();
        let firstPlay = true;
        video.addEventListener('playing', () => {
            if(firstPlay) this.auto(video.duration * 1000);
            firstPlay = false;
        });
    }

    auto(time: number) {
        this.timeout?.clear()
        this.timeout = new Timeout(() => this.next(), time);
        if (this.thumb) this.thumb.style.animationDuration = `${time}ms`
    }

    prev() {
        if(this.paused) return;
        const prev = this.index > 0 ? this.index - 1 : this.slides.length - 1
        this.show(prev);
    }

    next() {
        if(this.paused) return;
        const next = (this.index + 1) < this.slides.length ? this.index + 1 : 0
        this.show(next);
    }

    pause() {
        document.body.classList.add('paused');
        this.pausedTimeout = new Timeout(() => {
            this.timeout?.pause();
            this.paused = true
            this.thumb?.classList.add('paused');
            if (this.slide instanceof HTMLVideoElement) {
                this.slide.pause();
            }
        }, 200);
    }

    continue() {
        document.body.classList.remove('paused');
        this.pausedTimeout?.clear()
        if(this.paused) {
            this.paused = false
            this.timeout?.continue();
            this.thumb?.classList.remove('paused');
            if (this.slide instanceof HTMLVideoElement) {
                this.slide.play();
            }
        }
    }

    private addControls() {
        const prevButton = document.createElement('button');
        const nextButton = document.createElement('button');
        prevButton.innerText = 'Slide Anterior'
        nextButton.innerText = 'Próximo Slide'
        this.controls.appendChild(prevButton);
        this.controls.appendChild(nextButton);
        this.controls.addEventListener('pointerdown', () => this.pause());
        document.addEventListener('pointerup', () => this.continue());
        document.addEventListener('touchend', () => this.continue());

        prevButton.addEventListener('pointerup', () => this.prev());
        nextButton.addEventListener('pointerup', () => this.next());
    }

    private addThumbItems() {
        const thumbContainer = document.createElement('div');
        thumbContainer.id = 'slide-thumb';
        for (let i = 0; i < this.slides.length; i++) {
            thumbContainer.innerHTML += `<span><span class="thumb-item"></span></span>`        
        }
        this.controls.appendChild(thumbContainer);
        this.thumbItems = Array.from(document.querySelectorAll('.thumb-item'));
    }

    private init() {
        this.addControls();
        this.addThumbItems();
        this.show(this.index);
        divSound.addEventListener('click', () => {
            if(this.slide instanceof HTMLVideoElement) {
                this.soundVideo(this.slide)
            }
        });
    }
}