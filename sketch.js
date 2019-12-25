let waves;
let res;
let prop;
let screen;
let waveOffset;
let jet;
let headstart;
let drag;
let halt;
let meteors;
let nOff;
let fireOffset;
let health;
let dec;

let fr=[0,0];

function preload(){
	//theme song
    song = loadSound('./sound/TheOcean.mp3');
    //Jet (main object)
    rider = loadImage('./images/jet.png');
    //sound On image
    sOn = loadImage('./images/soundOn.png');
    //sound Off image
    sOff = loadImage('./images/soundOff.png');
    //background tree image
    tree = loadImage('./images/tree.png');
    //font load
    bcr = loadFont('./assets/BalooChettan-Regular.ttf');
}

function setup(){

    //game resolution
    res = 20 * window.devicePixelRatio;

    //set screen status
    screen='PLAY';

	//getting best window width/height size
	winSize = window.innerWidth;
	if (window.innerHeight < winSize)
		winSize = window.innerHeight;
	winSize = int(winSize/res) * res;

	//setting canvas size
	createCanvas(winSize, winSize);

	//global parameter-type setting
    angleMode(DEGREES);
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);

    //font setting
    textFont(bcr);

    //sound setting
    getAudioContext().resume();
    //sound mode setting
    song.playMode('restart');
    //sound start
    song.loop();

    //setting game properties
    prop = {
        elev : height * 3 / 4,  //waves' height in general
        tide : height / 12,     //tide's height
        wavesp : 1,             //wave's speed
        numMeteors : 1,         //number of meteors
        meteorSpeed : width / 120,  //speed of all meteors
        slant : -35,
        meteorSize: 5,
    };

    waveOffset=0;
    //waves' ripples initialization
    waves=[];
    for (let i = 0; i <= width; i += res) {
        waves.push(prop.elev - noise(waveOffset) * prop.tide);
        waveOffset += res / 200;
    }


    jet = {
        width: 15 * (width / 60), //15:9
        height: 9 * (width / 60), //15:9
        speed: width * 8 / 600,
    };
    jet.x = - jet.width / 2;
    wp = abs(floor(jet.x / res));   //wave particle that's elevating the jet
    y = waves[wp] - prop.tide/2;

    headstart = true;

    drag = 0;

    halt = {
        play: {
            s: height * width / 200 / 20,
        },
        pause: {
            s: height / 20,
            x: width * 18 / 20,
            y: height / 20,
        }
    };

    meteors = [];
    for (let i = 0; i < prop.numMeteors; i++)
        addMeteor(i);

    nOff = 0;
    fireOffset = 0;

    health = 100;
    dec = 100;
}

function draw() {

    //JET MOVEMENT/CONTROLS
    if(!headstart && screen=='PLAY'){
        let move = jet.speed;
        let boundary={
            left : ceil(jet.width / 2),
            right : floor(width - jet.width / 2),
        };
        //Mouse Control
        if (drag != 0) {
            move = constrain(mouseX - drag, boundary.left, boundary.right);
            jet.x = lerp(jet.x, move, 0.2);
        }
        //Keyboard Control
        if (keyIsDown(LEFT_ARROW))
            jet.x = constrain(jet.x - move, boundary.left, boundary.right);
        if (keyIsDown(RIGHT_ARROW))
            jet.x = constrain(jet.x + move, boundary.left, boundary.right);
    }
    
	//Background Sky
    background(222, 235, 247);

    //METEORS
    if (/*screen == 'PLAY' || screen == 'OVER' && */!headstart){
        displayMeteor();
        updateMeteor();
    }

    //JET AND WAVE UPDATION
    updateWave();
    slideJet();

    //CRASH
    crashCheck();

    //JET
    displayJet();

    //WAVE
    createWave();

    //PLAY/PAUSE BUTTON
    playpause();

    //SCORE
    showScore();

    if(!headstart)
        showHealthBar();
}

function mouseDragged() {
    cond = (mouseX > 0 && mouseX < width) && (mouseY > 0 && mouseY < height);
    if (cond && drag == 0 && !headstart)
        drag = mouseX - jet.x;
}

function mouseReleased() {
    drag = 0;
}

function mousePressed() {
    cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (mouseX > halt.pause.x && mouseX < halt.pause.x + halt.pause.s && mouseY > halt.pause.y && mouseY < halt.pause.y + halt.pause.s && screen == 'PLAY') {
        screen = "PAUSE";
        noLoop();
    }/* else if (mouseX > (width - halt.play.s)/2 && mouseX < (width + halt.play.s)/2 && mouseY > (height - halt.play.s)/2 && mouseY < (height + halt.play.s)/2 && screen == 'PAUSE') {
        screen = "PLAY";
        loop();
    } */else if(abs(mouseX - width/2) < halt.play.s/2 && abs(mouseY - height/2) < halt.play.s/2 && screen == 'PAUSE'){
        screen = "PLAY";
        loop();
    }
    return false;
}

function keyPressed() {
    if (key === ' ') {
        if (screen == "PLAY") {
            screen = "PAUSE";
            noLoop();
        } else if (screen == "PAUSE") {
            screen = "PLAY";
            loop();
        }
    }

    //FOR DEBUGGING
    if (key >= '1' && key <= '9')
        frameRate(key.valueOf() * 10);
    return false;
}

function slideJet() {
    if (headstart){
        jet.x = jet.x + res / 5;
        wp = abs(floor(jet.x / res));
        jet.y = waves[wp] - prop.tide / 2;
        headstart = !(jet.x >= width / 2);
    } else {
        wp=floor(jet.x / res);

        //for smooth bounce
        newY = waves[wp] - prop.tide/2;
        let amt = 0.99;
        if (jet.y < newY)
            amt = 0.1;
        if (screen != 'PLAY')
            amt = 0;
        jet.y = lerp(jet.y, newY, amt);
    }
}

function displayJet() {
    push();
    translate(jet.x, jet.y);
    let inc = floor(jet.width / res / 2) - 1;
    let dy = waves[wp + inc] - waves[wp - inc];
    let dx = res * inc * 2;
    rotate(atan(dy/dx));
    image(rider, -jet.width / 2, -jet.height / 2, jet.width, jet.height); //jet

    /*
    noFill().strokeWeight(5).stroke(255,0,0)
    translate(-jet.width/2,-jet.height/2);
    triangle(0, jet.height, jet.width, jet.height * 5.75 / 9, jet.width * 4.74 / 15, 0);//DELETE THIS
    */

    pop();
}

function crashCheck() {
    for (i = 0; i < prop.numMeteors; i++) {

        if (meteors[i].c)
            continue;
        let m = meteors[i];
        if ((m.y + m.r) > (jet.y - jet.height / 2) && (m.y - m.r) < (jet.y + jet.height / 2) && abs(m.x - jet.x) < (m.r + jet.width / 2)) {
            
            x1 = 0;
            y1 = jet.height;
            x2 = jet.width;
            y2 = jet.height * 5.75 / 9;
            x3 = jet.width * 4.74 / 15;
            y3 = 0;

            //slopes
            m1 = (y2 - y3) / (x2 - x3); //slope1
            m2 = (y3 - y1) / (x3 - x1); //slope2

            //y-intercepts
            c1 = (y3 + jet.y - jet.height / 2) - m1 * (x3 + jet.x - jet.width / 2); //y-intercept1
            c2 = (y1 + jet.y - jet.height / 2) - m2 * (x1 + jet.x - jet.width / 2); //y-intercept2

            //perpendicular distance
            d1 = abs(-m1 * m.x + m.y - c1) / sqrt((m1 * m1) + 1);
            d2 = abs(-m2 * m.x + m.y - c2) / sqrt((m2 * m2) + 1);

            //If crashed i.e. crash boundary crossed
            if ((m.x <= (jet.x - jet.width / 2 + jet.width * 4.74 / 15) && d2 < m.r / 2) || (m.x > (jet.x - jet.width / 2 + jet.width * 4.74 / 15) && d1 < m.r / 2)) {
                //tintColor = 0;
                dec = constrain(dec - m.r, 0, 100);
                m.c = true;
            }/* else if (m.x > (jet.x - jet.width / 2 + jet.width * 4.74 / 15) && d1 < m.r / 2) {
                //tintColor = 0;
                dec = constrain(dec - m.r, 0, 100);
                m.c = true;
            }*/
        }
    }
}

function addMeteor(index) {
    rad=random(width * prop.meteorSize / 250, width * prop.meteorSize / 150);
    meteors.splice(index, 0, {
        x: random(height + rad / 2, 2 * width - rad / 2),
        y: random(-(height - rad / 2), -rad / 2),
        r: floor(rad),
        c: false,
    });
}

function displayMeteor(){
    for(m of meteors){
        push();
        translate(m.x, m.y);
        strokeWeight(res*prop.meteorSize/25);
        inc = res * prop.meteorSize / 35;
        for(i = -m.r / sqrt(2); i <= m.r / sqrt(2) && m.y < prop.elev; i += inc){
            if (random() > 0.4) //percentage of yellow fire lines appearing
                stroke(255, 175, 0);    //orange color
            else
                stroke(255, 75, 0);     //yellow color
            len = m.r * 2 + m.r * 2 * noise(fireOffset);
            line(i, i, i + len * cos(90 + prop.slant), i - len * sin(90 + prop.slant));
            fireOffset++;
        }
        beginShape();
        stroke(255, (nOff % 100) + 75, 0);
        fill(139, 69, 19);//brown color
        for(i = 0; i < 360; i += res){
            cons = m.r * (1 + noise(nOff) / 4); //Rock Disfiguration
            vx = cons * cos(i);
            vy = cons * sin(i);
            vertex(vx, vy);
            nOff++;
        }
        endShape(CLOSE);
        pop();
    }
}

function updateMeteor(){
    if (meteors.length < prop.numMeteors)
        addMeteor(0);

    for (i = 0; i < prop.numMeteors; i++){
        m=meteors[i];
        //Shifting Meteors
        m.x -= prop.meteorSpeed;
        m.y += prop.meteorSpeed;

        //create new ones when a meteor drowns or goes out of the visible area
        if((m.y - m.r) > (prop.elev + prop.tide * 1.5) || (m.x + m.r) < 0){
            meteors.splice(i, 1);
            addMeteor(i);
        }
    }
}

function createWave() {
    surf = color(0, 128, 255, 200);//surface color
    flor = color(0, 0, 255, 255);//floor color

    noStroke();
    fill(surf)

    //displaying surface waves pattern
    beginShape();
    vertex(0, prop.elev);
    for(let i = 0; i < waves.length; i++)
    	vertex(i * res, waves[i]);
    vertex(width, prop.elev);
    endShape(CLOSE);

    //Ocean Floor
    let inc = res / 2;
    for (let i = prop.elev; i <= height; i += inc) {
        amt = map(i, prop.elev, height, 0, 1);
        lc = lerpColor(surf, flor, amt);
        fill(lc);
        rect(0, i, width, inc);
    }
}

function updateWave(){
    //Wave Shifting
    for (let i = 0; i <= prop.wavesp && (screen == 'PLAY' || screen == 'OVER'); i += res) {
        //wave particle addition at the back
        waves.push(prop.elev - noise(waveOffset) * prop.tide);
        //wave particle removal from the front
        waves.shift();
        waveOffset += res / 200;
    }
}

function playpause() {
    fill(255, 128, 0);  //orange color
    stroke(0);
    if (screen == 'PLAY') {
        //show PAUSE button
        push();
        translate(halt.pause.x, halt.pause.y);
        rect(0, 0, halt.pause.s / 3, halt.pause.s);
        rect(halt.pause.s * 2 / 3, 0, halt.pause.s / 3, halt.pause.s);
        pop();
    } else if (screen == 'PAUSE') {
        //show PLAY button
        push();
        background(0, 200);
        translate((width - halt.play.s)/2 , (height - halt.play.s)/2);
        triangle(0, 0, 0, halt.play.s, halt.play.s, halt.play.s / 2);
        pop();
    }
}

function showScore() {
    fontSize = height * 5 / 76;
    //wd = fontSize / 2.20;
    posY = height * 18 / 20;
    posX = width / 20;
    push();
    noStroke();
    textAlign(LEFT, CENTER);
    fill(255, 180, 0).textSize(fontSize);
    //fr = frameCount - del;
    text('Score : ' + round(frameCount / 60), posX, posY);
    pop();
}

function showHealthBar() {
    stroke(0);
    fill(255);
    h = height/30;
    w = width/3;
    rect(h, h, w, h);
    health = lerp(health, dec, 0.2);
    fill((100 - health)*255/100, health*255/100, 0);
    rect(h, h, map(health, 0, 100, 0, w), h);
    fill(255).textSize(h).strokeWeight(3);


    if(fr[1]++ == 10){
        fr[0]=int(frameRate());
        fr[1]=0;
    }
    text(/*"HEALTH"*/"frameRate : "+fr[0], h + w / 2, h + height / 100);


    if(health <= 0.1) {
        screen = 'OVER';
        noLoop();
        //DISPLAY OVER ANIMATION OF JET SINKING
    }
    strokeWeight(1);
}